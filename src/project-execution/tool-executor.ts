import crypto from "node:crypto";
import type {ProjectExecutionContext,ProjectToolCall,ProjectToolResult} from "./types";
import {listProjectFiles,patchProjectFile,readProjectFile,writeProjectFile} from "./file-tools";
import {detectTestCommand,runProjectCommand} from "./command-tools";
import {projectGitDiff,projectGitStatus} from "./git-tools";

export async function executeProjectTool(ctx:ProjectExecutionContext,call:ProjectToolCall):Promise<ProjectToolResult>{
  try{
    let output:unknown=null;
    if(call.name==="read_file")output=readProjectFile(ctx.projectPath,String(call.arguments.path||""),ctx.maxOutputBytes);
    else if(call.name==="list_files")output=listProjectFiles(ctx.projectPath,String(call.arguments.dir||"."),Number(call.arguments.limit||500));
    else if(call.name==="write_file"){
      if(!ctx.allowWrites)throw new Error("Project writes are disabled.");
      output=writeProjectFile(ctx.projectPath,String(call.arguments.path||""),String(call.arguments.content||""));
    }
    else if(call.name==="patch_file"){
      if(!ctx.allowWrites)throw new Error("Project writes are disabled.");
      output=patchProjectFile(ctx.projectPath,String(call.arguments.path||""),String(call.arguments.search||""),String(call.arguments.replace||""));
    }
    else if(call.name==="run_command"){
      if(!ctx.allowCommands)throw new Error("Project commands are disabled.");
      output=await runProjectCommand(ctx.projectPath,String(call.arguments.command||""),Number(call.arguments.timeoutMs||120000),ctx.maxOutputBytes);
    }
    else if(call.name==="run_tests"){
      if(!ctx.allowCommands)throw new Error("Project commands are disabled.");
      const command=String(call.arguments.command||detectTestCommand(ctx.projectPath)||"");
      if(!command)throw new Error("No test command could be detected.");
      output={command,result:await runProjectCommand(ctx.projectPath,command,Number(call.arguments.timeoutMs||300000),ctx.maxOutputBytes)};
    }
    else if(call.name==="git_status")output=projectGitStatus(ctx.projectPath);
    else if(call.name==="git_diff")output=projectGitDiff(ctx.projectPath);
    else throw new Error(`Unknown project tool: ${call.name}`);

    return {id:call.id||crypto.randomUUID(),name:call.name,ok:true,output,error:null};
  }catch(error:any){
    return {id:call.id||crypto.randomUUID(),name:call.name,ok:false,output:null,error:String(error?.message||error)};
  }
}
