import {test} from "node:test";
import assert from "node:assert/strict";
import {mkdtemp,mkdir,readFile,writeFile,rm} from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import {createHash} from "node:crypto";
import {AtlasRepository} from "../features/atlas/server/repository";
test("a published release pins the full preparation and rejects changed release bytes",async()=>{
  const root=await mkdtemp(path.join(os.tmpdir(),"atlas-version-"));
  try{
    const catalog=await readFile(path.join(process.cwd(),"data/atlas/catalog.json"),"utf8");
    const summary=await readFile(path.join(process.cwd(),"data/atlas/summary.json"),"utf8");
    const snapshotId=JSON.parse(catalog).snapshotId as string;
    const release=path.join(root,"releases",snapshotId);await mkdir(release,{recursive:true});
    const files={"catalog.json":catalog,"summary.json":summary};
    for(const [name,content] of Object.entries(files)){await writeFile(path.join(root,name),content);await writeFile(path.join(release,name),content);}
    await writeFile(path.join(release,"manifest.json"),JSON.stringify({snapshotId,files:Object.fromEntries(Object.entries(files).map(([name,content])=>[name,createHash("sha256").update(content).digest("hex")]))}));
    const repo=new AtlasRepository(root);const before=await repo.getSummary();
    await writeFile(path.join(root,"summary.json"),"[]");await writeFile(path.join(root,"catalog.json"),"{}");
    assert.equal((await repo.getCatalog()).snapshotId,snapshotId);assert.deepEqual(await repo.getSummary(),before);
    await writeFile(path.join(release,"summary.json"),summary+"\n");
    await assert.rejects(()=>repo.getSummary(),{code:"SNAPSHOT_INVALID"});
  }finally{await rm(root,{recursive:true,force:true});}
});
