import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {ProviderPolicyStore} from "../src/provider-sdk/policy";

const dir=fs.mkdtempSync(path.join(os.tmpdir(),"ado-provider-policy-"));
try{
  const store=new ProviderPolicyStore(dir);
  const initial=store.read();
  if(initial.preference!=="balanced"||initial.fallback.maxAttempts!==3)throw new Error("Default provider policy invalid");

  store.write({
    ...initial,
    preference:"quality",
    fallback:{...initial.fallback,maxAttempts:4,order:["anthropic","openai","gemini","xai","groq","cursor","opencode","ollama","openai-compatible"]},
    providerWeights:{anthropic:25,openai:10}
  });

  const saved=store.read();
  if(saved.preference!=="quality")throw new Error("Provider policy preference persistence failed");
  if(saved.fallback.maxAttempts!==4)throw new Error("Provider policy maxAttempts persistence failed");
  if(saved.providerWeights.anthropic!==25)throw new Error("Provider weight persistence failed");
  if(saved.fallback.order[0]!=="anthropic")throw new Error("Fallback order persistence failed");

  console.log("Provider Policy smoke PASS");
}finally{fs.rmSync(dir,{recursive:true,force:true});}
