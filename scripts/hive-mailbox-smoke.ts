import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {CollaborationStore} from "../src/collaboration/store";
import {formatHivePtyMessage,formatWakeup,hiveContext,hiveDirect,hiveHandshake,hivePtyRelay,hiveThread,idleRuntimeSessions,roleToAgentId} from "../src/collaboration/hive";

const temp=fs.mkdtempSync(path.join(os.tmpdir(),"office-hive-"));
const store=new CollaborationStore();

if(roleToAgentId("QA")!=="qa")throw new Error("role slug failed");
if(hiveDirect("qa","qa"))throw new Error("same-role handshake should be skipped");
if(!hiveDirect("backend","qa"))throw new Error("expert handshake should be direct");

const message=hiveHandshake(store,{
  projectId:"p1",
  projectPath:temp,
  fromAgentId:"Backend",
  toAgentId:"QA",
  subject:"Ready for verify",
  body:"API route is implemented. Please verify.",
  relatedTaskId:"PROG-1"
});
if(!message)throw new Error("hive handshake missing");
if(message.fromAgentId!=="backend"||message.toAgentId!=="qa")throw new Error("ids not normalized");

const extras=hiveThread(store,"p1",temp,[
  {fromAgentId:"qa",toAgentId:"backend",subject:"Verify passed",body:"Acceptance criteria hold."},
  {fromAgentId:"qa",toAgentId:"qa",subject:"noop",body:"should skip"}
]);
if(extras.length!==1)throw new Error("self-message should be skipped");

const snap=store.snapshot("p1",temp);
if(snap.messages.length!==2)throw new Error("mailbox count failed");
if(!snap.blackboard.some(x=>x.category==="handoff"))throw new Error("blackboard handoff missing");

const ctx=hiveContext(snap.messages,["backend","qa"]);
if(!/backend → qa/.test(ctx)||!/qa → backend/.test(ctx))throw new Error("hive context missing thread");

const pty=formatHivePtyMessage("Backend","QA","Ready","Please verify.");
if(!/\[HIVE backend → qa\]/.test(pty))throw new Error("pty payload missing");
let wrote="";
const sessionId=hivePtyRelay((id,data)=>{wrote=`${id}:${data}`;},[{id:"s1",agentId:"qa",role:"QA",status:"running"}],"QA",pty);
if(sessionId!=="s1"||!wrote.includes("Please verify"))throw new Error("pty relay failed");
if(!/\[OFFICE WAKEUP\] qa/.test(formatWakeup("QA")))throw new Error("wakeup payload missing");
if(idleRuntimeSessions([{id:"s1",status:"running",lastActivityAt:new Date(Date.now()-10*60*1000).toISOString()}],Date.now(),4*60*1000)[0]!=="s1"){
  throw new Error("idle session not detected");
}

console.log("Hive mailbox smoke PASS");
