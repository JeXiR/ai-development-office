import {classifyMissionRequirements} from "../src/orchestration/mission-classifier";
import {OllamaAdapter} from "../src/provider-sdk/adapters/ollama";
import {isProviderRouteEligible,isUnconfiguredProviderError,preferredUniversalProvider} from "../src/provider-sdk/eligibility";
import {DEFAULT_PROVIDER_POLICY} from "../src/provider-sdk/policy";
import {UniversalProviderRuntime} from "../src/provider-sdk/runtime";
import type {ProviderHealth,ProviderManifest,UniversalProviderAdapter,UniversalProviderId} from "../src/provider-sdk/types";

const KEYS=["OPENAI_API_KEY","ANTHROPIC_API_KEY","GEMINI_API_KEY","XAI_API_KEY","GROQ_API_KEY","OPENAI_COMPATIBLE_API_KEY","OPENAI_COMPATIBLE_BASE_URL"] as const;
const saved=Object.fromEntries(KEYS.map(key=>[key,process.env[key]]));
for(const key of KEYS)delete process.env[key];

const API_IDS:UniversalProviderId[]=["openai","anthropic","gemini","xai","groq","openai-compatible"];

function fail(message:string):never{throw new Error(message);}

function manifest(id:UniversalProviderId,vision=false):ProviderManifest{
  return {
    id,name:id,transport:id==="cursor"||id==="opencode"?"cli":id==="ollama"?"local-http":"native-api",
    capabilities:{coding:true,reasoning:true,toolCalling:true,structuredOutput:true,vision,streaming:true,sessionResume:true,local:id==="ollama"},
    credentialEnv:id==="cursor"||id==="opencode"||id==="ollama"?undefined:`${id.toUpperCase().replace(/-/g,"_")}_API_KEY`
  };
}

class FakeAdapter implements UniversalProviderAdapter{
  manifest:ProviderManifest;
  sendCount=0;
  constructor(
    id:UniversalProviderId,
    private available:boolean,
    private failMessage:string|null=null,
    vision=false
  ){
    this.manifest=manifest(id,vision);
  }
  async detect(){return this.available;}
  async health():Promise<ProviderHealth>{
    return {providerId:this.manifest.id,available:this.available,latencyMs:1,checkedAt:new Date().toISOString(),detail:this.available?"ok":"down"};
  }
  async models(){return this.available?["test-model"]:[]}
  async createSession(){return {id:`${this.manifest.id}-session`};}
  async resumeSession(id:string){return {id};}
  async sendTask(){
    this.sendCount++;
    if(this.failMessage)throw new Error(this.failMessage);
    return {text:`done:${this.manifest.id}`};
  }
  async cancel(){return;}
  async usage(){return {inputTokens:null,outputTokens:null,costUsd:null};}
}

