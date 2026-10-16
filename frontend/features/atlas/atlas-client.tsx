"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Compass,
  Layers,
  Maximize2,
  Search,
  X,
} from "lucide-react";
import type {
  AtlasCatalog,
  AtlasGeometry,
  AtlasIndicator,
  AtlasTab,
  ComparisonDataset,
  ComparisonRow,
  ContextAnalysis,
  ContextIndicator,
  CargosDataset,
  ElectionMetric,
  OfficeCode,
  ResiduosDataset,
  TerritoryDataset,
  ThemesDataset,
} from "./types";
import { CargosReading, CargosTable, ResiduosSection } from "./components/cargos";
import { useAtlasData } from "./use-atlas-data";
import { ContextLegend } from './components/context-legend';
import { ContextReading } from './components/context-reading';
import { classifyContext, type ContextMapMode } from './crossmap';
import {
  candidateClass,
  candidatePct,
  displayName,
  margin,
  number,
  pct,
  pp,
  rate,
  readableDate,
  shortNumber,
  winner,
} from "./format";
import { AtlasMap, type AtlasCamera } from "./components/atlas-map";
import { ContextPlot } from "./components/context-plot";
import { DataState } from "./components/data-state";
import { Dossier } from "./components/dossier";
import { Themes } from "./components/themes";
import { growthContrasts, indicatorDistribution } from "./insights";
import {
  atlasRegions,
  isStateScope,
  regionForScope,
  regionForState,
  scopeContainsState,
} from "./scopes";
import { StatePreview } from "./components/state-preview";
import { RegionOverview } from "./components/region-overview";
import { AtlasWorkbench } from "./components/atlas-workbench";
import { AtlasTimeline } from "./components/atlas-timeline";
import { parseCamera, serializeCamera, isDeltaMap } from "./map-navigation";
import "./immersive.css";

const tabs: { id: AtlasTab; label: string; description: string }[] = [
  { id: "atlas", label: "Atlas", description: "O território do voto" },
  {
    id: "evolucao",
    label: "Evolução",
    description: "A geografia da transformação",
  },
  { id: "cargos", label: "Cargos", description: "Presidência × outros cargos" },
  { id: "contexto", label: "Contexto", description: "Além dos resultados" },
  { id: "pautas", label: "Pautas", description: "Evidências em perspectiva" },
];
const indicators: { id: AtlasIndicator; label: string; denominator: string }[] =
  [
    {
      id: "winner",
      label: "Vencedor",
      denominator: "Participação nos votos válidos",
    },
    {
      id: "margin",
      label: "Margem de vitória",
      denominator: "Diferença entre os dois primeiros · pontos percentuais",
    },
    {
      id: "turnout",
      label: "Comparecimento",
      denominator: "% do eleitorado apto",
    },
    {
      id: "abstention",
      label: "Abstenção",
      denominator: "% do eleitorado apto",
    },
    { id: "blank", label: "Brancos", denominator: "% do comparecimento" },
    { id: "null", label: "Nulos", denominator: "% do comparecimento" },
  ];
