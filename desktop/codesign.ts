import {spawnSync} from "node:child_process";
import fs from "node:fs";
import path from "node:path";

export type CodesignStatus={
  platform:string;
  configured:boolean;
  identity:string|null;
  timestampUrl:string|null;
  tool:string|null;
  signed:boolean;
  reason:string;
  files:string[];
};

function certPath(){
  return String(process.env.OFFICE_CODESIGN_CERT||"").trim();
}
function identity(){
  return String(process.env.OFFICE_CODESIGN_IDENTITY||"").trim();
}
function timestampUrl(){
  return String(process.env.OFFICE_CODESIGN_TIMESTAMP||"").trim()||null;
}

export function codesignConfigured(){
  if(process.platform==="win32")return Boolean(certPath());
  if(process.platform==="darwin")return Boolean(identity());
  return false;
}

export function codesignStatus(signed=false, files:string[]=[], reason?:string):CodesignStatus{
  const configured=codesignConfigured();
  return {
    platform:process.platform,
    configured,
    identity:process.platform==="darwin"?identity()||null:(certPath()?path.basename(certPath()):null),
    timestampUrl:timestampUrl(),
    tool:process.platform==="win32"?"signtool":process.platform==="darwin"?"codesign":null,
    signed,
    reason:reason||(configured
      ?"Certificate configured. package:desktop / install-office will sign when the tool is on PATH."
      :"No certificate. Bundle stays unsigned (SmartScreen / Gatekeeper). Set OFFICE_CODESIGN_CERT or OFFICE_CODESIGN_IDENTITY."),
    files
  };
}

function signWindows(file:string){
  const cert=certPath();
  const args=["sign","/fd","SHA256"];
  if(fs.existsSync(cert)){
    args.push("/f",cert);
    if(process.env.OFFICE_CODESIGN_PASSWORD)args.push("/p",String(process.env.OFFICE_CODESIGN_PASSWORD));
  }else{
    args.push("/a");
    if(cert)args.push("/sha1",cert);
  }
  const stamp=timestampUrl();
  if(stamp)args.push("/tr",stamp,"/td","SHA256");
  args.push(file);
  const r=spawnSync("signtool",args,{encoding:"utf8",windowsHide:true});
  return {ok:r.status===0, error:String(r.stderr||r.stdout||"signtool failed")};
}

function signDarwin(target:string){
  const r=spawnSync("codesign",["--deep","--force","--sign",identity(),target],{encoding:"utf8"});
  return {ok:r.status===0, error:String(r.stderr||r.stdout||"codesign failed")};
}

export function signDesktopBundle(bundleDir:string):CodesignStatus{
  if(!codesignConfigured())return codesignStatus(false,[],undefined);
  const files:string[]=[];
  if(process.platform==="win32"){
    for(const name of ["office-launch.cmd","office-desktop.cmd","office.cmd"]){
      const file=path.join(bundleDir,name);
      if(!fs.existsSync(file))continue;
      const signed=signWindows(file);
      if(!signed.ok)return codesignStatus(false,files,signed.error);
      files.push(file);
    }
    if(!files.length)return codesignStatus(false,[],"No Windows launcher to sign.");
    return codesignStatus(true,files,"Signed with signtool.");
  }
  if(process.platform==="darwin"){
    if(!fs.existsSync(bundleDir))return codesignStatus(false,[],"Desktop bundle folder missing.");
    const signed=signDarwin(bundleDir);
    if(!signed.ok)return codesignStatus(false,[],signed.error);
    return codesignStatus(true,[bundleDir],"Signed with codesign.");
  }
  return codesignStatus(false,[],"Codesign is not implemented on this platform.");
}

export function codesignGuide(){
  return `# Codesign

Unsigned builds are expected until a certificate is configured. Office will not pretend a bundle is signed.

Windows:
  set OFFICE_CODESIGN_CERT=path-to.pfx   (or a certificate thumbprint)
  set OFFICE_CODESIGN_PASSWORD=...       (if the PFX is protected)
  set OFFICE_CODESIGN_TIMESTAMP=http://timestamp.digicert.com
  npm run package:desktop

macOS:
  export OFFICE_CODESIGN_IDENTITY="Developer ID Application: ..."
  npm run package:desktop

Linux stays unsigned. SmartScreen / Gatekeeper warnings are expected without a real cert.
`;
}
