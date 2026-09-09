import {spawn} from "node:child_process";
import {ProviderInstaller} from "../src/installer/provider-installer";

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

  console.log("Provider installer smoke PASS");
}

main().catch((error)=>{
  console.error(error);
  process.exit(1);
});
