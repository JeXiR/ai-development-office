import {spawnSync} from "node:child_process";
import type {ProviderId} from "./types";
import {buildCliLaunch} from "./cli-launch";
import {spawnEnv,wrapWindowsCli} from "./win-cli";

export type CrossCliAsk={
  provider:ProviderId;
  executable:string;
  projectPath:string;
  prompt:string;
  timeoutMs?:number;
};

export function buildConsultPrompt(goal:string){
  return [
    "VERIFY / CONSULT ONLY. Do not edit files. Do not run mutating commands.",
    "Cite repository evidence (tests, files, commands).",
    "End the reply with exactly one line: VERDICT: PASS or VERDICT: FAIL.",
    goal
  ].join("\n");
}

export function askCli(input:CrossCliAsk){
  const launch=buildCliLaunch({
    provider:input.provider,
    executable:input.executable,
    projectPath:input.projectPath,
    prompt:buildConsultPrompt(input.prompt),
    mutating:false,
    trusted:false
  });
  const wrapped=wrapWindowsCli(launch.command, launch.args);
  const result=spawnSync(wrapped.command, wrapped.args, {
    cwd:input.projectPath,
    encoding:"utf8",
    timeout:input.timeoutMs||90_000,
    windowsHide:true,
    env:spawnEnv(launch.env)
  });
  const output=`${result.stdout||""}\n${result.stderr||""}`.trim();
  return {
    provider:input.provider,
    ok:result.status===0,
    exitCode:typeof result.status==="number"?result.status:null,
    output:output.slice(0,8000),
    error:result.error?.message||null
  };
}
