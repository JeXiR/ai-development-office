import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {lintPalace,loadMemoryGraph,palaceContext,rememberHandoff,saveMemoryGraph,upsertNode} from "../src/memory-v2/graph";

const temp=fs.mkdtempSync(path.join(os.tmpdir(),"office-palace-"));
rememberHandoff(temp,"backend","qa","PROG-1","API ready","Verify the route.");
const ctx=palaceContext(temp,["backend","qa"]);
if(!/handoff/.test(ctx)||!/API ready/.test(ctx))throw new Error("palace context missing handoff");
if(!fs.existsSync(path.join(temp,".ai-kit","memory-v2","graph.json")))throw new Error("graph file missing");
const graph=loadMemoryGraph(temp);
for(let i=0;i<6;i++)upsertNode(graph,{id:`decision:${i}`,kind:"decision",label:`D${i}`,room:"decisions",refs:[]});
saveMemoryGraph(temp,graph);
if(!lintPalace(loadMemoryGraph(temp)).ok)throw new Error("pruned palace should pass lint");
console.log("Memory palace smoke PASS");