async function main(){
  const uiGoal=classifyMissionRequirements("Build a tip calculator UI with bill, tip %, and people");
  if(uiGoal.vision)fail("Bare UI wording must not require vision");
  const visionGoal=classifyMissionRequirements("Compare these screenshots and mark visual QA regressions");
  if(!visionGoal.vision)fail("Screenshot + visual QA should require vision");

  if(preferredUniversalProvider("claude")!=="anthropic")fail("claude should map to anthropic");
  if(preferredUniversalProvider("cursor")!=="cursor")fail("cursor preferred mapping failed");
  if(preferredUniversalProvider("auto")!==null)fail("auto should be no preference");

  if(!isUnconfiguredProviderError("GEMINI_API_KEY is not configured."))fail("Gemini unconfigured error not recognized");
  if(!isUnconfiguredProviderError("OpenAI API key is not configured"))fail("OpenAI unconfigured error not recognized");

  if(DEFAULT_PROVIDER_POLICY.fallback.order[0]!=="cursor")fail("Default fallback must prefer Cursor CLI");

  const empty=new UniversalProviderRuntime([]);
  const none=await empty.route({requires:["coding","reasoning","toolCalling"],preferredProvider:"gemini"});
  if(none.providerId)fail(`Unconfigured APIs must not be selected, got ${none.providerId}`);
  if(none.candidates.some(x=>API_IDS.includes(x.providerId)))fail("Unconfigured native APIs leaked into route candidates");

  for(const id of API_IDS){
    const down=new FakeAdapter(id,false,`${id} is not configured`);
    const runtime=new UniversalProviderRuntime([down]);
    const decision=await runtime.route({requires:["coding","reasoning"],preferredProvider:id});
    if(decision.providerId===id)fail(`${id} was selected without credentials or health`);
    const executed=await runtime.execute({prompt:"x",route:{preferredProvider:id,requires:["coding","reasoning"]}});
    if(down.sendCount)fail(`${id} sendTask ran despite being unconfigured`);
    if(executed.ok)fail(`${id} execute succeeded without a healthy provider`);
  }

  const cursor=new FakeAdapter("cursor",true);
  const gemini=new FakeAdapter("gemini",false,"GEMINI_API_KEY is not configured.",true);
  const openai=new FakeAdapter("openai",false,"OPENAI_API_KEY is not configured.",true);
  const anthropic=new FakeAdapter("anthropic",false,"ANTHROPIC_API_KEY is not configured.",true);
  const xai=new FakeAdapter("xai",false,"XAI_API_KEY is not configured.",true);
  const groq=new FakeAdapter("groq",false,"GROQ_API_KEY is not configured.");
  const ollama=new FakeAdapter("ollama",false);
  const compat=new FakeAdapter("openai-compatible",false,"OPENAI_COMPATIBLE_BASE_URL is not configured");
  const mixed=new UniversalProviderRuntime([cursor,gemini,openai,anthropic,xai,groq,ollama,compat]);

  const cursorRoute=await mixed.route({
    requires:["coding","reasoning","toolCalling"],
    preferredProvider:"gemini"
  },DEFAULT_PROVIDER_POLICY);
  if(cursorRoute.providerId!=="cursor")fail(`Healthy Cursor must win over unconfigured APIs, got ${cursorRoute.providerId}`);

  const cursorExec=await mixed.execute({
    prompt:"hello",
    route:{requires:["coding","reasoning","toolCalling"],preferredProvider:"gemini"}
  });
  if(!cursorExec.ok||cursorExec.providerId!=="cursor")fail(`Execute must stay on Cursor, got ${cursorExec.providerId}`);
  if(gemini.sendCount||openai.sendCount||anthropic.sendCount||xai.sendCount||groq.sendCount){
    fail("Unconfigured API adapters were invoked during execute");
  }

  const claudeOnly=new FakeAdapter("anthropic",true);
  const deadCursor=new FakeAdapter("cursor",false);
  const claudeRuntime=new UniversalProviderRuntime([deadCursor,claudeOnly,gemini,openai]);
  const claudeRoute=await claudeRuntime.route({requires:["coding","reasoning"],preferredProvider:"cursor"},DEFAULT_PROVIDER_POLICY);
  if(claudeRoute.providerId!=="anthropic")fail(`Healthy Anthropic must win when Cursor is down, got ${claudeRoute.providerId}`);

  const groqOnly=new FakeAdapter("groq",true);
  const groqRuntime=new UniversalProviderRuntime([groqOnly,gemini,openai]);
  const groqRoute=await groqRuntime.route({requires:["coding","reasoning"]});
  if(groqRoute.providerId!=="groq")fail(`Healthy Groq should be selectable, got ${groqRoute.providerId}`);

  const ollamaOnly=new FakeAdapter("ollama",true);
  const ollamaRuntime=new UniversalProviderRuntime([ollamaOnly,gemini]);
  const ollamaRoute=await ollamaRuntime.route({requires:["coding","reasoning"],allowLocal:true});
  if(ollamaRoute.providerId!=="ollama")fail(`Healthy Ollama should be selectable, got ${ollamaRoute.providerId}`);

  const cursorVsOllama=new UniversalProviderRuntime([new FakeAdapter("ollama",true),cursor]);
  const cursorFirst=await cursorVsOllama.route({requires:["coding","reasoning"]},DEFAULT_PROVIDER_POLICY);
  if(cursorFirst.providerId!=="cursor")fail(`Cursor must beat Ollama by default, got ${cursorFirst.providerId}`);

  const savedOllama=process.env.OLLAMA_MODEL;
  delete process.env.OLLAMA_MODEL;
  try{
    const ollamaHealth=await new OllamaAdapter(manifest("ollama")).health();
    if(ollamaHealth.available)fail("Ollama must not be healthy without OLLAMA_MODEL");
  }finally{
    if(savedOllama==null)delete process.env.OLLAMA_MODEL;
    else process.env.OLLAMA_MODEL=savedOllama;
  }

  if(!isProviderRouteEligible({
    configured:false,
    detected:true,
    health:{providerId:"cursor",available:true,latencyMs:1,checkedAt:new Date().toISOString(),detail:"ok"},
    manifest:manifest("cursor")
  }))fail("Healthy Cursor must be eligible");

  if(isProviderRouteEligible({
    configured:false,
    detected:false,
    health:{providerId:"gemini",available:false,latencyMs:null,checkedAt:new Date().toISOString(),detail:"no key"},
    manifest:manifest("gemini",true)
  }))fail("Unconfigured Gemini must be ineligible");

  console.log("Provider Routing smoke PASS");
  console.log(JSON.stringify({
    uiVision:uiGoal.vision,
    fallback:DEFAULT_PROVIDER_POLICY.fallback.order,
    cursor:cursorRoute.providerId,
    claude:claudeRoute.providerId,
    groq:groqRoute.providerId,
    ollama:ollamaRoute.providerId
  },null,2));
}

function restore(){
  for(const key of KEYS){
    if(saved[key]==null)delete process.env[key];
    else process.env[key]=saved[key];
  }
}

main().then(restore,error=>{restore();throw error;});
