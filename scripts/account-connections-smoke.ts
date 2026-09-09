import {AUTH_CONNECTION_MANIFESTS} from "../src/auth-connections/manifests";

const ids=AUTH_CONNECTION_MANIFESTS.map(x=>x.id);
for(const required of ["openai-codex","claude-code","gemini-cli","cursor-cli","github-cli"]){
  if(!ids.includes(required as any))throw new Error(`Missing account connection: ${required}`);
}
if(!AUTH_CONNECTION_MANIFESTS.find(x=>x.id==="openai-codex")?.modes.includes("browser-account"))throw new Error("Codex browser auth missing");
if(!AUTH_CONNECTION_MANIFESTS.find(x=>x.id==="gemini-cli")?.modes.includes("browser-account"))throw new Error("Gemini browser auth missing");
if(!AUTH_CONNECTION_MANIFESTS.find(x=>x.id==="github-cli")?.loginArgs.includes("--web"))throw new Error("GitHub web auth missing");

console.log("Account Connections smoke PASS");
