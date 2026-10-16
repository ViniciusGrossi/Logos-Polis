import { getSession } from "@/lib/session";
import { AtlasService } from "./service";
import { AtlasError } from "./errors";
import { parseAtlasQuery, type AtlasEndpoint } from "./schemas";

const service = new AtlasService();
const headers = { "Cache-Control": "private, no-store", "Vary": "Cookie", "X-Content-Type-Options": "nosniff" };

/** No cookie-presence bypass: getSession verifies the existing signed Polis session. */
export function isValidAtlasSession(session: unknown, now = Date.now()): boolean {
  if (!session || typeof session !== "object" || !("userId" in session) || !("exp" in session)) return false;
  return typeof session.userId === "string" && session.userId.trim().length > 0 && typeof session.exp === "number" && Number.isFinite(session.exp) && session.exp * 1000 > now;
}

export async function atlasController(endpoint: AtlasEndpoint, request: Request): Promise<Response> {
  try {
    if (!isValidAtlasSession(await getSession())) throw new AtlasError("UNAUTHENTICATED", "Entre no Logos Polis para acessar o Atlas Eleitoral.", 401);
    const search = new URL(request.url).searchParams;
    switch (endpoint) {
      case "catalogo": {
        parseAtlasQuery("catalogo", search);
        return Response.json(await service.getCatalog(), { headers });
      }
      case "territorios": {
        const query = parseAtlasQuery("territorios", search);
        return Response.json(query.kind === "geometry" ? await service.getGeometry(query.uf) : await service.getTerritories(query), { headers });
      }
      case "comparacao": return Response.json(await service.getComparison(parseAtlasQuery("comparacao", search)), { headers });
      case "contexto": return Response.json(await service.getContext(parseAtlasQuery("contexto", search)), { headers });
      case "pautas": {
        parseAtlasQuery("pautas", search);
        return Response.json(await service.getThemes(), { headers });
      }
      case "cargos": return Response.json(await service.getCargos(parseAtlasQuery("cargos", search)), { headers });
      case "residuos": return Response.json(await service.getResiduos(parseAtlasQuery("residuos", search)), { headers });
      case "dossie": return Response.json(await service.getDossier(parseAtlasQuery("dossie", search).id), { headers });
    }
  } catch (error) {
    const safe = error instanceof AtlasError ? error : new AtlasError("INTERNAL_ERROR", "Não foi possível concluir a consulta. Tente novamente.", 500);
    return Response.json({ error: { code: safe.code, message: safe.message } }, { status: safe.status, headers });
  }
}
