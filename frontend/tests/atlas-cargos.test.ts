import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { gzipSync } from "node:zlib";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { AtlasRepository } from "../features/atlas/server/repository";
import { AtlasService } from "../features/atlas/server/service";
import { AtlasError } from "../features/atlas/server/errors";
import { parseAtlasQuery } from "../features/atlas/server/schemas";
import { ols, summarizeOffice } from "../features/atlas/cargos";
import type { AtlasCatalog, ElectionMetric, OfficeCode, OfficeResult, Territory } from "../features/atlas/types";

const territory = (id: string, uf: string): Territory => ({ id, name: `Município ${id}`, level: "municipality", uf, tseCode: Number(id), ibgeCode: Number(id), mapped: true, comparable: true });
const state = (id: string): Territory => ({ id, name: id, level: "state", uf: id as Territory["uf"], tseCode: null, ibgeCode: null, mapped: true, comparable: true });
const president = (id: string, year: number, round: 1 | 2, pt: number, right: number, rightParty: string): ElectionMetric => ({
  territoryId: id, year, round, eligible: 300, turnout: 250, abstentions: 50, blankVotes: 10, nullVotes: 10,
  validVotes: pt + right + 30, officialValidVotes: pt + right + 30,
  candidates: [
    { id: `${year}:pt`, name: "Lula", party: "PT", votes: pt, share: 0 },
    { id: `${year}:right`, name: "Bolsonaro", party: rightParty, votes: right, share: 0 },
    { id: `${year}:other`, name: "Outro", party: "MIN", votes: 30, share: 0 },
  ],
});
const governor = (id: string, year: number, pt: number, right: number): OfficeResult => ({
  territoryId: id, year, round: 1, office: 3, seats: 1, eligible: 300, turnout: 250, abstentions: 50, blankVotes: 10, nullVotes: 10,
  officialValidVotes: pt + right, validVotes: pt + right,
  candidates: [["Gov A", "PT", pt, null], ["Gov B", "PL", right, null]], parties: [],
});
const deputy = (id: string, year: number, ptNominal: number, ptLegend: number): OfficeResult => ({
  territoryId: id, year, round: 1, office: 6, seats: null, eligible: 300, turnout: 250, abstentions: 50, blankVotes: 10, nullVotes: 10,
  officialValidVotes: ptNominal + ptLegend + 100 + 40, validVotes: ptNominal + 100,
  candidates: [["Dep Azul", "PL", 60, "azul"], ["Dep Rosa", "PT", ptNominal, "rosa"], ["Dep Cinza", "PL", 40, null]],
  parties: [["PT", ptNominal, ptLegend], ["PL", 100, 40]],
});

let root: string, legacyRoot: string, service: AtlasService, legacy: AtlasService;
const municipalities = Array.from({ length: 40 }, (_, i) => territory(String(i + 1), i < 32 ? "SP" : "RJ"));

