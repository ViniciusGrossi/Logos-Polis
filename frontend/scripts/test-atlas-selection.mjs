import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const require=createRequire(import.meta.url);
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const base=process.env.ATLAS_QA_BASE??'http://127.0.0.1:3802';
const esbuild=require(root+'/node_modules/esbuild');
const {chromium}=require(process.env.ATLAS_PLAYWRIGHT_PATH??'playwright');
const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const results=[];
try {
  for(const mutated of [true,false]) {
    const bundle=await esbuild.build({entryPoints:[root+'/features/atlas/preview.tsx'],bundle:true,write:false,outdir:root+'/.atlas-preview',platform:'browser',format:'iife',jsx:'automatic',external:['/fonts/*'],define:{'process.env.NODE_ENV':'"production"'},minify:true,logLevel:'silent',plugins:mutated?[{name:'regression-mutation',setup(build){build.onLoad({filter:/atlas-client\.tsx$/},async(args)=>{
      const {readFile}=await import('node:fs/promises');
      const source=await readFile(args.path,'utf8');
      const before='setContextCell(null);setHighlighted(ids);';
      assert.equal(source.split(before).length,2,'The mutation must change exactly the selection callback');
      return {contents:source.replace(before,'setHighlighted(ids);'),loader:'tsx'};
    });}}]:[]});
    const javascript=bundle.outputFiles.find(file=>file.path.endsWith('.js')).text;
    const page=await browser.newPage({viewport:{width:1440,height:1000}});
    const errors=[];page.on('pageerror',error=>errors.push(error.message));
    await page.route('**/preview.js',route=>route.fulfill({status:200,contentType:'text/javascript',body:javascript}));
    await page.goto(base+'/atlas?tab=contexto&uf=BR&year=2022&round=2&context=gdp',{waitUntil:'networkidle'});
    await page.locator('.atlas-map-canvas[data-atlas-rendered="true"]').first().waitFor();
    await page.getByRole('button',{name:/Indicador alto, voto alto/}).click();
    await page.waitForFunction(()=>new URL(location.href).searchParams.has('cell'));
    await page.getByRole('button',{name:'Limpar seleção conectada',exact:true}).click();
    const cleared=await page.waitForFunction(()=>!new URL(location.href).searchParams.has('cell'),null,{timeout:3000}).then(()=>true,()=>false);
    assert.deepEqual(errors,[]);
    assert.equal(cleared,!mutated,mutated?'RED: the pre-fix behavior must retain the stale cell':'GREEN: the corrected callback must remove the cell');
    results.push({version:mutated?'RED: missing URL reset reproduced':'GREEN: production callback',cellRemoved:cleared,pageErrors:errors.length});
    await page.close();
  }
  console.log(JSON.stringify({selectionRegression:results,hostFilesChanged:false,newServersStarted:false},null,2));
} finally {await browser.close();}
