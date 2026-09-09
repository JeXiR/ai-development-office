import {spawn} from "node:child_process";

export function openExternal(url:string){
  try{
    if(process.platform==="win32"){
      spawn("cmd",["/c","start","",url],{detached:true,windowsHide:true,stdio:"ignore"}).unref();
      return true;
    }
    if(process.platform==="darwin"){
      spawn("open",[url],{detached:true,stdio:"ignore"}).unref();
      return true;
    }
    spawn("xdg-open",[url],{detached:true,stdio:"ignore"}).unref();
    return true;
  }catch{return false;}
}
