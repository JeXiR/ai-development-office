import fs from "node:fs";import os from "node:os";import path from "node:path";
import {WorkerRegistry} from "../src/workers/registry";import {WorkerPool} from "../src/workers/pool";
const temp=fs.mkdtempSync(path.join(os.tmpdir(),"office-worker-"));
const reg=new WorkerRegistry();
reg.upsert(temp,{id:"local-1",name:"Local",kind:"local",enabled:true,host:null,user:null,port:null,container:null,workdir:null,tags:["default"],maxConcurrent:2});
const pool=new WorkerPool();
const selected=pool.select(reg.list(temp),["default"]);
if(!selected||selected.status!=="online")throw new Error("worker pool failed");
console.log("Workers smoke PASS");
