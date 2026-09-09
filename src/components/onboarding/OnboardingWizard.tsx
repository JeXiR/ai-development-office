"use client";

import {useEffect,useState} from "react";
import {useOfficeI18n} from "@/i18n/officeI18n";
import {sendOffice} from "@/hooks/useOfficeSocket";
import {useOfficeStore} from "@/store/useOfficeStore";

type Row={id:string;label:string;required:boolean;installed:boolean;version:string|null;installHint:string};

const STORAGE_KEY="office-onboarding-complete";
const send=sendOffice;

function localDone(){
  if(typeof window==="undefined")return false;
  return window.localStorage.getItem(STORAGE_KEY)==="1";
}

function persistLocal(){
  if(typeof window==="undefined")return;
  window.localStorage.setItem(STORAGE_KEY,"1");
}

export function OnboardingWizard(){
  const {t,language,setLanguage}=useOfficeI18n();
  const projects=useOfficeStore(s=>s.projects);
  const [open,setOpen]=useState(false);
  const [step,setStep]=useState(0);
  const [rows,setRows]=useState<Row[]>([]);
  const [projectPath,setProjectPath]=useState("");
  const [name,setName]=useState("");
  const [trusted,setTrusted]=useState(true);

  const markComplete=()=>{
    persistLocal();
    send({action:"set_onboarding_complete",complete:true});
    setOpen(false);
  };

  useEffect(()=>{
    if(localDone()||projects.length>0){
      persistLocal();
      if(projects.length>0)send({action:"set_onboarding_complete",complete:true});
      setOpen(false);
      return;
    }
    setOpen(true);
  },[projects.length]);

  useEffect(()=>{
    const reopen=()=>{setStep(0);setOpen(true);};
    const onBridge=(e:Event)=>{
      const d=(e as CustomEvent).detail;
      if(d?.type==="prerequisites")setRows(Array.isArray(d.data)?d.data:[]);
      if(d?.type==="project_folder_selected"&&d.data?.path)setProjectPath(String(d.data.path));
      if(d?.type==="onboarding"&&d.data?.complete){
        persistLocal();
        setOpen(false);
      }
    };
    window.addEventListener("office-open-onboarding",reopen);
    window.addEventListener("office-bridge-message",onBridge as EventListener);
    return()=>{
      window.removeEventListener("office-open-onboarding",reopen);
      window.removeEventListener("office-bridge-message",onBridge as EventListener);
    };
  },[]);

  if(!open)return null;

  const register=()=>{
    if(!projectPath.trim())return;
    send({action:"add_project",path:projectPath.trim(),name:name.trim()||null});
    setTimeout(()=>send({action:"get_projects"}),250);
  };

  return <div className="onboarding-backdrop">
    <section className="onboarding-wizard">
      <header>
        <strong>{t("onboarding.title")}</strong>
        <span>{t("onboarding.subtitle")}</span>
      </header>
      <nav>
        {[t("onboarding.language"),t("onboarding.prerequisites"),t("onboarding.project"),t("onboarding.finish")].map((label,i)=>(
          <b key={label} className={step===i?"active":step>i?"done":""}>{i+1}. {label}</b>
        ))}
      </nav>
      <div className="onboarding-body">
        {step===0?<div className="onboarding-card">
          <select value={language} onChange={e=>setLanguage(e.target.value as any)}>
            <option value="tr">Türkçe</option>
            <option value="en">English</option>
            <option value="de">Deutsch</option>
            <option value="ru">Русский</option>
          </select>
        </div>:null}
        {step===1?<div className="onboarding-card">
          <div className="section-heading">
            <div>
              <h3>{t("prereq.title")}</h3>
              <p>{t("prereq.subtitle")}</p>
            </div>
            <button onClick={()=>send({action:"prerequisites_check"})}>{t("prereq.recheck")}</button>
          </div>
          <div className="prereq-list">{rows.map(r=>(
            <article key={r.id}>
              <div>
                <strong>{r.label}</strong>
                <small>{r.version||r.installHint}</small>
              </div>
              <span>{r.installed?t("common.detected"):t("common.missing")}</span>
              {!r.installed?<button onClick={()=>send({action:"prerequisite_install",id:r.id})}>{t("common.install")}</button>:null}
            </article>
          ))}</div>
        </div>:null}
        {step===2?<div className="onboarding-card">
          <h3>{t("projectSetup.title")}</h3>
          <p>{t("projectSetup.subtitle")}</p>
          <div className="project-path-row">
            <input value={projectPath} onChange={e=>setProjectPath(e.target.value)} placeholder={t("projectSetup.path")}/>
            <button type="button" onClick={()=>send({action:"choose_project_folder"})}>Browse…</button>
          </div>
          <input value={name} onChange={e=>setName(e.target.value)} placeholder={t("projectSetup.name")}/>
          <label>
            <input type="checkbox" checked={trusted} onChange={e=>setTrusted(e.target.checked)}/>
            {t("projectSetup.trusted")}
          </label>
          <button disabled={!projectPath.trim()} onClick={register}>{t("projectSetup.register")}</button>
        </div>:null}
        {step===3?<div className="onboarding-card">
          <h3>{t("onboarding.complete")}</h3>
          <p>{t("onboarding.readyHint")}</p>
        </div>:null}
      </div>
      <footer>
        <button type="button" onClick={markComplete}>{t("onboarding.skip")}</button>
        <button disabled={step===0} onClick={()=>setStep(x=>Math.max(0,x-1))}>{t("common.back")}</button>
        {step<3
          ?<button onClick={()=>{
            persistLocal();
            send({action:"set_onboarding_complete",complete:true});
            if(step===0)send({action:"prerequisites_check"});
            setStep(x=>Math.min(3,x+1));
          }}>{t("common.next")}</button>
          :<button onClick={markComplete}>{t("common.finish")}</button>}
      </footer>
    </section>
  </div>;
}
