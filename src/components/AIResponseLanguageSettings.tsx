"use client";

import { useEffect, useMemo, useState } from "react";
import { useOfficeStore } from "@/store/useOfficeStore";
import { sendOffice } from "@/hooks/useOfficeSocket";
import { useOfficeI18n } from "@/i18n/officeI18n";

const LANGUAGES=[
  {value:"tr",label:"Türkçe"},
  {value:"en",label:"English"},
  {value:"de",label:"Deutsch"},
  {value:"ru",label:"Русский"},
  {value:"auto",label:"Auto"}
];

const send=sendOffice;

export function AIResponseLanguageSettings(){
  const {t}=useOfficeI18n();
  const projectId=useOfficeStore(s=>s.activeProjectId);
  const stored=useOfficeStore(s=>projectId?s.projectResponseLanguages[projectId]:undefined);
  const [value,setValue]=useState(stored||"en");
  const [saved,setSaved]=useState(false);

  useEffect(()=>{
    if(projectId)send({action:"get_project_response_language",project_id:projectId});
  },[projectId]);

  useEffect(()=>{if(stored)setValue(stored);},[stored]);

  const label=useMemo(()=>LANGUAGES.find(x=>x.value===value)?.label||value,[value]);

  const change=(next:string)=>{
    setValue(next);
    setSaved(false);
    if(!projectId)return;
    if(send({action:"set_project_response_language",project_id:projectId,response_language:next})){
      setSaved(true);
      window.setTimeout(()=>setSaved(false),1800);
    }
  };

  return <section className="panel ai-language-settings">
    <div className="section-heading">
      <div>
        <div className="eyebrow">{t("ai_response_language")}</div>
        <h2>{t("ai_responses_title")}</h2>
        <p>{t("ai_responses_desc")}</p>
      </div>
      <div className="ai-language-control">
        <select value={value} onChange={e=>change(e.target.value)} disabled={!projectId}>
          {LANGUAGES.map(item=><option key={item.value} value={item.value}>{item.label}</option>)}
        </select>
        <span>{saved?`${t("saved")} · ${label}`:`${t("current")} · ${label}`}</span>
      </div>
    </div>
    <small>{t("ai_code_note")}</small>
  </section>;
}
