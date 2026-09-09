"use client";
import {useState} from "react";
import {useOfficeI18n} from "@/i18n/officeI18n";
import {sendOffice} from "@/hooks/useOfficeSocket";
import {useWhenOfficeConnected} from "@/hooks/useWhenOfficeConnected";

type Row={id:string;label:string;required:boolean;installed:boolean;version:string|null;installHint:string};
const send=sendOffice;

export function PrerequisitesPanel(){
  const {t}=useOfficeI18n();
  const [rows,setRows]=useState<Row[]>([]);

  useWhenOfficeConnected(()=>{
    const h=(e:Event)=>{
      const d=(e as CustomEvent).detail;
      if(d?.type==="prerequisites")setRows(Array.isArray(d.data)?d.data:[]);
    };
    window.addEventListener("office-bridge-message",h as EventListener);
    send({action:"prerequisites_check"});
    return()=>window.removeEventListener("office-bridge-message",h as EventListener);
  });

  return <section className="panel">
    <div className="section-heading">
      <div><div className="eyebrow">{t("prereq.title").toUpperCase()}</div><h2>{t("prereq.subtitle")}</h2></div>
      <button onClick={()=>send({action:"prerequisites_check"})}>{t("prereq.recheck")}</button>
    </div>
    <div className="prereq-list">{rows.map(r=><article key={r.id}>
      <div><strong>{r.label}</strong><small>{r.version||r.installHint}</small></div>
      <span>{r.installed?t("common.detected"):t("common.missing")}</span>
      {!r.installed?<button onClick={()=>send({action:"prerequisite_install",id:r.id})}>{t("common.install")}</button>:null}
    </article>)}</div>
  </section>;
}
