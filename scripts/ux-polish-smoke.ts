import {assignDesks,slotOffset,stationForRole} from "../src/pixel-office/layout";

const desks=assignDesks([
  {id:"a1",role:"QA Engineer"},
  {id:"a2",role:"QA Engineer"},
  {id:"a3",role:"Backend Engineer"},
  {id:"a4",role:"Security Engineer"}
]);

if(desks.find(x=>x.agentId==="a1")?.stationId!=="qa")throw new Error("QA station mapping failed");
if(desks.find(x=>x.agentId==="a3")?.stationId!=="editor")throw new Error("editor station mapping failed");
if(desks.find(x=>x.agentId==="a2")?.slot!==1)throw new Error("station slot assignment failed");
if(slotOffset(4).y<=0)throw new Error("slot offset failed");
if(stationForRole("DevOps Specialist")!=="devops")throw new Error("role station rule failed");

console.log("UX polish smoke PASS");
