"use client";
import {useMemo} from "react";
import {useCollaborationStore} from "@/store/useCollaborationStore";
import {useOfficeI18n} from "@/i18n/officeI18n";

export function TaskDagPanel(){
  const {t}=useOfficeI18n();
  const tasks=useCollaborationStore(s=>s.tasks);

  const levels=useMemo(()=>{
    const byId=new Map(tasks.map(t=>[t.id,t]));
    const memo=new Map<string,number>();
    const depth=(id:string,seen=new Set<string>()):number=>{
      if(memo.has(id))return memo.get(id)!;
      if(seen.has(id))return 0;
      seen.add(id);
      const t:any=byId.get(id);
      const deps:any[]=t?.dependsOn||t?.dependencies||[];
      const d=deps.length?1+Math.max(...deps.map(x=>depth(String(x),new Set(seen)))):0;
      memo.set(id,d);return d;
    };
    const grouped=new Map<number,any[]>();
    for(const t of tasks){const d=depth(String(t.id));grouped.set(d,[...(grouped.get(d)||[]),t]);}
    return [...grouped.entries()].sort((a,b)=>a[0]-b[0]);
  },[tasks]);

  return <section className="panel">
    <div className="section-heading"><div><div className="eyebrow">{t("dag.eyebrow")}</div><h2>{t("dag.title")}</h2></div></div>
    <div className="task-dag">
      {levels.map(([level,rows])=><div key={level} className="task-dag-level">
        {rows.map((t:any)=><article key={t.id}><strong>{t.title||t.id}</strong><small>{t.role||t.owner||"unassigned"}</small><span>{t.status||"unknown"}</span></article>)}
      </div>)}
      {!tasks.length?<div className="workspace-empty">{t("dag.none")}</div>:null}
    </div>
  </section>;
}