import fs from "node:fs";
import path from "node:path";
import {spawnSync} from "node:child_process";
import {canonicalConflictFiles,hasConflictMarkers,openProgressItems} from "../src/project-intelligence/progress-completer";
import {pickNextFactoryItems} from "../src/factory/autonomous-factory";
import {ProviderResolver} from "../src/providers/resolver";
import {buildCliLaunch} from "../src/providers/cli-launch";
import {wrapWindowsCli} from "../src/providers/win-cli";
import {parseCliUsage} from "../src/factory/cli-usage";
import {formatHivePtyMessage,hivePtyRelay} from "../src/collaboration/hive";

const project=process.env.OFFICE_PROJECT_PATH||"";
if(!project||!fs.existsSync(project)){
  console.log("Factory live smoke SKIP — set OFFICE_PROJECT_PATH to a real project");
  process.exit(0);
}

const progress=fs.readFileSync(path.join(project,"PROGRESS.md"),"utf8");
const conflicts=canonicalConflictFiles(project);
if(hasConflictMarkers(progress)&&!conflicts.some(x=>/PROGRESS\.md$/i.test(x)))throw new Error("PROGRESS conflicts missed");

const open=openProgressItems(progress);
const picked=pickNextFactoryItems(
  open.map((item,index)=>({id:`LIVE-${index+1}`,title:item.title,source:"progress",sourceFile:"PROGRESS.md",status:"todo"})),
  [],
  2
);
if(conflicts.length&&picked.length&&open.some(x=>/<<<<<<</.test(x.title)))throw new Error("factory would queue conflict markers");

const resolver=new ProviderResolver();
const installed:string[]=[];
for(const id of ["cursor","claude","codex","gemini"] as const){
  const exe=resolver.resolveExecutable(id);
  if(!exe)continue;
  installed.push(id);
  if(process.platform==="win32"&&!/\.(exe|cmd|bat)$/i.test(exe)){
    throw new Error(`${id} resolved to a non-native shim: ${exe}`);
  }
  const launch=buildCliLaunch({provider:id,executable:exe,projectPath:project,prompt:"report status only",mutating:false,trusted:false});
  const wrapped=wrapWindowsCli(launch.command,["--version"]);
  const probe=spawnSync(wrapped.command,wrapped.args,{encoding:"utf8",timeout:12000,windowsHide:true});
  if(probe.error)throw new Error(`${id} version probe failed: ${probe.error.message}`);
  const help=wrapWindowsCli(exe,["--help"]);
  const helpOut=spawnSync(help.command,help.args,{encoding:"utf8",timeout:15000,windowsHide:true});
  const text=`${helpOut.stdout||""}\n${helpOut.stderr||""}`;
  if(id==="codex"&&!/exec/i.test(text))throw new Error("codex help missing exec");
  if(id==="gemini"&&!/-p/.test(text)&&!/--prompt/.test(text))throw new Error("gemini help missing prompt flag");
}

const hive=formatHivePtyMessage("Backend","QA","Live factory","Verify conflict trip.");
let wrote="";
hivePtyRelay((id,data)=>{wrote=`${id}:${data}`;},[{id:"s1",agentId:"qa",role:"QA",status:"running"}],"QA",hive);
if(!wrote.includes("Verify conflict trip"))throw new Error("hive pty live relay failed");

const usage=parseCliUsage('{"usage":{"input_tokens":11,"output_tokens":4,"total_tokens":15}}');
if(!usage||usage.tokens!==15)throw new Error("live usage parse failed");

console.log(`Factory live smoke PASS — ${path.basename(project)} conflicts=${conflicts.length} open=${open.length} clis=${installed.join(",")||"none"}`);
