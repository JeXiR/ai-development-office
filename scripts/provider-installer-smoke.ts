import fs from "node:fs";
import {spawn} from "node:child_process";
import {ProviderInstaller,providerInstallSpecs} from "../src/installer/provider-installer";
import {writeWindowsInstallScript} from "../src/installer/windows-install-window";

function onceError(child:ReturnType<typeof spawn>,ms=400){
  return new Promise<Error|null>((resolve)=>{
    const timer=setTimeout(()=>resolve(null),ms);
    child.once("error",(error)=>{clearTimeout(timer);resolve(error);});
  });
}

async function main(){
  const installer=new ProviderInstaller();
  if(typeof installer.launch!=="function")throw new Error("ProviderInstaller.launch missing");

  if(process.platform==="win32"){
    const safe=spawn(process.env.ComSpec||"cmd.exe",["/d","/s","/c","exit 0"],{
      detached:true,windowsHide:true,stdio:"ignore",shell:false
    });
    const safeError=await onceError(safe);
    safe.unref();
    if(safeError)throw safeError;

    const bad=spawn("powershell.exe",["-NoProfile","-Command","exit 0"],{
      detached:true,windowsHide:false,stdio:"ignore"
    });
    const badError=await onceError(bad,250);
    try{bad.kill();}catch{}
    if(badError&&!/EINVAL/i.test(String(badError))){
      throw new Error(`unexpected old-spawn error: ${badError.message}`);
    }
  }

  if(!providerInstallSpecs.grok?.script?.some(line=>/x\.ai\/cli\/install\.ps1/.test(line))){
    throw new Error("Grok CLI installer script missing");
  }
  const script=writeWindowsInstallScript("Grok CLI",providerInstallSpecs.grok.script||[]);
  const text=fs.readFileSync(script,"utf8");
  if(!text.includes("irm https://x.ai/cli/install.ps1 | iex"))throw new Error("Grok install script body missing irm");
  if(/\r?\nstart /.test(text))throw new Error("install script should not call cmd start");

  console.log("Provider installer smoke PASS");
}

main().catch((error)=>{
  console.error(error);
  process.exit(1);
});
