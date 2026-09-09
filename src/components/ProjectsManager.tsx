"use client";

import { FormEvent, useState } from "react";
import { useOfficeStore } from "@/store/useOfficeStore";
import { sendOffice } from "@/hooks/useOfficeSocket";
import { useOfficeI18n } from "@/i18n/officeI18n";

const send=sendOffice;

export function ProjectsManager(){
  const {t}=useOfficeI18n();
  const projects=useOfficeStore(s=>s.projects);
  const activeProjectId=useOfficeStore(s=>s.activeProjectId);
  const selectProject=useOfficeStore(s=>s.selectProject);
  const [path,setPath]=useState("");
  const [name,setName]=useState("");
  const [message,setMessage]=useState("");

  const submit=(e:FormEvent)=>{
    e.preventDefault();
    if(!path.trim()){setMessage(t("projects.pathRequired"));return;}
    if(!send({action:"add_project",path:path.trim(),name:name.trim()||null})){setMessage(t("projects.offline"));return;}
    setMessage(t("projects.sent"));
    setPath("");setName("");
  };

  const remove=(id:string,label:string)=>{
    if(!window.confirm(t("projects.removeConfirm").replace("{label}",label)))return;
    send({action:"remove_project",project_id:id});
  };

  return <section className="projects-manager">
    <div className="panel projects-add-panel">
      <div className="section-heading"><div><div className="eyebrow">{t("projects.eyebrow")}</div><h2>{t("projects.title")}</h2><p className="muted">{t("projects.hint")}</p></div><strong>{t("projects.registeredCount").replace("{n}",String(projects.filter(p=>p.enabled).length))}</strong></div>
      <form onSubmit={submit} className="projects-inline-form">
        <label><span>{t("projects.path")}</span><input value={path} onChange={e=>setPath(e.target.value)} placeholder={"D:\\Projects\\project-two"}/></label>
        <label><span>{t("switcher.name")} <em>{t("common.optional")}</em></span><input value={name} onChange={e=>setName(e.target.value)} placeholder="CallMe"/></label>
        <button className="primary-btn" type="submit">{t("projects.add")}</button>
      </form>
      {message?<div className="form-message">{message}</div>:null}
    </div>

    <div className="projects-grid">
      {projects.filter(p=>p.enabled).map(project=><article className={`panel project-manage-card ${project.id===activeProjectId?"active":""}`} key={project.id}>
        <div className="project-manage-head"><div><i/><strong>{project.name}</strong><span>{project.id===activeProjectId?t("projects.active"):t("projects.registered")}</span></div><b>{project.provider||"auto"}</b></div>
        <code>{project.path}</code>
        <div className="project-manage-stats"><span>{t("projects.provider")} <b>{project.provider||"auto"}</b></span><span>{t("projects.workspace")} <b>{project.runnerTrusted?t("projects.trusted"):t("projects.locked")}</b></span></div>
        <div className="project-manage-controls">
          <button onClick={()=>selectProject(project.id)} disabled={project.id===activeProjectId}>{project.id===activeProjectId?t("projects.selected"):t("projects.open")}</button>
          <select value={project.provider||"auto"} onChange={e=>send({action:"set_project_provider",project_id:project.id,provider:e.target.value})}>
            <option value="auto">auto</option><option value="cursor">Cursor</option><option value="claude">Claude</option>
          </select>
          <button onClick={()=>send({action:"set_project_trust",project_id:project.id,trusted:!project.runnerTrusted})}>{project.runnerTrusted?t("projects.lock"):t("projects.trust")}</button>
          <button className="danger-soft" onClick={()=>remove(project.id,project.name)}>{t("common.remove")}</button>
        </div>
      </article>)}
      {projects.filter(p=>p.enabled).length===0?<div className="panel muted">{t("projects.none")}</div>:null}
    </div>
  </section>;
}
