"use client";

import { useEffect, useMemo, useState } from "react";
import { useOfficeStore } from "@/store/useOfficeStore";
import { useActiveProjectState } from "@/hooks/useActiveProject";
import { sendOffice } from "@/hooks/useOfficeSocket";
import { useOfficeI18n } from "@/i18n/officeI18n";

export function SkillsHub(){
  const {t}=useOfficeI18n();
  const state=useActiveProjectState();
  const allSkills=useOfficeStore(s=>s.skillsByProject);
  const snapshot=allSkills[state.projectId];
  const [query,setQuery]=useState("");
  const [category,setCategory]=useState("all");
  const [visibleCount,setVisibleCount]=useState(36);

  const entries=snapshot?.entries??[];
  const categories=useMemo(()=>["all",...Array.from(new Set(entries.map(x=>x.category))).sort()],[entries]);
  const visible=useMemo(()=>{
    const q=query.trim().toLowerCase();
    return entries.filter(entry=>
      (category==="all"||entry.category===category) &&
      (!q||`${entry.id} ${entry.name} ${entry.agentRoles.join(" ")} ${entry.capabilities.join(" ")}`.toLowerCase().includes(q))
    );
  },[entries,query,category]);

  const connected=useOfficeStore(s=>s.connected);
  useEffect(()=>{
    if(state.projectId)sendOffice({action:"get_skills",project_id:state.projectId});
    setVisibleCount(36);
  },[state.projectId,connected]);

  const refresh=()=>{
    if(state.projectId)sendOffice({action:"get_skills",project_id:state.projectId});
  };
  const setEnabled=(skillId:string,enabled:boolean)=>{
    sendOffice({action:"set_skill_enabled",project_id:state.projectId,skill_id:skillId,enabled});
  };

  return <section className="skills-hub">
    <div className="panel skills-hero">
      <div><div className="eyebrow">{t("skills.eyebrow")}</div><h2>{t("skills.title")}</h2><p className="muted">{t("skills.hint")}</p></div>
      <div className="skills-stats">
        <div><strong>{snapshot?.total??0}</strong><span>{t("skills.total")}</span></div>
        <div><strong>{snapshot?.activeCount??0}</strong><span>{t("skills.active")}</span></div>
        <div><strong>{categories.length-1}</strong><span>{t("skills.categories")}</span></div>
        <button onClick={refresh}>{t("common.refresh")}</button>
      </div>
    </div>

    <div className="panel skills-toolbar">
      <input value={query} onChange={e=>{setQuery(e.target.value);setVisibleCount(36);}} placeholder={t("skills.search")}/>
      <div>{categories.map(c=><button className={category===c?"active":""} key={c} onClick={()=>{setCategory(c);setVisibleCount(36);}}>{c==="all"?t("skills.all"):c}</button>)}</div>
    </div>

    <div className="skills-grid">
      {visible.slice(0,visibleCount).map(skill=><article className={`panel skill-card ${skill.active?"active":""}`} key={skill.id}>
        <div className="skill-card-head"><div><strong>{skill.name}</strong><span>{skill.id}</span></div><em>{!skill.enabled?t("skills.disabled"):skill.active?t("skills.active").toUpperCase():t("skills.available")}</em></div>
        <div className="skill-tags">
          <span>{skill.category}</span>
          {skill.sources.map(source=><span key={source}>{source}</span>)}
        </div>
        <div className="skill-section"><b>{t("skills.agents")}</b><p>{skill.agentRoles.length?skill.agentRoles.join(" · "):t("skills.unassigned")}</p></div>
        <div className="skill-section"><b>{t("skills.caps")}</b><p>{skill.capabilities.length?skill.capabilities.join(" · "):"—"}</p></div>
        {skill.paths.length?<div className="skill-paths">{skill.paths.slice(0,3).map(path=><code key={path}>{path}</code>)}</div>:null}
        <div className="skill-policy-control"><span>{t("skills.policy")}</span><button className={skill.enabled?"enabled":"disabled"} onClick={()=>setEnabled(skill.id,!skill.enabled)}>{skill.enabled?t("skills.enabled"):t("skills.disabledState")}</button></div>
      </article>)}
      {!visible.length?<div className="panel muted">{t("skills.empty")}</div>:null}
      {visible.length>visibleCount?<div className="panel skills-more"><button onClick={()=>setVisibleCount(n=>n+36)}>{t("skills.more").replace("{n}",String(visible.length-visibleCount))}</button></div>:null}
    </div>
  </section>;
}
