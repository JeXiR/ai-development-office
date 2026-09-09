import fs from "node:fs";
import path from "node:path";

const root=process.cwd();
const live=fs.readFileSync(path.join(root,"src","pixel-office-v2","live-store.ts"),"utf8");
const help=fs.readFileSync(path.join(root,"src","components","help","GlobalContextHelp.tsx"),"utf8");
const envExample=fs.readFileSync(path.join(root,".env.example"),"utf8");
const officePs=fs.readFileSync(path.join(root,"office.ps1"),"utf8");
const runtime=fs.readFileSync(path.join(root,"desktop","runtime.ts"),"utf8");

if(!live.includes("return changed?{liveAgents:next}:state")){
  throw new Error("Pixel Office seedAgents idempotency guard missing.");
}
if(!help.includes("window.setTimeout(()=>")){
  throw new Error("GlobalContextHelp deferred unmount missing.");
}
if(/OFFICE_PROJECT_PATH=.+/m.test(envExample)){
  throw new Error(".env.example still hardcodes a project.");
}
if(officePs.includes("Set OFFICE_PROJECT_PATH in .env.local before starting Office.")){
  throw new Error("office.ps1 still requires a project.");
}
if(!runtime.includes('none selected')){
  throw new Error("Project-neutral desktop status missing.");
}

console.log("Runtime Stability smoke PASS");
