import type {CollaborationStore} from "./store";
import type {BlackboardEntry, MailMessage} from "./types";

export type HiveHandshakeInput={
  projectId:string;
  projectPath:string;
  fromAgentId:string;
  toAgentId:string;
  subject:string;
  body:string;
  relatedTaskId?:string|null;
  artifactIds?:string[];
  category?:BlackboardEntry["category"];
};

export function roleToAgentId(role:string){
  return String(role||"").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")||"specialist";
}

export function hiveDirect(fromAgentId:string, toAgentId:string){
  const from=roleToAgentId(fromAgentId);
  const to=roleToAgentId(toAgentId);
  return Boolean(from && to && from!==to);
}

export function hiveContext(messages:MailMessage[], agentIds:string[], limit=8){
  const wanted=new Set(agentIds.map(roleToAgentId));
  return messages
    .filter(row=>wanted.has(roleToAgentId(row.fromAgentId))||wanted.has(roleToAgentId(row.toAgentId)))
    .slice(-limit)
    .map(row=>`${row.fromAgentId} → ${row.toAgentId}: ${row.subject} — ${row.body}`)
    .join("\n");
}

export function hiveHandshake(store:CollaborationStore, input:HiveHandshakeInput){
  if(!hiveDirect(input.fromAgentId, input.toAgentId))return null;
  const message=store.sendMessage(input.projectId, input.projectPath, {
    fromAgentId:roleToAgentId(input.fromAgentId),
    toAgentId:roleToAgentId(input.toAgentId),
    subject:input.subject,
    body:input.body,
    relatedTaskId:input.relatedTaskId||null,
    artifactIds:input.artifactIds||[]
  });
  store.addBlackboard(input.projectId, input.projectPath, {
    authorAgentId:roleToAgentId(input.fromAgentId),
    category:input.category||"handoff",
    title:input.subject,
    body:input.body,
    relatedTaskId:input.relatedTaskId||null
  });
  return message;
}

export function formatHivePtyMessage(fromAgentId:string, toAgentId:string, subject:string, body:string){
  return `\r\n[HIVE ${roleToAgentId(fromAgentId)} → ${roleToAgentId(toAgentId)}] ${subject}\r\n${body}\r\n`;
}

export const DEFAULT_PTY_IDLE_MS=4*60*1000;

export function formatWakeup(agentId:string){
  return `\r\n[OFFICE WAKEUP] ${roleToAgentId(agentId)} still assigned; continue or report blocked.\r\n`;
}

export function idleRuntimeSessions(
  sessions:Array<{id:string;status?:string|null;paused?:boolean;lastActivityAt?:string|null}>,
  nowMs:number,
  idleMs:number
){
  return sessions
    .filter(row=>{
      if(String(row.status||"")!=="running"||row.paused)return false;
      const at=Date.parse(String(row.lastActivityAt||""));
      return Number.isFinite(at)&&nowMs-at>=idleMs;
    })
    .map(row=>row.id);
}

export function hivePtyRelay(
  write:(sessionId:string, data:string)=>void,
  sessions:Array<{id:string;agentId?:string|null;role?:string|null;status?:string|null}>,
  toAgentId:string,
  payload:string
){
  const wanted=roleToAgentId(toAgentId);
  const session=sessions.find(row=>{
    const live=String(row.status||"")==="running";
    const id=roleToAgentId(String(row.agentId||row.role||""));
    return live && id===wanted;
  });
  if(!session)return null;
  write(session.id, payload);
  return session.id;
}

export function hiveThread(store:CollaborationStore, projectId:string, projectPath:string, rows:Omit<HiveHandshakeInput, "projectId"|"projectPath">[]){
  const sent:MailMessage[]=[];
  for(const row of rows){
    const message=hiveHandshake(store, {...row, projectId, projectPath});
    if(message)sent.push(message);
  }
  return sent;
}
