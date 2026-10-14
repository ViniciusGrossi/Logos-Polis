import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { AtlasRepository } from "../features/atlas/server/repository";
import { AtlasService } from "../features/atlas/server/service";
import { AtlasError } from "../features/atlas/server/errors";
import { isValidAtlasSession } from "../features/atlas/server/controller";
import { parseAtlasQuery } from "../features/atlas/server/schemas";
import { percentShare, getWinner, getMargin, spearman } from "../features/atlas/analytics";
import type { AtlasCatalog, ElectionMetric, Territory } from "../features/atlas/types";

let root: string;
let service: AtlasService;
const territory = (id: string, uf = "SP"): Territory => ({ id, name: `Município ${id}`, level: "municipality", uf, tseCode: Number(id), ibgeCode: Number(id), mapped: true, comparable: true });
const metric = (id: string, year: number, pt: number, other: number, person = "jair"): ElectionMetric => ({
  territoryId: id, year, round: 2, eligible: 120, turnout: 110, abstentions: 10, validVotes: pt + other, officialValidVotes: pt + other,
  blankVotes: 5, nullVotes: 5, candidates: [
    { id: `${year}:pt`, name: year === 2018 ? "Fernando Haddad" : "Lula", party: "PT", votes: pt, share: percentShare(pt, pt + other) ?? 0 },
    { id: `${year}:right`, name: person === "jair" ? "Jair Bolsonaro" : "Flávio Bolsonaro", party: year === 2018 ? "PSL" : "PL", votes: other, share: percentShare(other, pt + other) ?? 0, personKey: person },
  ],
});

before(async () => {
  root = await mkdtemp(join(tmpdir(), "atlas-test-"));
  await mkdir(join(root, "metrics"));
  await mkdir(join(root, "geometry"));
  const municipalities = Array.from({ length: 40 }, (_, i) => territory(String(i + 1), i < 32 ? "SP" : "RJ"));
  const states: Territory[] = ["SP", "RJ"].map(id => ({ ...territory(id, id), level: "state", tseCode: null, ibgeCode: null }));
  const catalog: AtlasCatalog = { schemaVersion: 1, snapshotId: "fixture-v1", generatedAt: "2026-10-11T00:00:00Z", elections: [{ year: 2018, rounds: [2], provisional: false }, { year: 2022, rounds: [1, 2], provisional: false }, { year: 2026, rounds: [1], provisional: true }], territories: [{ ...states[0], id: "BR", name: "Brasil", level: "country", uf: null }, ...states], coverage: { resultsMunicipalities: 40, mappedMunicipalities: 40, issues: [], geometryEdition: "fixture" }, sources: [], methodology: ["Dados agregados"] };
  const metrics = municipalities.flatMap((t, i) => [metric(t.id, 2018, 40, 60), metric(t.id, 2022, 51 + i, 49 - i)]);
  // Legitimate zero, missing candidate, tie, no valid votes and unavailable edition.
  metrics.find(m => m.territoryId === "1" && m.year === 2018)!.candidates[0].votes = 0;
  metrics.find(m => m.territoryId === "2" && m.year === 2022)!.candidates.splice(0, 1);
  const tied = metrics.find(m => m.territoryId === "3" && m.year === 2022)!;
  tied.candidates.forEach(c => { c.votes = 50; });
  const empty = metrics.find(m => m.territoryId === "4" && m.year === 2022)!;
  empty.validVotes = 0; empty.candidates.forEach(c => { c.votes = 0; });
  const unchanged = metrics.find(m => m.territoryId === "6" && m.year === 2022)!;
  unchanged.candidates[0].votes = 30; unchanged.candidates[1].votes = 70;
  const ptBefore = metrics.find(m => m.territoryId === "7" && m.year === 2018)!;
  ptBefore.candidates[0].votes = 70; ptBefore.candidates[1].votes = 30;
  const noHistory = metrics.filter(m => !(m.territoryId === "5" && m.year === 2018));
  noHistory.push({ ...metric("1", 2022, 30, 70), round: 1 }, { ...metric("1", 2026, 30, 70, "flavio"), round: 1 });
  const files: Record<string, unknown> = { "catalog.json": catalog, "territories.json": municipalities, "summary.json": [], "context.json": { values: municipalities.map((t, i) => ({ territoryId: t.id, income: i + 1, education: null, density: null })), indicators: [{ id: "income", label: "Renda", unit: "R$", period: "2022", sourceId: "ibge", status: "available" }, { id: "education", label: "Educação", unit: "%", period: "2022", sourceId: "ibge", status: "unavailable" }], sources: [] }, "themes.json": { topics: [], series: [], surveys: [], sources: [] }, "representation.json": [{ territoryId: "SP", year: 2022, parties: [{ party: "MIN", votes: 1, share: 0.001, seats: 0 }], elected: [] }], "geometry/BR.json": { type: "FeatureCollection", features: [] }, "geometry/SP.json": { type: "FeatureCollection", features: [] } };
  for (const uf of ["SP", "RJ"]) files[`metrics/${uf}.json`] = noHistory.filter(m => municipalities.some(t => t.id === m.territoryId && t.uf === uf));
  await Promise.all(Object.entries(files).map(([name, data]) => writeFile(join(root, name), JSON.stringify(data))));
  service = new AtlasService(new AtlasRepository(root));
});
after(async () => { if (root) await rm(root, { recursive: true, force: true }); });

