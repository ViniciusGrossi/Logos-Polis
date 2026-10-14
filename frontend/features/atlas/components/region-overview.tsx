import type { TerritoryRecord } from "../types";
import { atlasRegions } from "../scopes";
import { aggregateRegionalMetric } from "../region-analytics";
import {
  candidateClass,
  candidatePct,
  displayName,
  pct,
  rate,
  shortNumber,
  winner,
} from "../format";

export function RegionOverview({
  records,
  onSelect,
}: {
  records: TerritoryRecord[];
  onSelect: (id: string) => void;
}) {
  return (
    <section
      className="atlas-region-overview"
      aria-label="Comparação entre macrorregiões"
    >
      <div className="atlas-section-heading">
        <div>
          <span className="atlas-eyebrow">Cinco macrorregiões</span>
          <h2>O Brasil não vota como um bloco.</h2>
        </div>
        <p>Votos somados, percentuais recalculados. Exterior não incluído.</p>
      </div>
      <div className="atlas-region-grid">
        {atlasRegions.map((region) => {
          const metric = aggregateRegionalMetric(
            region.id,
            region.states.map(
              (state) =>
                records.find((record) => record.territory.id === state)
                  ?.metric ?? null,
            ),
          );
          const leading = winner(metric);
          return (
            <button
              key={region.id}
              className="atlas-region-card"
              onClick={() => onSelect(region.id)}
              aria-label={`Analisar região ${region.name}`}
            >
              <header>
                <h3>{region.name}</h3>
                <span>{region.states.length} UFs</span>
              </header>
              <strong>{metric ? shortNumber(metric.validVotes) : "—"}</strong>
              <small>votos válidos</small>
              <div
                className={`atlas-region-winner atlas-candidate-${candidateClass(leading)}`}
              >
                <i />
                <span>
                  {leading ? displayName(leading.name) : "Empate / sem dados"}
                </span>
                <b>
                  {pct(
                    leading && metric ? candidatePct(leading, metric) : null,
                  )}
                </b>
              </div>
              <div className="atlas-region-bar">
                {metric?.candidates.map((candidate) => (
                  <i
                    key={candidate.id}
                    className={`atlas-candidate-${candidateClass(candidate)}`}
                    style={{ width: `${candidate.share}%` }}
                  />
                ))}
              </div>
              <footer>
                <span>Comparecimento</span>
                <b>
                  {pct(metric ? rate(metric.turnout, metric.eligible) : null)}
                </b>
              </footer>
            </button>
          );
        })}
      </div>
    </section>
  );
}
