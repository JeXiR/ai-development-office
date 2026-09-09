import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {AgentProviderPinStore} from "../src/provider-sdk/pinning";

const dir=fs.mkdtempSync(path.join(os.tmpdir(),"ado-provider-pins-"));
try{
  const store=new AgentProviderPinStore(dir);
  store.set({agentId:"laravel",providerId:"anthropic",model:"claude-test"});
  const pin=store.get("laravel");
  if(pin?.providerId!=="anthropic"||pin?.model!=="claude-test")throw new Error("Provider pin write/read failed");
  store.set({agentId:"laravel",providerId:"gemini",model:"gemini-test"});
  if(store.get("laravel")?.providerId!=="gemini")throw new Error("Provider pin replace failed");
  store.remove("laravel");
  if(store.get("laravel"))throw new Error("Provider pin remove failed");
  console.log("Provider Pinning smoke PASS");
}finally{fs.rmSync(dir,{recursive:true,force:true});}
