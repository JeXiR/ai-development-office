"use client";

import {useState} from "react";
import {getOfficeSocket,sendOffice} from "@/hooks/useOfficeSocket";
import {useWhenOfficeConnected} from "@/hooks/useWhenOfficeConnected";
import {useOfficeI18n} from "@/i18n/officeI18n";

export function DesktopRuntimePanel(){
  const {t}=useOfficeI18n();
  const [status,setStatus]=useState<any>(null);

  useWhenOfficeConnected(()=>{
    const socket=getOfficeSocket(); if(!socket)return;
    const onMessage=(event:MessageEvent)=>{
      try{
        const m=JSON.parse(String(event.data));
        if(m.type==="desktop_runtime_status")setStatus(m.data);
      }catch{}
    };
    socket.addEventListener("message",onMessage);
    sendOffice({action:"get_desktop_runtime_status"});
    return()=>socket.removeEventListener("message",onMessage);
  });

  return <section className="panel desktop-runtime-panel" data-help="desktop-runtime">
    <div className="section-heading">
      <div>
        <div className="eyebrow">{t("desktop.eyebrow")}</div>
        <h2>{t("desktop.title")}</h2>
      </div>
      <span>{status?.ready?t("common.ready"):t("common.unknown")}</span>
    </div>

    <div className="desktop-runtime-grid">
      <div><small>{t("desktop.bridge")}</small><strong>{status?.bridgeUrl||"—"}</strong></div>
      <div><small>{t("desktop.web")}</small><strong>{status?.webUrl||"—"}</strong></div>
      <div><small>{t("desktop.kit")}</small><strong>{status?.kitVersion||"—"}</strong></div>
      <div><small>{t("desktop.project")}</small><strong>{status?.projectPath||t("desktop.noProject")}</strong></div>
    </div>

    <p className="muted">
      {t("desktop.hint")}
    </p>
  </section>;
}
