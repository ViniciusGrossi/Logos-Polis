"use client";
import { useEffect, useRef } from "react";
import { ArrowUpRight, BookOpen, X } from "lucide-react";
import type { ElectionMetric } from "../types";
import {
  candidateClass,
  candidatePct,
  displayName,
  margin,
  number,
  pct,
  pp,
  rate,
  shortNumber,
  winner,
} from "../format";

export function StatePreview({
  id,
  name,
  level = "state",
  metric,
  before,
  loading,
  error,
  onClose,
  onDeepen,
  onDossier,
}: {
  id: string;
  name: string;
  level?: "state" | "municipality";
  metric: ElectionMetric | null;
  before?: ElectionMetric | null;
  loading: boolean;
  error: Error | null;
  onClose: () => void;
  onDeepen: () => void;
  onDossier: () => void;
}) {
  const panel = useRef<HTMLElement>(null);
  useEffect(() => {
    const previous =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    panel.current?.querySelector<HTMLButtonElement>("button")?.focus();
    const close = (event: KeyboardEvent) => {
      if (
        event.key !== "Escape" ||
        document.querySelector('.atlas-dossier[aria-modal="true"]')
      )
        return;
      event.preventDefault();
      event.stopImmediatePropagation();
      onClose();
    };
    window.addEventListener("keydown", close, true);
    return () => {
      window.removeEventListener("keydown", close, true);
      previous?.focus();
    };
  }, [id, onClose]);
  return (
    <section
      ref={panel}
      className="atlas-state-preview"
      role="dialog"
      aria-modal="false"
      aria-labelledby="atlas-state-preview-title"
      tabIndex={-1}
    >
      <header>
        <div>
          <span className="atlas-eyebrow">{level === "municipality" ? "Município" : "Estado"} selecionado · {id}</span>
          <h3 id="atlas-state-preview-title">{name}</h3>
        </div>
        <button
          className="atlas-icon-button"
          aria-label={level === "municipality" ? "Fechar resumo do município" : "Fechar resumo do estado"}
          onClick={onClose}
        >
          <X size={16} />
        </button>
      </header>
      {loading && !metric ? (
        <p role="status">Carregando resumo…</p>
      ) : error && !metric ? (
        <p role="alert">
          Não foi possível carregar este território. Tente selecioná-lo novamente.
        </p>
      ) : !metric ? (
        <p>Sem resultado disponível neste turno.</p>
      ) : (
        <>
          <p className="atlas-preview-edition">
            Presidência · {metric.year} · {metric.round}º turno{" "}
            {metric.year === 2026 && <small>Provisório</small>}
          </p>
          <div className="atlas-preview-candidates">
            {metric.candidates
              .slice()
              .sort((a, b) => b.votes - a.votes)
              .slice(0, 3)
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
                  <div className="atlas-result-track">
                    <span
                      style={{
                        width: `${candidatePct(candidate, metric) ?? 0}%`,
                      }}
                    />
                  </div>
                  <small>{number(candidate.votes)} votos</small>
                </div>
              ))}
          </div>
          <dl className="atlas-preview-metrics">
            <div>
              <dt>Votos válidos</dt>
              <dd>{shortNumber(metric.validVotes)}</dd>
            </div>
            <div>
              <dt>Comparecimento</dt>
              <dd>{pct(rate(metric.turnout, metric.eligible))}</dd>
            </div>
            <div>
              <dt>Abstenção</dt>
              <dd>{pct(rate(metric.abstentions, metric.eligible))}</dd>
            </div>
            <div>
              <dt>Margem</dt>
              <dd>{pp(margin(metric))}</dd>
            </div>
          </dl>
          {before && (
            <p className="atlas-preview-history">
              Vencedor em {before.year}:{" "}
              <b>{displayName(winner(before)?.name ?? "Empate")}</b>. Em{" "}
              {metric.year}:{" "}
              <b>{displayName(winner(metric)?.name ?? "Empate")}</b>.
            </p>
          )}
        </>
      )}
      <footer>
        <button
          className="atlas-button atlas-button-primary"
          onClick={onDeepen}
        >
          {level === "municipality" ? "Analisar estado" : "Aprofundar"} <ArrowUpRight size={15} />
        </button>
        <button className="atlas-text-button" onClick={onDossier}>
          <BookOpen size={14} /> Abrir dossiê
        </button>
      </footer>
      <small className="atlas-preview-hint">
        {level === "municipality" ? "O resumo preserva o recorte do mapa. O dossiê reúne histórico e contexto municipal." : "Você continua no mapa atual. Aprofundar abre os municípios."}
      </small>
    </section>
  );
}
