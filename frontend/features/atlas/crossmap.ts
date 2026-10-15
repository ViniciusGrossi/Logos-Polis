import type { ContextPoint } from './types';

export type ContextMapMode = 'indicator' | 'bivariate' | 'vote';
export interface CrossmapRow extends ContextPoint { xClass: number; yClass: number; cell: number; }
export interface CrossmapCell { id: number; xClass: number; yClass: number; count: number; }
export function terciles(values: number[]): [number,number] {
  const sorted=values.filter(Number.isFinite).sort((a,b)=>a-b);
  const q=(fraction:number)=>{
    if(!sorted.length)return 0;
    const index=(sorted.length-1)*fraction,low=Math.floor(index),high=Math.ceil(index);
    return sorted[low]+(sorted[high]-sorted[low])*(index-low);
  };
  return [q(1/3),q(2/3)];
}
export function contextClass(value:number, cuts:[number,number]):number {
  return value<=cuts[0]?0:value<=cuts[1]?1:2;
}
export function classifyContext(points:ContextPoint[]) {
  const valid=points.filter(p=>Number.isFinite(p.x)&&Number.isFinite(p.y));
  const xCuts=terciles(valid.map(p=>p.x)),yCuts=terciles(valid.map(p=>p.y));
  const rows:CrossmapRow[]=valid.map(p=>{
    const xClass=contextClass(p.x,xCuts),yClass=contextClass(p.y,yCuts);
    return {...p,xClass,yClass,cell:yClass*3+xClass};
  });
  const cells:CrossmapCell[]=Array.from({length:9},(_,id)=>({id,xClass:id%3,yClass:Math.floor(id/3),count:rows.filter(r=>r.cell===id).length}));
  return {rows,cells,xCuts,yCuts};
}
export function summarizeGroup(points:ContextPoint[],measure:'share'|'delta'='share') {
  const validVotes=points.reduce((n,p)=>n+p.weight,0);
  const currentVotes=points.reduce((n,p)=>n+(p.votes??(measure==='share'?p.y*p.weight/100:0)),0);
  const hasPrevious=points.length>0 && points.every(p=>p.votesBefore!==undefined && p.validVotesBefore!==undefined && p.validVotesBefore>0 && p.votes!==undefined);
  const validVotesBefore=hasPrevious?points.reduce((n,p)=>n+p.validVotesBefore!,0):null;
  const previousVotes=hasPrevious?points.reduce((n,p)=>n+p.votesBefore!,0):null;
  const currentShare=validVotes>0?currentVotes/validVotes*100:null;
  const share=measure==='share'?currentShare:currentShare!==null && validVotesBefore && previousVotes!==null?currentShare-previousVotes/validVotesBefore*100:null;
  return {n:points.length,validVotes,validVotesBefore,share};
}
export function contextMapValues(points:ContextPoint[],measure:'share'|'delta'='share') {
  const index=new Map<string,ContextPoint>(points.map(p=>[p.territory.id,p]));
  const states=new Map<string,ContextPoint[]>();
  for(const point of points){if(!point.territory.uf)continue;const group=states.get(point.territory.uf)??[];group.push(point);states.set(point.territory.uf,group);}
  for(const [uf,group] of states){
    const xs=group.map(p=>p.x).sort((a,b)=>a-b), mid=(xs.length-1)/2;
    const x=(xs[Math.floor(mid)]+xs[Math.ceil(mid)])/2;
    const summary=summarizeGroup(group,measure);
    if(summary.share===null)continue;
    index.set(uf,{territory:{...group[0].territory,id:uf,level:'state',name:uf},x,y:summary.share,weight:summary.validVotes});
  }
  return index;
}
