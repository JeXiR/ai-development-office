import {ProviderEngine} from "../src/providers/engine";

const engine=new ProviderEngine();

const registry=engine.registry.list();
for(const id of ["cursor","claude","codex","gemini","copilot","kimi","qwen","crush","pi","grok","custom","opencode","local"]){
  if(!registry.some(x=>x.id===id))throw new Error(`missing provider ${id}`);
}

const health=registry.map(def=>({
  provider:def.id,
  status:def.id==="codex"?"healthy":"unknown",
  checkedAt:new Date().toISOString(),
  latencyMs:def.id==="codex"?100:null,
  executable:def.id==="codex"?"codex":null,
  message:"smoke"
} as const));

const decision=engine.router.route({task:"Implement backend API and tests",role:"backend",preferred:"codex"},health as any);
if(decision.selected!=="codex")throw new Error("routing failed");

const next=engine.router.failover("codex",{
  selected:decision.selected,
  ranked:[
    {provider:"claude",score:70,reasons:[],health:"healthy"},
    {provider:"cursor",score:60,reasons:[],health:"healthy"}
  ],
  reason:"smoke"
});
if(next!=="claude")throw new Error("failover failed");

console.log("Provider smoke PASS");
