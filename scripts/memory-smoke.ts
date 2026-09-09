import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {MemoryService} from "../src/memory/service";

const temp=fs.mkdtempSync(path.join(os.tmpdir(),"office-memory-"));
const service=new MemoryService();

service.add("p1",temp,{scope:"shared",agentId:null,kind:"decision",title:"Auth strategy",body:"Use tenant-aware middleware.",tags:["auth","tenant"],importance:90});
service.add("p1",temp,{scope:"agent",agentId:"qa",kind:"lesson",title:"Regression check",body:"Always verify cross-tenant access.",tags:["qa","tenant"],importance:80});

const snapshot=service.snapshot("p1",temp);
if(snapshot.shared.length!==1)throw new Error("shared memory failed");
if(snapshot.agents.qa?.length!==1)throw new Error("agent memory failed");

const results=service.search("p1",temp,"tenant auth",null,10);
if(!results.length)throw new Error("memory search failed");

const context=service.directorContext("p1",temp,"tenant auth regression");
if(!context.length)throw new Error("director memory context failed");

const condensed=service.condense("p1",temp,1,365);
if(!condensed.shared)throw new Error("memory condensation failed");

console.log("Memory smoke PASS");
