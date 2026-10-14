import assert from "node:assert/strict";
import { performance } from "node:perf_hooks";
import { AtlasRepository } from "../features/atlas/server/repository";
import { AtlasService } from "../features/atlas/server/service";

async function verify() {
  const repository = new AtlasRepository();
  const service = new AtlasService(repository);
  const started = performance.now();
  const { data: catalog } = await service.getCatalog();
  const territories = await repository.getTerritories();
  const summary = await repository.getSummary();
  const municipalities = territories.filter(t => t.level === "municipality");
  assert.equal(new Set(territories.map(t => t.id)).size, territories.length, "IDs territoriais duplicados");
  const mapped = municipalities.filter(t => t.mapped).length;
  assert.equal(catalog.coverage.resultsMunicipalities, municipalities.length);
  assert.equal(catalog.coverage.mappedMunicipalities, mapped);
  const issues = new Set(catalog.coverage.issues.map(issue => issue.id));
  for (const territory of municipalities.filter(t => !t.mapped)) assert.ok(issues.has(territory.id), "Ausência cartográfica sem cobertura");
  const states = catalog.territories.filter(t => t.level === "state");
  const all = (await Promise.all(states.map(t => repository.getMetrics(t.id)))).flat();
  for (const election of catalog.elections) for (const round of election.rounds) {
    const br = summary.find(m => m.territoryId === "BR" && m.year === election.year && m.round === round);
    assert.ok(br, "Resumo nacional ausente");
    const exterior = summary.find(m => m.territoryId === "EXTERIOR" && m.year === election.year && m.round === round);
    const domestic = all.filter(m => m.year === election.year && m.round === round);
    assert.equal(new Set(domestic.map(m => m.territoryId)).size, domestic.length, "Métricas municipais duplicadas");
    for (const field of ["validVotes", "eligible", "turnout", "abstentions", "blankVotes", "nullVotes"] as const) {
      const sum = domestic.reduce((total, m) => total + m[field], 0) + (exterior?.[field] ?? 0);
      assert.equal(sum, br[field], `${field} municipal + exterior difere de BR em ${election.year}/${round}`);
    }
    for (const metric of domestic) assert.equal(metric.candidates.reduce((sum, c) => sum + c.votes, 0), metric.validVotes, "Votos nominais completos diferem do denominador");
  }
  const { data: comparison } = await service.getComparison({ uf: "BR", fromYear: 2018, toYear: 2022, round: 2, candidate: "PT" });
  assert.equal(comparison.rows.length, municipalities.length);
  assert.equal(comparison.summary.comparable + comparison.summary.missing + comparison.summary.ties, comparison.rows.length);
  const transition = (from: string, to: string) => comparison.transitions.filter(t => t.from.toUpperCase().includes(from) && t.to.toUpperCase().includes(to)).reduce((sum, t) => sum + t.municipalities, 0);
  assert.equal(transition("JAIR", "LULA"), 368, "Reconciliar viradas exploratórias Jair→Lula");
  assert.equal(transition("HADDAD", "JAIR"), 54, "Reconciliar viradas exploratórias Haddad→Jair");
  assert.equal(comparison.summary.changed, 422, "Viradas preservam continuidade da pessoa ou partido histórico");
  const context = await service.getContext({ uf: "BR", year: 2022, round: 2, indicator: "income", measure: "share", weighted: false });
  await service.getThemes();
  await service.getDossier("BR");
  await service.getGeometry("BR");
  for (const state of states) {
    const geometry = await service.getGeometry(state.id);
    const municipalIds = new Set(municipalities.filter(t => t.uf === state.id && t.mapped).map(t => t.id));
    assert.equal(geometry.data.features.length, municipalIds.size, `Cobertura geométrica de ${state.id}`);
    for (const feature of geometry.data.features) assert.ok(municipalIds.has(feature.properties.id), "Geometria sem município correspondente");
  }
  const coldMs = performance.now() - started;
  const warmStart = performance.now();
  await service.getComparison({ uf: "BR", fromYear: 2018, toYear: 2022, round: 2, candidate: "PT" });
  console.log(JSON.stringify({ snapshot: catalog.snapshotId, municipalities: municipalities.length, mapped, issues: catalog.coverage.issues.length, comparison: comparison.summary, turns: { jairToLula: transition("JAIR", "LULA"), haddadToJair: transition("HADDAD", "JAIR") }, contextPoints: context.data.points.length, coldValidationMs: Math.round(coldMs), warmComparisonMs: Math.round(performance.now() - warmStart) }));
}
verify().catch(error => { console.error(error instanceof Error ? error.message : "Falha ao validar Atlas"); process.exitCode = 1; });
