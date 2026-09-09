import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {ProviderQualityStore} from "../src/provider-sdk/quality-feedback";

const dir=fs.mkdtempSync(path.join(os.tmpdir(),"ado-adaptive-routing-"));
try{
  const store=new ProviderQualityStore(dir);
  for(let i=0;i<5;i++)store.append({providerId:"openai",taskType:"development",score:1,latencyMs:100,ok:true,at:new Date().toISOString()});
  for(let i=0;i<5;i++)store.append({providerId:"groq",taskType:"development",score:.2,latencyMs:50,ok:i<2,at:new Date().toISOString()});
  if(store.routingBonus("openai","development")<=store.routingBonus("groq","development"))throw new Error("Adaptive quality bonus ranking failed");
  console.log("Adaptive Routing smoke PASS");
}finally{fs.rmSync(dir,{recursive:true,force:true});}
