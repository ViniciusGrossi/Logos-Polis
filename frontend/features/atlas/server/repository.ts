import { readFile, stat } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { z } from "zod";
import type { AtlasCatalog, AtlasGeometry, ContextDataset, ElectionMetric, Representation, Territory, ThemesDataset } from "../types";
import { AtlasError } from "./errors";
import { catalogSchema, contextSchema, geometrySchema, metricSchema, representationSchema, territorySchema, themesSchema, ufSchema } from "./schemas";

/** Sole filesystem boundary. Fixed filenames, validated content and mtime-aware per-process cache. */
export class AtlasRepository {
  private readonly cache = new Map<string, { fingerprint: string; promise: Promise<unknown> }>();
  private readonly root: string;
  private readonly legacyFixtures: boolean;
  private pinnedDirectory: string | null = null;
  private fileHashes: Record<string,string> | null = null;
  private pinnedCatalog: Promise<AtlasCatalog> | null = null;
  constructor(root?: string) {
    this.root = root ?? path.join(process.cwd(), "data", "atlas");
    this.legacyFixtures = root !== undefined;
  }

  private async read<T>(relative: string, schema: z.ZodType<T>): Promise<T> {
    await this.getCatalog();
    return this.readFrom(this.pinnedDirectory!,relative,schema);
  }
  private async readFrom<T>(directory: string, relative: string, schema: z.ZodType<T>): Promise<T> {
    const filename = path.join(directory, relative);
    let fingerprint: string;
    try { const info = await stat(filename); fingerprint = `${info.mtimeMs}:${info.size}`; }
    catch { throw new AtlasError("SNAPSHOT_UNAVAILABLE", "Base local ainda não está disponível. Prepare os dados e tente novamente.", 503); }
    const cached = this.cache.get(filename);
    if (cached?.fingerprint === fingerprint) return cached.promise as Promise<T>;
    const promise = (async () => {
      let data: unknown;
      try {
        const content=await readFile(filename,"utf8");
        if(directory===this.pinnedDirectory&&this.fileHashes&&createHash("sha256").update(content).digest("hex")!==this.fileHashes[relative])throw new AtlasError("SNAPSHOT_INVALID","Arquivo não corresponde ao manifesto da preparação.",503);
        data = JSON.parse(content) as unknown;
      }
      catch(error) { if(error instanceof AtlasError)throw error;throw new AtlasError("SNAPSHOT_INVALID", "Arquivo da base local inválido. Uma nova preparação é necessária.", 503); }
      const parsed = schema.safeParse(data);
      if (!parsed.success) throw new AtlasError("SNAPSHOT_INVALID", "Estrutura da base local incompatível. Uma nova preparação é necessária.", 503);
      return parsed.data;
    })();
    this.cache.set(filename, { fingerprint, promise });
    try { return await promise; } catch (error) { this.cache.delete(filename); throw error; }
  }
  getCatalog(): Promise<AtlasCatalog> {
    if(this.pinnedCatalog)return this.pinnedCatalog;
    this.pinnedCatalog=(async()=>{
      const configured=process.env.ATLAS_SNAPSHOT;
      if(configured&&!/^atlas-v1-[0-9a-f]{16}$/.test(configured))throw new AtlasError("SNAPSHOT_INVALID","Identificador de preparação inválido.",503);
      const pointer=configured?null:await this.readFrom(this.root,"catalog.json",catalogSchema);
      const id=configured??pointer!.snapshotId;
      if(!/^atlas-v1-[0-9a-f]{16}$/.test(id)){
        if(this.legacyFixtures&&!configured){this.pinnedDirectory=this.root;return pointer!;}
        throw new AtlasError("SNAPSHOT_INVALID","Identificador de preparação inválido.",503);
      }
      const directory=path.join(this.root,"releases",id);
      try{await stat(path.join(directory,"manifest.json"));}
      catch{
        if(this.legacyFixtures&&!configured){this.pinnedDirectory=this.root;return pointer!;}
        throw new AtlasError("SNAPSHOT_UNAVAILABLE","Preparação imutável ainda não publicada. Prepare os dados e reinicie o serviço.",503);
      }
      let manifest: {snapshotId:string;files:Record<string,string>};
      try{
        manifest=z.object({snapshotId:z.literal(id),files:z.record(z.string().regex(/^(catalog|territories|summary|context|themes|representation)\.json$|^(metrics|geometry)\/[A-Z]{2}\.json$/),z.string().regex(/^[0-9a-f]{64}$/))}).parse(JSON.parse(await readFile(path.join(directory,"manifest.json"),"utf8")));
        if(!this.legacyFixtures&&Object.keys(manifest.files).length!==61)throw new Error("incomplete release");
      }catch{throw new AtlasError("SNAPSHOT_INVALID","Manifesto da preparação inválido ou incompleto.",503);}
      this.pinnedDirectory=directory;
      this.fileHashes=manifest.files;
      const catalog=await this.readFrom(directory,"catalog.json",catalogSchema);
      if(catalog.snapshotId!==id)throw new AtlasError("SNAPSHOT_INVALID","A versão do catálogo não corresponde à preparação.",503);
      return {...catalog,versions:[{snapshotId:catalog.snapshotId,generatedAt:catalog.generatedAt}]};
    })();
    this.pinnedCatalog.catch(()=>{this.pinnedCatalog=null;this.pinnedDirectory=null;this.fileHashes=null;});
    return this.pinnedCatalog;
  }
  getTerritories(): Promise<Territory[]> { return this.read("territories.json", z.array(territorySchema)); }
  getSummary(): Promise<ElectionMetric[]> { return this.read("summary.json", z.array(metricSchema)); }
  getMetrics(uf: string): Promise<ElectionMetric[]> {
    const parsed = ufSchema.safeParse(uf);
    if (!parsed.success || parsed.data === "BR") throw new AtlasError("INVALID_QUERY", "Selecione uma UF válida para os dados municipais.");
    return this.read(`metrics/${parsed.data}.json`, z.array(metricSchema));
  }
  getGeometry(uf: string): Promise<AtlasGeometry> {
    const parsed = ufSchema.safeParse(uf);
    if (!parsed.success) throw new AtlasError("INVALID_QUERY", "Território inválido.");
    return this.read(`geometry/${parsed.data}.json`, geometrySchema);
  }
  getContext(): Promise<ContextDataset> { return this.read("context.json", contextSchema); }
  getThemes(): Promise<ThemesDataset> { return this.read("themes.json", themesSchema); }
  getRepresentation(): Promise<Representation[]> { return this.read("representation.json", representationSchema); }
}
