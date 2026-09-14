import {
  pickLatestRelatedCommand,
  shouldKeepVanishedWorkItem
} from "../src/work/reconcile-work-ledger";

const commands=[
  {id:"old",projectId:"office-check",workItemId:"PROG-01",status:"running",createdAt:"2026-09-09T21:13:50.000Z",updatedAt:"2026-09-09T21:13:50.000Z"},
  {id:"new",projectId:"office-check",workItemId:"PROG-01",status:"completed",message:"PROG-01 is done.",createdAt:"2026-09-09T21:13:50.000Z",updatedAt:"2026-09-09T21:16:10.000Z"}
];

const latest=pickLatestRelatedCommand(commands,"office-check","PROG-01");
if(latest?.id!=="new")throw new Error("latest related command should be the completed one");

if(shouldKeepVanishedWorkItem({status:"working",source:"progress"}, latest)){
  throw new Error("completed progress item must leave Active Work");
}
if(shouldKeepVanishedWorkItem({status:"working"}, {status:"running"})!==true){
  throw new Error("in-flight vanished row must stay until the command finishes");
}
if(shouldKeepVanishedWorkItem({status:"todo",source:"progress"}, null)){
  throw new Error("checked progress with no live command must not be resurrected");
}
if(shouldKeepVanishedWorkItem({status:"done"}, {status:"completed"})){
  throw new Error("terminal rows stay dropped");
}
if(shouldKeepVanishedWorkItem({status:"working",source:"coverage"}, {status:"completed"})){
  throw new Error("stale coverage working rows must drop after the command ends");
}

console.log("Work ledger smoke PASS");
