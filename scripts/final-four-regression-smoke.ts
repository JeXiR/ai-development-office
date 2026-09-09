import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {selectAgentsForCapabilities} from "../src/orchestration/agent-selector";
import {findPixelPath} from "../src/pixel-office-v2/pathfinding";

const agents=[
  {id:"laravel",name:"Laravel Specialist",role:"Laravel Specialist"},
  {id:"security",name:"Security",role:"Security"},
  {id:"qa",name:"QA",role:"QA"}
];
const selected=selectAgentsForCapabilities(agents,["backend.laravel","security","testing"]).map(x=>x.id);
for(const id of ["laravel","security","qa"]){
  if(!selected.includes(id))throw new Error(`Agent coverage regression: ${id}`);
}

const p=findPixelPath({x:40,y:40},{x:900,y:650});
if(p.length<2||p[0].x!==40||p[0].y!==40)throw new Error(`Path regression: ${JSON.stringify(p)}`);

const audit=fs.readFileSync(path.join(process.cwd(),"scripts","ui-copy-audit.ts"),"utf8");
if(!audit.includes("literalRawKeyPattern"))throw new Error("UI copy audit regression");

console.log("Final Four Regression smoke PASS");
