"use client";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { CargoLeader, CargoRow, CargosDataset, ResiduosDataset, Territory } from "../types";
import { displayName, number, pct, pp } from "../format";
import { DataState } from "./data-state";

const PAGE = 12;
const decimal = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2, minimumFractionDigits: 2 });

/** "Nome · UF" for municipalities: the same name exists in several states. */
export const territoryLabel = (territory: Territory) =>
  `${displayName(territory.name)}${territory.level === "municipality" && territory.uf ? ` · ${territory.uf}` : ""}`;
const leaderLabel = (leader: CargoLeader | null, validVotes: number) =>
  leader
    ? `${leader.name ? displayName(leader.name) + " · " : ""}${leader.party}`
    : validVotes > 0 ? "Empate" : "Sem disputa neste turno";

export function CargosReading({ data, officeLabel, stateName }: { data: CargosDataset; officeLabel: string; stateName: string }) {
  const { summary } = data;
  return (
    <>
      <span className="atlas-eyebrow">Cargo × Presidência</span>
      <h2>{stateName}</h2>
      <p className="atlas-helper">
        {officeLabel} · {data.year} · {data.round}º turno · linha {data.line}
        {data.seats ? ` · ${data.seats} vaga${data.seats > 1 ? "s" : ""}` : ""}
      </p>
      <div className="atlas-reading-fact">
        <span>{data.line} no cargo menos {data.president.party} na Presidência</span>
        <strong>{pp(summary.splitPp)}</strong>
        <p>
          Diferença de participação nos votos válidos, no mesmo recorte. Positivo: a linha foi mais votada para o cargo
          do que para presidente.
        </p>
      </div>
      <div className="atlas-reading-list">
        <div><span>Participação no cargo</span><b>{pct(summary.lineShare)}</b></div>
        <div><span>Participação na Presidência</span><b>{pct(summary.presidentShare)}</b></div>
        <div><span>Territórios comparáveis</span><b>{number(summary.comparable)}</b></div>
        <div><span>Cargo acima da Presidência</span><b>{number(summary.officeAbove)}</b></div>
        <div><span>Cargo abaixo da Presidência</span><b>{number(summary.officeBelow)}</b></div>
      </div>
      {!data.lineComparable && (
        <p className="atlas-notice" role="note">
          Em {data.year} o candidato a presidente foi do {data.president.party}, não do {data.line}: as linhas comparadas
          não são o mesmo lado eleitoral.
        </p>
      )}
      {data.caveats.map((note) => <p className="atlas-helper" key={note}>{note}</p>)}
      <p className="atlas-helper">Descritivo. A diferença não explica o motivo do voto nem descreve eleitores individuais.</p>
    </>
  );
}

export function CargosTable({ rows, onSelect }: { rows: CargoRow[]; onSelect: (id: string) => void }) {
  const [requested, setPage] = useState(1);
  const sorted = useMemo(
    () => rows.slice().sort((a, b) => Math.abs(b.splitPp ?? -1) - Math.abs(a.splitPp ?? -1)),
    [rows],
  );
  const page = Math.min(requested, Math.max(1, Math.ceil(sorted.length / PAGE)));
  return (
    <>
      <h3>Maiores diferenças cargo × Presidência</h3>
      <div className="atlas-table-wrap">
        <table>
          <thead>
            <tr><th>Território</th><th>Cargo</th><th>Pres.</th><th>Dif.</th><th>Mais votado no cargo</th></tr>
          </thead>
          <tbody>
            {sorted.slice((page - 1) * PAGE, page * PAGE).map((row) => (
              <tr key={row.territory.id}>
                <td><button className="atlas-text-button" onClick={() => onSelect(row.territory.id)}>{territoryLabel(row.territory)}</button></td>
                <td>{pct(row.office.lineShare)}</td>
                <td>{pct(row.president?.lineShare)}</td>
                <td>{pp(row.splitPp)}</td>
                <td>{leaderLabel(row.office.leader, row.office.validVotes)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="atlas-pagination">
        <span>{sorted.length ? `${(page - 1) * PAGE + 1}–${Math.min(page * PAGE, sorted.length)} de ${number(sorted.length)}` : "Nenhum resultado"}</span>
        <button aria-label="Página anterior" disabled={page <= 1} onClick={() => setPage(page - 1)}><ChevronLeft size={17} /></button>
        <button aria-label="Próxima página" disabled={page * PAGE >= sorted.length} onClick={() => setPage(page + 1)}><ChevronRight size={17} /></button>
      </div>
    </>
  );
}

export function ResiduosSection({ data, loading, error, retry, onSelect }: {
  data: ResiduosDataset | undefined; loading: boolean; error: Error | null; retry: () => void; onSelect: (id: string) => void;
}) {
  const ranked = useMemo(() => {
    const rows = (data?.rows ?? []).slice().sort((a, b) => b.residualPp - a.residualPp);
    return { top: rows.slice(0, 8), bottom: rows.slice(-8).reverse() };
  }, [data]);
  if (!data) return <DataState loading={loading} error={error} retry={retry} message="Calculando resíduos…" />;
  const { fit, summary } = data;
  const list = (title: string, rows: typeof ranked.top) => (
    <>
      <h4>{title}</h4>
      <div className="atlas-table-wrap">
        <table>
          <thead><tr><th>Território</th><th>Observado</th><th>Esperado</th><th>Resíduo</th></tr></thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.territory.id}>
                <td><button className="atlas-text-button" onClick={() => onSelect(row.territory.id)}>{territoryLabel(row.territory)}</button></td>
                <td>{pct(row.observed)}</td>
                <td>{pct(row.expected)}</td>
                <td>{pp(row.residualPp)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
  return (
    <>
      <h3>Resíduo: observado − esperado</h3>
      <p className="atlas-helper">
        Esperado = ajuste linear nacional da participação da linha {data.line} em {data.baseYear} (1º turno)
        sobre {data.year}; a seleção territorial só filtra as linhas.
      </p>
      {fit ? (
        <div className="atlas-reading-list">
          <div><span>Correlação (r)</span><b>{fit.r === null ? "—" : decimal.format(fit.r)}</b></div>
          <div><span>Inclinação</span><b>{decimal.format(fit.slope)}</b></div>
          <div><span>Municípios no ajuste</span><b>{number(fit.n)}</b></div>
          <div><span>Resíduo médio no recorte</span><b>{pp(summary.meanResidualPp !== null && Math.abs(summary.meanResidualPp) < 0.05 ? 0 : summary.meanResidualPp)}</b></div>
          <div><span>Acima / abaixo do esperado</span><b>{number(summary.positive)} / {number(summary.negative)}</b></div>
        </div>
      ) : (
        <p className="atlas-helper">Ajuste indisponível: pares insuficientes entre as duas eleições.</p>
      )}
      {ranked.top.length > 0 && list("Acima do esperado", ranked.top)}
      {ranked.bottom.length > 0 && list("Abaixo do esperado", ranked.bottom)}
      <p className="atlas-helper">Descritivo e provisório (2026). Resíduo não indica causa; fronteiras não harmonizadas ficam fora.</p>
    </>
  );
}
