"use client";
import type {AtlasCatalog} from "../types";
export function AtlasTimeline({elections,year,round,onChange}: {elections:AtlasCatalog["elections"];year:number;round:1|2;onChange:(year:number,round:1|2)=>void}) {
  return <nav className="atlas-immersive-timeline" aria-label="Linha do tempo eleitoral">
    <span className="atlas-timeline-label">Eleição</span>
    {elections.flatMap(election => election.rounds.map(turn => <button
      key={`${election.year}:${turn}`}
      aria-label={`${election.year} · ${turn}º turno${election.provisional ? " · provisória" : ""}`}
      aria-pressed={year===election.year && round===turn}
      className={election.provisional ? "provisional" : ""}
      onClick={() => onChange(election.year,turn)}
    ><b>{election.year}</b><small>{turn}º turno{election.provisional ? " · prov." : ""}</small></button>))}
  </nav>;
}
