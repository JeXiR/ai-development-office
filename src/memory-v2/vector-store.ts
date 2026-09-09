import fs from "node:fs";
import path from "node:path";
import {atomicWriteJson} from "@/recovery/atomic-write";

export type VectorRow={
  id:string;
  vector:number[];
  metadata:Record<string,unknown>;
};

export interface VectorStore{
  upsert(row:VectorRow):void;
  remove(id:string):void;
  list():VectorRow[];
}

export class JsonVectorStore implements VectorStore{
  private rows=new Map<string,VectorRow>();
  constructor(private readonly file:string){this.load();}

  private load(){
    try{
      const raw=JSON.parse(fs.readFileSync(this.file,"utf8"));
      for(const row of Array.isArray(raw)?raw:[])this.rows.set(row.id,row);
    }catch{}
  }

  private persist(){
    atomicWriteJson(this.file,[...this.rows.values()]);
  }

  upsert(row:VectorRow){this.rows.set(row.id,row);this.persist();}
  remove(id:string){this.rows.delete(id);this.persist();}
  list(){return [...this.rows.values()];}
}
