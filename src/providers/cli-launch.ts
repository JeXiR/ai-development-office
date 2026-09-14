import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {createHash} from "node:crypto";
import type {ProviderId} from "./types";

export const CLI_PROMPT_INLINE_LIMIT=3500;

export function materializeCliPrompt(_projectPath:string, prompt:string){
  if(!prompt||prompt.length<=CLI_PROMPT_INLINE_LIMIT)return {prompt,file:null as string|null};
  const dir=path.join(os.tmpdir(),"office-cli-prompts");
  fs.mkdirSync(dir,{recursive:true});
  const file=path.join(dir,`${createHash("sha1").update(prompt).digest("hex").slice(0,12)}.md`);
  if(!fs.existsSync(file))fs.writeFileSync(file,prompt);
  return {
    prompt:`Read the task from this file and execute it. Do not ask. ${file}`,
    file
  };
}

export type CliLaunchMode="exec"|"interactive";

export type CliLaunchInput={
  provider:ProviderId;
  executable:string;
  projectPath:string;
  prompt:string;
  mutating:boolean;
  trusted?:boolean;
  mode?:CliLaunchMode;
  customArgs?:string[];
};

export type CliLaunchPlan={
  command:string;
  args:string[];
  env:Record<string,string>;
};

function substitute(args:string[], input:CliLaunchInput, prompt:string){
  return args.map(arg=>arg
    .replaceAll("{project}", input.projectPath)
    .replaceAll("{prompt}", prompt)
    .replaceAll("{mutating}", input.mutating?"1":"0")
  );
}

function auto(input:CliLaunchInput){
  return !!(input.trusted||input.mutating);
}

export function buildCliLaunch(input:CliLaunchInput):CliLaunchPlan{
  const materialized=materializeCliPrompt(input.projectPath, input.prompt);
  const prompt=materialized.prompt;
  const env={
    OFFICE_EXE:input.executable,
    OFFICE_PROJECT:input.projectPath,
    OFFICE_PROMPT:prompt,
    OFFICE_MUTATE:input.mutating?"1":"0",
    ...(materialized.file?{OFFICE_PROMPT_FILE:materialized.file}:{})
  };
  const mode=input.mode||"exec";
  const yolo=auto(input);

  if(input.provider==="cursor"){
    if(mode==="interactive")return {command:input.executable,args:["--trust","--workspace",input.projectPath],env};
    return {
      command:input.executable,
      args:["-p","--trust","--workspace",input.projectPath,"--output-format","text",...(input.mutating?["--force"]:[]),prompt],
      env
    };
  }
  if(input.provider==="claude"){
    if(mode==="interactive")return {command:input.executable,args:yolo?["--permission-mode","auto"]:[],env};
    return {command:input.executable,args:["-p","--permission-mode",yolo?"auto":"acceptEdits","--output-format","json",prompt],env};
  }
  if(input.provider==="codex"){
    if(mode==="interactive")return {command:input.executable,args:["-C",input.projectPath,...(yolo?["--full-auto"]:[])],env};
    return {
      command:input.executable,
      args:["exec","--skip-git-repo-check","--json","-C",input.projectPath,...(yolo?["--full-auto"]:[]),prompt],
      env
    };
  }
  if(input.provider==="gemini"){
    if(mode==="interactive")return {command:input.executable,args:yolo?["--yolo"]:[] ,env};
    return {command:input.executable,args:["-p",prompt,"--output-format","json",...(yolo?["--yolo"]:[])],env};
  }
  if(input.provider==="copilot"){
    if(mode==="interactive")return {command:input.executable,args:["--add-dir",input.projectPath,...(yolo?["--allow-all"]:[])],env};
    return {command:input.executable,args:["-p",prompt,"--add-dir",input.projectPath,...(yolo?["--allow-all"]:[])],env};
  }
  if(input.provider==="opencode"){
    if(mode==="interactive")return {command:input.executable,args:[],env};
    return {command:input.executable,args:["run",prompt],env};
  }
  if(input.provider==="kimi"){
    if(mode==="interactive")return {command:input.executable,args:yolo?["--yolo","--auto"]:[],env};
    return {command:input.executable,args:["-p",prompt,"--output-format","json",...(yolo?["--yolo","--auto"]:[])],env};
  }
  if(input.provider==="qwen"){
    if(mode==="interactive")return {command:input.executable,args:yolo?["--yolo"]:[],env};
    return {command:input.executable,args:["-p",prompt,"--output-format","json",...(yolo?["--yolo"]:[])],env};
  }
  if(input.provider==="crush"){
    if(mode==="interactive")return {command:input.executable,args:["--cwd",input.projectPath,...(yolo?["--yolo"]:[])],env};
    return {command:input.executable,args:["run","--cwd",input.projectPath,...(yolo?["--yolo"]:[]),prompt],env};
  }
  if(input.provider==="pi"){
    if(mode==="interactive")return {command:input.executable,args:yolo?["--approve"]:[],env};
    return {command:input.executable,args:[...(yolo?["--approve"]:[]),"--",prompt],env};
  }
  if(input.provider==="grok"){
    if(mode==="interactive")return {command:input.executable,args:[],env};
    return {command:input.executable,args:["-p",prompt],env};
  }
  if(input.provider==="custom"){
    const template=input.customArgs?.length?input.customArgs:mode==="interactive"?[]:["{prompt}"];
    return {command:input.executable,args:substitute(template,input,prompt),env};
  }
  if(mode==="interactive")return {command:input.executable,args:[],env};
  return {command:input.executable,args:[prompt],env};
}

export const QUEUE_PROVIDERS:ProviderId[]=[
  "cursor","claude","codex","gemini","copilot","kimi","qwen","crush","pi","grok","opencode","custom","local"
];
