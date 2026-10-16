import type {
  AtlasCatalog,
  AtlasGeometry,
  AtlasMeta,
  AtlasResponse,
  CandidateResult,
  ComparisonDataset,
  ComparisonRow,
  ContextAnalysis,
  ContextPoint,
  DossierDataset,
  CargosDataset,
  ElectionMetric,
  OfficeResult,
  ResiduosDataset,
  TerritoryDataset,
  ThemesDataset,
} from "../types";
import {
  candidateLabel,
  candidateShare,
  findCandidate,
  getMargin,
  getWinner,
  percentShare,
  samePoliticalWinner,
  spearman,
} from "../analytics";
import { AtlasRepository } from "./repository";
import { AtlasError } from "./errors";
import type { CargosQuery, ComparisonQuery, ContextQuery, ResiduosQuery, TerritoryQuery } from "./schemas";
import { OFFICE_LABELS, PROPORTIONAL_OFFICES, cargoRow, isLineComparable, ols, presidentParty, summarizePresident } from "../cargos";
import {
  regionForScope,
  regionTerritories,
  scopeContainsState,
  isStateScope,
} from "../scopes";
import { aggregateRegionalMetric } from "../region-analytics";

type ElectionIndex = Map<string, ElectionMetric>;
const metricKey = (id: string, year: number, round: number) =>
  `${id}:${year}:${round}`;
const indexMetrics = (metrics: ElectionMetric[]): ElectionIndex =>
  new Map(metrics.map((m) => [metricKey(m.territoryId, m.year, m.round), m]));

export class AtlasService {
  private readonly analyticalCache = new Map<string, Promise<unknown>>();
  constructor(private readonly repository = new AtlasRepository()) {}