test("query validation rejects traversal, unknown parameters, duplicates and malformed numbers", () => {
  for (const q of ["uf=../SP", "page=1e3", "round=3", "pageSize=1001", "year=2022&year=2018", "unexpected=1", "__proto__=1", "constructor=1"]) assert.throws(() => parseAtlasQuery("territorios", new URLSearchParams(q)), AtlasError);
  assert.throws(() => parseAtlasQuery("contexto", new URLSearchParams("weighted=yes")), AtlasError);
  assert.equal(parseAtlasQuery("contexto", new URLSearchParams("weighted=false")).weighted, false);
});
test("Atlas boundary rejects missing user and expiry claims independently of cookie presence", () => {
  const now = Date.now();
  for (const session of [null, {}, { userId: "" }, { userId: "   ", exp: now / 1000 + 60 }, { userId: "u", exp: now / 1000 - 1 }, { userId: "u", exp: "9999999999" }, { userId: 1, exp: now / 1000 + 60 }, { userId: "u", exp: NaN }]) assert.equal(isValidAtlasSession(session, now), false);
  assert.equal(isValidAtlasSession({ userId: "authenticated-id", exp: now / 1000 + 60 }, now), true);
});
test("catalog metadata carries fixed snapshot", async () => {
  const response = await service.getCatalog();
  assert.equal(response.meta.snapshotId, "fixture-v1");
});
test("territories preserve full map records and paginate rows", async () => {
  const response = await service.getTerritories({ uf: "SP", year: 2022, round: 2, page: 2, pageSize: 10 });
  assert.equal(response.data.records.length, 32);
  assert.equal(response.data.rows.length, 10);
  assert.equal(response.data.pagination.total, 32);
});
test("missing nominations are null, genuine zero is zero and ties are explicit", async () => {
  const { data } = await service.getComparison({ uf: "SP", fromYear: 2018, toYear: 2022, round: 2, candidate: "PT" });
  assert.equal(data.rows.find(r => r.territory.id === "1")!.beforeShare, 0);
  assert.equal(data.rows.find(r => r.territory.id === "2")!.afterShare, null);
  assert.equal(data.rows.find(r => r.territory.id === "2")!.status, "missing");
  assert.equal(data.rows.find(r => r.territory.id === "3")!.status, "tie");
  assert.equal(data.rows.find(r => r.territory.id === "4")!.afterShare, null);
  assert.equal(data.rows.find(r => r.territory.id === "5")!.status, "missing");
  assert.match(data.candidateLabelBefore, /Haddad/);
  assert.match(data.candidateLabelAfter, /Lula/);
});
test("same Jair person is not a winner change because party changed", async () => {
  const before = metric("x", 2018, 10, 90);
  const after = metric("x", 2022, 10, 90);
  assert.equal(getWinner(before)?.personKey, getWinner(after)?.personKey);
  const { data } = await service.getComparison({ uf: "SP", fromYear: 2018, toYear: 2022, round: 2, candidate: "PT" });
  assert.equal(data.rows.find(r => r.territory.id === "6")!.changed, false);
  const ptContinuity = data.rows.find(r => r.territory.id === "7")!;
  assert.equal(ptContinuity.changed, false);
  assert.match(ptContinuity.winnerBefore!, /Haddad/);
  assert.match(ptContinuity.winnerAfter!, /Lula/);
});
test("nominal comparison uses reliable person key across editions, not surname", async () => {
  const { data } = await service.getComparison({ uf: "SP", fromYear: 2018, toYear: 2022, round: 2, candidate: "2018:right" });
  assert.match(data.candidateLabelAfter, /Jair/);
  assert.equal(data.rows.find(r => r.territory.id === "1")!.afterShare, 49);
});
test("Jair and Flávio remain separate nominations and winner identities", async () => {
  const party = await service.getComparison({ uf: "SP", fromYear: 2022, toYear: 2026, round: 1, candidate: "PL" });
  assert.equal(party.data.rows[0].changed, false);
  assert.notEqual(getWinner(party.data.rows[0].before)?.personKey, getWinner(party.data.rows[0].after)?.personKey);
  assert.match(party.data.candidateLabelBefore, /Jair/);
  assert.match(party.data.candidateLabelAfter, /Flávio/);
  const nominal = await service.getComparison({ uf: "SP", fromYear: 2022, toYear: 2026, round: 1, candidate: "2022:right" });
  assert.equal(nominal.data.rows[0].afterShare, null);
  assert.equal(nominal.data.rows[0].status, "missing");
});
test("invalid election pairs, absent rounds and unknown nominations reject", async () => {
  await assert.rejects(service.getComparison({ uf: "BR", fromYear: 2022, toYear: 2018, round: 2, candidate: "PT" }), AtlasError);
  await assert.rejects(service.getComparison({ uf: "BR", fromYear: 2018, toYear: 2022, round: 1, candidate: "PT" }), AtlasError);
  await assert.rejects(service.getComparison({ uf: "BR", fromYear: 2018, toYear: 2022, round: 2, candidate: "NOTAPARTY" }), AtlasError);
});
test("zero denominator yields absence, and tied winner has zero margin", () => {
  assert.equal(percentShare(0, 0), null);
  assert.equal(getWinner(metric("x", 2022, 0, 0)), null);
  assert.equal(getWinner(metric("x", 2022, 50, 50)), null);
  assert.equal(getMargin(metric("x", 2022, 50, 50)), 0);
});
test("Spearman tied ranks, n threshold, constants and weighted result", () => {
  const points = Array.from({ length: 40 }, (_, i) => ({ x: Math.floor(i / 2), y: Math.floor(i / 2), weight: i + 1 }));
  assert.equal(spearman(points).coefficient, 1);
  assert.equal(spearman(points, true).coefficient, 1);
  assert.equal(spearman(points.slice(0, 29)).coefficient, null);
  assert.equal(spearman(points.map(p => ({ ...p, y: 1 }))).coefficient, null);
  assert.equal(spearman(points.map(p => ({ ...p, y: -p.y }))).coefficient, -1);
  const sensitivity = Array.from({ length: 40 }, (_, i) => ({ x: i, y: (i * 7) % 40, weight: i === 39 ? 1000 : 1 }));
  assert.notEqual(spearman(sensitivity).coefficient, spearman(sensitivity, true).coefficient);
});
test("context computes regional/national on actual service and tracks missing", async () => {
  const { data } = await service.getContext({ uf: "RJ", year: 2022, round: 2, indicator: "income", measure: "share", weighted: false });
  assert.equal(data.regional.n, 8);
  assert.equal(data.regional.coefficient, null);
  assert.ok(data.national.n >= 30);
  assert.ok(data.national.coefficient !== null);
  assert.match(data.candidateLabel, /Lula/);
  const unavailable = await service.getContext({ uf: "BR", year: 2022, round: 2, indicator: "education", measure: "share", weighted: false });
  assert.equal(unavailable.data.points.length, 0);
  assert.equal(unavailable.data.missing, 40);
});
test("dossier preserves historical party below 1% and municipal state representation", async () => {
  const { data } = await service.getDossier("1");
  assert.equal(data.history.length, 4);
  assert.equal(data.representation[0].parties[0].share, 0.001);
  assert.equal(data.context?.income, 1);
  await assert.rejects(service.getDossier("not-found"), AtlasError);
});
test("missing snapshot and malformed snapshot produce safe typed errors", async () => {
  const missing = new AtlasRepository(join(root, "missing"));
  await assert.rejects(missing.getCatalog(), (e: unknown) => e instanceof AtlasError && e.code === "SNAPSHOT_UNAVAILABLE");
  const corruptRoot = join(root, "corrupt");
  await mkdir(corruptRoot);
  await writeFile(join(corruptRoot, "catalog.json"), JSON.stringify({ schemaVersion: 1, snapshotId: "wrong" }));
  await assert.rejects(new AtlasRepository(corruptRoot).getCatalog(), (e: unknown) => e instanceof AtlasError && e.code === "SNAPSHOT_INVALID");
});
test("geometry and themes are validated and keep their provenance contract", async () => {
  assert.equal((await service.getGeometry("BR")).data.type, "FeatureCollection");
  assert.deepEqual((await service.getThemes()).data.series, []);
  await assert.rejects(service.getGeometry("../../private"), AtlasError);
  await assert.rejects(service.getGeometry("RJ"), (e: unknown) => e instanceof AtlasError && e.code === "SNAPSHOT_UNAVAILABLE");
});
