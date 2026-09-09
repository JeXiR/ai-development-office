import {DEFAULT_MISSION_RETRY_POLICY,shouldRetryAgent} from "../src/orchestration/retry-policy";
import {classifyApprovalNeed} from "../src/orchestration/approval-gates";
import {evaluateAgentResults,reviewMissionResult} from "../src/orchestration/stages";

if(!shouldRetryAgent({attempt:1,ok:false,output:null,error:"fail"},DEFAULT_MISSION_RETRY_POLICY))throw new Error("retry policy failed");
if(shouldRetryAgent({attempt:3,ok:false,output:null,error:"fail"},DEFAULT_MISSION_RETRY_POLICY))throw new Error("retry max failed");

const high=classifyApprovalNeed("git reset --hard HEAD");
if(!high.required||high.risk!=="high")throw new Error("approval high-risk classification failed");

const test=evaluateAgentResults([{ok:true,output:{ok:true},error:null}]);
if(!test.ok)throw new Error("test stage failed");

const review=reviewMissionResult({completedAgents:["a"],failedAgents:[]});
if(!review.ok)throw new Error("review stage failed");

console.log("Execution Hardening smoke PASS");
