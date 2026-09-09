import crypto from "node:crypto";
import type {ProjectToolCall,ProjectToolName} from "./types";

const ALLOWED=new Set<ProjectToolName>(["read_file","write_file","patch_file","list_files","run_command","git_diff","git_status","run_tests"]);

export function normalizeProviderToolCalls(output:any):ProjectToolCall[]{
  const calls=Array.isArray(output?.toolCalls)
    ? output.toolCalls
    : Array.isArray(output?.output?.toolCalls)
      ? output.output.toolCalls
      : [];

  return calls.flatMap((call:any)=>{
    const name=String(call?.name||"") as ProjectToolName;
    if(!ALLOWED.has(name))return [];
    let args=call?.arguments??call?.input??{};
    if(typeof args==="string"){
      try{args=JSON.parse(args);}catch{args={};}
    }
    return [{
      id:String(call?.id||crypto.randomUUID()),
      name,
      arguments:args&&typeof args==="object"?args:{}
    }];
  });
}
