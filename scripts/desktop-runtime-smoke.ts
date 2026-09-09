import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {restoreLastProject} from "../desktop/project-restore";
import {verifyEmbeddedKit} from "../desktop/kit-bootstrap";
import {discoverProviderCliExecutables} from "../desktop/provider-bootstrap";

const root=process.cwd();
const kit=verifyEmbeddedKit(root);
if(!kit.version)throw new Error("Embedded Kit version missing");

const dir=fs.mkdtempSync(path.join(os.tmpdir(),"ado-desktop-"));
try{
  fs.writeFileSync(path.join(dir,"projects.json"),JSON.stringify({
    activeProjectId:"p1",
    projects:[{id:"p1",name:"Demo",path:"C:\\Demo"}]
  }));
  const project=restoreLastProject(dir,null);
  if(project?.id!=="p1")throw new Error("Last-project restore failed");
}finally{
  fs.rmSync(dir,{recursive:true,force:true});
}

const providers=discoverProviderCliExecutables();
if(providers.length<5)throw new Error("Provider CLI discovery incomplete");

console.log("Desktop Runtime smoke PASS");
console.log(JSON.stringify({kitVersion:kit.version,providerRows:providers.length},null,2));
