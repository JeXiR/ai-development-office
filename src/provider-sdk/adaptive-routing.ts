import os from "node:os";
import path from "node:path";
import {ProviderQualityStore} from "./quality-feedback";
import type {UniversalProviderId} from "./types";

function dataDir(){
  return process.env.LOCALAPPDATA
    ? path.join(process.env.LOCALAPPDATA,"AI-Development-Office")
    : path.join(os.homedir(),".ai-development-office");
}

const quality=new ProviderQualityStore(dataDir());

export function adaptiveQualityBonus(providerId:UniversalProviderId,taskType="development"){
  return quality.routingBonus(providerId,taskType);
}

export function providerQualitySnapshot(taskType="development"){
  const ids:UniversalProviderId[]=["openai","anthropic","gemini","xai","groq","cursor","opencode","ollama","openai-compatible"];
  return ids.map(providerId=>({
    providerId,
    aggregate:quality.aggregate(providerId,taskType),
    routingBonus:quality.routingBonus(providerId,taskType)
  }));
}