const presets = [
  { id: "2018-2022", from: 2018, to: 2022, round: 2 as const },
  { id: "2022-2026", from: 2022, to: 2026, round: 1 as const },
];
const scenes = [
  "O território do voto",
  "Onde o vencedor mudou",
  "Um estado, muitas trajetórias",
  "O voto em seu contexto",
  "Pautas: três tipos de evidência",
  "O dossiê territorial",
];
function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}
function Insight({
  metric,
  name,
  onDossier,
}: {
  metric: ElectionMetric | null;
  name: string;
  onDossier: () => void;
}) {
  return (
    <aside className="atlas-insight">
      <span className="atlas-eyebrow">Leitura do território</span>
      <h2>{name}</h2>
      <p className="atlas-helper">
        Presidência · {metric?.year} · {metric?.round}º turno
      </p>
      <div className="atlas-result-list">
        {metric?.candidates
          .slice()
          .sort((a, b) => b.votes - a.votes)
          .map((candidate) => (
            <div
              className={`atlas-candidate-${candidateClass(candidate)}`}
              key={candidate.id}
            >
              <div>
                <i />
                <span>
                  {displayName(candidate.name)}
                  <small>{candidate.party}</small>
                </span>
                <b>{pct(candidatePct(candidate, metric))}</b>
              </div>
              <div className="atlas-result-track">
                <span
                  style={{ width: `${candidatePct(candidate, metric) ?? 0}%` }}
                />
              </div>
              <small>{number(candidate.votes)} votos</small>
            </div>
          ))}
      </div>
      <div className="atlas-insight-fact">
        <span>Margem entre os dois primeiros</span>
        <strong>{pp(margin(metric))}</strong>
        <p>
          Calculada sobre os votos válidos; não sobre o tamanho do território.
        </p>
      </div>
      <div className="atlas-mini-metrics">
        <div>
          <span>Comparecimento</span>
          <b>{pct(metric ? rate(metric.turnout, metric.eligible) : null)}</b>
        </div>
        <div>
          <span>Abstenção</span>
          <b>
            {pct(metric ? rate(metric.abstentions, metric.eligible) : null)}
          </b>
        </div>
        <div>
          <span>Votos válidos</span>
          <b>{metric ? shortNumber(metric.validVotes) : "—"}</b>
        </div>
        <div>
          <span>Eleitorado apto</span>
          <b>{metric ? shortNumber(metric.eligible) : "—"}</b>
        </div>
      </div>
      <button className="atlas-button atlas-button-wide" onClick={onDossier}>
        <BookOpen size={16} /> Abrir dossiê <ArrowRight size={16} />
      </button>
    </aside>
  );
}
export function AtlasClient({
  initialParams,
}: {
  initialParams: Record<string, string>;
}) {
  const [client] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={client}>
      <AtlasExperience initialParams={initialParams} />
    </QueryClientProvider>
  );
}
function AtlasExperience({
  initialParams,
}: {
  initialParams: Record<string, string>;
}) {
  const [tab, setTab] = useState<AtlasTab>(
    tabs.some((t) => t.id === initialParams.tab) &&
      !(initialParams.tab === "cargos" && initialParams.layout === "classic")
      ? (initialParams.tab as AtlasTab)
      : "atlas",
  );
  const [uf, setUf] = useState(
    /^(BR|[A-Z]{2})$/.test(initialParams.uf ?? "") ||
      regionForScope(initialParams.uf ?? "")
      ? initialParams.uf
      : "BR",
  );
  const [year, setYear] = useState(
    [2018, 2022, 2026].includes(Number(initialParams.year))
      ? Number(initialParams.year)
      : 2022,
  );
  const [round, setRound] = useState<1 | 2>(
    initialParams.round === "1" || initialParams.year === "2026" ? 1 : 2,
  );
  const [indicator, setIndicator] = useState<AtlasIndicator>(
    indicators.some((i) => i.id === initialParams.indicator)
      ? (initialParams.indicator as AtlasIndicator)
      : "winner",
  );
  const [presetId, setPresetId] = useState(
    initialParams.comparison === "2022-2026" ? "2022-2026" : "2018-2022",
  );
  const [candidate, setCandidate] = useState(
    initialParams.candidate === "PL" ? "PL" : "PT",
  );
  const [office, setOffice] = useState<OfficeCode>(
    ([3, 5, 6, 7, 8] as const).find((code) => code === Number(initialParams.office)) ?? 3,
  );
  const [symbols, setSymbols] = useState(initialParams.symbols === "1");
  const [curtain, setCurtain] = useState(initialParams.view === "curtain");
  const [split, setSplit] = useState(50);
  const [changesOnly, setChangesOnly] = useState(initialParams.changes === "1");
  const [contextIndicator, setContextIndicator] = useState<ContextIndicator>(
    ["income", "education", "density", "gdp", "homicide"].includes(initialParams.context)
      ? (initialParams.context as ContextIndicator)
      : "income",
  );
  const [measure, setMeasure] = useState<"share" | "delta">(
    initialParams.measure === "delta" ? "delta" : "share",
  );
  const [contextMode,setContextMode]=useState<ContextMapMode>(initialParams.contextView==='indicator'?'indicator':initialParams.contextView==='vote'?'vote':'bivariate');
  const [contextCell,setContextCell]=useState<number|null>(/^[0-8]$/.test(initialParams.cell??'')?Number(initialParams.cell):null);
  const [weighted, setWeighted] = useState(initialParams.weighted === "1");
  const [selected, setSelected] = useState<string | null>(null);
  const [peek, setPeek] = useState<string | null>(
    isStateScope(initialParams.preview ?? "") ? initialParams.preview : null,
  );
  const [highlighted, setHighlighted] = useState<string[]>([]);
  const changeContextSelection=useCallback((ids:string[])=>{setContextCell(null);setHighlighted(ids);},[]);
  const [dossier, setDossier] = useState<string | null>(null);
  const [camera, setCamera] = useState<AtlasCamera | null>(() => parseCamera(initialParams.map));
  const scopeCameras = useRef(new Map<string, AtlasCamera>());
  const [search, setSearch] = useState("");
  const [requestedPage, setPage] = useState(1);
  const [presentation, setPresentation] = useState(false);
  const [scene, setScene] = useState(0);
  const catalogQuery = useAtlasData<AtlasCatalog>("catalogo");
  const catalog = catalogQuery.data?.data;
  const preset = presets.find((p) => p.id === presetId)!;
  // Cargos: year/round fall back to what the chosen office actually has in the published release.
  const officeEntries = catalog?.offices ?? [];
  const officeEntry = officeEntries.find((o) => o.office === office) ?? officeEntries[0];
  const cargoElection =
    officeEntry?.elections.find((e) => e.year === year) ??
    officeEntry?.elections[officeEntry.elections.length - 1];
  const cargoYear = cargoElection?.year ?? year;
  const cargoRound = cargoElection?.rounds.includes(round) ? round : (cargoElection?.rounds[0] ?? round);
  const activeYear = tab === "evolucao" ? preset.to : tab === "cargos" ? cargoYear : year;
  const activeRound = tab === "evolucao" ? preset.round : tab === "cargos" ? cargoRound : round;
  const territoryQuery = useAtlasData<TerritoryDataset>(
    catalog
      ? `territorios?uf=${uf}&year=${activeYear}&round=${activeRound}&pageSize=100`
      : null,
  );
  const geometryQuery = useAtlasData<AtlasGeometry>(
    catalog ? `territorios?kind=geometry&uf=${uf}` : null,
  );
  const beforeQuery = useAtlasData<TerritoryDataset>(
    catalog && tab === "evolucao"
      ? `territorios?uf=${uf}&year=${preset.from}&round=${preset.round}&pageSize=100`
      : null,
  );
  const comparisonQuery = useAtlasData<ComparisonDataset>(
    catalog &&
      tab === "evolucao" &&
      (candidate !== "PL" || preset.from !== 2018 || beforeQuery.data)
      ? `comparacao?uf=${uf}&fromYear=${preset.from}&toYear=${preset.to}&round=${preset.round}&candidate=${encodeURIComponent(candidate === "PL" && preset.from === 2018 ? (beforeQuery.data!.data.summary?.candidates.find((c) => c.party === "PSL")?.id ?? "unavailable") : candidate)}`
      : null,
  );
  const contextMeasure =
    measure === "delta" &&
    ((year === 2022 && round === 2) || (year === 2026 && round === 1))
      ? "delta"
      : "share";
  const contextQuery = useAtlasData<ContextAnalysis>(
    catalog && tab === "contexto"
      ? `contexto?uf=${uf}&year=${year}&round=${round}&indicator=${contextIndicator}&candidate=${candidate}&measure=${contextMeasure}&weighted=${weighted}`
      : null,
  );
  const themesQuery = useAtlasData<ThemesDataset>(
    catalog && tab === "pautas" ? "pautas" : null,
  );
  const cargosQuery = useAtlasData<CargosDataset>(
    catalog && tab === "cargos" && officeEntry
      ? `cargos?uf=${uf}&year=${cargoYear}&round=${cargoRound}&office=${officeEntry.office}&line=${candidate === "PL" ? "PL" : "PT"}`
      : null,
  );
  const residuosQuery = useAtlasData<ResiduosDataset>(
    catalog && tab === "cargos" && officeEntry
      ? `residuos?uf=${uf}&year=2026&line=${candidate === "PL" ? "PL" : "PT"}`
      : null,
  );
  const cargosData = cargosQuery.data?.data;
  const cargoMap = useMemo<ComparisonRow[]>(
    () =>
      (cargosData?.rows ?? []).map((row) => ({
        territory: row.territory,
        before: null,
        after: null,
        beforeShare: row.president?.lineShare ?? null,
        afterShare: row.office.lineShare,
        deltaPp: row.splitPp,
        deltaVotes: null,
        marginBefore: null,
        marginAfter: null,
        winnerBefore: null,
        winnerAfter: null,
        changed: false,
        status: row.splitPp === null ? "missing" : "comparable",
      })),
    [cargosData],
  );
  const records = useMemo(
    () => territoryQuery.data?.data.records ?? [],
    [territoryQuery.data],
  );
  const comparison = comparisonQuery.data?.data;
  const context = contextQuery.data?.data;
  const geometry = geometryQuery.data?.data;
  const municipalView = isStateScope(uf);
  const scopeRegion = regionForScope(uf);
  const parentRegion = municipalView ? regionForState(uf) : scopeRegion;
  const peekQuery = useAtlasData<TerritoryDataset>(
    peek
      ? `territorios?uf=BR&year=${activeYear}&round=${activeRound}&pageSize=100`
      : null,
  );
  const peekBeforeQuery = useAtlasData<TerritoryDataset>(
    peek && tab === "evolucao"
      ? `territorios?uf=BR&year=${preset.from}&round=${preset.round}&pageSize=100`
      : null,
  );
  const peekMetric =
    records.find((record) => record.territory.id === peek)?.metric ??
    peekQuery.data?.data.records.find((record) => record.territory.id === peek)
      ?.metric ??
    null;
  const closePeek = useCallback(() => setPeek(null), []);
  const closeSelected = useCallback(() => setSelected(null), []);
  const currentTerritory = catalog?.territories.find(
    (t) => t.id === (selected ?? uf),
  );
  const selectedQuery = useAtlasData<TerritoryDataset>(
    selected && currentTerritory?.uf && !records.some(record => record.territory.id === selected)
      ? `territorios?uf=${currentTerritory.uf}&year=${activeYear}&round=${activeRound}&pageSize=100` : null,
  );
  const currentMetric = selected
    ? (records.find((r) => r.territory.id === selected)?.metric ?? selectedQuery.data?.data.records.find(r=>r.territory.id===selected)?.metric ?? null)
    : (territoryQuery.data?.data.summary ?? null);
  const name = currentTerritory?.name ?? (uf === "BR" ? "Brasil" : uf);
  const stateName = catalog?.territories.find((t) => t.id === uf)?.name ?? uf;
  const contrasts = useMemo(
    () => growthContrasts(comparison?.rows ?? []),
    [comparison],
  );
  const distribution = useMemo(
    () => indicatorDistribution(records, indicator),
    [records, indicator],
  );
  const closeDossier = useCallback(() => setDossier(null), []);
  const comparisonMap = useMemo(() => {
    if (!comparison) return [];
    if (isStateScope(uf)) return comparison.rows;
    return records.map((record) => {
      const before =
        beforeQuery.data?.data.records.find(
          (r) => r.territory.id === record.territory.id,
        )?.metric ?? null;
      const after = record.metric;
      const beforeCandidate = before?.candidates.find(
        (c) =>
          c.party ===
          (candidate === "PL" && preset.from === 2018 ? "PSL" : candidate),
      );
      const afterCandidate =
        candidate === "PL" && preset.from === 2018
          ? after?.candidates.find(
              (c) =>
                beforeCandidate?.personKey &&
                c.personKey === beforeCandidate.personKey,
            )
          : after?.candidates.find((c) => c.party === candidate);
      const s0 =
        before && beforeCandidate
          ? candidatePct(beforeCandidate, before)
          : null;
      const s1 =
        after && afterCandidate ? candidatePct(afterCandidate, after) : null;
      const municipalities = comparison.rows.filter(
        (r) => r.territory.uf === record.territory.id,
      );
      return {
        territory: record.territory,
        before,
        after,
        beforeShare: s0,
        afterShare: s1,
        deltaPp: s0 !== null && s1 !== null ? s1 - s0 : null,
        deltaVotes:
          beforeCandidate && afterCandidate
            ? afterCandidate.votes - beforeCandidate.votes
            : null,
        marginBefore: margin(before),
        marginAfter: margin(after),
        winnerBefore: winner(before)?.name ?? null,
        winnerAfter: winner(after)?.name ?? null,
        changed: municipalities.some((r) => r.changed),
        status: before && after ? "comparable" : "missing",
      } as ComparisonRow;
    });
  }, [comparison, records, beforeQuery.data, uf, candidate, preset.from]);
  const searchResults = useMemo(
    () =>
      search.trim().length >= 2
        ? (catalog?.territories
            .filter(
              (t) =>
                t.level !== "exterior" &&
                normalize(t.name + " " + (t.uf ?? "")).includes(
                  normalize(search),
                ),
            )
            .slice(0, 8) ?? [])
        : [],
    [search, catalog],
  );
  const rankRows = useMemo(() => {
    if (tab === "evolucao")
      return (comparison?.rows ?? [])
        .filter(
          (r) =>
            (!changesOnly || r.changed) &&
            (!highlighted.length || highlighted.includes(r.territory.id)),
        )
        .sort((a, b) => Math.abs(b.deltaPp ?? 0) - Math.abs(a.deltaPp ?? 0));
    return records
      .filter(
        (r) => !highlighted.length || highlighted.includes(r.territory.id),
      )
      .sort(
        (a, b) => (b.metric?.validVotes ?? 0) - (a.metric?.validVotes ?? 0),
      );
  }, [tab, comparison, records, changesOnly, highlighted]);
  const page = Math.min(
    requestedPage,
    Math.max(
      1,
      Math.ceil(
        (tab === "contexto"
          ? (context?.points.filter(
              (p) =>
                !highlighted.length || highlighted.includes(p.territory.id),
            ).length ?? 0)
          : rankRows.length) / 12,
      ),
    ),
  );
  const histogram = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => {
        const min = -30 + i * 5;
        return {
          min,
          count:
            comparison?.rows.filter(
              (r) =>
                r.deltaPp !== null &&
                (i === 0
                  ? r.deltaPp < min + 5
                  : i === 11
                    ? r.deltaPp >= min
                    : r.deltaPp >= min && r.deltaPp < min + 5),
            ).length ?? 0,
        };
      }),
    [comparison],
  );
  useEffect(() => {
    const params = new URLSearchParams({
      tab,
      office: String(office),
      uf,
      year: String(year),
      round: String(round),
      indicator,
      comparison: presetId,
      candidate,
      context: contextIndicator,
      measure: contextMeasure,
    });
    if (symbols) params.set("symbols", "1");
    params.set('contextView',contextMode);
    if(contextCell!==null)params.set('cell',String(contextCell));
    if (curtain) params.set("view", "curtain");
    if (changesOnly) params.set("changes", "1");
    if (weighted) params.set("weighted", "1");
    if (peek) params.set("preview", peek);
    if (camera) params.set("map", serializeCamera(camera));
    if (initialParams.layout === "classic") params.set("layout", "classic");
    const timer=window.setTimeout(()=>window.history.replaceState(null, "", `/atlas?${params}`), 250);
    return ()=>window.clearTimeout(timer);
  }, [
    tab,
    office,
    uf,
    year,
    round,
    indicator,
    presetId,
    candidate,
    contextIndicator,
    contextMode,
    contextCell,
    measure,
    contextMeasure,
    symbols,
    curtain,
    changesOnly,
    weighted,
    peek,
    camera,
    initialParams.layout,
  ]);
  // Discard ephemeral map selection when its remote dataset identity changes.
  /* eslint-disable react-hooks/set-state-in-effect -- Synchronize URL input and ephemeral selection with the remote catalog/dataset identity. */
  useEffect(() => {
    setSelected((id) => {
      const target = catalog?.territories.find((t) => t.id === id);
      return target?.uf && scopeContainsState(uf,target.uf) ? id : null;
    });
    setHighlighted([]);
    setPage(1);
    setPeek((id) => (id && scopeContainsState(uf, id) ? id : null));
  }, [uf, tab, presetId, year, round, catalog]);
  useEffect(()=>{
    if(tab==='contexto' && context && contextCell!==null){
      setHighlighted(classifyContext(context.points).rows.filter(row=>row.cell===contextCell).map(row=>row.territory.id));
    }
  },[context,contextCell,tab]);
  // Reconcile URL input against the asynchronously published catalog, never an invented edition.
  useEffect(() => {
    if (!catalog) return;
    const election = catalog.elections.find((e) => e.year === year);
    if (!election) {
      setYear(2022);
      setRound(2);
    } else if (!election.rounds.includes(round)) setRound(election.rounds[0]);
    if (
      !catalog.territories.some(
        (t) => t.id === uf && ["state", "region", "country"].includes(t.level),
      )
    )
      setUf("BR");
  }, [catalog, year, round, uf]);
  /* eslint-enable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (presentation) document.body.dataset.atlasPresentation = "true";
    else delete document.body.dataset.atlasPresentation;
    return () => {
      delete document.body.dataset.atlasPresentation;
    };
  }, [presentation]);
  const goScene = useCallback(
    (index: number) => {
      setScene(index);
      setDossier(null);
      setPeek(null);
      requestAnimationFrame(() =>
        window.scrollTo({ top: 0, behavior: "auto" }),
      );
      if (index === 0) {
        setTab("atlas");
        setUf("BR");
        setYear(2022);
        setRound(2);
        setIndicator("winner");
        setSymbols(false);
      }
      if (index === 1) {
        setTab("evolucao");
        setUf("BR");
        setPresetId("2018-2022");
        setCandidate("PT");
        setCurtain(false);
        setChangesOnly(true);
      }
      if (index === 2) {
        setTab("evolucao");
        setUf("MG");
        setPresetId("2018-2022");
        setCandidate("PT");
        setCurtain(true);
        setChangesOnly(false);
      }
      if (index === 3) {
        setTab("contexto");
        setUf("MG");
        setYear(2022);
        setRound(2);
        setContextIndicator("income");
        setMeasure("share");
        setWeighted(false);
      }
      if (index === 4) setTab("pautas");
      if (index === 5) setDossier(uf === "BR" ? "MG" : uf);
    },
    [uf],
  );
  useEffect(() => {
    if (!presentation) return;
    const key = (event: KeyboardEvent) => {
      if (
        event.target instanceof HTMLElement &&
        event.target.matches("input,select,textarea")
      )
        return;
      if (event.key === "Escape") {
        setPresentation(false);
        return;
      }
      if (event.key === "ArrowRight") goScene(Math.min(5, scene + 1));
      if (event.key === "ArrowLeft") goScene(Math.max(0, scene - 1));
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [presentation, scene, goScene]);
  function choose(id: string, locate = false) {
    const target = catalog?.territories.find((t) => t.id === id);
    if (target?.level === "state") {
      if (isStateScope(uf) || !scopeContainsState(uf, id)) changeScope("BR");
      setPeek(id);
      setSelected(null);
      if (tab === "pautas") setTab("atlas");
    } else if (target?.level === "country" || target?.level === "region") {
      changeScope(target.id);
    } else {
      setPeek(null);
      setSelected(id);
      if (locate && target?.centroid && target.mapped && initialParams.layout !== "classic") {
        setCamera({center:target.centroid,zoom:7,pitch:camera?.pitch ?? 45,bearing:camera?.bearing ?? -8});
      }
      if(initialParams.layout === "classic") {
        if (target?.uf && target.uf !== uf) changeScope(target.uf);
        setDossier(id);
      }
    }
    setSearch("");
  }
  function changeScope(id: string) {
    if (camera) scopeCameras.current.set(uf,camera);
    setPeek(null);
    setSelected(null);
    setUf(id);
    setCamera(scopeCameras.current.get(id) ?? null);
    setSearch("");
  }
  function changeYear(value: number) {
    setYear(value);
    setRound(
      catalog?.elections.find((e) => e.year === value)?.rounds.includes(round)
        ? round
        : 1,
    );
  }
  const mapHighlighted = useMemo(() => municipalView ? highlighted : [...highlighted,...new Set(context?.points.filter(point=>highlighted.includes(point.territory.id)).map(point=>point.territory.uf ?? "") ?? [])], [municipalView,highlighted,context?.points]);
  const mapContextLayer=useMemo(()=>tab==='contexto' && context ? {analysis:context,mode:contextMode} : undefined,[tab,context,contextMode]);
  const mapProps = {
    geometry: geometry!,
    records,
    indicator,
    symbols: tab === "atlas" && symbols,
    selectedId: peek ?? selected,
    highlightedIds: highlighted,
    onSelect: choose,
    perspective: (tab === "atlas" || tab === "pautas") && !symbols,
    camera,
    onCameraChange: setCamera,
    progressive: tab !== "cargos" && !isStateScope(uf) && !symbols ? {year:activeYear,round:activeRound} : undefined,
    municipalComparison: tab === "cargos" ? undefined : comparison?.rows,
    liveCamera: tab === "evolucao" && curtain,
    contextLayer: mapContextLayer,
  };
  const stateOverlay = peek && (
    <StatePreview
      id={peek}
      name={
        catalog?.territories.find((territory) => territory.id === peek)?.name ??
        peek
      }
      metric={peekMetric}
      before={
        peekBeforeQuery.data?.data.records.find(
          (record) => record.territory.id === peek,
        )?.metric
      }
      loading={peekQuery.isLoading}
      error={peekQuery.error}
      onClose={closePeek}
      onDeepen={() => changeScope(peek)}
      onDossier={() => setDossier(peek)}
    />
  );
  const activeIndicator = indicators.find((i) => i.id === indicator)!;
  const pending =
    territoryQuery.isLoading ||
    geometryQuery.isLoading ||
    (tab === "evolucao" &&
      (comparisonQuery.isLoading || beforeQuery.isLoading));
  const mainError =
    territoryQuery.error ??
    geometryQuery.error ??
    (tab === "evolucao" ? (comparisonQuery.error ?? beforeQuery.error) : null);
  const retryMain = () => {
    void territoryQuery.refetch();
    void geometryQuery.refetch();
    if (tab === "evolucao") {
      void comparisonQuery.refetch();
      void beforeQuery.refetch();
    }
  };
  if (initialParams.layout !== "classic") {
    const deltaView = isDeltaMap(tab,curtain) || tab==="cargos";
    const selectionOverlay = peek ? stateOverlay : selected && currentTerritory ? <StatePreview
      id={selected} name={currentTerritory.name} level="municipality" metric={currentMetric} loading={selectedQuery.isLoading} error={selectedQuery.error}
      onClose={closeSelected} onDeepen={()=>{if(currentTerritory.uf)changeScope(currentTerritory.uf);}}
      onDossier={()=>setDossier(selected)}
    /> : null;
    const header = <>
      <a className="atlas-brand" href="/atlas" onClick={event=>{event.preventDefault();changeScope("BR");}}>
        <span className="atlas-brand-icon"><Compass size={22}/></span><span><small>LOGOS POLIS</small><h1>Atlas Eleitoral</h1></span>
      </a>
      {catalog && <span className="atlas-immersive-version"><i/>BASE PREPARADA · {readableDate(catalog.generatedAt)}</span>}
      <div className="atlas-search"><Search size={17}/><input aria-label="Buscar estado ou município" placeholder="Buscar território…" value={search} onChange={event=>setSearch(event.target.value)} onKeyDown={event=>{if(event.key==="Escape")setSearch("");if(event.key==="Enter" && searchResults[0])choose(searchResults[0].id,true);}}/>
        {searchResults.length>0 && <div className="atlas-search-results">{searchResults.map(territory=><button key={territory.id} onClick={()=>choose(territory.id,true)}><span>{displayName(territory.name)}</span><small>{territory.level==="municipality" ? `${territory.uf} · município` : territory.level==="region" ? "Região" : "Estado"}{!territory.mapped ? " · sem geometria" : ""}</small><ArrowRight size={14}/></button>)}</div>}
      </div>
      <button className="atlas-button" onClick={()=>{setPresentation(!presentation);if(!presentation)goScene(0);}}>{presentation?<X size={16}/>:<Maximize2 size={16}/>}<span>{presentation?"Sair":"Apresentar"}</span></button>
    </>;
    const tools = catalog ? <>
      <label>Território analisado<select aria-label="Território" value={uf} onChange={event=>changeScope(event.target.value)}><option value="BR">Brasil · panorama nacional</option><optgroup label="Macrorregiões">{atlasRegions.map(region=><option key={region.id} value={region.id}>{region.name}</option>)}</optgroup><optgroup label="Estados e Distrito Federal">{catalog.territories.filter(territory=>territory.level==="state").map(territory=><option key={territory.id} value={territory.id}>{territory.name}</option>)}</optgroup></select></label>
      {tab === "cargos" && officeEntries.length > 0 ? <label>Cargo<select aria-label="Cargo" value={officeEntry?.office} onChange={event=>setOffice(Number(event.target.value) as OfficeCode)}>{officeEntries.map(option=><option key={option.office} value={option.office}>{option.label}</option>)}</select></label> : <label>Cargo<span className="atlas-office-tag">Presidência</span></label>}
      {tab === "atlas" || tab === "pautas" ? <label>Camada<select aria-label="Indicador" value={indicator} onChange={event=>setIndicator(event.target.value as AtlasIndicator)}>{indicators.map(option=><option key={option.id} value={option.id}>{option.label}</option>)}</select></label> : tab === "cargos" ? <>
        <label>Linha comparada<select aria-label="Linha comparada" value={candidate === "PL" ? "PL" : "PT"} onChange={event=>setCandidate(event.target.value)}><option value="PT">PT</option><option value="PL">PL</option></select></label>
        <p className="atlas-helper">Eleição e turno: linha do tempo abaixo. Cores: diferença entre a linha no cargo e na Presidência, no mesmo território.</p>
      </> : tab === "evolucao" ? <>
        <label>Comparação<select aria-label="Comparação" value={presetId} onChange={event=>setPresetId(event.target.value)}><option value="2018-2022">2018 → 2022 · 2º turno</option><option value="2022-2026">2022 → 2026 · provisória</option></select></label>
        <label>Candidatura<select aria-label="Candidatura comparada" value={candidate} onChange={event=>setCandidate(event.target.value)}><option value="PT">Haddad / Lula · PT</option><option value="PL">Jair Bolsonaro · PSL/PL</option></select></label>
        <label className="atlas-checkbox"><input type="checkbox" checked={changesOnly} onChange={event=>setChangesOnly(event.target.checked)}/>Somente mudanças de vencedor</label>
      </> : <>
        <label>Indicador territorial<select aria-label="Indicador territorial" value={contextIndicator} onChange={event=>{setContextIndicator(event.target.value as ContextIndicator);setHighlighted([]);setContextCell(null);}}><option value="gdp">PIB per capita</option><option value="homicide">Mortalidade por agressões</option><option value="income">Renda domiciliar per capita</option><option value="education">Alfabetização · 15+</option><option value="density">Densidade demográfica</option></select></label>
        <label>Comparar com<select aria-label="Candidatura no cruzamento" value={candidate} onChange={event=>{setCandidate(event.target.value);setHighlighted([]);setContextCell(null);}}><option value="PT">PT · candidatura da eleição</option><option value="PL">PL/PSL · candidatura da eleição</option></select></label>
        <label>Leitura do mapa<select aria-label="Leitura contextual do mapa" value={contextMode} onChange={event=>setContextMode(event.target.value as ContextMapMode)}><option value="bivariate">Indicador × voto · 3×3</option><option value="indicator">Somente indicador</option><option value="vote">Somente voto</option></select></label>
        <label>Resultado eleitoral<select aria-label="Resultado eleitoral" value={contextMeasure} onChange={event=>{setMeasure(event.target.value as "share"|"delta");setHighlighted([]);setContextCell(null);}}><option value="share">Participação · {candidate}</option>{((year===2022 && round===2)||(year===2026 && round===1)) && <option value="delta">Variação · {candidate}</option>}</select></label>
        <label className="atlas-checkbox"><input type="checkbox" checked={weighted} onChange={event=>setWeighted(event.target.checked)}/>Sensibilidade ao peso eleitoral</label>
      </>}
      {uf!=="BR" && <nav className="atlas-scope-path" aria-label="Caminho territorial"><button onClick={()=>changeScope("BR")}>Brasil</button><ChevronRight size={13}/>{municipalView && parentRegion && <><button onClick={()=>changeScope(parentRegion.id)}>{parentRegion.name}</button><ChevronRight size={13}/></>}<span>{stateName}</span></nav>}
    </> : null;
    const reading = !catalog ? <DataState loading={catalogQuery.isLoading} error={catalogQuery.error} retry={()=>void catalogQuery.refetch()}/> : tab === "atlas" ? <><Insight metric={currentMetric} name={uf==="BR" && !selected ? "Brasil" : name} onDossier={()=>setDossier(selected ?? uf)}/>{uf==="BR" && !selected && <p className="atlas-helper">Totais nacionais incluem votos do exterior; a cartografia mostra o território brasileiro.</p>}</> : tab === "evolucao" ? <>
      <span className="atlas-eyebrow">Mudança de vencedor municipal</span><h2>{stateName}</h2><p className="atlas-helper">{preset.from} → {preset.to} · {preset.round}º turno</p>
      {comparison ? <><div className="atlas-reading-fact"><strong>{number(comparison.summary.changed)}</strong><p>municípios mudaram de vencedor.</p><small className="atlas-helper">{number(comparison.summary.comparable)} comparáveis · {number(comparison.summary.ties)} empates · {number(comparison.summary.missing)} ausências</small></div>
        <div className="atlas-reading-list">{comparison.transitions.filter(transition=>transition.from!==transition.to).map((transition,index)=><div key={index}><span>{displayName(transition.from)} → {displayName(transition.to)}</span><b>{number(transition.municipalities)}</b></div>)}</div>
        <div className="atlas-reading-fact"><span className="atlas-helper">Votos válidos nas localidades que mudaram</span><strong>{shortNumber(comparison.summary.votesInChanged)}</strong><p className="atlas-helper">Volume territorial, não transferência individual de votos.</p></div>
        <div className="atlas-segment"><button className={!curtain?"active":""} onClick={()=>setCurtain(false)}>Variação</button><button className={curtain?"active":""} onClick={()=>{setCurtain(true);setCamera(value=>value?{...value,pitch:0}:null);}}>Cortina</button></div>
      </> : <DataState loading={comparisonQuery.isLoading} error={comparisonQuery.error} retry={()=>void comparisonQuery.refetch()}/>}
    </> : tab === "cargos" ? (
      !officeEntry ? <p className="atlas-helper">Governador, senador e deputados ainda não estão preparados nesta base. Publique uma versão com os cargos para ativar esta aba.</p>
      : cargosData ? <CargosReading data={cargosData} officeLabel={officeEntry.label} stateName={stateName}/>
      : <DataState loading={cargosQuery.isLoading} error={cargosQuery.error} retry={()=>void cargosQuery.refetch()}/>
    ) : tab === "contexto" ? <>
      <span className="atlas-eyebrow">Associação territorial</span><h2>{stateName}</h2>
      {context && <ContextReading analysis={context} highlighted={highlighted} selectedId={selected}/>}
{context ? <><p className="atlas-helper">{context.indicator.label} × {context.candidateLabel} · {context.indicator.period}</p><div className="atlas-reading-fact"><span>Spearman neste recorte</span><strong>{context.regional.coefficient===null ? "Não calculada" : context.regional.coefficient.toFixed(3).replace(".",",")}</strong><p>{number(context.regional.n)} pares municipais válidos</p></div><div className="atlas-reading-list"><div><span>Associação nacional</span><b>{context.national.coefficient===null ? "Não calculada" : context.national.coefficient.toFixed(3).replace(".",",")}</b></div><div><span>Sem par válido no recorte</span><b>{number(context.missing)}</b></div><div><span>Municípios selecionados</span><b>{number(highlighted.length)}</b></div></div><p className="atlas-helper">Abra as análises para selecionar municípios na dispersão e relacioná-los ao mapa. Correlação não demonstra causa nem comportamento individual.</p>{highlighted.length>0 && <button className="atlas-text-button" onClick={()=>changeContextSelection([])}>Limpar seleção conectada</button>}</> : <DataState loading={contextQuery.isLoading} error={contextQuery.error} retry={()=>void contextQuery.refetch()}/>}
    </> : <>
      <span className="atlas-eyebrow">Três leituras diferentes</span><h2>Pautas em perspectiva</h2><p className="atlas-helper">Buscas, preocupação declarada e condição observada não medem a mesma coisa.</p><div className="atlas-reading-list"><div><span>Pesquisa</span><b>DataSenado · nacional</b></div><div><span>Interesse de busca</span><b>{themesQuery.data?.data.series.length ? "Séries documentadas" : "Sem série preparada"}</b></div><div><span>Contexto observado</span><b>IBGE · municipal</b></div></div><p className="atlas-helper">O mapa mantém os resultados eleitorais. As pesquisas conservam seu recorte original e não são atribuídas a cada município.</p><p className="atlas-helper">As novas camadas de segurança, PIB e cobertura local entram após a aprovação desta composição, com fontes e cobertura validadas.</p>
    </>;
    const map = !geometry || territoryQuery.isLoading || territoryQuery.error ? <DataState loading={pending} error={mainError} retry={retryMain}/> : tab === "evolucao" && curtain ? <div className="atlas-curtain">
      <div className="atlas-curtain-base"><AtlasMap {...mapProps} records={beforeQuery.data?.data.records ?? []} progressive={!municipalView?{year:preset.from,round:preset.round}:undefined} perspective={false} label={`${preset.from} · ${preset.round}º turno`}/></div>
      <div className="atlas-curtain-cover" style={{clipPath:`inset(0 ${100-split}% 0 0)`}}><AtlasMap {...mapProps} perspective={false} label={`${preset.to} · ${preset.round}º turno`} controls={false}/></div>
      <div className="atlas-curtain-divider" style={{left:`${split}%`}}/>
      <input className="atlas-curtain-slider" aria-label="Posição da cortina comparativa" type="range" min={0} max={100} value={split} onChange={event=>setSplit(Number(event.target.value))}/>
    </div> : <AtlasMap {...mapProps} comparison={tab==="evolucao"?comparisonMap:tab==="cargos"?cargoMap:undefined} delta={tab==="evolucao"||tab==="cargos"} changesOnly={tab==="evolucao" && changesOnly} highlightedIds={mapHighlighted}/>
    const analysis = <>
      <p className="atlas-helper">Recorte analisado: <b>{stateName}</b>. O enquadramento e o nível de zoom não alteram estes totais.</p>
      {tab==="contexto" && context && <><h3>{context.indicator.label}</h3><ContextPlot points={context.points} unit={context.indicator.unit} measure={contextMeasure} selectedId={selected} highlighted={highlighted} onSelect={choose} onHighlight={changeContextSelection}/><p className="atlas-helper">Arraste um retângulo para selecionar municípios. {context.methodology}</p></>}
      {tab==="cargos" && (cargosData ? <><CargosTable rows={cargosData.rows} onSelect={choose}/><ResiduosSection data={residuosQuery.data?.data} loading={residuosQuery.isLoading} error={residuosQuery.error} retry={()=>void residuosQuery.refetch()} onSelect={choose}/></> : <DataState loading={cargosQuery.isLoading} error={cargosQuery.error} retry={()=>void cargosQuery.refetch()}/>)}
      {tab==="pautas" && (themesQuery.data ? <Themes data={themesQuery.data.data}/> : <DataState loading={themesQuery.isLoading} error={themesQuery.error} retry={()=>void themesQuery.refetch()}/>)}
      {tab==="atlas" && <><button className={`atlas-button ${symbols?"active":""}`} aria-pressed={symbols} onClick={()=>setSymbols(!symbols)}><Layers size={16}/>{symbols?"Voltar ao mapa geográfico":"Mostrar peso eleitoral"}</button><p className="atlas-helper">Área dos círculos proporcional aos votos válidos. O tamanho geográfico não expressa peso eleitoral.</p>{uf==="BR" && <RegionOverview records={records} onSelect={changeScope}/>}</>}
      {tab==="evolucao" && comparison && <><h3>Proporção e volume</h3><p className="atlas-helper">{number(contrasts.shareUpVotesDown)} municípios com participação proporcional maior e votos absolutos menores; {number(contrasts.shareDownVotesUp)} com participação menor e votos absolutos maiores. {number(contrasts.n)} pares válidos.</p><h3>Distribuição das mudanças</h3><div className="atlas-histogram" role="img" aria-label={histogram.map(bin=>`${bin.min} a ${bin.min+5} pontos: ${bin.count} municípios`).join("; ")}>{histogram.map(bin=><div key={bin.min}><small>{number(bin.count)}</small><i style={{height:`${Math.max(2,bin.count/Math.max(1,...histogram.map(item=>item.count))*90)}px`}}/><span>{bin.min}</span></div>)}</div></>}
      {tab==="atlas" && indicator!=="winner" && <><h3>Distribuição do indicador</h3><p className="atlas-helper">Mediana {pct(distribution.median)}; percentis 10–90 {pct(distribution.p10)}–{pct(distribution.p90)}. {number(distribution.n)} territórios válidos; {number(distribution.missing)} sem indicador. {activeIndicator.denominator}.</p></>}
      {tab!=="pautas" && tab!=="cargos" && <><h3>Evidência territorial</h3><div className="atlas-table-wrap"><table><thead><tr><th>Território</th><th>{tab==="evolucao"?"Variação":"Mais votado"}</th><th>{tab==="evolucao"?"Votos Δ":"Votos válidos"}</th></tr></thead><tbody>{rankRows.slice((page-1)*12,page*12).map(row=> <tr key={row.territory.id}><td><button className="atlas-text-button" onClick={()=>choose(row.territory.id)}>{displayName(row.territory.name)}</button></td><td>{"deltaPp" in row ? pp(row.deltaPp) : displayName(winner(row.metric)?.name ?? "Sem dado / empate")}</td><td>{"deltaVotes" in row ? (row.deltaVotes===null?"Sem dado":number(row.deltaVotes)) : row.metric?number(row.metric.validVotes):"Sem dado"}</td></tr>)}</tbody></table></div><Pagination page={page} total={rankRows.length} onChange={setPage}/><button className="atlas-button atlas-button-wide" onClick={()=>setDossier(selected ?? uf)}><BookOpen size={16}/> Dossiê do recorte</button></>}
      {catalog && <details><summary>Fontes, versão e cobertura</summary><div className="atlas-sources"><b>{catalog.snapshotId}</b><p>{number(catalog.coverage.mappedMunicipalities)} municípios com geometria / {number(catalog.coverage.resultsMunicipalities)} na base.</p>{catalog.coverage.issues.map(issue=><p key={issue.id}>{issue.name} · {issue.uf}: {issue.reason}</p>)}{catalog.sources.map(source=><article key={source.id}><a href={source.url} target="_blank" rel="noreferrer">{source.title}</a><small>{source.period} · {source.status}</small><p>{source.methodology}</p></article>)}{catalog.methodology.map(note=><p key={note}>{note}</p>)}</div></details>}
    </>;
    return <AtlasWorkbench
      tab={tab} header={header}
      navigation={tabs.map(area=><button key={area.id} aria-current={tab===area.id?"page":undefined} onClick={()=>setTab(area.id)}>{area.label}</button>)}
      tools={tools} reading={reading} map={map}
      timeline={catalog && (tab==="evolucao" ? <nav className="atlas-immersive-timeline" aria-label="Comparações eleitorais">{presets.map(option=><button key={option.id} aria-pressed={presetId===option.id} onClick={()=>setPresetId(option.id)}><b>{option.from} → {option.to}</b><small>{option.round}º turno{option.to===2026?" · provisória":""}</small></button>)}</nav> : <AtlasTimeline elections={tab==="cargos" && officeEntry ? catalog.elections.filter(e=>officeEntry.elections.some(o=>o.year===e.year)).map(e=>({...e,rounds:e.rounds.filter(r=>officeEntry.elections.find(o=>o.year===e.year)?.rounds.includes(r))})) : catalog.elections} year={activeYear} round={activeRound} onChange={(nextYear,nextRound)=>{setYear(nextYear);setRound(nextRound);}}/>)}
      legend={tab==='contexto' && context ? <ContextLegend analysis={context} mode={contextMode} selectedCell={contextCell} onSelect={cell=>{setContextCell(cell);setHighlighted(cell===null?[]:classifyContext(context.points).rows.filter(r=>r.cell===cell).map(r=>r.territory.id));}}/> : <><span className="atlas-legend-title">{tab==="cargos"?`${candidate==="PL"?"PL":"PT"}: cargo − Presidência`:deltaView?"Variação de participação":activeIndicator.label}</span>{deltaView?<div className="atlas-delta-legend"><span>−20 p.p.</span><i/><span>+20 p.p.</span></div>:<Legend indicator={indicator}/>}<small>{tab==="cargos"?"Ciano: cargo acima da Presidência · dourado: abaixo · ±20 p.p. · cinza: sem a linha em um dos cargos":deltaView?"Escala comum · valores completos antes de arredondar":symbols?"Área proporcional aos votos válidos":activeIndicator.denominator}</small></>}
      analysis={analysis} selection={selectionOverlay}
      notice={activeYear===2026?<p className="atlas-notice">2026 · base local provisória. Certificação externa pendente.</p>:null}
      presentation={presentation?<div className="atlas-presentation"><button aria-label="Cena anterior" disabled={scene===0} onClick={()=>goScene(scene-1)}><ChevronLeft/></button><span><small>CENA {scene+1} / 6</small>{scenes[scene]}</span><button aria-label="Próxima cena" disabled={scene===5} onClick={()=>goScene(scene+1)}><ChevronRight/></button></div>:null}
      modal={dossier?<Dossier id={dossier} onClose={closeDossier} filters={`${stateName} · ${tab==="cargos"&&officeEntry?officeEntry.label:"Presidência"} · ${tab==="evolucao"?`${preset.from} → ${preset.to}`:activeYear} · ${activeRound}º turno · ${tab==="contexto"?context?.indicator.label ?? contextIndicator:activeIndicator.label}`}/>:null}
    />;
  }
  return (
    <div className="atlas-root">
      <header className="atlas-header">
        <a className="atlas-brand" href="/atlas">
          <span className="atlas-brand-icon">
            <Compass size={25} />
          </span>
          <span>
            <small>LOGOS POLIS</small>
            <b>Atlas Eleitoral</b>
          </span>
        </a>
        <div className="atlas-search">
          <Search size={17} />
          <input
            aria-label="Buscar estado ou município"
            placeholder="Buscar território…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setSearch("");
            }}
          />
          {searchResults.length > 0 && (
            <div className="atlas-search-results">
              {searchResults.map((t) => (
                <button key={t.id} onClick={() => choose(t.id)}>
                  {displayName(t.name)}
                  <small>
                    {t.uf ?? "Brasil"} ·{" "}
                    {t.level === "municipality" ? "Município" : "Estado"}
                  </small>
                  <ArrowRight size={14} />
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          className="atlas-button"
          onClick={() => {
            setPresentation(!presentation);
            if (!presentation) goScene(0);
          }}
        >
          {presentation ? <X size={16} /> : <Maximize2 size={16} />}
          <span>{presentation ? "Sair da apresentação" : "Apresentar"}</span>
        </button>
      </header>
      {presentation && (
        <div className="atlas-presentation">
          <button
            aria-label="Cena anterior"
            disabled={scene === 0}
            onClick={() => goScene(scene - 1)}
          >
            <ChevronLeft />
          </button>
          <span>
            <small>CENA {scene + 1} / 6</small>
            {scenes[scene]}
          </span>
          <button
            aria-label="Próxima cena"
            disabled={scene === 5}
            onClick={() => goScene(scene + 1)}
          >
            <ChevronRight />
          </button>
          <small>← → navegar · Esc sair</small>
        </div>
      )}
      <nav className="atlas-tabs" aria-label="Áreas do Atlas">
        {tabs.filter((t) => t.id !== "cargos").map((t) => (
          <button
            aria-current={tab === t.id ? "page" : undefined}
            className={tab === t.id ? "active" : ""}
            key={t.id}
            onClick={() => setTab(t.id)}
          >
            <span>{t.label}</span>
            <small>{t.description}</small>
          </button>
        ))}
      </nav>
      {!catalog ? (
        <DataState
          loading={catalogQuery.isLoading}
          error={catalogQuery.error}
          retry={() => void catalogQuery.refetch()}
        />
      ) : (
        <>
          <section className="atlas-heading">
            <div>
              <span className="atlas-eyebrow">
                {tab === "evolucao"
                  ? "Transformação / Território"
                  : tab === "contexto"
                    ? "Associação / Evidência"
                    : tab === "pautas"
                      ? "Interesse / Pesquisa / Indicadores"
                      : "Território / Democracia"}
              </span>
              <h1>
                {tab === "atlas"
                  ? "Cada voto tem um lugar."
                  : tab === "evolucao"
                    ? "O voto muda. O mapa revela."
                    : tab === "contexto"
                      ? "O território além das urnas."
                      : "As pautas, em perspectiva."}
              </h1>
              <p>
                {tab === "atlas"
                  ? "Explore resultados, participação e o peso eleitoral de cada território."
                  : tab === "evolucao"
                    ? "Distinga mudança de vencedor, crescimento percentual e volume de votos."
                    : tab === "contexto"
                      ? "Investigue associações — sem confundir correlação com causa."
                      : "Separe o que é buscado, o que é declarado e o que é observado."}
              </p>
            </div>
            <div className="atlas-version">
              <span className="atlas-live-dot" />
              BASE PREPARADA<small>{readableDate(catalog.generatedAt)}</small>
            </div>
          </section>
          <section className="atlas-filterbar" aria-label="Filtros da análise">
            <label>
              Território
              <select value={uf} onChange={(e) => changeScope(e.target.value)}>
                <option value="BR">Brasil · panorama nacional</option>
                <optgroup label="Macrorregiões">
                  {atlasRegions.map((region) => (
                    <option key={region.id} value={region.id}>
                      {region.name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Estados e Distrito Federal">
                  {catalog.territories
                    .filter((t) => t.level === "state")
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                </optgroup>
              </select>
            </label>
            {tab === "evolucao" ? (
              <>
                <label>
                  Comparação
                  <select
                    value={presetId}
                    onChange={(e) => setPresetId(e.target.value)}
                  >
                    {presets
                      .filter((p) =>
                        catalog.elections
                          .find((e) => e.year === p.to)
                          ?.rounds.includes(p.round),
                      )
                      .map((p) => (
                        <option value={p.id} key={p.id}>
                          {p.from} → {p.to} · {p.round}º turno
                        </option>
                      ))}
                  </select>
                </label>
                <label>
                  Participação comparada
                  <select
                    value={candidate}
                    onChange={(e) => setCandidate(e.target.value)}
                  >
                    <option value="PT">PT · Haddad / Lula</option>
                    <option value="PL">
                      {preset.from === 2018
                        ? "Jair Bolsonaro · PSL → PL"
                        : "PL · Jair → Flávio Bolsonaro"}
                    </option>
                  </select>
                </label>
              </>
            ) : tab !== "pautas" ? (
              <>
                <label>
                  Eleição
                  <select
                    value={year}
                    onChange={(e) => changeYear(Number(e.target.value))}
                  >
                    {catalog.elections.map((e) => (
                      <option value={e.year} key={e.year}>
                        {e.year}
                        {e.provisional ? " · provisória" : ""}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Turno
                  <select
                    value={round}
                    onChange={(e) => setRound(Number(e.target.value) as 1 | 2)}
                  >
                    {catalog.elections
                      .find((e) => e.year === year)
                      ?.rounds.map((r) => (
                        <option value={r} key={r}>
                          {r}º turno
                        </option>
                      ))}
                  </select>
                </label>
              </>
            ) : (
              <p className="atlas-filter-note">
                Pesquisas conservam o recorte original; o filtro territorial não
                altera uma pesquisa nacional.
              </p>
            )}
            {tab === "atlas" && (
              <label>
                Indicador
                <select
                  value={indicator}
                  onChange={(e) =>
                    setIndicator(e.target.value as AtlasIndicator)
                  }
                >
                  {indicators.map((i) => (
                    <option value={i.id} key={i.id}>
                      {i.label}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {tab !== "pautas" && (
              <button
                className="atlas-text-button"
                onClick={() => setDossier(selected ?? uf)}
              >
                <BookOpen size={15} /> Dossiê do recorte
              </button>
            )}
          </section>
          {uf !== "BR" && (
            <nav className="atlas-scope-path" aria-label="Caminho territorial">
              <button onClick={() => changeScope("BR")}>Brasil</button>
              <ChevronRight size={13} />
              {municipalView && parentRegion && (
                <>
                  <button onClick={() => changeScope(parentRegion.id)}>
                    {parentRegion.name}
                  </button>
                  <ChevronRight size={13} />
                </>
              )}
              <span aria-current="location">{stateName}</span>
              <small>
                {municipalView ? "Recorte municipal" : "Recorte por estados"}
              </small>
            </nav>
          )}
          {activeYear === 2026 && tab !== "pautas" && (
            <p className="atlas-notice">
              2026: preparação local provisória, somente 1º turno. A
              certificação externa desta edição ainda está pendente.
            </p>
          )}
          {(tab === "atlas" || tab === "evolucao") &&
          (pending || mainError || !geometry) ? (
            <DataState loading={pending} error={mainError} retry={retryMain} />
          ) : null}
          {tab === "atlas" && geometry && !pending && !mainError && (
            <>
              <div className="atlas-workspace">
                <section className="atlas-map-panel">
                  <div className="atlas-map-heading">
                    <div>
                      <span className="atlas-eyebrow">
                        {!municipalView
                          ? `${records.length} unidades federativas${scopeRegion ? " · " + scopeRegion.name : ""}`
                          : "Municípios de " + stateName}
                      </span>
                      <h2>{activeIndicator.label}</h2>
                    </div>
                    <button
                      className={`atlas-toggle ${symbols ? "active" : ""}`}
                      aria-pressed={symbols}
                      onClick={() => setSymbols(!symbols)}
                    >
                      <Layers size={15} />
                      {symbols ? "Peso eleitoral" : "Mapa geográfico"}
                    </button>
                  </div>
                  <AtlasMap {...mapProps} />
                  {stateOverlay}
                  <div className="atlas-map-caption">
                    <span>
                      {!municipalView
                        ? "Selecione um estado para ver o resumo; aprofunde quando quiser"
                        : "Clique em um município para abrir o dossiê"}
                    </span>
                    <span>
                      {symbols
                        ? "Área dos círculos ∝ votos válidos"
                        : "Cor e intensidade expressam o indicador"}
                    </span>
                  </div>
                  <Legend indicator={indicator} />
                </section>
                <Insight
                  metric={currentMetric}
                  name={name}
                  onDossier={() => setDossier(selected ?? uf)}
                />
              </div>
              {uf === "BR" && (
                <RegionOverview records={records} onSelect={changeScope} />
              )}
              {indicator !== "winner" && (
                <section className="atlas-distribution">
                  <div>
                    <span className="atlas-eyebrow">
                      Distribuição do recorte
                    </span>
                    <h2>{activeIndicator.label} em perspectiva</h2>
                    <p>
                      {number(distribution.n)}{" "}
                      {!municipalView ? "estados" : "municípios"} válidos ·{" "}
                      {number(distribution.missing)} sem indicador. Mediana{" "}
                      {pct(distribution.median)}; percentis 10–90:{" "}
                      {pct(distribution.p10)}–{pct(distribution.p90)}.{" "}
                      {activeIndicator.denominator}.
                    </p>
                  </div>
                  <div
                    className="atlas-histogram"
                    role="img"
                    aria-label={distribution.bins
                      .map(
                        (b) =>
                          `${b.min} a ${b.min + 10}%: ${b.count} territórios`,
                      )
                      .join("; ")}
                  >
                    {distribution.bins.map((b) => (
                      <div key={b.min}>
                        <small>{number(b.count)}</small>
                        <i
                          style={{
                            height: `${Math.max(2, (b.count / Math.max(1, ...distribution.bins.map((v) => v.count))) * 95)}px`,
                            background: "var(--atlas-cyan)",
                          }}
                        />
                        <span>{b.min}%</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}
              <div className="atlas-evidence-strip">
                <span className="atlas-eyebrow">Como interpretar</span>
                <p>
                  {symbols
                    ? "Uma região extensa não significa mais votos. A área dos círculos representa os votos válidos, em escala comum dentro deste recorte."
                    : "O tamanho geográfico não representa peso eleitoral. Alterne para símbolos proporcionais para comparar os volumes."}{" "}
                  {activeIndicator.denominator}.
                </p>
              </div>
            </>
          )}
          {tab === "evolucao" &&
            geometry &&
            comparison &&
            !pending &&
            !mainError && (
              <>
                <div className="atlas-comparison-stats">
                  <Stat
                    label="Municípios com virada"
                    value={number(comparison.summary.changed)}
                    detail={`de ${number(comparison.summary.comparable)} comparáveis`}
                  />
                  <Stat
                    label="Votos válidos nesses municípios"
                    value={shortNumber(comparison.summary.votesInChanged)}
                    detail={`volume no ano de ${preset.to}, não votos transferidos`}
                  />
                  <Stat
                    label="Participação aumentou"
                    value={number(comparison.summary.positive)}
                    detail={comparison.candidateLabelAfter}
                  />
                  <Stat
                    label="Sem comparação direta"
                    value={number(comparison.summary.missing)}
                    detail="ausência ou configuração territorial distinta"
                  />
                </div>
                <div className="atlas-workspace">
                  <section className="atlas-map-panel">
                    <div className="atlas-map-heading">
                      <div>
                        <span className="atlas-eyebrow">
                          {!municipalView
                            ? "Mapa de UFs · "
                            : "Mapa municipal · "}
                          {comparison.candidateLabelBefore} →{" "}
                          {comparison.candidateLabelAfter}
                        </span>
                        <h2>
                          {curtain
                            ? "Dois momentos, um território"
                            : "Variação de participação"}
                        </h2>
                      </div>
                      <div className="atlas-segment">
                        <button
                          className={!curtain ? "active" : ""}
                          onClick={() => setCurtain(false)}
                        >
                          Variação
                        </button>
                        <button
                          className={curtain ? "active" : ""}
                          onClick={() => setCurtain(true)}
                        >
                          Cortina
                        </button>
                      </div>
                    </div>
                    {curtain ? (
                      <div className="atlas-curtain">
                        <div className="atlas-curtain-base">
                          <AtlasMap
                            {...mapProps}
                            indicator="winner"
                            records={beforeQuery.data?.data.records ?? []}
                            symbols={false}
                            camera={camera}
                            onCameraChange={setCamera}
                            label={`${preset.from} · ${preset.round}º turno`}
                          />
                        </div>
                        <div
                          className="atlas-curtain-cover"
                          style={{ clipPath: `inset(0 0 0 ${split}%)` }}
                        >
                          <AtlasMap
                            {...mapProps}
                            indicator="winner"
                            symbols={false}
                            camera={camera}
                            onCameraChange={setCamera}
                            label={`${preset.to} · ${preset.round}º turno`}
                            controls={false}
                          />
                        </div>
                        <div
                          className="atlas-curtain-divider"
                          style={{ left: `${split}%` }}
                        />
                        <input
                          className="atlas-curtain-slider"
                          type="range"
                          min={5}
                          max={95}
                          value={split}
                          aria-label="Posição da cortina de comparação"
                          onChange={(e) => setSplit(Number(e.target.value))}
                        />
                      </div>
                    ) : (
                      <AtlasMap
                        {...mapProps}
                        indicator="winner"
                        comparison={comparisonMap}
                        delta
                        changesOnly={changesOnly}
                      />
                    )}
                    {stateOverlay}
                    <div className="atlas-map-caption">
                      {!curtain && (
                        <label>
                          <input
                            type="checkbox"
                            checked={changesOnly}
                            onChange={(e) => setChangesOnly(e.target.checked)}
                          />{" "}
                          {!municipalView
                            ? "Destacar UFs com municípios que mudaram de vencedor"
                            : "Destacar municípios que mudaram de vencedor"}
                        </label>
                      )}
                      <span>
                        {curtain
                          ? "Arraste a cortina · mesma escala de margem"
                          : !municipalView
                            ? "Clique em uma UF para ver municípios · escala −20 a +20 pp"
                            : "Escala fixa: −20 a +20 pontos percentuais"}
                      </span>
                    </div>
                    {curtain ? (
                      <Legend indicator="winner" />
                    ) : (
                      <div className="atlas-delta-legend">
                        <span>Queda −20 pp</span>
                        <i />
                        <span>Alta +20 pp</span>
                      </div>
                    )}
                  </section>
                  <aside className="atlas-insight">
                    <span className="atlas-eyebrow">Conclusão calculada</span>
                    <h2>
                      {number(comparison.summary.changed)} municípios mudaram de
                      vencedor.
                    </h2>
                    <p>
                      Uma virada aqui é mudança entre candidaturas sem
                      continuidade de pessoa ou partido. Haddad → Lula mantém
                      PT; Jair PSL → PL mantém a pessoa.
                    </p>
                    <div className="atlas-transition-list">
                      {comparison.transitions
                        .filter((t) =>
                          comparison.rows.some(
                            (r) =>
                              r.changed &&
                              r.winnerBefore === t.from &&
                              r.winnerAfter === t.to,
                          ),
                        )
                        .sort((a, b) => b.municipalities - a.municipalities)
                        .slice(0, 5)
                        .map((t) => (
                          <div key={t.from + t.to}>
                            <span>
                              {displayName(t.from)}
                              <ArrowRight size={12} />
                              {displayName(t.to)}
                            </span>
                            <b>{number(t.municipalities)}</b>
                          </div>
                        ))}
                    </div>
                    <p className="atlas-method-note">
                      Transições acima identificam os vencedores nominalmente.
                      Municípios não são indivíduos: isto não demonstra
                      transferência pessoal de votos.
                    </p>
                    <a className="atlas-button" href="#atlas-evidence">
                      Ver evidência <ArrowDownRight size={15} />
                    </a>
                  </aside>
                </div>
                <div className="atlas-evidence-strip">
                  <span className="atlas-eyebrow">Proporção ≠ volume</span>
                  <p>
                    Em {number(contrasts.shareUpVotesDown)} municípios, a
                    participação percentual aumentou enquanto os votos absolutos
                    caíram. Em {number(contrasts.shareDownVotesUp)}, houve queda
                    percentual com crescimento de votos. Base:{" "}
                    {number(contrasts.n)} pares válidos de{" "}
                    {comparison.candidateLabelBefore} →{" "}
                    {comparison.candidateLabelAfter}.
                  </p>
                </div>
                <section className="atlas-distribution" id="atlas-evidence">
                  <div>
                    <span className="atlas-eyebrow">Toda a distribuição</span>
                    <h2>Além dos extremos</h2>
                    <p>
                      Municípios por faixa de variação de participação de{" "}
                      {comparison.candidateLabelAfter}. Valores completos antes
                      do arredondamento.
                    </p>
                  </div>
                  <div
                    className="atlas-histogram"
                    role="img"
                    aria-label={histogram
                      .map(
                        (b, i) =>
                          `${i === 0 ? "menos de −25" : i === 11 ? "25 ou mais" : `${b.min} a menos de ${b.min + 5}`} pp: ${b.count} municípios`,
                      )
                      .join("; ")}
                  >
                    {histogram.map((bin, i) => (
                      <div key={bin.min}>
                        <small>{number(bin.count)}</small>
                        <i
                          style={{
                            height: `${Math.max(2, (bin.count / Math.max(1, ...histogram.map((b) => b.count))) * 95)}px`,
                            background:
                              i < 6 ? "var(--atlas-gold)" : "var(--atlas-cyan)",
                          }}
                        />
                        <span>
                          {i === 0 ? "<−25" : i === 11 ? "≥25" : bin.min}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              </>
            )}
          {tab === "contexto" && (
            <>
              <div className="atlas-context-controls">
                <label>
                  Indicador territorial
                  <select
                    value={contextIndicator}
                    onChange={(e) => {
                      setContextIndicator(e.target.value as ContextIndicator);
                      setHighlighted([]);
                    }}
                  >
                    <option value="income">Renda domiciliar per capita</option>
                    <option value="education">
                      Taxa de alfabetização · 15 anos ou mais
                    </option>
                    <option value="density">Densidade demográfica</option>
                  </select>
                </label>
                <label>
                  Resultado eleitoral
                  <select
                    value={contextMeasure}
                    onChange={(e) => {
                      setMeasure(e.target.value as "share" | "delta");
                      setHighlighted([]);
                    }}
                  >
                    <option value="share">
                      Participação do candidato do PT
                    </option>
                    {((year === 2022 && round === 2) ||
                      (year === 2026 && round === 1)) && (
                      <option value="delta">
                        Variação PT ·{" "}
                        {year === 2022
                          ? "2018 → 2022 · 2º turno"
                          : "2022 → 2026 · 1º turno"}
                      </option>
                    )}
                  </select>
                </label>
                <label className="atlas-checkbox">
                  <input
                    type="checkbox"
                    checked={weighted}
                    onChange={(e) => setWeighted(e.target.checked)}
                  />{" "}
                  Sensibilidade ao peso eleitoral
                </label>
              </div>
              {!context ? (
                <DataState
                  loading={contextQuery.isLoading}
                  error={contextQuery.error}
                  retry={() => void contextQuery.refetch()}
                />
              ) : (
                <>
                  <div className="atlas-context-stats">
                    <Stat
                      label={
                        weighted
                          ? "Associação ponderada de ranks · Brasil"
                          : "Spearman · Brasil"
                      }
                      value={
                        context.national.coefficient === null
                          ? "Não calculada"
                          : context.national.coefficient
                              .toFixed(3)
                              .replace(".", ",")
                      }
                      detail={`${number(context.national.n)} municípios`}
                    />
                    <Stat
                      label={
                        uf === "BR"
                          ? "Recorte nacional"
                          : `Mesmo cálculo · ${stateName}`
                      }
                      value={
                        context.regional.coefficient === null
                          ? "Não calculada"
                          : context.regional.coefficient
                              .toFixed(3)
                              .replace(".", ",")
                      }
                      detail={`${number(context.regional.n)} municípios · mínimo 30`}
                    />
                    <Stat
                      label="Sem par válido no recorte"
                      value={number(context.missing)}
                      detail="ausência permanece distinta de zero"
                    />
                  </div>
                  <div className="atlas-context-workspace">
                    <section className="atlas-scatter-panel">
                      <span className="atlas-eyebrow">
                        {context.indicator.period} · {context.candidateLabel}
                      </span>
                      <h2>{context.indicator.label}</h2>
                      <ContextPlot
                        points={context.points}
                        unit={context.indicator.unit}
                        measure={contextMeasure}
                        selectedId={selected}
                        highlighted={highlighted}
                        onSelect={choose}
                        onHighlight={changeContextSelection}
                      />
                      <p className="atlas-helper">
                        Arraste um retângulo para selecionar municípios; toque
                        num ponto ou use a tabela.{" "}
                        {highlighted.length > 0 && (
                          <button
                            className="atlas-text-button"
                            onClick={() => setHighlighted([])}
                          >
                            Limpar {number(highlighted.length)} selecionados
                          </button>
                        )}
                      </p>
                    </section>
                    <section className="atlas-context-map">
                      <span className="atlas-eyebrow">Seleção conectada</span>
                      <h2>
                        {!municipalView ? "Estados do recorte" : stateName}
                      </h2>
                      {geometry && (
                        <AtlasMap
                          {...mapProps}
                          indicator="winner"
                          highlightedIds={
                            !municipalView
                              ? [
                                  ...new Set(
                                    context.points
                                      .filter((p) =>
                                        highlighted.includes(p.territory.id),
                                      )
                                      .map((p) => p.territory.uf ?? ""),
                                  ),
                                ]
                              : highlighted
                          }
                        />
                      )}
                      {stateOverlay}
                      <p className="atlas-helper">
                        {!municipalView
                          ? "A seleção municipal destaca seus estados. Selecione uma UF e use Aprofundar para ver os municípios."
                          : "Os mesmos municípios aparecem no gráfico e no mapa."}
                      </p>
                    </section>
                  </div>
                  <p className="atlas-method-note">
                    {context.methodology} {context.indicator.period}. A
                    associação nacional pode mudar dentro de um estado; não
                    demonstra causa nem comportamento individual.
                  </p>
                  <section className="atlas-table-section">
                    <h2>Municípios do gráfico</h2>
                    <div className="atlas-table-wrap">
                      <table>
                        <thead>
                          <tr>
                            <th>Município</th>
                            <th>{context.indicator.label}</th>
                            <th>
                              {contextMeasure === "share"
                                ? "Votos válidos (%)"
                                : "Variação (pp)"}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {context.points
                            .filter(
                              (p) =>
                                !highlighted.length ||
                                highlighted.includes(p.territory.id),
                            )
                            .slice((page - 1) * 12, page * 12)
                            .map((p) => (
                              <tr key={p.territory.id}>
                                <td>
                                  <button
                                    onClick={() => choose(p.territory.id)}
                                  >
                                    {displayName(p.territory.name)}{" "}
                                    <small>{p.territory.uf}</small>
                                  </button>
                                </td>
                                <td>
                                  {p.x.toLocaleString("pt-BR", {
                                    maximumFractionDigits: 2,
                                  })}
                                </td>
                                <td>
                                  {contextMeasure === "share"
                                    ? pct(p.y)
                                    : pp(p.y)}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                    <Pagination
                      page={page}
                      total={
                        context.points.filter(
                          (p) =>
                            !highlighted.length ||
                            highlighted.includes(p.territory.id),
                        ).length
                      }
                      onChange={setPage}
                    />
                  </section>
                </>
              )}
            </>
          )}
          {tab === "pautas" &&
            (themesQuery.data ? (
              <Themes data={themesQuery.data.data} />
            ) : (
              <DataState
                loading={themesQuery.isLoading}
                error={themesQuery.error}
                retry={() => void themesQuery.refetch()}
              />
            ))}
          {(tab === "atlas" || tab === "evolucao") && !pending && !mainError && (
            <section className="atlas-table-section">
              <div className="atlas-section-heading">
                <div>
                  <span className="atlas-eyebrow">Evidência territorial</span>
                  <h2>
                    {tab === "evolucao"
                      ? "Variações por município"
                      : "Onde estão os votos"}
                  </h2>
                </div>
                <span>
                  {number(rankRows.length)} territórios ·{" "}
                  {tab === "evolucao"
                    ? "ordenados pela variação absoluta em pp"
                    : "ordenados por votos válidos"}
                </span>
              </div>
              <div className="atlas-table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Território</th>
                      <th>
                        {tab === "evolucao" ? "Anterior → Atual" : "Vencedor"}
                      </th>
                      <th>
                        {tab === "evolucao" ? "Variação" : "Participação"}
                      </th>
                      <th>
                        {tab === "evolucao"
                          ? "Δ votos absolutos"
                          : "Votos válidos"}
                      </th>
                      <th>
                        {tab === "evolucao"
                          ? "Classificação"
                          : "Comparecimento"}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rankRows.slice((page - 1) * 12, page * 12).map((row) => {
                      const evolution = "beforeShare" in row;
                      const metric = evolution ? row.after : row.metric;
                      const top = winner(metric);
                      return (
                        <tr key={row.territory.id}>
                          <td>
                            <button onClick={() => choose(row.territory.id)}>
                              {displayName(row.territory.name)}{" "}
                              <small>{row.territory.uf}</small>
                            </button>
                          </td>
                          <td>
                            {evolution
                              ? `${pct(row.beforeShare)} → ${pct(row.afterShare)}`
                              : displayName(top?.name ?? "Sem resultado")}
                          </td>
                          <td
                            className={
                              evolution
                                ? (row.deltaPp ?? 0) >= 0
                                  ? "atlas-positive"
                                  : "atlas-negative"
                                : ""
                            }
                          >
                            {evolution ? (
                              <>
                                <span>
                                  {(row.deltaPp ?? 0) >= 0 ? (
                                    <ArrowUpRight size={14} />
                                  ) : (
                                    <ArrowDownRight size={14} />
                                  )}
                                </span>
                                {pp(row.deltaPp)}
                              </>
                            ) : top && metric ? (
                              pct(candidatePct(top, metric))
                            ) : (
                              "—"
                            )}
                          </td>
                          <td>
                            {evolution
                              ? row.deltaVotes === null
                                ? "—"
                                : number(row.deltaVotes)
                              : metric
                                ? number(metric.validVotes)
                                : "—"}
                          </td>
                          <td>
                            {evolution
                              ? row.status !== "comparable"
                                ? row.status === "tie"
                                  ? "Empate"
                                  : "Sem comparação"
                                : row.changed
                                  ? "Virada"
                                  : "Continuidade"
                              : metric
                                ? pct(rate(metric.turnout, metric.eligible))
                                : "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <Pagination
                page={page}
                total={rankRows.length}
                onChange={setPage}
              />
            </section>
          )}
          <footer className="atlas-footer">
            <div>
              <Compass size={18} />
              <span>
                LOGOS POLIS <small>Atlas Eleitoral</small>
              </span>
            </div>
            <p>
              TSE · IBGE · DataSenado
              <br />
              {number(catalog.coverage.mappedMunicipalities)} municípios com
              geometria / {number(catalog.coverage.resultsMunicipalities)} na
              base · {catalog.coverage.geometryEdition}
            </p>
            <details>
              <summary>Fontes, versão e cobertura</summary>
              <div className="atlas-sources">
                <b>{catalog.snapshotId}</b>
                {catalog.coverage.issues.map((issue) => (
                  <p key={issue.id}>
                    {issue.name} · {issue.uf}: {issue.reason}
                  </p>
                ))}
                {catalog.sources.map((source) => (
                  <article key={source.id}>
                    <a href={source.url} target="_blank" rel="noreferrer">
                      {source.title}
                    </a>
                    <small>
                      {source.period} · {source.status}
                    </small>
                    <p>{source.methodology}</p>
                  </article>
                ))}
                {catalog.methodology.map((note) => (
                  <p key={note}>{note}</p>
                ))}
              </div>
            </details>
          </footer>
        </>
      )}
      {dossier && (
        <Dossier
          id={dossier}
          onClose={closeDossier}
          filters={`${stateName} · Presidência · ${tab === "evolucao" ? `${preset.from} → ${preset.to}` : year} · ${activeRound}º turno · ${tab === "evolucao" ? (comparison?.candidateLabelAfter ?? candidate) : tab === "contexto" ? `${context?.indicator.label ?? contextIndicator} · ${contextMeasure === "share" ? "Participação PT" : "Variação PT"}` : activeIndicator.label}`}
        />
      )}
    </div>
  );
}
function Stat({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="atlas-stat">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </div>
  );
}
function Pagination({
  page,
  total,
  onChange,
}: {
  page: number;
  total: number;
  onChange: (page: number) => void;
}) {
  return (
    <div className="atlas-pagination">
      <span>
        {total
          ? `${Math.min((page - 1) * 12 + 1, total)}–${Math.min(page * 12, total)} de ${number(total)}`
          : "Nenhum resultado"}
      </span>
      <button
        aria-label="Página anterior"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
      >
        <ChevronLeft size={17} />
      </button>
      <button
        aria-label="Próxima página"
        disabled={page * 12 >= total}
        onClick={() => onChange(page + 1)}
      >
        <ChevronRight size={17} />
      </button>
    </div>
  );
}
function Legend({ indicator }: { indicator: AtlasIndicator }) {
  return (
    <div className="atlas-legend">
      {indicator === "winner" || indicator === "margin" ? (
        <>
          <span>
            <i className="pt" />
            PT
          </span>
          <span>
            <i className="bolsonaro" />
            PSL / PL
          </span>
          <span>
            <i className="other" />
            Outros
          </span>
          <span>
            <i className="neutral" />
            Sem dado / empate
          </span>
          <small>Intensidade: margem de 0 a 50 pp</small>
        </>
      ) : (
        <>
          <span>0%</span>
          <i className="atlas-percentage-scale" />
          <span>100%</span>
          <small>
            {indicators.find((i) => i.id === indicator)?.denominator}
          </small>
        </>
      )}
    </div>
  );
}
