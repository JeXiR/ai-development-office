import {spawn,type ChildProcess} from "node:child_process";

export type ManagedProcess={
  name:string;
  child:ChildProcess;
};

function windowsCommand(command:string,args:string[]){
  const lower=command.toLowerCase();
  if(lower.endsWith(".cmd")||lower.endsWith(".bat")||lower==="npm"||lower==="npm.cmd"||lower==="npx"||lower==="npx.cmd"){
    const escaped=[command,...args]
      .map(part=>/[ \t"&|<>^]/.test(part)?`"${part.replace(/"/g,'\\"')}"`:part)
      .join(" ");
    return {
      command:process.env.ComSpec||"cmd.exe",
      args:["/d","/s","/c",escaped]
    };
  }
  return {command,args};
}

export class ProcessSupervisor{
  private children:ManagedProcess[]=[];
  private shuttingDown=false;

  spawn(name:string,command:string,args:string[],options:any={}){
    const resolved=process.platform==="win32"
      ? windowsCommand(command,args)
      : {command,args};

    const child=spawn(resolved.command,resolved.args,{
      cwd:options.cwd||process.cwd(),
      env:{...process.env,...(options.env||{})},
      windowsHide:false,
      stdio:options.stdio||"inherit",
      shell:false
    });

    child.once("error",error=>{
      console.error(`[${name}] spawn error:`,error);
    });

    this.children.push({name,child});
    return child;
  }

  list(){return this.children.slice();}

  async shutdown(){
    if(this.shuttingDown)return;
    this.shuttingDown=true;

    for(const {child} of this.children.slice().reverse()){
      if(child.killed)continue;
      try{
        if(process.platform==="win32"&&child.pid){
          spawn(process.env.ComSpec||"cmd.exe",[
            "/d","/s","/c",
            `taskkill /pid ${child.pid} /t /f`
          ],{windowsHide:true,stdio:"ignore"}).unref();
        }else{
          child.kill("SIGTERM");
        }
      }catch{}
    }

    await new Promise(r=>setTimeout(r,350));
    this.children=[];
  }
}
