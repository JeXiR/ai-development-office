import fs from "node:fs";
import path from "node:path";
import {spawn} from "node:child_process";
import {decideOperationPolicy} from "../security/operation-policy";

const BLOCKED_COMMANDS=[
  /\brm\s+-rf\b/i,
  /\bdel\s+\/[sq]\b/i,
  /\bformat\b/i,
  /\bshutdown\b/i,
  /\bmkfs\b/i,
  /\bgit\s+reset\s+--hard\b/i,
  /\bgit\s+push\b.*--force\b/i,
  /\bnpm\s+publish\b/i,
  /\bdrop\s+database\b/i,
  /\btruncate\b/i
];

export function validateProjectCommand(command:string){
  if(!command.trim())throw new Error("Command is empty.");
  for(const pattern of BLOCKED_COMMANDS)if(pattern.test(command))throw new Error(`Blocked destructive command: ${pattern}`);
  const policy=decideOperationPolicy(command);
  if(policy.blocked)throw new Error(`Blocked command by security policy: ${policy.reasons.join("; ")}`);
  return policy;
}

export function runProjectCommand(projectRoot:string,command:string,timeoutMs=120000,maxOutputBytes=2*1024*1024){
  validateProjectCommand(command);
  return new Promise<{code:number|null;stdout:string;stderr:string;timedOut:boolean}>((resolve,reject)=>{
    const shell=process.platform==="win32"?"cmd.exe":"/bin/sh";
    const args=process.platform==="win32"?["/d","/s","/c",command]:["-lc",command];
    const child=spawn(shell,args,{cwd:projectRoot,windowsHide:true,env:process.env});
    let stdout="",stderr="",done=false;

    const cap=(current:string,next:Buffer|string)=>{
      if(Buffer.byteLength(current)>=maxOutputBytes)return current;
      const joined=current+String(next);
      return Buffer.byteLength(joined)>maxOutputBytes?Buffer.from(joined).subarray(0,maxOutputBytes).toString():joined;
    };

    child.stdout?.on("data",d=>stdout=cap(stdout,d));
    child.stderr?.on("data",d=>stderr=cap(stderr,d));
    child.on("error",reject);

    const timer=setTimeout(()=>{
      if(done)return;
      try{child.kill();}catch{}
      resolve({code:null,stdout,stderr,timedOut:true});
    },timeoutMs);

    child.on("exit",code=>{
      done=true; clearTimeout(timer);
      resolve({code,stdout,stderr,timedOut:false});
    });
  });
}

export function detectTestCommand(projectRoot:string){
  const pkg=path.join(projectRoot,"package.json");
  if(fs.existsSync(pkg)){
    try{
      const parsed=JSON.parse(fs.readFileSync(pkg,"utf8"));
      if(parsed?.scripts?.test)return "npm test -- --runInBand";
      if(parsed?.scripts?.["test:unit"])return "npm run test:unit";
      if(parsed?.scripts?.typecheck)return "npm run typecheck";
    }catch{}
  }
  if(fs.existsSync(path.join(projectRoot,"artisan")))return "php artisan test";
  if(fs.existsSync(path.join(projectRoot,"pytest.ini"))||fs.existsSync(path.join(projectRoot,"pyproject.toml")))return "pytest";
  if(fs.existsSync(path.join(projectRoot,"pubspec.yaml")))return "flutter test";
  return null;
}