before(async () => {
  root = await mkdtemp(join(tmpdir(), "atlas-cargos-"));
  legacyRoot = await mkdtemp(join(tmpdir(), "atlas-cargos-legacy-"));
  const catalog: AtlasCatalog = {
    schemaVersion: 1, snapshotId: "fixture-cargos", generatedAt: "2026-10-15T00:00:00Z",
    elections: [{ year: 2018, rounds: [1], provisional: false }, { year: 2022, rounds: [1], provisional: false }, { year: 2026, rounds: [1], provisional: true }],
    territories: [{ ...state("SP") }, { ...state("RJ") }],
    coverage: { resultsMunicipalities: 40, mappedMunicipalities: 40, issues: [], geometryEdition: "fixture" }, sources: [], methodology: ["Dados agregados"],
    offices: [
      { office: 3 as OfficeCode, label: "Governador", elections: [{ year: 2022, rounds: [1] }] },
      { office: 6 as OfficeCode, label: "Deputado federal", elections: [{ year: 2018, rounds: [1] }, { year: 2022, rounds: [1] }] },
    ],
  };
  const metrics: ElectionMetric[] = municipalities.flatMap((t, i) => {
    const pt22 = 80 + i * 2, right22 = 140 - i * 2;
    // 2026 follows 2022 + 5 pp-ish, except municipality 7 (big positive outlier).
    const pt26 = t.id === "7" ? pt22 + 60 : pt22 + 8;
    return [president(t.id, 2018, 1, 70 + i, 150 - i, "PSL"), president(t.id, 2022, 1, pt22, right22, "PL"), president(t.id, 2026, 1, pt26, right22 - 8, "PL")];
  });
  const offices: OfficeResult[] = municipalities.flatMap((t, i) => [governor(t.id, 2022, 100 + i, 120 - i), deputy(t.id, 2022, 50 + i, 20), deputy(t.id, 2018, 50 + i, 20)]);
  // Municipality 2 has no PT governor candidate: absence must stay null, not 0.
  offices.find((o) => o.territoryId === "2" && o.office === 3)!.candidates = [["Gov B", "PL", 120, null]];
  offices.find((o) => o.territoryId === "2" && o.office === 3)!.validVotes = 120;
  offices.find((o) => o.territoryId === "2" && o.office === 3)!.officialValidVotes = 120;
  const files: Record<string, unknown> = {
    "catalog.json": catalog, "territories.json": municipalities, "summary.json": [],
    "context.json": { values: [], indicators: [], sources: [] }, "themes.json": { topics: [], series: [], surveys: [], sources: [] }, "representation.json": [],
  };
  await mkdir(join(root, "metrics")); await mkdir(join(root, "offices"));
  await mkdir(join(legacyRoot, "metrics"));
  for (const uf of ["SP", "RJ"]) {
    const ids = new Set(municipalities.filter((t) => t.uf === uf).map((t) => t.id));
    files[`metrics/${uf}.json`] = metrics.filter((m) => ids.has(m.territoryId));
    await writeFile(join(root, "offices", `${uf}.json.gz`), gzipSync(JSON.stringify(offices.filter((o) => ids.has(o.territoryId)))));
  }
  for (const [name, data] of Object.entries(files)) {
    await writeFile(join(root, name), JSON.stringify(data));
    await writeFile(join(legacyRoot, name), JSON.stringify(name === "catalog.json" ? { ...catalog, offices: undefined } : data));
  }
  service = new AtlasService(new AtlasRepository(root));
  legacy = new AtlasService(new AtlasRepository(legacyRoot));
});
after(async () => { await Promise.all([root, legacyRoot].filter(Boolean).map((p) => rm(p, { recursive: true, force: true }))); });

const rejects = async (work: Promise<unknown>, code: string) => {
  await assert.rejects(work, (error: unknown) => error instanceof AtlasError && error.code === code);
};

test("governador municipal: participação, presidente e diferença em pp são exatos", async () => {
  const { data } = await service.getCargos({ uf: "SP", year: 2022, round: 1, office: 3, line: "PT" });
  assert.equal(data.level, "municipality");
  const row = data.rows.find((r) => r.territory.id === "1")!;
  assert.equal(row.office.lineShare, (100 / 220) * 100);
  assert.equal(row.president!.lineShare, (80 / (80 + 140 + 30)) * 100);
  assert.equal(row.splitPp, row.office.lineShare! - row.president!.lineShare!);
  assert.equal(row.office.leader!.party, "PL");
});

test("linha ausente é null e nunca zero", async () => {
  const { data } = await service.getCargos({ uf: "SP", year: 2022, round: 1, office: 3, line: "PT" });
  const row = data.rows.find((r) => r.territory.id === "2")!;
  assert.equal(row.office.lineVotes, null);
  assert.equal(row.office.lineShare, null);
  assert.equal(row.splitPp, null);
});

test("resumo só conta territórios onde a linha disputou os dois cargos", async () => {
  const { data } = await service.getCargos({ uf: "SP", year: 2022, round: 1, office: 3, line: "PT" });
  const ids = municipalities.filter((t) => t.uf === "SP" && t.id !== "2").map((t) => Number(t.id) - 1);
  assert.equal(data.summary.comparable, 31);
  assert.ok(Math.abs(data.summary.lineShare! - (ids.reduce((s, i) => s + 100 + i, 0) / (ids.length * 220)) * 100) < 1e-9);
});