  private meta(catalog: AtlasCatalog, methodology?: string): AtlasMeta {
    return {
      snapshotId: catalog.snapshotId,
      generatedAt: catalog.generatedAt,
      source:
        "TSE · base local versionada; fontes complementares descritas no catálogo",
      methodology: methodology ?? catalog.methodology.join(" "),
    };
  }
  private response<T>(
    catalog: AtlasCatalog,
    data: T,
    methodology?: string,
  ): AtlasResponse<T> {
    return { data, meta: this.meta(catalog, methodology) };
  }
  private requireElection(catalog: AtlasCatalog, year: number, round: number) {
    if (
      !catalog.elections.some(
        (e) => e.year === year && e.rounds.includes(round as 1 | 2),
      )
    )
      throw new AtlasError(
        "ELECTION_UNAVAILABLE",
        "Eleição ou turno indisponível nesta versão da base.",
      );
  }
  private requireUf(catalog: AtlasCatalog, uf: string) {
    if (
      uf !== "BR" &&
      !regionForScope(uf) &&
      !catalog.territories.some((t) => t.id === uf && t.level === "state")
    )
      throw new AtlasError(
        "TERRITORY_NOT_FOUND",
        "Estado ou região não encontrado no catálogo.",
        404,
      );
  }
  private async cached<T>(key: string, work: () => Promise<T>): Promise<T> {
    const cached = this.analyticalCache.get(key);
    if (cached) return cached as Promise<T>;
    if (this.analyticalCache.size >= 128)
      this.analyticalCache.delete(this.analyticalCache.keys().next().value!);
    const promise = work();
    this.analyticalCache.set(key, promise);
    try {
      return await promise;
    } catch (error) {
      this.analyticalCache.delete(key);
      throw error;
    }
  }
  private async municipal(catalog: AtlasCatalog, uf: string) {
    const territories = (await this.repository.getTerritories()).filter(
      (t) => t.level === "municipality" && scopeContainsState(uf, t.uf),
    );
    const states = catalog.territories
      .filter((t) => t.level === "state" && scopeContainsState(uf, t.id))
      .map((t) => t.id);
    const metrics = (
      await Promise.all(
        states.map((state) => this.repository.getMetrics(state)),
      )
    ).flat();
    return { territories, metrics, index: indexMetrics(metrics) };
  }
  async getCatalog(): Promise<AtlasResponse<AtlasCatalog>> {
    const catalog = await this.repository.getCatalog();
    return this.response(catalog, {
      ...catalog,
      territories: [...catalog.territories, ...regionTerritories],
    });
  }
  async getTerritories(
    query: Omit<TerritoryQuery, "kind">,
  ): Promise<AtlasResponse<TerritoryDataset>> {
    const catalog = await this.repository.getCatalog();
    this.requireUf(catalog, query.uf);
    this.requireElection(catalog, query.year, query.round);
    const summary = await this.repository.getSummary();
    const region = regionForScope(query.uf);
    const metrics = !isStateScope(query.uf)
      ? summary
      : await this.repository.getMetrics(query.uf);
    const territories = !isStateScope(query.uf)
      ? catalog.territories.filter(
          (t) => t.level === "state" && scopeContainsState(query.uf, t.id),
        )
      : (await this.repository.getTerritories()).filter(
          (t) => t.level === "municipality" && t.uf === query.uf,
        );
    const index = indexMetrics(metrics);
    const records = territories.map((territory) => ({
      territory,
      metric:
        index.get(metricKey(territory.id, query.year, query.round)) ?? null,
    }));
    const offset = (query.page - 1) * query.pageSize;
    const selectedSummary = region
      ? aggregateRegionalMetric(
          region.id,
          region.states.map(
            (state) =>
              index.get(metricKey(state, query.year, query.round)) ?? null,
          ),
        )
      : (summary.find(
          (m) =>
            m.territoryId === query.uf &&
            m.year === query.year &&
            m.round === query.round,
        ) ?? null);
    return this.response(
      catalog,
      {
        records,
        rows: records.slice(offset, offset + query.pageSize),
        pagination: {
          page: query.page,
          pageSize: query.pageSize,
          total: records.length,
        },
        summary: selectedSummary,
      },
      region
        ? "Macrorregião IBGE: soma dos votos e denominadores de todas as UFs integrantes, sem exterior; percentuais recalculados, não médias estaduais. Ausência de uma UF impede total parcial silencioso."
        : undefined,
    );
  }
  async getGeometry(uf: string): Promise<AtlasResponse<AtlasGeometry>> {
    const catalog = await this.repository.getCatalog();
    this.requireUf(catalog, uf);
    const region = regionForScope(uf);
    const geometry = await this.repository.getGeometry(region ? "BR" : uf);
    return this.response(
      catalog,
      region
        ? {
            ...geometry,
            features: geometry.features.filter((feature) =>
              scopeContainsState(uf, feature.properties.id),
            ),
          }
        : geometry,
      `Geometria ${catalog.coverage.geometryEdition}. ${region ? `UFs da macrorregião ${region.name}; fronteiras originais preservadas.` : ""} Ausências cartográficas são preservadas na cobertura do catálogo.`,
    );
  }
  async getComparison(
    query: ComparisonQuery,
  ): Promise<AtlasResponse<ComparisonDataset>> {
    const catalog = await this.repository.getCatalog();
    this.requireUf(catalog, query.uf);
    if (query.fromYear >= query.toYear)
      throw new AtlasError(
        "INCOMPATIBLE_COMPARISON",
        "A eleição anterior deve preceder a eleição atual.",
      );
    this.requireElection(catalog, query.fromYear, query.round);
    this.requireElection(catalog, query.toYear, query.round);
    return this.cached(
      `${catalog.snapshotId}:comparison:${JSON.stringify(query)}`,
      async () => {
        const { territories, metrics, index } = await this.municipal(
          catalog,
          query.uf,
        );
        const editions = metrics.filter(
          (m) =>
            (m.year === query.fromYear || m.year === query.toYear) &&
            m.round === query.round,
        );
        const isParty = editions.some((m) =>
          m.candidates.some((c) => c.party === query.candidate),
        );
        const nominal = editions
          .flatMap((m) => m.candidates)
          .find((c) => c.id === query.candidate);
        if (!isParty && !nominal)
          throw new AtlasError(
            "CANDIDATE_UNAVAILABLE",
            "Partido ou candidatura indisponível neste recorte.",
          );
        const select = (
          metric: ElectionMetric | null,
        ): CandidateResult | null => {
          if (!metric) return null;
          if (isParty) return findCandidate(metric, query.candidate);
          return (
            metric.candidates.find(
              (c) =>
                c.id === nominal!.id ||
                (nominal!.personKey && c.personKey === nominal!.personKey),
            ) ?? null
          );
        };
        const labelBefore = candidateLabel(
          select(
            editions.find((m) => m.year === query.fromYear && select(m)) ??
              null,
          ),
        );
        const labelAfter = candidateLabel(
          select(
            editions.find((m) => m.year === query.toYear && select(m)) ?? null,
          ),
        );
        const rows: ComparisonRow[] = territories.map((territory) => {
          const before =
            index.get(metricKey(territory.id, query.fromYear, query.round)) ??
            null;
          const after =
            index.get(metricKey(territory.id, query.toYear, query.round)) ??
            null;
          const selectedBefore = select(before),
            selectedAfter = select(after);
          const beforeShare =
            selectedBefore && before
              ? percentShare(selectedBefore.votes, before.validVotes)
              : null;
          const afterShare =
            selectedAfter && after
              ? percentShare(selectedAfter.votes, after.validVotes)
              : null;
          const winnerBefore = getWinner(before),
            winnerAfter = getWinner(after);
          const missing =
            !territory.comparable ||
            beforeShare === null ||
            afterShare === null;
          const tie = !missing && (!winnerBefore || !winnerAfter);
          return {
            territory,
            before,
            after,
            beforeShare,
            afterShare,
            deltaPp:
              beforeShare !== null && afterShare !== null
                ? afterShare - beforeShare
                : null,
            deltaVotes:
              selectedBefore && selectedAfter
                ? selectedAfter.votes - selectedBefore.votes
                : null,
            marginBefore: getMargin(before),
            marginAfter: getMargin(after),
            winnerBefore: winnerBefore ? candidateLabel(winnerBefore) : null,
            winnerAfter: winnerAfter ? candidateLabel(winnerAfter) : null,
            changed:
              !missing &&
              !tie &&
              !samePoliticalWinner(winnerBefore!, winnerAfter!),
            status: missing ? "missing" : tie ? "tie" : "comparable",
          };
        });
        const transitionMap = new Map<
          string,
          ComparisonDataset["transitions"][number]
        >();
        for (const row of rows) {
          const from =
            row.winnerBefore ??
            (row.before?.validVotes ? "Empate" : "Sem dados");
          const to =
            row.winnerAfter ?? (row.after?.validVotes ? "Empate" : "Sem dados");
          const key = `${from}\u0000${to}`;
          const entry = transitionMap.get(key) ?? {
            from,
            to,
            municipalities: 0,
            votes: 0,
          };
          entry.municipalities++;
          entry.votes += row.after?.validVotes ?? 0;
          transitionMap.set(key, entry);
        }
        const comparable = rows.filter((r) => r.status === "comparable"),
          changed = rows.filter((r) => r.changed);
        const data: ComparisonDataset = {
          rows,
          fromYear: query.fromYear,
          toYear: query.toYear,
          round: query.round,
          candidateLabelBefore: labelBefore,
          candidateLabelAfter: labelAfter,
          summary: {
            comparable: comparable.length,
            changed: changed.length,
            missing: rows.filter((r) => r.status === "missing").length,
            ties: rows.filter((r) => r.status === "tie").length,
            votesInChanged: changed.reduce(
              (total, r) => total + (r.after?.validVotes ?? 0),
              0,
            ),
            positive: comparable.filter(
              (r) => r.deltaPp !== null && r.deltaPp > 0,
            ).length,
            negative: comparable.filter(
              (r) => r.deltaPp !== null && r.deltaPp < 0,
            ).length,
          },
          transitions: [...transitionMap.values()].sort(
            (a, b) => b.municipalities - a.municipalities,
          ),
        };
        return this.response(
          catalog,
          data,
          "Participação = votos da candidatura / votos nominais válidos presidenciais. Variação em pontos percentuais antes de arredondamento. Virada indica ruptura da continuidade política do vencedor: continuidade existe pela mesma pessoa identificada ou pelo mesmo partido histórico. Haddad→Lula mantém PT, Jair PSL→PL mantém pessoa, Jair→Flávio mantém PL mas são pessoas distintas. A matriz conserva nomes completos. Não há inferência de transferência individual. Candidatura nominal só se liga entre edições por identificação confiável, sem agrupar sobrenomes ou presumir sucessão partidária.",
        );
      },
    );
  }
  async getContext(
    query: ContextQuery,
  ): Promise<AtlasResponse<ContextAnalysis>> {
    const catalog = await this.repository.getCatalog();
    this.requireUf(catalog, query.uf);
    this.requireElection(catalog, query.year, query.round);
    const previous =
      query.year === 2022 && query.round === 2
        ? 2018
        : query.year === 2026 && query.round === 1
          ? 2022
          : null;
    if (query.measure === "delta") {
      if (!previous)
        throw new AtlasError(
          "INCOMPATIBLE_COMPARISON",
          "Variação de contexto disponível para 2018→2022 no 2º turno ou 2022→2026 no 1º turno.",
        );
      this.requireElection(catalog, previous, query.round);
    }
    return this.cached(
      `${catalog.snapshotId}:context:${JSON.stringify(query)}`,
      async () => {
        const context = await this.repository.getContext();
        const indicator = context.indicators.find(
          (i) => i.id === query.indicator,
        );
        if (!indicator)
          throw new AtlasError(
            "INDICATOR_UNAVAILABLE",
            "Indicador não registrado nesta versão.",
            404,
          );
        const { territories, metrics, index } = await this.municipal(
          catalog,
          "BR",
        );
        const values = new Map(context.values.map((v) => [v.territoryId, v]));
        const nationalPoints: ContextPoint[] = [];
        for (const territory of territories) {
          const current =
            index.get(metricKey(territory.id, query.year, query.round)) ?? null;
          const currentShare = candidateShare(current, query.candidate === "PL" && query.year === 2018 ? "PSL" : query.candidate ?? "PT");
          const before = previous
            ? (index.get(metricKey(territory.id, previous, query.round)) ??
              null)
            : null;
          const beforeShare = candidateShare(before, query.candidate === "PL" && previous === 2018 ? "PSL" : query.candidate ?? "PT");
          const y =
            query.measure === "share"
              ? currentShare
              : currentShare !== null &&
                  beforeShare !== null &&
                  territory.comparable
                ? currentShare - beforeShare
                : null;
          const x =
            indicator.status === "unavailable"
              ? null
              : (values.get(territory.id)?.[query.indicator] ?? null);
          if (
            x !== null &&
            y !== null &&
            current &&
            (!query.weighted || current.validVotes > 0)
          )
            nationalPoints.push({
              territory,
              x,
              y,
              weight: current.validVotes,
              votes: findCandidate(current,query.candidate==='PL' && query.year===2018?'PSL':query.candidate??'PT')!.votes,
              ...(before && beforeShare!==null ? {
                votesBefore:findCandidate(before,query.candidate==='PL' && previous===2018?'PSL':query.candidate??'PT')!.votes,
                validVotesBefore:before.validVotes,
              } : {}),
            });
        }
        const points = nationalPoints.filter((p) =>
          scopeContainsState(query.uf, p.territory.uf),
        );
        const count = territories.filter((t) =>
          scopeContainsState(query.uf, t.uf),
        ).length;
        const currentNomination =
          metrics
            .filter((m) => m.year === query.year && m.round === query.round)
            .map((m) => findCandidate(m, query.candidate === "PL" && query.year === 2018 ? "PSL" : query.candidate ?? "PT"))
            .find((c) => c !== null) ?? null;
        const previousNomination =
          metrics
            .filter((m) => m.year === previous && m.round === query.round)
            .map((m) => findCandidate(m, query.candidate === "PL" && previous === 2018 ? "PSL" : query.candidate ?? "PT"))
            .find((c) => c !== null) ?? null;
        const methodology = `Spearman com ranks médios nos empates; coeficiente não calculado com menos de 30 municípios ou variância zero. ${query.weighted ? "Sensibilidade ponderada: Pearson dos ranks ordinários com peso de votos válidos da eleição atual." : "Cada município tem o mesmo peso."} Associação municipal, sem inferência causal ou individual. Brasil e recorte estadual ou macrorregional usam amostras e ranks próprios. Indicador ${indicator.period}; eleição ${query.year}, ${query.round}º turno.`;
        return this.response(
          catalog,
          {
            points,
            national: spearman(nationalPoints, query.weighted),
            measure: query.measure,
            regional: spearman(points, query.weighted),
            indicator,
            missing: count - points.length,
            candidateLabel:
              query.measure === "delta"
                ? `${candidateLabel(previousNomination)} → ${candidateLabel(currentNomination)}`
                : candidateLabel(currentNomination),
            methodology,
          },
          methodology,
        );
      },
    );
  }
  async getCargos(query: CargosQuery): Promise<AtlasResponse<CargosDataset>> {
    const catalog = await this.repository.getCatalog();
    this.requireUf(catalog, query.uf);
    if (!catalog.offices)
      throw new AtlasError("OFFICES_UNAVAILABLE", "Cargos estaduais e legislativos não estão disponíveis nesta versão da base.", 404);
    const available = catalog.offices.find((o) => o.office === query.office)?.elections.find((e) => e.year === query.year)?.rounds.includes(query.round);
    if (!available) throw new AtlasError("ELECTION_UNAVAILABLE", "Cargo, eleição ou turno indisponível nesta versão da base.");
    return this.cached(`${catalog.snapshotId}:cargos:${JSON.stringify(query)}`, async () => {
      const municipalLevel = isStateScope(query.uf);
      const states = catalog.territories.filter((t) => t.level === "state" && scopeContainsState(query.uf, t.id));
      const selectedMetric = (m: ElectionMetric) => m.year === query.year && m.round === query.round;
      const selectedOffice = (o: OfficeResult) => o.year === query.year && o.round === query.round && o.office === query.office;
      const perState = await Promise.all(states.map(async (state) => ({
        state,
        offices: (await this.repository.getOffices(state.id)).filter(selectedOffice),
        metrics: (await this.repository.getMetrics(state.id)).filter(selectedMetric),
      })));
      const rows = municipalLevel
        ? (await this.repository.getTerritories())
            .filter((t) => t.level === "municipality" && t.uf === query.uf)
            .map((territory) => cargoRow(
              territory,
              perState[0].offices.filter((o) => o.territoryId === territory.id),
              perState[0].metrics.filter((m) => m.territoryId === territory.id),
              query.line, query.year,
            ))
        : perState.map(({ state, offices, metrics }) => cargoRow(state, offices, metrics, query.line, query.year));
      const allOffices = perState.flatMap((p) => p.offices);
      const allMetrics = perState.flatMap((p) => p.metrics);
      const president = summarizePresident(allMetrics, presidentParty(query.line, query.year));
      const comparable = rows.filter((r) => r.splitPp !== null);
      // Summary only over territories where the line ran in both races; otherwise absent lines would count as zero votes.
      const base = comparable.reduce((a, r) => ({
        line: a.line + r.office.lineVotes!,
        office: a.office + (PROPORTIONAL_OFFICES.includes(query.office) ? r.office.officialValidVotes : r.office.validVotes),
        presidentLine: a.presidentLine + r.president!.lineVotes!,
        president: a.president + r.president!.validVotes,
      }), { line: 0, office: 0, presidentLine: 0, president: 0 });
      const lineShare = base.office > 0 ? (base.line / base.office) * 100 : null;
      const presidentShare = base.president > 0 ? (base.presidentLine / base.president) * 100 : null;
      const lineComparable = isLineComparable(query.line, query.year);
      const proportional = PROPORTIONAL_OFFICES.includes(query.office);
      const caveats = [
        proportional
          ? "Proporcional: participação do partido = votos nominais + de legenda sobre o total oficial de votos válidos; legenda nunca é atribuída a pessoas. Federações aparecem partido a partido."
          : "Majoritário: participação = votos válidos da candidatura sobre a soma dos votos nominais válidos do cargo.",
        ...(query.office === 5 ? ["Senado: cada eleitor vota em até duas candidaturas quando há duas vagas; o denominador são as escolhas válidas, não eleitores."] : []),
        "Diferença presidente × cargo = participação da linha partidária no cargo menos participação do candidato presidencial do mesmo partido, em pontos percentuais; descritiva, sem inferência de voto individual.",
        ...(lineComparable ? [] : ["Linha PL em 2018: o candidato presidencial era do PSL; a comparação opõe lados eleitorais distintos e não é comparável."]),
        "Mais votado no município não significa eleito: cargos proporcionais elegem por quociente na circunscrição. Resultados de 2026 são provisórios.",
        ...(query.year === 2018 && query.office === 6 ? ["AM 2018, deputado federal: soma dos partidos supera o detalhe em 7.048 votos (divergência da fonte, documentada e não corrigida)."] : []),
      ];
      const data: CargosDataset = {
        office: query.office, year: query.year, round: query.round, line: query.line,
        seats: allOffices[0]?.seats ?? null,
        level: municipalLevel ? "municipality" : "state",
        rows,
        summary: {
          lineShare,
          presidentShare,
          splitPp: lineShare !== null && presidentShare !== null ? lineShare - presidentShare : null,
          comparable: comparable.length,
          officeAbove: comparable.filter((r) => r.splitPp! > 0).length,
          officeBelow: comparable.filter((r) => r.splitPp! < 0).length,
        },
        lineComparable,
        president: { label: president?.leader ? `${president.leader.name} (${president.leader.party})` : null, party: presidentParty(query.line, query.year) },
        caveats,
      };
      return this.response(catalog, data, `${OFFICE_LABELS[query.office]} ${query.year}, ${query.round}º turno. ${caveats.join(" ")}`);
    });
  }
  async getResiduos(query: ResiduosQuery): Promise<AtlasResponse<ResiduosDataset>> {
    const catalog = await this.repository.getCatalog();
    this.requireUf(catalog, query.uf);
    this.requireElection(catalog, 2022, 1);
    this.requireElection(catalog, query.year, 1);
    return this.cached(`${catalog.snapshotId}:residuos:${JSON.stringify(query)}`, async () => {
      const { territories, index } = await this.municipal(catalog, "BR");
      const sample = territories.flatMap((territory) => {
        if (!territory.comparable) return [];
        const x = candidateShare(index.get(metricKey(territory.id, 2022, 1)) ?? null, query.line);
        const y = candidateShare(index.get(metricKey(territory.id, query.year, 1)) ?? null, query.line);
        return x !== null && y !== null ? [{ territory, x, y }] : [];
      });
      const fit = ols(sample);
      const rows = fit
        ? sample
            .filter((p) => scopeContainsState(query.uf, p.territory.uf))
            .map((p) => {
              const expected = fit.intercept + fit.slope * p.x;
              return { territory: p.territory, x: p.x, observed: p.y, expected, residualPp: p.y - expected };
            })
            .sort((a, b) => b.residualPp - a.residualPp)
        : [];
      const data: ResiduosDataset = {
        year: query.year, line: query.line, baseYear: 2022,
        label: `${query.line}: ${query.year} esperado a partir de 2022 (1º turno)`,
        fit,
        rows,
        summary: {
          n: rows.length,
          meanResidualPp: rows.length ? rows.reduce((s, r) => s + r.residualPp, 0) / rows.length : null,
          positive: rows.filter((r) => r.residualPp > 0).length,
          negative: rows.filter((r) => r.residualPp < 0).length,
        },
      };
      return this.response(catalog, data, "Resíduo = participação observada da linha em 2026 menos a esperada por regressão linear simples sobre a participação em 2022 (1º turno), ajustada em todos os municípios comparáveis do país; o recorte só filtra as linhas. Descritivo: desvio de um modelo de uma variável, sem causa nem inferência individual. 2026 provisório.");
    });
  }
  async getThemes(): Promise<AtlasResponse<ThemesDataset>> {
    const catalog = await this.repository.getCatalog();
    return this.response(
      catalog,
      await this.repository.getThemes(),
      "Busca = interesse relativo (0–100), não intenção de voto. Séries normalizadas separadamente não têm níveis comparáveis. Pesquisas conservam pergunta, universo e período; dados ausentes não são sintetizados.",
    );
  }
  async getDossier(id: string): Promise<AtlasResponse<DossierDataset>> {
    const catalog = await this.repository.getCatalog();
    const territories = await this.repository.getTerritories();
    const territory =
      catalog.territories.find((t) => t.id === id) ??
      regionTerritories.find((t) => t.id === id) ??
      territories.find((t) => t.id === id);
    if (!territory)
      throw new AtlasError(
        "TERRITORY_NOT_FOUND",
        "Território não encontrado.",
        404,
      );
    const metrics =
      territory.level === "municipality" && territory.uf
        ? await this.repository.getMetrics(territory.uf)
        : await this.repository.getSummary();
    const [context, representation] = await Promise.all([
      this.repository.getContext(),
      this.repository.getRepresentation(),
    ]);
    const region = regionForScope(id);
    const metricIndex = indexMetrics(metrics);
    const history = region
      ? catalog.elections
          .flatMap((election) =>
            election.rounds.map((round) =>
              aggregateRegionalMetric(
                id,
                region.states.map(
                  (state) =>
                    metricIndex.get(metricKey(state, election.year, round)) ??
                    null,
                ),
              ),
            ),
          )
          .filter((metric): metric is ElectionMetric => metric !== null)
      : metrics.filter((m) => m.territoryId === id);
    return this.response(
      catalog,
      {
        territory,
        history: history.sort((a, b) => a.year - b.year || a.round - b.round),
        context: context.values.find((v) => v.territoryId === id) ?? null,
        indicators: context.indicators,
        representation: representation.filter((r) =>
          territory.level === "country"
            ? true
            : region
              ? scopeContainsState(id, r.territoryId)
              : r.territoryId ===
                (territory.level === "municipality" ? territory.uf : id),
        ),
      },
      "Histórico eleitoral completo; macrorregiões somam votos e denominadores de UFs, sem exterior, sem média de percentuais. Indicadores de contexto são municipais, não médias regionais artificiais. Representação por UF no ano eleitoral, com partidos inferiores a 1% preservados.",
    );
  }
}
