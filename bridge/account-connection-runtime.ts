import {AccountConnectionRuntime} from "../src/auth-connections/runtime";
import type {AuthConnectionId} from "../src/auth-connections/types";

let runtime:AccountConnectionRuntime|null=null;
export function getAccountConnectionRuntime(){
  if(!runtime)runtime=new AccountConnectionRuntime();
  return runtime;
}
export async function accountConnectionSnapshot(){return getAccountConnectionRuntime().state();}
export function launchAccountLogin(id:string){return getAccountConnectionRuntime().launchLogin(id as AuthConnectionId);}
export async function accountConnectionStatus(id:string){return getAccountConnectionRuntime().status(id as AuthConnectionId);}
