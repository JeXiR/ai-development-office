import type {OfficeStationId} from "./types";
export function stationForSignal(signal:{role?:string|null;eventType?:string|null;payload?:Record<string,unknown>|null}):OfficeStationId{
 const role=(signal.role||"").toLowerCase(),event=(signal.eventType||"").toLowerCase(),payload=JSON.stringify(signal.payload||{}).toLowerCase(),all=`${role} ${event} ${payload}`;
 if(/mail|message|handoff|collaboration/.test(all))return "mailbox";
 if(/memory|recall|lesson|decision/.test(all))return "memory";
 if(/git|diff|commit|merge|branch/.test(all))return "git";
 if(/test|qa|verify|coverage/.test(all))return "qa";
 if(/security|auth|permission|vulnerability/.test(all))return "security";
 if(/database|sql|migration|schema|query/.test(all))return "database";
 if(/devops|docker|deploy|ci|cd|nginx|server/.test(all))return "devops";
 if(/editor|file|write|patch|code/.test(all))return "editor";
 if(/terminal|command|shell|runtime|pty/.test(all))return "terminal";
 if(/director|plan|supervisor/.test(all))return "director";
 return "lounge";
}
