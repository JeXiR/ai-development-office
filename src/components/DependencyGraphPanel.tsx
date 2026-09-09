"use client";

import { useMemo } from "react";
import { useOfficeStore } from "@/store/useOfficeStore";
import { useActiveProjectState } from "@/hooks/useActiveProject";
import { useOfficeI18n } from "@/i18n/officeI18n";

type GraphNode={
  id:string;title:string;status:string;gate:string;role:string;deps:string[];
  x:number;y:number;level:number;
};

function logicalId(c:any){return String(c.workItemId||c.findingId||c.id)}
function nodeColor(status:string,gate:string){
  if(status==="failed"||gate==="failed")return"#ef6b78";
  if(status==="completed"&&(gate==="verified"||gate==="pending_reaudit"))return"#45d6a4";
  if(["running","verifying","planning","plan_ready"].includes(status))return"#56b8ff";
  if(["queued","waiting_for_agent"].includes(status))return"#e7bd5d";
  return"#71869f";
}

export function DependencyGraphPanel(){
  const {t}=useOfficeI18n();
  const state=useActiveProjectState();
  const history=useOfficeStore(s=>s.commandHistory);

  const graph=useMemo(()=>{
    const latest=new Map<string,any>();
    for(const command of history.filter(c=>c.projectId===state.projectId&&(c.workItemId||c.findingId))){
      const id=logicalId(command);
      if(!latest.has(id)||String(command.createdAt)>String(latest.get(id).createdAt))latest.set(id,command);
    }
    const raw=[...latest.values()].slice(0,28);
    const ids=new Set(raw.map(logicalId));
    const levelMemo=new Map<string,number>();
    const visiting=new Set<string>();
    const levelOf=(id:string):number=>{
      if(levelMemo.has(id))return levelMemo.get(id)!;
      if(visiting.has(id))return 0;
      visiting.add(id);
      const command=latest.get(id);
      const deps=(command?.dependencyIds||[]).filter((dep:string)=>ids.has(dep));
      const level=deps.length?1+Math.max(...deps.map(levelOf)):0;
      visiting.delete(id);levelMemo.set(id,level);return level;
    };
    const groups=new Map<number,any[]>();
    for(const command of raw){
      const level=levelOf(logicalId(command));
      const arr=groups.get(level)||[];arr.push(command);groups.set(level,arr);
    }
    const nodes:GraphNode[]=[];
    for(const [level,commands] of groups){
      commands.forEach((c,index)=>nodes.push({
        id:logicalId(c),title:String(c.workItemTitle||c.findingTitle||c.command),
        status:c.status,gate:c.qualityGateStatus||"—",role:c.leadRole||c.assignedRole||"Governance",
        deps:(c.dependencyIds||[]).filter((dep:string)=>ids.has(dep)),
        x:30+level*235,y:30+index*92,level
      }));
    }
    const map=new Map(nodes.map(n=>[n.id,n]));
    const edges=nodes.flatMap(node=>node.deps.map(dep=>({from:map.get(dep),to:node})).filter(e=>e.from&&e.to) as Array<{from:GraphNode;to:GraphNode}>);
    return {nodes,edges,width:Math.max(760,80+(Math.max(0,...nodes.map(n=>n.level))+1)*235),height:Math.max(280,80+Math.max(1,...[...groups.values()].map(g=>g.length))*92)};
  },[history,state.projectId]);

  return <section className="panel dependency-graph-panel">
    <div className="section-heading"><div><div className="eyebrow">{t("tasks.depEyebrow")}</div><h2>{t("tasks.depTitle")}</h2></div><span className="muted">{t("tasks.depNodes").replace("{n}",String(graph.nodes.length))}</span></div>
    {!graph.nodes.length?<div className="muted graph-empty">{t("tasks.depEmpty")}</div>:
    <div className="dependency-canvas" style={{height:Math.min(620,graph.height+20)}}>
      <div className="dependency-stage" style={{width:graph.width,height:graph.height}}>
        <svg width={graph.width} height={graph.height} className="dependency-lines" aria-hidden="true">
          {graph.edges.map((edge,index)=>{
            const x1=edge.from.x+180,y1=edge.from.y+31,x2=edge.to.x,y2=edge.to.y+31,mid=(x1+x2)/2;
            return <path key={index} d={`M ${x1} ${y1} C ${mid} ${y1}, ${mid} ${y2}, ${x2} ${y2}`} fill="none" stroke="#38516b" strokeWidth="2"/>;
          })}
        </svg>
        {graph.nodes.map(node=><article className={`dependency-node dep-${node.status}`} style={{left:node.x,top:node.y,borderColor:nodeColor(node.status,node.gate)}} key={node.id}>
          <div><i style={{background:nodeColor(node.status,node.gate)}}/><strong>{node.id}</strong><span>{node.status}</span></div>
          <p>{node.title}</p>
          <small>{node.role} · {t("tasks.depGate").replace("{gate}",node.gate)}</small>
        </article>)}
      </div>
    </div>}
  </section>;
}
