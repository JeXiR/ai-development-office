import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {SecureProviderCredentialStore} from "../src/provider-sdk/credentials";

const dir=fs.mkdtempSync(path.join(os.tmpdir(),"ado-provider-cred-"));
try{
  const store=new SecureProviderCredentialStore(dir);
  store.set("openai","sk-test-secret");
  if(!store.has("openai"))throw new Error("Credential presence failed");
  if(store.get("openai")!=="sk-test-secret")throw new Error("Credential roundtrip failed");

  const raw=fs.readFileSync(path.join(dir,"provider-credentials.secure.json"),"utf8");
  if(raw.includes("sk-test-secret"))throw new Error("Credential persisted in plaintext");

  store.remove("openai");
  if(store.has("openai"))throw new Error("Credential remove failed");

  console.log("Provider Credentials smoke PASS");
}finally{fs.rmSync(dir,{recursive:true,force:true});}
