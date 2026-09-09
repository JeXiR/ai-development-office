import type {ProviderRuntimeState} from "./runtime-types";
import type {UniversalProviderId} from "./types";

const NATIVE_API=new Set(["native-api","openai-compatible"]);

export function preferredUniversalProvider(value:unknown):UniversalProviderId|null{
  const raw=String(value||"").trim().toLowerCase();
  if(!raw||raw==="auto")return null;
  if(raw==="claude")return "anthropic";
  const known:UniversalProviderId[]=["openai","anthropic","gemini","xai","groq","cursor","opencode","ollama","openai-compatible"];
  return known.includes(raw as UniversalProviderId)?raw as UniversalProviderId:null;
}

export function isProviderRouteEligible(row:Pick<ProviderRuntimeState,"configured"|"detected"|"health"|"manifest">){
  const available=Boolean(row.health?.available||row.detected);
  if(!available)return false;
  if(NATIVE_API.has(row.manifest.transport)&&!row.configured&&!row.health?.available)return false;
  return true;
}

export function isUnconfiguredProviderError(message:unknown){
  return /(?:API_KEY|API key|not configured|CLI is not installed|CLI not found|base URL|OPENAI_COMPATIBLE_BASE_URL)/i.test(String(message||""));
}
