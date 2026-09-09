import fs from "node:fs";
import path from "node:path";

export type ApprovalInboxItem={
  id:string;
  missionId:string;
  goal:string;
  risk:string;
  reasons:string[];
  status:"pending"|"approved"|"rejected";
  createdAt:string;
  decidedAt:string|null;
};

export class ApprovalInboxStore{
  constructor(private readonly dataDir:string){}
  private file(){return path.join(this.dataDir,"approval-inbox.json");}
  private readAll():ApprovalInboxItem[]{
    try{return JSON.parse(fs.readFileSync(this.file(),"utf8"))||[];}catch{return [];}
  }
  private writeAll(rows:ApprovalInboxItem[]){
    fs.mkdirSync(this.dataDir,{recursive:true});
    fs.writeFileSync(this.file(),JSON.stringify(rows,null,2)+"\n","utf8");
  }
  add(item:ApprovalInboxItem){
    const rows=this.readAll().filter(x=>x.id!==item.id);
    rows.push(item); this.writeAll(rows); return item;
  }
  list(){return this.readAll();}
  decide(id:string,status:"approved"|"rejected"){
    const rows=this.readAll().map(x=>x.id===id?{...x,status,decidedAt:new Date().toISOString()}:x);
    this.writeAll(rows);
    return rows.find(x=>x.id===id)||null;
  }
}
