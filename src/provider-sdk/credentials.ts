import fs from "node:fs";
import path from "node:path";
import {spawnSync} from "node:child_process";

export type ProviderCredentialRecord={
  providerId:string;
  encrypted:string;
  mode:"windows-dpapi"|"development-obfuscation";
  updatedAt:string;
};

function xor(text:string,key:string){
  const bytes=Buffer.from(text,"utf8");
  const k=Buffer.from(key||"office","utf8");
  const out=Buffer.alloc(bytes.length);
  for(let i=0;i<bytes.length;i++)out[i]=bytes[i]^k[i%k.length];
  return out.toString("base64");
}
function xorDecode(text:string,key:string){
  const bytes=Buffer.from(text,"base64");
  const k=Buffer.from(key||"office","utf8");
  const out=Buffer.alloc(bytes.length);
  for(let i=0;i<bytes.length;i++)out[i]=bytes[i]^k[i%k.length];
  return out.toString("utf8");
}

function powershellDpapi(mode:"encrypt"|"decrypt",value:string){
  // Windows PowerShell 5.1 may not expose ProtectedData directly in all hosts.
  // ConvertFrom-SecureString / ConvertTo-SecureString use CurrentUser DPAPI on Windows
  // when no explicit key is supplied, and keep the secret off the command line.
  const script=mode==="encrypt"
    ? `$v=[Console]::In.ReadToEnd();$s=ConvertTo-SecureString $v -AsPlainText -Force;ConvertFrom-SecureString $s`
    : `$v=[Console]::In.ReadToEnd();$s=ConvertTo-SecureString $v;$b=[Runtime.InteropServices.Marshal]::SecureStringToBSTR($s);try{[Runtime.InteropServices.Marshal]::PtrToStringBSTR($b)}finally{[Runtime.InteropServices.Marshal]::ZeroFreeBSTR($b)}`;

  const result=spawnSync("powershell.exe",["-NoProfile","-NonInteractive","-Command",script],{
    input:value,
    encoding:"utf8",
    windowsHide:true,
    maxBuffer:1024*1024
  });
  if(result.status!==0)throw new Error(String(result.stderr||"DPAPI PowerShell failure").trim());
  const output=String(result.stdout||"").trim();
  if(!output)throw new Error("DPAPI PowerShell returned empty output.");
  return output;
}

export class SecureProviderCredentialStore{
  constructor(private readonly dataDir:string){}
  private file(){return path.join(this.dataDir,"provider-credentials.secure.json");}
  private readAll():ProviderCredentialRecord[]{
    try{return JSON.parse(fs.readFileSync(this.file(),"utf8"))||[];}catch{return [];}
  }
  private writeAll(rows:ProviderCredentialRecord[]){
    fs.mkdirSync(this.dataDir,{recursive:true});
    fs.writeFileSync(this.file(),JSON.stringify(rows,null,2)+"\n","utf8");
  }

  set(providerId:string,secret:string){
    if(!secret)throw new Error("Credential secret is empty.");
    let encrypted:string,mode:ProviderCredentialRecord["mode"];
    if(process.platform==="win32"){
      encrypted=powershellDpapi("encrypt",secret);
      mode="windows-dpapi";
    }else{
      // Development-only fallback. Not represented as secure storage.
      encrypted=xor(secret,process.env.USER||process.env.USERNAME||"office");
      mode="development-obfuscation";
    }
    const rows=this.readAll().filter(x=>x.providerId!==providerId);
    rows.push({providerId,encrypted,mode,updatedAt:new Date().toISOString()});
    this.writeAll(rows);
  }

  get(providerId:string){
    const row=this.readAll().find(x=>x.providerId===providerId);
    if(!row)return null;
    if(row.mode==="windows-dpapi"){
      if(process.platform!=="win32")throw new Error("Windows DPAPI credential cannot be decrypted on this platform.");
      return powershellDpapi("decrypt",row.encrypted);
    }
    return xorDecode(row.encrypted,process.env.USER||process.env.USERNAME||"office");
  }

  has(providerId:string){
    return this.readAll().some(x=>x.providerId===providerId);
  }

  remove(providerId:string){
    const rows=this.readAll().filter(x=>x.providerId!==providerId);
    this.writeAll(rows);
  }

  delete(providerId:string){
    this.remove(providerId);
  }

  mode(providerId:string){
    return this.readAll().find(x=>x.providerId===providerId)?.mode??null;
  }

  updatedAt(providerId:string){
    return this.readAll().find(x=>x.providerId===providerId)?.updatedAt??null;
  }

  snapshot(){
    return this.readAll().map(x=>({
      providerId:x.providerId,
      present:true,
      mode:x.mode,
      updatedAt:x.updatedAt
    }));
  }
}
