"use client";

import {useState} from "react";
import {getOfficeSocket, sendOffice} from "@/hooks/useOfficeSocket";
import {useWhenOfficeConnected} from "@/hooks/useWhenOfficeConnected";
import {useOfficeI18n} from "@/i18n/officeI18n";

type Row={
  providerId:string;
  providerName:string;
  present:boolean;
  source:"secure-store"|"environment"|"none";
  storageMode:string;
  updatedAt:string|null;
  envName:string|null;
};

const secretProviders=["openai","anthropic","gemini","xai","groq","openai-compatible"];

export function ProviderCredentialsPanel(){
  const {t}=useOfficeI18n();
  const [rows,setRows]=useState<Row[]>([]);
  const [values,setValues]=useState<Record<string,string>>({});
  const [test,setTest]=useState<any>(null);

  const send=(action:string,data?:any)=>{sendOffice({action,data});};

  useWhenOfficeConnected(()=>{
    const socket=getOfficeSocket(); if(!socket)return;
    const onMessage=(event:MessageEvent)=>{
      try{
        const m=JSON.parse(String(event.data));
        if(m.type==="provider_credentials")setRows(Array.isArray(m.data)?m.data:[]);
        if(m.type==="provider_connection_test")setTest(m.data);
      }catch{}
    };
    socket.addEventListener("message",onMessage);
    send("get_provider_credentials");
    return()=>socket.removeEventListener("message",onMessage);
  });

  return <section className="panel provider-credentials-panel" data-help="provider-credentials">
    <div className="section-heading">
      <div>
        <div className="eyebrow">{t("credentials.eyebrow")}</div>
        <h2>{t("credentials.title")}</h2>
      </div>
      <span>{rows.filter(x=>x.present).length} {t("credentials.configured")}</span>
    </div>

    <p className="muted">
      {t("credentials.hint")}
    </p>

    <div className="provider-credential-grid">
      {secretProviders.map(providerId=>{
        const row=rows.find(x=>x.providerId===providerId);
        return <article key={providerId} className="provider-credential-card">
          <div>
            <strong>{row?.providerName||providerId}</strong>
            <span>{row?.present?`${row.source} · ${row.storageMode}`:t("credentials.notConfigured")}</span>
          </div>
          <input
            type="password"
            autoComplete="new-password"
            placeholder={row?.present?"••••••••••••":t("credentials.enter")}
            value={values[providerId]||""}
            onChange={e=>setValues(v=>({...v,[providerId]:e.target.value}))}
          />
          <div className="skills-toolbar">
            <button disabled={!values[providerId]} onClick={()=>{
              send("save_provider_credential",{providerId,value:values[providerId]});
              setValues(v=>({...v,[providerId]:""}));
            }}>{t("credentials.save")}</button>
            <button onClick={()=>send("test_provider_connection",{providerId})}>{t("credentials.test")}</button>
            <button disabled={!row?.present} onClick={()=>send("delete_provider_credential",{providerId})}>{t("credentials.remove")}</button>
          </div>
        </article>;
      })}
    </div>

    {test?<div className="provider-route-evidence">
      <strong>{t("credentials.connectionTest")} · {test.providerId}</strong>
      <span>{test.health?.available?t("credentials.online"):t("credentials.offline")}</span>
      <small>{test.health?.detail||test.lastError||t("credentials.noDetails")}</small>
      <code>{Array.isArray(test.models)&&test.models.length?t("credentials.models").replace("{count}",String(test.models.length)):t("credentials.noModels")}</code>
    </div>:null}
  </section>;
}