test("estado soma votos e denominadores, não média de percentuais", async () => {
  const { data } = await service.getCargos({ uf: "SP", year: 2022, round: 1, office: 3, line: "PL" });
  const sp = municipalities.filter((t) => t.uf === "SP").map((t) => Number(t.id) - 1);
  const right = sp.reduce((s, i) => s + (i === 1 ? 120 : 120 - i), 0);
  const total = sp.reduce((s, i) => s + (i === 1 ? 120 : 220), 0);
  assert.ok(Math.abs(data.summary.lineShare! - (right / total) * 100) < 1e-9);
});

test("proporcional: partido soma nominais e legenda sobre o oficial; legenda não vira pessoa", async () => {
  const { data } = await service.getCargos({ uf: "SP", year: 2022, round: 1, office: 6, line: "PT" });
  const row = data.rows.find((r) => r.territory.id === "1")!;
  assert.equal(row.office.lineVotes, 50 + 20);
  assert.equal(row.office.lineShare, (70 / (70 + 140)) * 100);
  assert.equal(row.office.topCandidate!.name, "Dep Azul");
  assert.equal(data.seats, null);
  const statewide = await service.getCargos({ uf: "BR", year: 2022, round: 1, office: 6, line: "PT" });
  assert.equal(statewide.data.level, "state");
  assert.equal(statewide.data.rows.length, 2);
  assert.equal(statewide.data.rows[0].office.topCandidate, null);
});

test("linha PL em 2018 declara lados distintos (PSL × PL)", async () => {
  const { data } = await service.getCargos({ uf: "SP", year: 2018, round: 1, office: 6, line: "PL" });
  assert.equal(data.lineComparable, false);
  assert.equal(data.president.party, "PSL");
  assert.ok(data.caveats.some((c) => c.includes("PSL")));
  assert.ok(data.caveats.some((c) => c.includes("7.048")));
});

test("release sem cargos responde OFFICES_UNAVAILABLE; cargo fora do catálogo, ELECTION_UNAVAILABLE", async () => {
  await rejects(legacy.getCargos({ uf: "SP", year: 2022, round: 1, office: 3, line: "PT" }), "OFFICES_UNAVAILABLE");
  await rejects(service.getCargos({ uf: "SP", year: 2026, round: 1, office: 3, line: "PT" }), "ELECTION_UNAVAILABLE");
  await rejects(service.getCargos({ uf: "SP", year: 2022, round: 1, office: 5, line: "PT" }), "ELECTION_UNAVAILABLE");
});

test("resíduo: esperado vem de regressão nacional e outlier é o maior desvio positivo", async () => {
  const { data } = await service.getResiduos({ uf: "BR", year: 2026, line: "PT" });
  assert.equal(data.fit!.n, 40);
  assert.equal(data.rows[0].territory.id, "7");
  assert.ok(data.rows[0].residualPp > 0);
  assert.ok(Math.abs(data.summary.meanResidualPp!) < 1e-9);
  const sp = await service.getResiduos({ uf: "RJ", year: 2026, line: "PT" });
  assert.equal(sp.data.rows.length, 8);
  assert.deepEqual(sp.data.fit, data.fit);
});

test("ols exato, sem ajuste abaixo de 30 pontos ou sem variância", () => {
  const points = Array.from({ length: 30 }, (_, i) => ({ x: i, y: 2 * i + 1 }));
  const fit = ols(points)!;
  assert.ok(Math.abs(fit.slope - 2) < 1e-9 && Math.abs(fit.intercept - 1) < 1e-9 && Math.abs(fit.r! - 1) < 1e-9);
  assert.equal(ols(points.slice(0, 29)), null);
  assert.equal(ols(points.map((p) => ({ x: 5, y: p.y }))), null);
});

test("empate no topo não tem líder", () => {
  const record = governor("1", 2022, 100, 100);
  assert.equal(summarizeOffice([record], "PT").leader, null);
});

test("consultas estritas para cargos e resíduos", () => {
  assert.equal(parseAtlasQuery("cargos", new URLSearchParams("uf=SP&office=5&line=PL")).office, 5);
  for (const q of ["office=4", "office=9", "line=PSOL", "round=3", "x=1", "office=3&office=5"]) assert.throws(() => parseAtlasQuery("cargos", new URLSearchParams(q)), AtlasError);
  assert.throws(() => parseAtlasQuery("residuos", new URLSearchParams("year=2022")), AtlasError);
  assert.equal(parseAtlasQuery("residuos", new URLSearchParams("")).year, 2026);
});
