import type {ProviderDefinition,ProviderId,ProviderSessionDescriptor} from "./types";

export class ProviderSessionFactory{
  build(definition:ProviderDefinition,executable:string,projectPath:string,resumeToken?:string|null):ProviderSessionDescriptor{
    const args=[...definition.defaultArgs];

    // Provider-specific resume wiring intentionally lives here, not in runtime.
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
          args.push("--resume",resumeToken);
          break;
        case "opencode":
          args.push("--session",resumeToken);
          break;
      }
    }

    return {
      provider:definition.id,
      executable,
      args,
      cwd:projectPath,
      resumeToken:resumeToken||null
    };
  }
}
