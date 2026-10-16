"use client";
import { useSyncExternalStore } from 'react';
import type { ContextAnalysis } from '../types';
import { classifyContext, type ContextMapMode } from '../crossmap';

export function ContextLegend({analysis,mode,selectedCell,onSelect}:{analysis:ContextAnalysis;mode:ContextMapMode;selectedCell:number|null;onSelect:(cell:number|null)=>void}){
  const model=classifyContext(analysis.points);
  const desktop=useSyncExternalStore(callback=>{const media=matchMedia('(min-width: 901px)');media.addEventListener('change',callback);return()=>media.removeEventListener('change',callback);},()=>matchMedia('(min-width: 901px)').matches,()=>false);
  const fmt=(value:number)=>new Intl.NumberFormat('pt-BR',{maximumFractionDigits:1}).format(value);
  return <details className="atlas-context-legend" open={desktop}>
    <summary><b>{mode==='bivariate'?`${analysis.indicator.label} × voto`:mode==='vote'?`Voto · ${analysis.candidateLabel}`:analysis.indicator.label}</b></summary>
    {mode==='bivariate'?<><div className="atlas-bivariate-axis">↑ Maior {analysis.measure==='delta'?'variação':'participação'} eleitoral</div><div className="atlas-bivariate-grid" role="group" aria-label="Grupos do cruzamento territorial">{[6,7,8,3,4,5,0,1,2].map(id=>{const cell=model.cells[id];const description=`Indicador ${['baixo','médio','alto'][cell.xClass]}, voto ${['baixo','médio','alto'][cell.yClass]}`;return <button key={id} aria-label={`${description} · ${cell.count} municípios`} aria-pressed={selectedCell===id} title={description} style={{background:`var(--atlas-biv-${id})`}} onClick={()=>onSelect(selectedCell===id?null:id)}>{cell.count}</button>;})}</div><div className="atlas-bivariate-axis">Maior {analysis.indicator.label.toLowerCase()} →</div></>:<div className="atlas-context-scale">{[0,1,2].map(i=><span key={i} style={{background:`var(--atlas-context-${i})`}}>{['Baixo','Médio','Alto'][i]}</span>)}</div>}
    <small>Tercis municipais do recorte. Cortes: {fmt(mode==='vote'?model.yCuts[0]:model.xCuts[0])} / {fmt(mode==='vote'?model.yCuts[1]:model.xCuts[1])}{mode==='vote'?(analysis.measure==='delta'?' p.p.':'%'):` ${analysis.indicator.unit}`}.</small>
    <small>{analysis.indicator.period} · {analysis.points.length} pares · {analysis.missing} ausentes. Estados: mediana municipal; voto agregado dos pares. Cinza: sem par válido.</small>
  </details>;
}
