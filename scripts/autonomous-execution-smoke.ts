import type {MissionExecutionSummary} from "../src/orchestration/execution-types";

const summary:MissionExecutionSummary={
  missionId:"m1",
  status:"completed",
  startedAt:new Date().toISOString(),
  completedAt:new Date().toISOString(),
  agentResults:[
    {agentId:"architect",providerId:"openai",ok:true,output:{text:"plan"},error:null,attempts:1},
    {agentId:"qa",providerId:"gemini",ok:true,output:{text:"tests"},error:null,attempts:2}
  ],
  finalResult:{ok:true},
  errors:[]
};

if(summary.status!=="completed")throw new Error("Execution summary status failed");
if(summary.agentResults.length!==2)throw new Error("Execution summary aggregation failed");
if(summary.agentResults[1].attempts!==2)throw new Error("Failover attempt evidence failed");

console.log("Autonomous Execution model smoke PASS");
