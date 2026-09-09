"use client";
import {useEffect,useId,useState} from "react";
import {useOfficeStore} from "@/store/useOfficeStore";
import {useMemoryV2Store} from "@/store/useMemoryV2Store";
import {sendOffice} from "@/hooks/useOfficeSocket";
import {useOfficeI18n} from "@/i18n/officeI18n";

const send=sendOffice;

export function MemoryV2Panel(){
  const {t}=useOfficeI18n();
  const projectId=useOfficeStore(s=>s.activeProjectId);
  const state=useMemoryV2Store();
  const categoryId=useId();
  const [title,setTitle]=useState("Architecture rule");
  const [body,setBody]=useState("Keep tenant boundaries explicit and test cross-tenant access.");
  const [query,setQuery]=useState("tenant architecture security");
  const [agentId,setAgentId]=useState("");
  const [category,setCategory]=useState("architecture");

  useEffect(()=>{if(projectId)send({action:"memory_v2_snapshot",project_id:projectId});},[projectId]);

  return <section className="panel">
    <div className="section-heading">
      <div><div className="eyebrow">{t("memory.eyebrow")}</div><h2>{t("memory.title")}</h2></div>
      <div><button onClick={()=>projectId&&send({action:"memory_v2_snapshot",project_id:projectId})}>{t("common.refresh")}</button><button onClick={()=>projectId&&send({action:"memory_v2_prune",project_id:projectId})}>{t("memory.prune")}</button></div>
    </div>

    <div className="memoryv2-compose">
      <input value={title} onChange={e=>setTitle(e.target.value)} />
      <select id={categoryId} value={category} onChange={e=>setCategory(e.target.value)}>
        <option value="architecture">{t("memory.architecture")}</option><option value="decision">{t("memory.decision")}</option><option value="lesson">{t("memory.lesson")}</option><option value="fact">{t("memory.fact")}</option><option value="warning">{t("memory.warning")}</option><option value="handoff">{t("memory.handoff")}</option><option value="specialization">{t("memory.specialization")}</option>
      </select>
      <textarea value={body} onChange={e=>setBody(e.target.value)} />
      <button onClick={()=>{projectId&&send({action:"memory_v2_add",project_id:projectId,category,scope:"shared",title,body,tags:["architecture","tenant"],importance:.8,confidence:.9,source_type:"user",actor:"user"});}}>{t("memory.add")}</button>
    </div>

    <div className="memory-search-row">
      <input value={query} onChange={e=>setQuery(e.target.value)} />
      <input value={agentId} onChange={e=>setAgentId(e.target.value)} placeholder={t("memory.agentPlaceholder")}/>
      <button onClick={()=>projectId&&send({action:"memory_v2_search",project_id:projectId,query,agent_id:agentId||null,limit:12})}>{t("memory.semanticSearch")}</button>
      <button onClick={()=>projectId&&agentId&&send({action:"memory_v2_specialties",project_id:projectId,agent_id:agentId})}>{t("memory.specialties")}</button>
    </div>

    <div className="memory-hit-list">
      {state.hits.map(hit=><article key={hit.record.id}><div><strong>{hit.record.title}</strong><small>{hit.record.category} · {hit.record.scope} · {hit.record.provenance.sourceType}</small><p>{hit.record.body}</p></div><span>{hit.score.toFixed(3)}</span></article>)}
    </div>

    <div className="memory-specialties">
      {state.specialties.map(s=><span key={s.tag}>{s.tag} {s.score}</span>)}
    </div>

    <div className="memory-record-grid">
      {state.records.slice(-20).reverse().map(r=><article key={r.id}><strong>{r.title}</strong><small>{r.category} · importance {r.importance.toFixed(2)} · confidence {r.confidence.toFixed(2)}</small><span>{r.tags.join(" · ")}</span></article>)}
    </div>
  </section>;
}