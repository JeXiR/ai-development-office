import {spawnSync} from "node:child_process";

export type NpmRunResult={
  script:string;
  ok:boolean;
  status:number|null;
  error:string|null;
};

export function runNpmScript(script:string):NpmRunResult{
  const command=process.platform==="win32"?"cmd.exe":"npm";
  const args=process.platform==="win32"
    ? ["/d","/s","/c",`npm run ${script}`]
    : ["run",script];

  const result=spawnSync(command,args,{
    stdio:"inherit",
    shell:false,
    windowsHide:false,
    env:process.env
  });

  const error=result.error?String(result.error.message||result.error):null;
  const ok=!error&&result.status===0;

  if(error)console.error(`Unable to start npm script "${script}": ${error}`);
  if(!ok)console.error(`npm script "${script}" exited with status ${String(result.status)}`);

  return {script,ok,status:result.status,error};
}
