import {createInterface} from "node:readline";
import {ProviderResolver} from "../src/providers/resolver";
import {askCli} from "../src/providers/cross-cli";
import {OFFICE_ASK_TOOLS,providerFromAskTool} from "../src/providers/office-mcp";
import {claimLease,releaseLease} from "../src/coordination/leases";

const project=process.env.OFFICE_PROJECT_PATH||"";
const resolver=new ProviderResolver();

function send(id:unknown, result:unknown){
  const body=JSON.stringify({jsonrpc:"2.0",id,result});
  process.stdout.write(`Content-Length: ${Buffer.byteLength(body,"utf8")}\r\n\r\n${body}`);
}

function sendError(id:unknown, message:string){
  const body=JSON.stringify({jsonrpc:"2.0",id,error:{code:-32000,message}});
  process.stdout.write(`Content-Length: ${Buffer.byteLength(body,"utf8")}\r\n\r\n${body}`);
}

async function handle(msg:any){
  const id=msg.id;
  const method=String(msg.method||"");
  if(method==="initialize"){
    send(id,{protocolVersion:"2024-11-05",capabilities:{tools:{}},serverInfo:{name:"office-ask",version:"2.1.9"}});
    return;
  }
  if(method==="tools/list"){
    send(id,{tools:OFFICE_ASK_TOOLS.map(name=>({
      name,
      description:name.startsWith("ask_")?"Read-only consult of another Office CLI. Ends with VERDICT: PASS|FAIL.":"Claim or release a project lease.",
      inputSchema:{type:"object",properties:{prompt:{type:"string"},taskId:{type:"string"},agentId:{type:"string"},files:{type:"array",items:{type:"string"}}},additionalProperties:true}
    }))});
    return;
  }
  if(method==="tools/call"){
    const name=String(msg.params?.name||"");
    const args=msg.params?.arguments||{};
    if(!project){sendError(id,"OFFICE_PROJECT_PATH is not set.");return;}
    if(name==="lease_claim"){
      const row=claimLease(project,{taskId:String(args.taskId||"adhoc"),agentId:String(args.agentId||"specialist"),files:Array.isArray(args.files)?args.files:[],note:String(args.prompt||"")});
      send(id,{content:[{type:"text",text:JSON.stringify(row)}]});
      return;
    }
    if(name==="lease_release"){
      releaseLease(project,String(args.agentId||"specialist"),args.taskId?String(args.taskId):undefined);
      send(id,{content:[{type:"text",text:"released"}]});
      return;
    }
    const provider=providerFromAskTool(name);
    if(!provider){sendError(id,`Unknown tool ${name}`);return;}
    const exe=resolver.resolveExecutable(provider);
    if(!exe){sendError(id,`${provider} CLI not found`);return;}
    const asked=askCli({provider,executable:exe,projectPath:project,prompt:String(args.prompt||""),timeoutMs:45000});
    send(id,{content:[{type:"text",text:asked.output||asked.error||"empty"}]});
    return;
  }
  if(id!=null)send(id,{});
}

const rl=createInterface({input:process.stdin,crlfDelay:Infinity});
let buffer="";
rl.on("line",line=>{
  if(!line.trim()){
    const match=buffer.match(/Content-Length:\s*(\d+)/i);
    buffer="";
    if(!match)return;
    const size=Number(match[1]);
    let raw="";
    const onData=(chunk:string|Buffer)=>{
      raw+=String(chunk);
      if(Buffer.byteLength(raw,"utf8")>=size){
        process.stdin.off("data",onData);
        try{handle(JSON.parse(raw.slice(0,size)));}catch{}
      }
    };
    process.stdin.on("data",onData);
    return;
  }
  buffer+=`${line}\n`;
});
