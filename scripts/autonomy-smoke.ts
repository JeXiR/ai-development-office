import {DynamicTeamBuilder} from "../src/autonomy/team-builder";
import {IntelligentRetryStrategy} from "../src/autonomy/retry";
import {NoProgressRecovery} from "../src/autonomy/recovery";

const team=new DynamicTeamBuilder().create("p1","Implement backend API with security tests and CI");
if(!team.roles.some(x=>x.id==="backend")||!team.roles.some(x=>x.id==="security")||!team.roles.some(x=>x.id==="qa"))throw new Error("dynamic team failed");

const retry=new IntelligentRetryStrategy().decide({
  attempt:2,maxAttempts:4,repeatedErrors:3,noProgressCount:1,currentProvider:"codex",
  fallbackProviders:["claude","cursor"],costExceeded:false,destructiveRisk:false
});
if(retry.action!=="retry_fallback"||retry.provider!=="claude")throw new Error("retry strategy failed");

const recovery=new NoProgressRecovery().decide({
  noProgressCount:4,repeatedCommandCount:1,repeatedErrorCount:1,costExceeded:false,runtimeExceeded:false,fallbackProvider:"claude"
});
if(recovery.action!=="fallback"||recovery.nextProvider!=="claude")throw new Error("no-progress recovery failed");

console.log("Autonomy smoke PASS");
