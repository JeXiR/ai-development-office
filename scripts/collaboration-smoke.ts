import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {CollaborationService} from "../src/collaboration/service";

const temp=fs.mkdtempSync(path.join(os.tmpdir(),"office-collab-"));
const service=new CollaborationService();

const plan=service.createPlan("p1",temp,"Build backend API and verify security",["architect","backend","frontend","qa","security","database","devops"]);
if(!plan.tasks.length)throw new Error("director decomposition failed");

service.store.sendMessage("p1",temp,{
  fromAgentId:"backend",
  toAgentId:"qa",
  subject:"handoff",
  body:"API ready for verification",
  relatedTaskId:plan.tasks[0]?.id||null,
  artifactIds:[]
});

service.store.addBlackboard("p1",temp,{
  authorAgentId:"director",
  category:"decision",
  title:"API contract",
  body:"Use versioned route group.",
  relatedTaskId:null
});

service.store.addArtifact("p1",temp,{
  producerAgentId:"backend",
  taskId:plan.tasks[0]?.id||null,
  type:"report",
  title:"Backend handoff",
  payload:{files:["routes/api.php"]}
});

const snapshot=service.snapshot("p1",temp);
if(snapshot.messages.length!==1)throw new Error("mailbox failed");
if(snapshot.blackboard.length!==1)throw new Error("blackboard failed");
if(snapshot.artifacts.length!==1)throw new Error("artifact store failed");

console.log("Collaboration smoke PASS");
