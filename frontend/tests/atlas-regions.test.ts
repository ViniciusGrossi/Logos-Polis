import assert from "node:assert/strict";
import { test } from "node:test";
import { AtlasService } from "../features/atlas/server/service";
import { parseAtlasQuery } from "../features/atlas/server/schemas";
import { aggregateRegionalMetric } from "../features/atlas/region-analytics";
import {
  atlasRegions,
  regionForState,
  scopeContainsState,
} from "../features/atlas/scopes";
import type { ElectionMetric } from "../features/atlas/types";

const service = new AtlasService();
function metric(
  territoryId: string,
  votes: number,
  total: number,
): ElectionMetric {
  return {
    territoryId,
    year: 2022,
    round: 2,
    eligible: total + 20,
    turnout: total + 10,
    abstentions: 10,
    validVotes: total,
    officialValidVotes: total,
    blankVotes: 5,
    nullVotes: 5,
    candidates: [
      {
        id: "2022:pt",
        name: "Lula",
        party: "PT",
        votes,
        share: (votes / total) * 100,
      },
      {
        id: "2022:pl",
        name: "Jair Bolsonaro",
        party: "PL",
        votes: total - votes,
        share: ((total - votes) / total) * 100,
      },
    ],
  };
}
test("macroregion membership partitions the 27 UFs exactly, never exterior", () => {
  const states = atlasRegions.flatMap((region) => [...region.states]);
  assert.equal(states.length, 27);
  assert.equal(new Set(states).size, 27);
  assert.equal(regionForState("DF")?.id, "CENTRO-OESTE");
  assert.equal(scopeContainsState("SUDESTE", "SP"), true);
  assert.equal(scopeContainsState("SUDESTE", "BA"), false);
  assert.equal(
    atlasRegions.some((region) => scopeContainsState(region.id, "ZZ")),
    false,
  );
});
test("regional percentages sum votes and denominators, do not average state shares", () => {
  const a = metric("SP", 90, 100),
    b = metric("RJ", 90, 900);
  const aggregate = aggregateRegionalMetric("SUDESTE", [a, b])!;
  assert.equal(
    aggregate.candidates.find((candidate) => candidate.party === "PT")?.share,
    18,
  );
  assert.equal(aggregate.validVotes, 1000);
  assert.equal(aggregate.eligible, 1040);
  assert.equal(
    aggregate.candidates.reduce(
      (total, candidate) => total + candidate.votes,
      0,
    ),
    aggregate.validVotes,
  );
  assert.equal(a.candidates[0].votes, 90, "input release must not be mutated");
});
test("missing UF, empty members and incompatible rounds do not invent regional totals", () => {
  assert.equal(
    aggregateRegionalMetric("SUL", [metric("RS", 30, 100), null]),
    null,
  );
  assert.equal(aggregateRegionalMetric("SUL", []), null);
  assert.equal(
    aggregateRegionalMetric("SUL", [
      metric("RS", 30, 100),
      { ...metric("SC", 40, 100), round: 1 },
    ]),
    null,
  );
});
test("regional query names are explicitly validated on existing APIs", () => {
  for (const region of atlasRegions) {
    assert.equal(
      parseAtlasQuery("territorios", new URLSearchParams({ uf: region.id })).uf,
      region.id,
    );
    assert.equal(
      parseAtlasQuery("comparacao", new URLSearchParams({ uf: region.id })).uf,
      region.id,
    );
    assert.equal(
      parseAtlasQuery("contexto", new URLSearchParams({ uf: region.id })).uf,
      region.id,
    );
    assert.equal(
      parseAtlasQuery("dossie", new URLSearchParams({ id: region.id })).id,
      region.id,
    );
  }
  assert.throws(() =>
    parseAtlasQuery("territorios", new URLSearchParams({ uf: "SUDOESTE" })),
  );
});
test("five regional totals reconcile with Brazil minus exterior in every prepared round", async () => {
  const catalog = (await service.getCatalog()).data;
  assert.equal(
    catalog.territories.filter((territory) => territory.level === "region")
      .length,
    5,
  );
  const exterior = (await service.getDossier("EXTERIOR")).data;
  for (const election of catalog.elections)
    for (const round of election.rounds) {
      const national = (
        await service.getTerritories({
          uf: "BR",
          year: election.year,
          round,
          page: 1,
          pageSize: 100,
        })
      ).data.summary!;
      const overseas = exterior.history.find(
        (metric) => metric.year === election.year && metric.round === round,
      )!;
      const aggregates = await Promise.all(
        atlasRegions.map((region) =>
          service.getTerritories({
            uf: region.id,
            year: election.year,
            round,
            page: 1,
            pageSize: 100,
          }),
        ),
      );
      for (const key of [
        "eligible",
        "turnout",
        "abstentions",
        "validVotes",
        "officialValidVotes",
        "blankVotes",
        "nullVotes",
      ] as const) {
        assert.equal(
          aggregates.reduce(
            (sum, result) => sum + result.data.summary![key],
            0,
          ),
          national[key] - overseas[key],
          `${election.year}/${round} ${key}`,
        );
      }
      for (const candidate of national.candidates) {
        const domesticVotes = aggregates.reduce(
          (sum, result) =>
            sum +
            (result.data.summary!.candidates.find(
              (nomination) => nomination.id === candidate.id,
            )?.votes ?? 0),
          0,
        );
        assert.equal(
          domesticVotes,
          candidate.votes -
            (overseas.candidates.find(
              (nomination) => nomination.id === candidate.id,
            )?.votes ?? 0),
        );
      }
    }
});
test("region geometry retains original UF IDs, not fictitious polygons", async () => {
  const geometry = (await service.getGeometry("SUDESTE")).data;
  assert.deepEqual(
    geometry.features.map((feature) => feature.properties.id).sort(),
    ["ES", "MG", "RJ", "SP"],
  );
  const territory = (
    await service.getTerritories({
      uf: "SUDESTE",
      year: 2022,
      round: 2,
      page: 2,
      pageSize: 2,
    })
  ).data;
  assert.equal(territory.records.length, 4);
  assert.equal(territory.rows.length, 2);
  assert.equal(territory.summary?.territoryId, "SUDESTE");
});
test("municipal transitions reconcile across regions with national comparison", async () => {
  const query = {
    fromYear: 2018,
    toYear: 2022,
    round: 2 as const,
    candidate: "PT",
  };
  const national = (await service.getComparison({ ...query, uf: "BR" })).data;
  const regional = await Promise.all(
    atlasRegions.map((region) =>
      service.getComparison({ ...query, uf: region.id }),
    ),
  );
  assert.equal(
    regional.reduce((sum, result) => sum + result.data.rows.length, 0),
    national.rows.length,
  );
  for (const key of [
    "comparable",
    "changed",
    "missing",
    "ties",
    "votesInChanged",
    "positive",
    "negative",
  ] as const) {
    assert.equal(
      regional.reduce((sum, result) => sum + result.data.summary[key], 0),
      national.summary[key],
    );
  }
  regional.forEach((result, index) =>
    assert.ok(
      result.data.rows.every((row) =>
        scopeContainsState(atlasRegions[index].id, row.territory.uf),
      ),
    ),
  );
});
test("regional Spearman uses its municipal sample and dossier keeps representation per UF", async () => {
  const context = (
    await service.getContext({
      uf: "SUDESTE",
      year: 2022,
      round: 2,
      indicator: "income",
      measure: "share",
      weighted: false,
    })
  ).data;
  assert.ok(
    context.points.every((point) =>
      scopeContainsState("SUDESTE", point.territory.uf),
    ),
  );
  assert.equal(context.points.length, context.regional.n);
  assert.ok(context.national.n > context.regional.n);
  const dossier = (await service.getDossier("SUDESTE")).data;
  assert.equal(dossier.territory.level, "region");
  assert.equal(dossier.history.length, 5);
  assert.equal(dossier.context, null);
  assert.ok(dossier.representation.length > 0);
  assert.ok(
    dossier.representation.every((row) =>
      scopeContainsState("SUDESTE", row.territoryId),
    ),
  );
});
