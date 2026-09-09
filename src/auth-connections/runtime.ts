import {spawn} from "node:child_process";
import {AUTH_CONNECTION_MANIFESTS} from "./manifests";
import {commandAvailable,commandCandidates} from "../provider-sdk/shell";
import type {AuthConnectionId,AuthConnectionState} from "./types";

function run(command:string,args:string[],timeout=7000){
  return new Promise<{ok:boolean,text:string}>((resolve)=>{
    const cmd=commandCandidates(command)[0];
    if(!cmd)return resolve({ok:false,text:"CLI not installed"});
    const child=spawn(cmd,args,{windowsHide:true,stdio:["ignore","pipe","pipe"]});
    let text="";
    const timer=setTimeout(()=>{try{child.kill();}catch{};resolve({ok:false,text:text||"status timeout"});},timeout);
    child.stdout?.on("data",d=>text+=String(d));
    child.stderr?.on("data",d=>text+=String(d));
    child.on("exit",code=>{clearTimeout(timer);resolve({ok:code===0,text:text.trim()});});
    child.on("error",err=>{clearTimeout(timer);resolve({ok:false,text:String(err.message||err)});});
  });
}

export class AccountConnectionRuntime{
  manifests(){return AUTH_CONNECTION_MANIFESTS.slice();}

  async state():Promise<AuthConnectionState[]>{
    const rows:AuthConnectionState[]=[];
    for(const manifest of this.manifests()){
      const installed=await commandAvailable(manifest.command);
      let authenticated=false,statusText=installed?"installed":"CLI not installed";
      if(installed&&manifest.statusArgs.length){
        const status=await run(manifest.command,manifest.statusArgs);
        authenticated=status.ok;
        statusText=status.text||statusText;
      }
      rows.push({
        id:manifest.id,
        name:manifest.name,
        installed,
        authenticated,
        statusText,
        preferredMode:manifest.preferredMode,
        apiFallback:manifest.apiFallback,
        accountUsageNotes:manifest.accountUsageNotes
      });
    }
    return rows;
  }

  launchLogin(id:AuthConnectionId){
    const manifest=this.manifests().find(x=>x.id===id);
    if(!manifest)throw new Error("Unknown auth connection.");
    const cmd=commandCandidates(manifest.command)[0];
    if(!cmd)throw new Error(`${manifest.name} CLI is not installed.`);

    // Browser/account flows are intentionally launched in a detached interactive window.
    const args=manifest.loginArgs;
    const child=spawn(cmd,args,{
      detached:true,
      windowsHide:false,
      stdio:"ignore",
      shell:false
    });
    child.unref();
    return {ok:true,id:manifest.id,name:manifest.name};
  }

  async status(id:AuthConnectionId){
    return (await this.state()).find(x=>x.id===id)||null;
  }
}
