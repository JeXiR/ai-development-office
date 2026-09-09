"use client";

import {useState} from "react";
import {getOfficeSocket,sendOffice} from "@/hooks/useOfficeSocket";
import {useWhenOfficeConnected} from "@/hooks/useWhenOfficeConnected";
import {useOfficeI18n} from "@/i18n/officeI18n";

export function AdaptiveRoutingPanel(){
  const {t}=useOfficeI18n();
  const [rows,setRows]=useState<any[]>([]);

  useWhenOfficeConnected(()=>{
    const socket=getOfficeSocket(); if(!socket)return;
    const onMessage=(event:MessageEvent)=>{
      try{
        const m=JSON.parse(String(event.data));
        if(m.type==="adaptive_routing")setRows(Array.isArray(m.data)?m.data:[]);
      }catch{}
    };
    socket.addEventListener("message",onMessage);
    sendOffice({action:"get_adaptive_routing"});
    return()=>socket.removeEventListener("message",onMessage);
  });

  return <section className="panel adaptive-routing-panel" data-help="adaptive-routing">
    <div className="section-heading">
      <div><div className="eyebrow">{t("routing.eyebrow")}</div><h2>{t("routing.title")}</h2></div>
      <span>{rows.filter(x=>x.aggregate?.count>0).length} {t("routing.learned")}</span>
    </div>
    <div className="provider-runtime-grid">
      {rows.map(row=><article key={row.providerId} className="provider-runtime-card">
        <div><strong>{row.providerId}</strong><span>{t("routing.bonus")} {row.routingBonus}</span></div>
        <small>{row.aggregate?.count||0} {t("routing.samples")}</small>
        <small>{t("routing.quality")} {(row.aggregate?.avgScore||0).toFixed(2)} · {t("routing.success")} {Math.round((row.aggregate?.successRate||0)*100)}%</small>
      </article>)}
    </div>
  </section>;
}
