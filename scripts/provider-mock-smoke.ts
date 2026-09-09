import {MockProviderEnvironment} from "../src/providers/mock";
const env=new MockProviderEnvironment().set("codex","healthy",100).set("claude","unavailable",null).set("cursor","degraded",500);
const decision=env.route({task:"implement backend code",preferred:"codex"});
if(decision.selected!=="codex")throw new Error("provider mock routing failed");
console.log("Provider mock smoke PASS");
