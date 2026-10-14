"use client";
import { useEffect, useRef, useState } from "react";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Printer, X, BookOpen, Download } from "lucide-react";
import { useAtlasData } from "../use-atlas-data";
import type { DossierDataset } from "../types";
import {
  candidateClass,
  candidatePct,
  displayName,
  number,
  pct,
  rate,
  readableDate,
  winner,
} from "../format";
import { DataState } from "./data-state";

export function Dossier({
  id,
  onClose,
  filters,
}: {
  id: string;
  onClose: () => void;
  filters: string;
}) {
  const query = useAtlasData<DossierDataset>(
    `dossie?id=${encodeURIComponent(id)}`,
  );
  const data = query.data?.data;
  const panel = useRef<HTMLElement>(null);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  async function exportHtml() {
    if (!panel.current || !data) return;
    setExporting(true);
    setExportError(null);
    try {
      const report = document.implementation.createHTMLDocument(
        `Dossiê · ${data.territory.name} · Logos Polis`,
      );
      report.documentElement.lang = "pt-BR";
      const charset = report.createElement("meta");
      charset.setAttribute("charset", "utf-8");
      report.head.prepend(charset);
      const viewport = report.createElement("meta");
      viewport.name = "viewport";
      viewport.content = "width=device-width,initial-scale=1";
      report.head.append(viewport);
      const css = report.createElement("style");
      const rules = Array.from(document.styleSheets)
        .flatMap((sheet) => {
          try {
            return Array.from(sheet.cssRules).map((rule) => rule.cssText);
          } catch {
            return [];
          }
        })
        .join("\n");
      const font = async (name: string) => {
        const response = await fetch(`/fonts/polis/${name}-latin.woff2`);
        if (!response.ok) throw new Error("font unavailable");
        const bytes = new Uint8Array(await response.arrayBuffer());
        let raw = "";
        for (const byte of bytes) raw += String.fromCharCode(byte);
        return btoa(raw);
      };
      const [sans, serif, mono] = await Promise.all([
        font("inter"),
        font("playfair"),
        font("jetbrains"),
      ]);
      css.textContent =
        rules +
        `\n@font-face{font-family:Atlas Sans;src:url(data:font/woff2;base64,${sans});font-weight:100 900} @font-face{font-family:Atlas Serif;src:url(data:font/woff2;base64,${serif});font-weight:400 900} @font-face{font-family:Atlas Mono;src:url(data:font/woff2;base64,${mono});font-weight:100 800} body{margin:0;background:#09090b}.atlas-dossier-backdrop{position:static!important;display:block!important;background:transparent!important}.atlas-dossier{position:static!important;width:100%!important;height:auto!important;overflow:visible!important;border:0!important;box-shadow:none!important}.atlas-root{margin:0!important;padding:20px!important;--atlas-font-sans:Atlas Sans;--atlas-font-serif:Atlas Serif;--atlas-font-mono:Atlas Mono}`;
      report.head.append(css);
      const root = report.createElement("main");
      root.className = "atlas-root";
      const backdrop = report.createElement("div");
      backdrop.className = "atlas-dossier-backdrop";
      const clone = panel.current.cloneNode(true) as HTMLElement;
      clone.removeAttribute("role");
      clone.removeAttribute("aria-modal");
      clone
        .querySelectorAll("button,script,input,select")
        .forEach((node) => node.remove());
      backdrop.append(clone);
      root.append(backdrop);
      report.body.append(root);
      const blob = new Blob(
        ["<!DOCTYPE html>\n", report.documentElement.outerHTML],
        { type: "text/html;charset=utf-8" },
      );
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `logos-polis-dossie-${data.territory.id}.html`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      setExportError(
        "Não foi possível exportar o HTML. Tente novamente ou use a impressão.",
      );
    } finally {
      setExporting(false);
    }
  }
  useEffect(() => {
    const previous =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    panel.current?.querySelector<HTMLButtonElement>("button")?.focus();
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
      }
      if (event.key !== "Tab" || !panel.current) return;
      const targets = [
        ...panel.current.querySelectorAll<HTMLElement>(
          'button:not(:disabled),a[href],input,select,[tabindex="0"]',
        ),
      ];
      const first = targets[0],
        last = targets[targets.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", close, true);
    return () => {
      document.removeEventListener("keydown", close, true);
      previous?.focus();
    };
  }, [onClose]);
  const series =
    data?.history
      .filter((metric) => metric.round === 1)
      .map((metric) => ({
        year: String(metric.year),
        comparecimento: rate(metric.turnout, metric.eligible),
        abstencao: rate(metric.abstentions, metric.eligible),
      })) ?? [];
  return (
    <div className="atlas-dossier-backdrop" onClick={onClose}>
      <aside
        ref={panel}
        className="atlas-dossier"
        role="dialog"
        aria-modal="true"
        aria-labelledby="atlas-dossier-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="atlas-dossier-header">
          <div>
            <span className="atlas-eyebrow">
              Logos Polis / Dossiê territorial
            </span>
            <h2 id="atlas-dossier-title">
              {data?.territory.name ?? "Abrindo território…"}
            </h2>
          </div>
          <button
            className="atlas-icon-button"
            onClick={onClose}
            aria-label="Fechar dossiê"
          >
            <X size={21} />
          </button>
        </header>
        {!data ? (
          <DataState
            loading={query.isLoading}
            error={query.error}
            retry={() => void query.refetch()}
          />
        ) : (
          <>
            <div className="atlas-dossier-actions">
              <span>
                {data.territory.level === "region"
                  ? "Macrorregião IBGE"
                  : (data.territory.uf ?? "Brasil")}{" "}
                · Resultados agregados
              </span>
              <button
                className="atlas-button"
                onClick={() => void exportHtml()}
                disabled={exporting}
              >
                <Download size={16} />
                {exporting ? "Preparando HTML…" : "Exportar HTML"}
              </button>
              <button className="atlas-button" onClick={() => window.print()}>
                <Printer size={16} />
                Exportar PDF / imprimir
              </button>
            </div>
            {exportError && (
              <p role="alert" className="atlas-notice">
                {exportError}
              </p>
            )}
            <p className="atlas-dossier-lead">
              A trajetória eleitoral de um território, com números completos e
              suas referências.
            </p>
            <p className="atlas-helper">
              Recorte de origem: {filters}. Histórico abaixo conserva todos os
              turnos disponíveis.
            </p>
            {data.history.some((m) => m.year === 2026) && (
              <p className="atlas-notice">
                2026: dados locais provisórios, sem certificação externa
                independente. Não interpretar esta preparação como resultado
                certificado pelo TSE.
              </p>
            )}
            {!data.territory.mapped && (
              <p className="atlas-notice">
                Este território está preservado nos resultados, mas não tem
                polígono na edição cartográfica carregada.
              </p>
            )}
            {!data.territory.comparable && (
              <p className="atlas-notice">
                A configuração territorial não permite comparação direta com
                todas as eleições anteriores.
              </p>
            )}
            <section>
              <h3>Resultados por eleição e turno</h3>
              <div className="atlas-history">
                {[...data.history]
                  .sort((a, b) => b.year - a.year || b.round - a.round)
                  .map((metric) => (
                    <article key={`${metric.year}-${metric.round}`}>
                      <header>
                        <b>{metric.year}</b>
                        <span>{metric.round}º turno</span>
                        <small>{number(metric.validVotes)} votos válidos</small>
                      </header>
                      <div className="atlas-dossier-candidates">
                        {[...metric.candidates]
                          .sort((a, b) => b.votes - a.votes)
                          .map((candidate) => (
                            <div
                              key={candidate.id}
                              className={`atlas-candidate-${candidateClass(candidate)}`}
                            >
                              <span>
                                <i />
                                {displayName(candidate.name)}{" "}
                                <small>{candidate.party}</small>
                              </span>
                              <b>{pct(candidatePct(candidate, metric))}</b>
                              <small>{number(candidate.votes)} votos</small>
                            </div>
                          ))}
                      </div>
                      <footer>
                        <span>
                          Comparecimento{" "}
                          <b>{pct(rate(metric.turnout, metric.eligible))}</b>
                        </span>
                        <span>
                          Abstenção{" "}
                          <b>
                            {pct(rate(metric.abstentions, metric.eligible))}
                          </b>
                        </span>
                        <span>
                          Brancos{" "}
                          <b>{pct(rate(metric.blankVotes, metric.turnout))}</b>
                        </span>
                        <span>
                          Nulos{" "}
                          <b>{pct(rate(metric.nullVotes, metric.turnout))}</b>
                        </span>
                      </footer>
                    </article>
                  ))}
              </div>
            </section>
            <section>
              <h3>Participação ao longo do tempo</h3>
              <p className="atlas-helper">
                Primeiros turnos · percentual do eleitorado apto
              </p>
              <div className="atlas-dossier-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={series}
                    margin={{ top: 15, right: 20, left: 0, bottom: 5 }}
                  >
                    <XAxis
                      dataKey="year"
                      stroke="var(--atlas-muted)"
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      domain={[0, 100]}
                      stroke="var(--atlas-muted)"
                      tickLine={false}
                      axisLine={false}
                      width={35}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "var(--atlas-panel)",
                        borderColor: "var(--atlas-border)",
                        color: "var(--atlas-text)",
                      }}
                    />
                    <Line
                      dataKey="comparecimento"
                      name="Comparecimento (%)"
                      stroke="var(--atlas-cyan)"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      isAnimationActive={false}
                    />
                    <Line
                      dataKey="abstencao"
                      name="Abstenção (%)"
                      stroke="var(--atlas-gold)"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>
            <section>
              <h3>Contexto do território</h3>
              {data.territory.level !== "municipality" ? (
                <p className="atlas-helper">
                  Os indicadores IBGE desta versão são municipais. Explore a
                  aba Contexto para comparar os municípios deste recorte; não
                  calculamos médias simples para representar estados ou regiões.
                </p>
              ) : (
                <div className="atlas-context-values">
                {data.indicators.map((indicator) => (
                  <div key={indicator.id}>
                    <span>{indicator.label}</span>
                    <b>
                      {data.context?.[indicator.id] == null
                        ? "Sem dado"
                        : indicator.unit === "%"
                          ? pct(data.context[indicator.id])
                          : `${number(Math.round(data.context[indicator.id] ?? 0))} ${indicator.unit}`}
                    </b>
                    <small>{indicator.period}</small>
                  </div>
                ))}
                </div>
              )}
            </section>
            {data.representation.length > 0 && (
              <section>
                <h3>Partidos e representação estadual</h3>
                <p className="atlas-helper">
                  Bancada e votação para deputado federal na UF; não são
                  cadeiras municipais.
                </p>
                {[...data.representation]
                  .sort((a, b) => b.year - a.year)
                  .map((rep) => (
                    <div
                      className="atlas-representation"
                      key={`${rep.year}-${rep.territoryId}`}
                    >
                      <h4>
                        {rep.territoryId} · {rep.year}
                      </h4>
                      <div className="atlas-party-table">
                        <div>
                          <b>Partido</b>
                          <b>Votos válidos</b>
                          <b>Cadeiras</b>
                        </div>
                        {rep.parties
                          .sort((a, b) => b.seats - a.seats)
                          .map((p) => (
                            <div key={p.party}>
                              <span>{p.party}</span>
                              <span>{pct(p.share)}</span>
                              <span>{p.seats}</span>
                            </div>
                          ))}
                      </div>
                      {rep.elected.length > 0 && (
                        <p className="atlas-helper">
                          {rep.elected
                            .map(
                              (e) =>
                                `${displayName(e.name)} (${e.party}) · ${e.office}`,
                            )
                            .join("; ")}
                        </p>
                      )}
                    </div>
                  ))}
              </section>
            )}
            <section className="atlas-dossier-method">
              <h3>
                <BookOpen size={16} /> Fontes e metodologia
              </h3>
              <p>
                Resultados: Portal de Dados Abertos do TSE. Cartografia e
                indicadores: IBGE. Percentuais presidenciais usam votos nominais
                válidos. Comparecimento e abstenção usam eleitorado apto;
                brancos e nulos usam comparecimento. Mudança de vencedor
                descreve territórios, não indivíduos.
              </p>
              <p>
                Preparado em {readableDate(query.data?.meta.generatedAt ?? "")}{" "}
                · versão {query.data?.meta.snapshotId}
              </p>
              <a
                href="https://dadosabertos.tse.jus.br/"
                target="_blank"
                rel="noreferrer"
              >
                Consultar fonte eleitoral
              </a>
            </section>
            <footer className="atlas-dossier-footer">
              Logos Polis · Atlas Eleitoral · {data.history.length}{" "}
              eleições/turnos disponíveis ·{" "}
              {winner(data.history.at(-1))
                ? "Resultados públicos agregados"
                : "Consulte a cobertura"}
            </footer>
          </>
        )}
      </aside>
    </div>
  );
}
