import type {ProviderDefinition,ProviderSessionDescriptor} from "./types";
import {buildCliLaunch} from "./cli-launch";

export class ProviderSessionFactory{
  build(definition:ProviderDefinition,executable:string,projectPath:string,resumeToken?:string|null):ProviderSessionDescriptor{
    const launch=buildCliLaunch({
      provider:definition.id,
      executable,
      projectPath,
      prompt:"",
      mutating:false,
      trusted:true,
      mode:"interactive"
    });
    const args=[...launch.args];

    if(resumeToken&&definition.capabilities.resume){
      switch(definition.id){
        case "claude":
          args.push("--resume",resumeToken);
          break;
        case "cursor":
          args.push("--resume",resumeToken);
          break;
        case "codex":
          args.push("resume",resumeToken);
          break;
        case "gemini":
        case "kimi":
        case "qwen":
        case "grok":
          args.push("--resume",resumeToken);
          break;
        case "crush":
          args.push("--session",resumeToken);
          break;
        case "opencode":
          args.push("--session",resumeToken);
          break;
      }
    }

    return {
      provider:definition.id,
      executable:launch.command,
      args,
      cwd:projectPath,
      resumeToken:resumeToken||null
    };
  }
}
