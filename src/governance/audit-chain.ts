import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

export type AuditChainEntry={
  sequence:number;
  timestamp:string;
  actor:string;
  action:string;
  payload:Record<string,unknown>;
  previousHash:string;
  hash:string;
};

export class GovernanceAuditChain{
  private file(projectPath:string){return path.join(projectPath,".ai-kit","governance","audit-chain.jsonl");}

  list(projectPath:string):AuditChainEntry[]{
    const file=this.file(projectPath);
    if(!fs.existsSync(file))return [];
    return fs.readFileSync(file,"utf8").split(/\r?\n/).filter(Boolean).map(x=>JSON.parse(x));
  }

  append(projectPath:string,actor:string,action:string,payload:Record<string,unknown>){
    const rows=this.list(projectPath);
    const previousHash=rows.at(-1)?.hash||"GENESIS";
    const sequence=rows.length+1,timestamp=new Date().toISOString();
    const canonical=JSON.stringify({sequence,timestamp,actor,action,payload,previousHash});
    const hash=crypto.createHash("sha256").update(canonical).digest("hex");
    const row:AuditChainEntry={sequence,timestamp,actor,action,payload,previousHash,hash};
    const file=this.file(projectPath);
    fs.mkdirSync(path.dirname(file),{recursive:true});
    fs.appendFileSync(file,JSON.stringify(row)+"\n","utf8");
    return row;
  }

  verify(projectPath:string){
    const rows=this.list(projectPath);
    let previous="GENESIS";
    for(const row of rows){
      if(row.previousHash!==previous)return {ok:false,sequence:row.sequence,reason:"previous hash mismatch"};
      const canonical=JSON.stringify({
        sequence:row.sequence,timestamp:row.timestamp,actor:row.actor,action:row.action,payload:row.payload,previousHash:row.previousHash
      });
      const expected=crypto.createHash("sha256").update(canonical).digest("hex");
      if(expected!==row.hash)return {ok:false,sequence:row.sequence,reason:"entry hash mismatch"};
      previous=row.hash;
    }
    return {ok:true,count:rows.length,head:previous};
  }
}
