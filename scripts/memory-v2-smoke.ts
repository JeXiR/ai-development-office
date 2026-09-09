import fs from "node:fs";import os from "node:os";import path from "node:path";
import {MemoryV2Service} from "../src/memory-v2/service";
import {inferSpecialties} from "../src/memory-v2/specialization";

async function main(){
  const temp=fs.mkdtempSync(path.join(os.tmpdir(),"office-memoryv2-"));
  const svc=new MemoryV2Service();

  const a=await svc.add("p1",temp,{
    category:"architecture",scope:"shared",title:"Tenant rule",
    body:"Cross tenant access must be blocked.",tags:["tenant","security"],
    importance:.9,confidence:.95,provenance:{sourceType:"decision",sourceId:"d1",actor:"architect"}
  });

  const duplicate=await svc.add("p1",temp,{
    category:"architecture",scope:"shared",title:"Tenant rule",
    body:"Cross tenant access must be blocked.",tags:["tenant","security","isolation"],
    importance:.8,confidence:.8
  });

  if(a.id!==duplicate.id)throw new Error("deduplication failed");

  await svc.add("p1",temp,{
    category:"lesson",scope:"agent",agentId:"backend",title:"Laravel policy lesson",
    body:"Use policies for resource authorization.",tags:["laravel","authorization"],importance:.8,confidence:.9
  });

  const hits=await svc.search(temp,{query:"tenant security isolation",limit:5});
  if(!hits.length||hits[0].record.title!=="Tenant rule")throw new Error("semantic recall failed");

  const specialties=inferSpecialties(svc.store.list(temp),"backend");
  if(!specialties.some(x=>x.tag==="laravel"))throw new Error("specialization failed");

  const pruned=svc.prune(temp);
  if(pruned.after<1)throw new Error("prune removed everything");

  console.log("Memory v2 smoke PASS");
}
main().catch(e=>{console.error(e);process.exit(1);});
