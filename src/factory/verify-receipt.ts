import fs from "node:fs";
import path from "node:path";
import {atomicWriteJson} from "../recovery/atomic-write";

export type VerifyReceipt={
  itemId:string;
  implementer:string;
  verifier:string;
  ok:boolean;
  command:string;
  exitCode:number|null;
  evidence:string;
  createdAt:string;
};

function fileOf(projectPath:string){
  return path.join(projectPath,".ai-kit","factory","receipts.json");
}

export function listReceipts(projectPath:string):VerifyReceipt[]{
  try{
    const parsed=JSON.parse(fs.readFileSync(fileOf(projectPath),"utf8"));
    return Array.isArray(parsed)?parsed:[];
  }catch{
    return [];
  }
}

export function writeReceipt(projectPath:string, receipt:VerifyReceipt){
  const rows=listReceipts(projectPath).filter(row=>row.itemId!==receipt.itemId);
  rows.push(receipt);
  atomicWriteJson(fileOf(projectPath), rows.slice(-400));
  return receipt;
}

export function receiptFor(projectPath:string, itemId:string){
  return listReceipts(projectPath).find(row=>row.itemId===itemId)||null;
}

export function parseVerifyVerdict(text:string):"pass"|"fail"|"unknown"{
  const body=String(text||"");
  if(/\bVERDICT\s*:\s*FAIL\b|\bVERIFY\s*FAIL\b|\bBLOCKED\b/i.test(body))return "fail";
  if(/\bVERDICT\s*:\s*PASS\b|\bVERIFY\s*PASS\b|\bVERIFIED\b/i.test(body))return "pass";
  return "unknown";
}

export function evaluateReceipt(receipt:VerifyReceipt|null, implementer?:string){
  if(!receipt)return {ok:false, reason:"No independent verify receipt."};
  if(implementer&&receipt.verifier===implementer){
    return {ok:false, reason:"Verifier cannot be the same role that implemented the work."};
  }
  if(!receipt.ok)return {ok:false, reason:receipt.evidence||"Independent verify failed."};
  if(!String(receipt.evidence||"").trim())return {ok:false, reason:"Receipt has no evidence."};
  if(receipt.command==="queue-verifier"||receipt.command==="skipped"){
    return {ok:true, reason:null as string|null};
  }
  const verdict=parseVerifyVerdict(receipt.evidence);
  if(verdict==="fail")return {ok:false, reason:"Independent verifier returned FAIL."};
  if(verdict==="pass")return {ok:true, reason:null};
  return {ok:false, reason:"Receipt needs an explicit VERDICT: PASS."};
}
