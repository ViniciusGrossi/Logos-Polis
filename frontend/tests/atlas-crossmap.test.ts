import assert from 'node:assert/strict';
import { test } from 'node:test';
import { classifyContext, summarizeGroup } from '../features/atlas/crossmap';
import { parseAtlasQuery, contextSchema } from '../features/atlas/server/schemas';
import { AtlasService } from '../features/atlas/server/service';
import type { ContextPoint } from '../features/atlas/types';

const points: ContextPoint[] = [0,10,20,30,40,50].map((x,index)=>({territory:{id:String(index),name:String(index),level:'municipality',uf:'MG',ibgeCode:index,tseCode:index,mapped:true,comparable:true},x,y:index*10,weight:100}));

test('bivariate classification preserves zero, excludes missing and uses municipal terciles',()=>{
  const model=classifyContext(points);
  assert.equal(model.rows[0].cell,0);
  assert.equal(model.rows[5].cell,8);
  assert.equal(model.cells.reduce((n,c)=>n+c.count,0),6);
  assert.equal(classifyContext([{...points[0],x:NaN}]).rows.length,0);
  const tied=classifyContext(points.map(p=>({...p,x:0,y:50})));
  assert.equal(new Set(tied.rows.map(r=>r.cell)).size,1);
});

test('context party selection changes actual municipal votes and nomination',async()=>{
  const service=new AtlasService();
  const pt=(await service.getContext(parseAtlasQuery('contexto',new URLSearchParams('uf=MG&year=2022&round=2&candidate=PT')))).data;
  const pl=(await service.getContext(parseAtlasQuery('contexto',new URLSearchParams('uf=MG&year=2022&round=2&candidate=PL')))).data;
  assert.match(pl.candidateLabel,/Jair Bolsonaro/i);
  assert.ok(pt.points.length>30);
  assert.ok(Math.abs(pt.points[0].y+pl.points[0].y-100)<1e-8);
});

test('group electoral result weights vote denominators rather than averaging shares',()=>{
  const rows=[{...points[0],y:90,weight:100},{...points[1],y:10,weight:900}];
  const group=summarizeGroup(rows);
  assert.equal(group.n,2);
  assert.equal(group.validVotes,1000);
  assert.equal(group.share,18);
  assert.equal(summarizeGroup([]).share,null);
});

test('group delta compares aggregated period shares, including changing municipal weight',()=>{
  const rows=[{...points[0],y:0,weight:100,votes:90,votesBefore:810,validVotesBefore:900},{...points[1],y:0,weight:900,votes:90,votesBefore:10,validVotesBefore:100}];
  const group=summarizeGroup(rows,'delta');
  assert.equal(group.share,-64);
  assert.equal(group.validVotesBefore,1000);
  assert.equal(summarizeGroup(points,'delta').share,null);
});

test('context accepts GDP and SIM and party selector while legacy snapshots remain valid',()=>{
  const query=parseAtlasQuery('contexto',new URLSearchParams('indicator=homicide&candidate=PL'));
  assert.equal(query.indicator,'homicide');assert.equal(query.candidate,'PL');
  assert.equal(parseAtlasQuery('contexto',new URLSearchParams('indicator=gdp')).indicator,'gdp');
  assert.throws(()=>parseAtlasQuery('contexto',new URLSearchParams('candidate=SQL')));
  assert.ok(contextSchema.safeParse({values:[{territoryId:'1',income:0,education:50,density:10}],indicators:[],sources:[]}).success);
});
