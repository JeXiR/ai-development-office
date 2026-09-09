import {SafetyService} from "../src/safety/service";

const safety=new SafetyService({
  repeatedErrorThreshold:3,
  repeatedCommandThreshold:3,
  noProgressThreshold:3,
  maxRuntimeMinutes:1,
  maxTokens:100,
  maxCostUsd:1,
  protectedPaths:[".env","vendor/"]
});

const seed={projectId:"p1",agentId:"backend"};

let incident=null;
for(let i=0;i<3;i++)incident=safety.breaker.recordCommand("s1",seed,"php artisan test");
if(!incident||incident.reason!=="repeated-command")throw new Error("repeated command detection failed");

incident=null;
for(let i=0;i<3;i++)incident=safety.breaker.recordError("s2",seed,"SQLSTATE failed");
if(!incident||incident.reason!=="repeated-error")throw new Error("repeated error detection failed");

incident=null;
for(let i=0;i<3;i++)incident=safety.breaker.recordProgress("s3",seed,"same-diff");
if(!incident||incident.reason!=="no-progress")throw new Error("no-progress detection failed");

incident=safety.breaker.recordUsage("s4",seed,120,0.2);
if(!incident||incident.reason!=="token-ceiling")throw new Error("token ceiling failed");

incident=safety.breaker.checkProtectedPath("s5",seed,".env");
if(!incident||incident.reason!=="protected-path")throw new Error("protected path failed");

console.log("Safety smoke PASS");
