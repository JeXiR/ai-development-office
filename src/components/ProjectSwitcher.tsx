"use client";

import { FormEvent, useState } from "react";
import { sendOffice } from "@/hooks/useOfficeSocket";
import { useOfficeStore } from "@/store/useOfficeStore";
import { useOfficeI18n } from "@/i18n/officeI18n";
import { ViewportModal } from "./ViewportModal";

export function ProjectSwitcher() {
  const {t}=useOfficeI18n();
  const projects=useOfficeStore(s=>s.projects);
  const activeProjectId=useOfficeStore(s=>s.activeProjectId);
  const selectProject=useOfficeStore(s=>s.selectProject);
  const [open,setOpen]=useState(false);
  const [path,setPath]=useState("");
  const [name,setName]=useState("");
  const [message,setMessage]=useState("");

  const enabled=projects.filter(p=>p.enabled);
  const send=sendOffice;

  const submit=(event:FormEvent)=>{
    event.preventDefault();
    if(!path.trim()){setMessage(t("switcher.pathRequired"));return;}
    if(!send({action:"add_project",path:path.trim(),name:name.trim()||null})){
      setMessage(t("switcher.offline"));return;
    }
    setMessage(t("switcher.added"));
    setPath("");setName("");
    setTimeout(()=>setOpen(false),250);
  };

  return <>
    <div className="compact-project-switcher">
      <select
        value={activeProjectId??""}
        onChange={e=>selectProject(e.target.value)}
        aria-label={t("switcher.active")}
      >
        {enabled.length===0?<option value="">{t("switcher.none")}</option>:enabled.map(project=>
          <option value={project.id} key={project.id}>{project.name}</option>
        )}
      </select>
      <span>{t("switcher.count").replace("{n}",String(enabled.length))}</span>
      <button type="button" onClick={()=>{setMessage("");setOpen(true)}} title={t("switcher.addTitle")}>＋</button>
    </div>

    {open?<ViewportModal onClose={()=>setOpen(false)} width={620} height={520}>
      <div className="modal-head">
        <div><div className="eyebrow">{t("switcher.eyebrow")}</div><h2>{t("switcher.title")}</h2><div className="muted">{t("switcher.hint")}</div></div>
        <button className="modal-close" onClick={()=>setOpen(false)}>×</button>
      </div>
      <form onSubmit={submit} className="project-form">
        <label><span>{t("switcher.path")}</span><input value={path} onChange={e=>setPath(e.target.value)} placeholder={"D:\\Projects\\my-project"} autoFocus/></label>
        <label><span>{t("switcher.name")} <em>{t("common.optional")}</em></span><input value={name} onChange={e=>setName(e.target.value)} placeholder="CallMe"/></label>
        {message?<div className="form-message">{message}</div>:null}
        <div className="modal-actions"><button type="button" className="secondary-btn" onClick={()=>setOpen(false)}>{t("common.cancel")}</button><button className="primary-btn" type="submit">{t("projects.add")}</button></div>
      </form>
    </ViewportModal>:null}
  </>;
}
