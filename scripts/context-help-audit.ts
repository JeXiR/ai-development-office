import fs from "node:fs";
import path from "node:path";
import {helpFor} from "../src/help/helpRegistry";

const root=process.cwd();
const host=path.join(root,"src/components/help/GlobalContextHelp.tsx");
const registry=path.join(root,"src/help/helpRegistry.ts");
const icon=path.join(root,"src/components/help/InfoIcon.tsx");

for(const file of [host,registry,icon]){
  if(!fs.existsSync(file))throw new Error(`Missing context-help file: ${path.relative(root,file)}`);
}

const hostText=fs.readFileSync(host,"utf8");
const registryText=fs.readFileSync(registry,"utf8");
const iconText=fs.readFileSync(icon,"utf8");
if(!hostText.includes("helpFor"))throw new Error("GlobalContextHelp does not use helpFor");
if(!iconText.includes("helpFor"))throw new Error("InfoIcon does not use helpFor");
if(!registryText.includes("Cost ledger"))throw new Error("Help registry is missing the cost-ledger explanation");
if(!registryText.includes("This panel groups related Office status and actions."))throw new Error("Heading fallback still echoes the title");
for(const selector of ["button","h1","h2","h3"]){
  if(!hostText.includes(selector))throw new Error(`Global help does not cover selector: ${selector}`);
}

const sourceFiles:string[]=[];
function walk(dir:string){
  for(const e of fs.readdirSync(dir,{withFileTypes:true})){
    const p=path.join(dir,e.name);
    if(e.isDirectory()){if(!["node_modules",".next"].includes(e.name))walk(p);}
    else if(/\.tsx$/.test(e.name))sourceFiles.push(p);
  }
}
walk(path.join(root,"src/components"));

let buttons=0,checkboxes=0,selects=0,headings=0;
for(const file of sourceFiles){
  const text=fs.readFileSync(file,"utf8");
  buttons+=(text.match(/<button\b/g)||[]).length;
  checkboxes+=(text.match(/type=["']checkbox["']/g)||[]).length;
  selects+=(text.match(/<select\b/g)||[]).length;
  headings+=(text.match(/<h[1-3]\b/g)||[]).length;
}

const ledger=helpFor("Provider usage & latency telemetry","heading","en");
if(ledger.purpose===ledger.title||/provider usage & latency telemetry/i.test(ledger.purpose)){
  throw new Error("Cost ledger tooltip still repeats the heading");
}
if(!/token|cost|latency/i.test(ledger.purpose))throw new Error("Cost ledger tooltip is too vague");
const taskTr=helpFor("Görev Akışı","heading","tr");
if(!/hazır|aktif/i.test(taskTr.purpose))throw new Error("Task flow tooltip is not translated to Turkish");
if(taskTr.title==="Task flow"&&taskTr.purpose.startsWith("Shows ready"))throw new Error("Turkish UI still gets English help text");

console.log(`context help audit PASS`);
console.log(`discoverable controls: buttons=${buttons}, checkboxes=${checkboxes}, selects=${selects}, headings=${headings}`);
console.log(`coverage strategy: global runtime decoration + registry-specific explanations`);
