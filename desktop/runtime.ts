import path from "node:path";
import fs from "node:fs";
import {desktopRuntimeConfig} from "./runtime-config";
import {restoreLastProject} from "./project-restore";
import {verifyEmbeddedKit} from "./kit-bootstrap";
import {discoverProviderCliExecutables} from "./provider-bootstrap";
import {ProcessSupervisor} from "./process-supervisor";
import {waitForPort} from "./health";
import {openExternal} from "./open-browser";

function commandForNpm(){
  return process.platform==="win32"?"npm.cmd":"npm";
}

function ensureDataDir(dir:string){fs.mkdirSync(dir,{recursive:true});}

async function main(){
  const config=desktopRuntimeConfig();
  ensureDataDir(config.dataDir);

  const kit=verifyEmbeddedKit(config.officeRoot);
  const project=restoreLastProject(config.dataDir,config.projectPath);
  const providers=discoverProviderCliExecutables();

  console.log("AI Development Office Desktop Runtime");
  console.log(`Office root : ${config.officeRoot}`);
  console.log(`Kit         : ${kit.version}`);
  console.log(`Project     : ${project?.path||"none selected"}`);
  console.log(`Bridge      : ws://127.0.0.1:${config.bridgePort}`);
  console.log(`Web         : http://127.0.0.1:${config.webPort}`);
  console.log("Provider CLIs:");
  for(const row of providers)console.log(`  ${row.id.padEnd(10)} ${row.executable||"missing"} (${row.source})`);

  const supervisor=new ProcessSupervisor();
  const env:any={
    OFFICE_BRIDGE_PORT:String(config.bridgePort),
    NEXT_PUBLIC_OFFICE_WS_URL:`ws://127.0.0.1:${config.bridgePort}`,
    ...(project?.path?{OFFICE_PROJECT_PATH:project.path}:{})
  };

  console.log("Starting bridge...");
  const bridge=supervisor.spawn(
    "bridge",
    commandForNpm(),
    ["run","bridge"],
    {cwd:config.officeRoot,env}
  );

  bridge.once("exit",code=>{
    if(code&&code!==0)console.error(`Bridge exited with code ${code}`);
  });

  const bridgeReady=await waitForPort(config.bridgePort);
  if(!bridgeReady)throw new Error(`Bridge failed to open port ${config.bridgePort}.`);

  console.log("Starting web runtime...");
  const web=supervisor.spawn(
    "web",
    commandForNpm(),
    ["run","dev","--","-p",String(config.webPort)],
    {cwd:config.officeRoot,env}
  );

  web.once("exit",code=>{
    if(code&&code!==0)console.error(`Web runtime exited with code ${code}`);
  });

  const webReady=await waitForPort(config.webPort);
  if(!webReady)throw new Error(`Web runtime failed to open port ${config.webPort}.`);

  const url=`http://127.0.0.1:${config.webPort}`;
  if(config.openBrowser)openExternal(url);

  console.log("Office runtime READY");
  console.log(url);

  const stop=async()=>{
    console.log("Shutting down AI Development Office...");
    await supervisor.shutdown();
    process.exit(0);
  };

  process.once("SIGINT",stop);
  process.once("SIGTERM",stop);
  process.once("SIGHUP",stop);

  if(process.platform==="win32"){
    process.stdin.resume();
  }
}

main().catch(error=>{
  console.error(error);
  process.exit(1);
});
