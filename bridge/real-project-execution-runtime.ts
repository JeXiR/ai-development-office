import crypto from "node:crypto";
import path from "node:path";
import {getUniversalProviderRuntime} from "./provider-universal-runtime";
import {ensureOfficeProjectDocs,isDocsBootstrapGoal} from "../src/project-intelligence/docs-bootstrap";
import {createMissionWorkspace} from "../src/project-execution/worktree";
import {executeProjectTool} from "../src/project-execution/tool-executor";
import {normalizeProviderToolCalls} from "../src/project-execution/tool-call-parser";
import {projectGitDiff,projectGitHead,projectGitStatus} from "../src/project-execution/git-tools";
import {detectTestCommand,runProjectCommand} from "../src/project-execution/command-tools";

const PROJECT_TOOLS=[
  {name:"read_file",description:"Read a UTF-8 project file.",inputSchema:{type:"object",properties:{path:{type:"string"}},required:["path"]}},
  {name:"list_files",description:"List project files.",inputSchema:{type:"object",properties:{dir:{type:"string"},limit:{type:"number"}}}},
  {name:"write_file",description:"Create or overwrite a project file.",inputSchema:{type:"object",properties:{path:{type:"string"},content:{type:"string"}},required:["path","content"]}},
  {name:"patch_file",description:"Replace exact text in an existing project file.",inputSchema:{type:"object",properties:{path:{type:"string"},search:{type:"string"},replace:{type:"string"}},required:["path","search","replace"]}},
  {name:"run_command",description:"Run a safe project command.",inputSchema:{type:"object",properties:{command:{type:"string"},timeoutMs:{type:"number"}},required:["command"]}},
  {name:"run_tests",description:"Run the detected or supplied project test command.",inputSchema:{type:"object",properties:{command:{type:"string"},timeoutMs:{type:"number"}}}},
  {name:"git_status",description:"Read git status.",inputSchema:{type:"object",properties:{}}},
  {name:"git_diff",description:"Read current git diff.",inputSchema:{type:"object",properties:{}}}
];

export async function executeRealProjectMission(data:any){
  const projectPath=String(data?.projectPath||"");
  const goal=String(data?.goal||"").trim();
  const providerId=data?.providerId?String(data.providerId):undefined;
  const model=data?.model?String(data.model):undefined;
  const missionId=String(data?.missionId||crypto.randomUUID());
  if(!projectPath||!goal)throw new Error("projectPath and goal are required.");

  if(isDocsBootstrapGoal(goal)){
    const created=ensureOfficeProjectDocs({
      projectPath,
      projectName:String(data?.projectName||path.basename(projectPath)||"Project"),
      brief:String(data?.brief||goal)
    });
    return {
      missionId,
      workspaceMode:"inplace",
      workspacePath:projectPath,
      localDocs:true,
      created,
      changed:true,
      verification:{testsPassed:null,hasDiff:true,hasStatus:true}
    };
  }

  const workspace=createMissionWorkspace(projectPath,missionId);
  const beforeHead=projectGitHead(workspace.path);
  const runtime=getUniversalProviderRuntime();

  const transcript:any[]=[];
  let prompt=[
    `You are working inside project: ${workspace.path}`,
    `Mission: ${goal}`,
    "Use the available project tools to inspect and implement the mission.",
    "Do not access files outside the project.",
    "Prefer the smallest safe change.",
    "After implementation, run tests and inspect git diff."
  ].join("\n");

  try{
    for(let round=0;round<8;round++){
      const result=await runtime.execute({
        prompt,
        model,
        tools:PROJECT_TOOLS as any,
        route:{preferredProvider:providerId as any,requires:["coding","reasoning","toolCalling"]}
      } as any);

      transcript.push({round,providerId:result.providerId,attempts:result.attempts,output:result.output});
      if(!result.ok)throw new Error(result.attempts[result.attempts.length-1]?.error||"Provider execution failed.");

      const calls=normalizeProviderToolCalls(result.output);
      if(!calls.length)break;

      const toolResults=[];
      for(const call of calls){
        const tr=await executeProjectTool({
          projectPath:workspace.path,
          missionId,
          allowWrites:true,
          allowCommands:true,
          maxOutputBytes:2*1024*1024
        },call);
        toolResults.push(tr);
      }

      prompt=[
        "Continue the mission using these tool results.",
        JSON.stringify(toolResults),
        "If the mission is complete, respond with a concise final summary and do not call more tools."
      ].join("\n");
    }

    let testEvidence:any=null;
    const testCommand=detectTestCommand(workspace.path);
    if(testCommand){
      testEvidence={command:testCommand,result:await runProjectCommand(workspace.path,testCommand,300000,2*1024*1024)};
    }

    const diff=projectGitDiff(workspace.path);
    const status=projectGitStatus(workspace.path);

    return {
      missionId,
      workspaceMode:workspace.mode,
      workspacePath:workspace.path,
      branch:workspace.branch,
      beforeHead,
      transcript,
      testEvidence,
      gitStatus:status,
      gitDiff:diff,
      changed:Boolean(status.trim()||diff.trim()),
      verification:{
        testsPassed:testEvidence?testEvidence.result.code===0&&!testEvidence.result.timedOut:null,
        hasDiff:Boolean(diff.trim()),
        hasStatus:Boolean(status.trim())
      }
    };
  }finally{
    if(data?.keepWorkspace!==true)workspace.cleanup();
  }
}
