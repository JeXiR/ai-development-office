import {AnthropicAdapter} from "../src/provider-sdk/adapters/anthropic";
import {GeminiAdapter} from "../src/provider-sdk/adapters/gemini";
import {XAIAdapter} from "../src/provider-sdk/adapters/xai";
import {BUILTIN_PROVIDER_MANIFESTS} from "../src/provider-sdk/manifests";

const manifest=(id:any)=>BUILTIN_PROVIDER_MANIFESTS.find(x=>x.id===id)!;
const originalFetch=globalThis.fetch;
const originalEnv={...process.env};

function response(data:any,status=200){
  return new Response(JSON.stringify(data),{status,headers:{"content-type":"application/json"}});
}

try{
  process.env.ANTHROPIC_API_KEY="test";
  process.env.ANTHROPIC_MODEL="claude-test";
  globalThis.fetch=async ()=>response({
    content:[
      {type:"text",text:"anthropic-ok"},
      {type:"tool_use",id:"t1",name:"read_file",input:{path:"a.ts"}}
    ],
    stop_reason:"tool_use",
    usage:{input_tokens:10,output_tokens:5}
  });
  const a=new AnthropicAdapter(manifest("anthropic"));
  const as=await a.createSession({});
  const ao:any=await a.sendTask(as.id,{prompt:"x",tools:[{name:"read_file",inputSchema:{type:"object"}}]});
  if(ao.text!=="anthropic-ok"||ao.toolCalls.length!==1||ao.usage.totalTokens!==15)throw new Error("Anthropic normalization failed");

  process.env.GEMINI_API_KEY="test";
  process.env.GEMINI_MODEL="gemini-test";
  globalThis.fetch=async ()=>response({
    candidates:[{content:{parts:[{text:'{"ok":true}'},{functionCall:{name:"write_file",args:{path:"a.ts"}}}]},finishReason:"STOP"}],
    usageMetadata:{promptTokenCount:11,candidatesTokenCount:7,totalTokenCount:18,thoughtsTokenCount:2}
  });
  const g=new GeminiAdapter(manifest("gemini"));
  const gs=await g.createSession({});
  const go:any=await g.sendTask(gs.id,{prompt:"x",responseSchema:{type:"object"}});
  if(go.toolCalls.length!==1||go.structured?.ok!==true||go.usage.reasoningTokens!==2)throw new Error("Gemini normalization failed");

  process.env.XAI_API_KEY="test";
  process.env.XAI_MODEL="grok-test";
  globalThis.fetch=async ()=>response({
    status:"completed",
    output:[
      {type:"message",content:[{type:"output_text",text:"xai-ok"}]},
      {type:"function_call",call_id:"c1",name:"run_test",arguments:'{"suite":"unit"}'}
    ],
    usage:{input_tokens:12,output_tokens:8,total_tokens:20,output_tokens_details:{reasoning_tokens:3}}
  });
  const x=new XAIAdapter(manifest("xai"));
  const xs=await x.createSession({});
  const xo:any=await x.sendTask(xs.id,{prompt:"x"});
  if(xo.text!=="xai-ok"||xo.toolCalls[0]?.arguments?.suite!=="unit"||xo.usage.reasoningTokens!==3)throw new Error("xAI normalization failed");

  console.log("Native Provider smoke PASS");
}finally{
  globalThis.fetch=originalFetch;
  process.env=originalEnv;
}
