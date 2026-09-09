import type {PixelAgentState,PixelStationId} from "./types";
import {collectEventAgentIds} from "./agent-match";
import {roleToStation} from "./runtime-map";

export type PixelMappedEvent={
  agentIds:string[];
  state:PixelAgentState|null;
  station:PixelStationId|null;
  speech:string|null;
  targetAgentId:string|null;
};

function stationFromText(text:string):PixelStationId|null{
  const t=text.toLowerCase();
  if(/security|vulnerability|audit|permission|auth/.test(t))return "security";
  if(/database|sql|migration|prisma|eloquent|postgres|mysql/.test(t))return "database";
  if(/deploy|docker|ci|cd|server|nginx|devops|observability|sre|infra/.test(t))return "devops";
  if(/test|qa|coverage|assert|phpunit|jest|vitest|pytest/.test(t))return "qa";
  if(/git|review|diff|commit|merge|pull request/.test(t))return "git";
  if(/memory|context|docs|writer|documentation|roadmap|progress/.test(t))return "memory";
  if(/frontend|react|next|ui|css|component|flutter|mobile/.test(t))return "editor";
  if(/backend|laravel|nest|api|php|worker|queue/.test(t))return "terminal";
  if(/meeting|plan|architecture|director|decision|ceo|mission/.test(t))return "meeting";
  return null;
}

export function mapOfficeRuntimeEvent(event:any):PixelMappedEvent{
  const type=String(event?.type||event?.event_type||"").toLowerCase();
  const status=String(event?.status||event?.data?.status||"").toLowerCase();
  const message=String(
    event?.message
    ||event?.data?.message
    ||event?.data?.goal
    ||event?.task
    ||event?.title
    ||""
  );
  const agentIds=collectEventAgentIds(event);

  let state:PixelAgentState|null=null;
  if(/planned|planning|approval/.test(type)||status==="planning")state="thinking";
  else if(/started|running|working|retrying/.test(type)||["running","working","queued"].includes(status))state="working";
  else if(/testing|test_result/.test(type)||status==="testing")state="testing";
  else if(/reviewing|review_result/.test(type)||status==="reviewing")state="thinking";
  else if(/failed|blocked|error/.test(type)||["failed","blocked","error"].includes(status))state="blocked";
  else if(/completed|done|success/.test(type)||["completed","done"].includes(status))state="done";
  else if(/cancelled/.test(type))state="idle";
  else if(/stream\.text\.delta|communicat|message/.test(type))state="talking";

  const stationHaystack=/message|communicat/.test(type)
    ?message
    :`${type} ${message} ${agentIds.join(" ")}`;
  let station:PixelStationId|null=stationFromText(stationHaystack);
  if(type.includes("mission.planned")||type.includes("mission.started")||type.includes("mission.approval"))station="meeting";
  if(type.includes("mission.testing")||type.includes("mission.test_result"))station="qa";
  if(type.includes("mission.review"))station="git";
  if(type.includes("mission.completed")||type.includes("mission.cancelled"))station="lounge";

  return {
    agentIds,
    state,
    station,
    speech:message?message.slice(0,56):null,
    targetAgentId:event?.targetAgentId?String(event.targetAgentId):null
  };
}

export function roleDefaultStation(role:string):PixelStationId{
  return stationFromText(role)||roleToStation(role);
}
