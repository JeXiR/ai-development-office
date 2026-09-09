import {RuntimeEventBus} from "../src/runtime/event-bus";
import {AgentProcessManager} from "../src/runtime/process-manager";

async function main(){
  const events=new RuntimeEventBus();
  const manager=new AgentProcessManager(events);
  let output="";

  events.subscribe(event=>{
    if(event.type==="runtime.session.output")output+=String(event.payload.data||"");
  });

  const shell=process.platform==="win32"?(process.env.ComSpec||"cmd.exe"):"/bin/sh";
  const args=process.platform==="win32"
    ?["/d","/s","/c","echo OFFICE_RUNTIME_OK"]
    :["-lc","printf OFFICE_RUNTIME_OK"];

  const session=manager.spawn({
    projectId:"smoke",
    projectPath:process.cwd(),
    agentId:"smoke-agent",
    role:"qa",
    provider:"claude",
    executable:shell,
    args,
    cwd:process.cwd()
  });

  const deadline=Date.now()+5000;
  while(Date.now()<deadline){
    const current=manager.get(session.id);
    if(current?.status==="exited"||current?.status==="failed")break;
    await new Promise(resolve=>setTimeout(resolve,50));
  }

  if(!output.includes("OFFICE_RUNTIME_OK")){
    console.error("Runtime smoke failed.",{output,session:manager.get(session.id)});
    process.exit(1);
  }

  console.log("Runtime smoke PASS");
}

main().catch(error=>{
  console.error(error);
  process.exit(1);
});
