import type { ContextAnalysis } from '../types';
import { summarizeGroup } from '../crossmap';
import { number, pct, pp } from '../format';

export function ContextReading({analysis,highlighted,selectedId}:{analysis:ContextAnalysis;highlighted:string[];selectedId:string|null}){
  const group=analysis.points.filter(p=>highlighted.includes(p.territory.id));
  const summary=summarizeGroup(group,analysis.measure);
  const selected=analysis.points.find(p=>p.territory.id===selectedId);
  return <div className="atlas-context-investigation">
    <p className="atlas-helper">O mapa cruza {analysis.indicator.label.toLowerCase()} com {analysis.measure==='delta'?'variação eleitoral':'participação eleitoral'}. Clique numa célula da legenda para investigar o grupo; amplie para ver municípios.</p>
    {selected && <div className="atlas-reading-list"><div><span>{selected.territory.name}</span><b>{new Intl.NumberFormat('pt-BR',{maximumFractionDigits:2}).format(selected.x)} {analysis.indicator.unit}</b></div><div><span>{analysis.candidateLabel}</span><b>{analysis.measure==='delta'?pp(selected.y):pct(selected.y)}</b></div></div>}
    {summary.n>0 && <div className="atlas-reading-fact" role="status"><span>Grupo selecionado · {number(summary.n)} municípios</span><strong>{analysis.measure==='delta'?pp(summary.share):pct(summary.share)}</strong><p>{analysis.candidateLabel} · {analysis.measure==='delta'?'diferença entre participações agregadas nos dois períodos':'votos do grupo ÷ votos válidos do grupo'} · {number(summary.validVotes)} votos válidos atuais{analysis.measure==='delta' && summary.validVotesBefore!==null?` / ${number(summary.validVotesBefore)} anteriores`:''} no denominador.</p></div>}
    <p className="atlas-helper">Período do indicador: {analysis.indicator.period}. Estados: mediana dos municípios válidos, não uma taxa estadual. Cinza indica ausência de par, nunca zero. Taxas de mortalidade em municípios pequenos são instáveis.</p>
  </div>;
}
