import fs from "node:fs";
import path from "node:path";
import {spawnSync} from "node:child_process";
import {usesBundledNode} from "../desktop/bundled-node";
import {codesignStatus} from "../desktop/codesign";

const result=spawnSync(process.platform==="win32"?"npx.cmd":"npx",["tsx","scripts/package-desktop.ts"],{encoding:"utf8",cwd:process.cwd(),windowsHide:true,shell:process.platform==="win32"});
if(result.status!==0)throw new Error(result.stderr||result.stdout||"package-desktop failed");
const out=path.join(process.cwd(),"dist","office-desktop");
for(const file of ["office-launch.cmd","office-launch.sh","CODESIGN.md","README.md"]){
  if(!fs.existsSync(path.join(out,file)))throw new Error(`missing ${file}`);
}
if(usesBundledNode(process.cwd())!==false&&usesBundledNode(process.cwd())!==true)throw new Error("bundled node helper failed");
const guide=fs.readFileSync(path.join(out,"CODESIGN.md"),"utf8");
if(!/unsigned|signed/i.test(guide))throw new Error("CODESIGN.md missing sign result");
if(codesignStatus().signed)throw new Error("smoke must not report a fake signature");
console.log("Package desktop smoke PASS");
