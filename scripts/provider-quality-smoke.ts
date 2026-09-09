import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {ProviderQualityStore} from "../src/provider-sdk/quality-feedback";

const dir=fs.mkdtempSync(path.join(os.tmpdir(),"ado-provider-quality-"));
try{
  const store=new ProviderQualityStore(dir);
  store.append({providerId:"openai",taskType:"development",score:1,latencyMs:100,ok:true,at:new Date().toISOString()});
  store.append({providerId:"openai",taskType:"development",score:.8,latencyMs:200,ok:true,at:new Date().toISOString()});
  const agg=store.aggregate("openai","development");
  if(agg.count!==2)throw new Error("quality count failed");
  if(Math.abs(agg.avgScore-.9)>.0001)throw new Error("quality average failed");
  if(store.routingBonus("openai","development")<=0)throw new Error("routing bonus failed");
  console.log("Provider Quality smoke PASS");
}finally{fs.rmSync(dir,{recursive:true,force:true});}
