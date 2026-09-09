import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {readProjectFile,writeProjectFile,patchProjectFile,listProjectFiles} from "../src/project-execution/file-tools";
import {validateProjectCommand,detectTestCommand} from "../src/project-execution/command-tools";
import {normalizeProviderToolCalls} from "../src/project-execution/tool-call-parser";

const dir=fs.mkdtempSync(path.join(os.tmpdir(),"ado-real-project-"));
try{
  fs.writeFileSync(path.join(dir,"package.json"),JSON.stringify({scripts:{test:"node test.js"}}));
  fs.writeFileSync(path.join(dir,"a.txt"),"hello");

  const read=readProjectFile(dir,"a.txt");
  if(read.content!=="hello")throw new Error("read_file failed");

  writeProjectFile(dir,"b.txt","world");
  patchProjectFile(dir,"b.txt","world","done");
  if(readProjectFile(dir,"b.txt").content!=="done")throw new Error("patch_file failed");

  const files=listProjectFiles(dir);
  if(!files.includes("a.txt")||!files.includes("b.txt"))throw new Error("list_files failed");

  if(detectTestCommand(dir)!=="npm test -- --runInBand")throw new Error("test detection failed");

  let blocked=false;
  try{validateProjectCommand("git reset --hard HEAD");}catch{blocked=true;}
  if(!blocked)throw new Error("destructive command guard failed");

  const calls=normalizeProviderToolCalls({toolCalls:[{id:"1",name:"read_file",arguments:{path:"a.txt"}}]});
  if(calls.length!==1||calls[0].name!=="read_file")throw new Error("tool call normalization failed");

  console.log("Real Project Execution smoke PASS");
}finally{
  fs.rmSync(dir,{recursive:true,force:true});
}
