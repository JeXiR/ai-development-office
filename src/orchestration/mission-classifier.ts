import type {MissionProviderRequirement} from "./types";

export function classifyMissionRequirements(goal:string):MissionProviderRequirement{
  const g=goal.toLowerCase();
  return {
    coding:true,
    reasoning:true,
    toolCalling:true,
    structuredOutput:/json|schema|structured|contract|api/i.test(g),
    vision:/\b(images?|screenshots?|screen\s*shots?|mockups?|wireframes?|vision model)\b|\bvisual\s+(inspect|qa|test|diff|regression|review)\b/i.test(g),
    localPreferred:/local only|offline|private local/i.test(g)
  };
}

export function requirementKeys(req:MissionProviderRequirement){
  return Object.entries(req)
    .filter(([key,value])=>Boolean(value)&&key!=="localPreferred")
    .map(([key])=>key) as any[];
}
