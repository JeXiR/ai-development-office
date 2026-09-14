import path from "node:path";
import type {McpServerConfig} from "../integrations/types";
import type {ProviderId} from "./types";
import {QUEUE_PROVIDERS} from "./cli-launch";

export const OFFICE_ASK_TOOLS=["ask_cursor","ask_claude","ask_codex","ask_gemini","ask_copilot","ask_grok","lease_claim","lease_release"] as const;

export function providerFromAskTool(name:string):ProviderId|null{
  const id=name.replace(/^ask_/,"");
  return QUEUE_PROVIDERS.includes(id as ProviderId)?id as ProviderId:null;
}

export function officeMcpConfig(officeRoot:string, projectPath:string):McpServerConfig{
  const script=path.join(officeRoot,"scripts","office-mcp.ts");
  return {
    id:"office-ask",
    command:process.execPath,
    args:["--import","tsx",script],
    env:{
      OFFICE_PROJECT_PATH:projectPath,
      OFFICE_ROOT:officeRoot
    },
    enabled:true
  };
}
