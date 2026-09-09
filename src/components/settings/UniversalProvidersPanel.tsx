"use client";

import {useMemo,useState} from "react";
import {getOfficeSocket,sendOffice} from "@/hooks/useOfficeSocket";
import {useWhenOfficeConnected} from "@/hooks/useWhenOfficeConnected";
import {useOfficeI18n} from "@/i18n/officeI18n";

type Row={
  id:string;
  manifest:{
    name:string;
    transport:string;
    capabilities:Record<string,boolean>;
    credentialEnv?:string;
  };
  configured:boolean;
  detected:boolean;
  health:{available:boolean;latencyMs:number|null;detail:string|null}|null;
  models:string[];
  lastError:string|null;
};

export function UniversalProvidersPanel(){
  const {t}=useOfficeI18n();
  const [rows,setRows]=useState<Row[]>([]);
  const [route,setRoute]=useState<any>(null);
  const [loading,setLoading]=useState(false);

  const refresh=()=>{
    setLoading(true);
    sendOffice({action:"get_universal_providers"});
  };

  useWhenOfficeConnected(()=>{
    const socket=getOfficeSocket();
    if(!socket)return;
    const onMessage=(event:MessageEvent)=>{
      try{
        const m=JSON.parse(String(event.data));
        if(m.type==="universal_provider_runtime"){
          setRows(Array.isArray(m.data?.providers)?m.data.providers:[]);
          setLoading(false);
        }
        if(m.type==="universal_provider_route")setRoute(m.data);
      }catch{}
    };
    socket.addEventListener("message",onMessage);
    refresh();
    return()=>socket.removeEventListener("message",onMessage);
  });

  const healthy=useMemo(()=>rows.filter(x=>x.health?.available).length,[rows]);
  const configured=useMemo(()=>rows.filter(x=>x.configured).length,[rows]);

  const testRoute=()=>{
    sendOffice({action:"route_universal_provider",data:{requires:["coding","reasoning"],allowLocal:true}});
  };

  return <section className="panel universal-provider-panel" data-help="universal-provider-runtime">
    <div className="section-heading">
      <div>
        <div className="eyebrow">{t("settings.runtimeEyebrow")}</div>
        <h2>{t("settings.runtimeTitle")}</h2>
      </div>
      <span>{t("runtime.healthyCount").replace("{n}",String(healthy)).replace("{total}",String(rows.length||9))}</span>
    </div>

    <div className="office-kpis">
      <div><span>{t("runtime.providers")}</span><strong>{rows.length||9}</strong><small>{t("runtime.registered")}</small></div>
      <div><span>{t("runtime.healthy")}</span><strong>{healthy}</strong><small>{t("runtime.healthChecks")}</small></div>
      <div><span>{t("runtime.configured")}</span><strong>{configured}</strong><small>{t("runtime.credentials")}</small></div>
      <div><span>{t("runtime.routed")}</span><strong>{route?.providerId||"—"}</strong><small>{route?t("runtime.score").replace("{n}",String(route.score)):t("runtime.notTested")}</small></div>
      <div><span>{t("runtime.failover")}</span><strong>3</strong><small>{t("runtime.maxAttempts")}</small></div>
    </div>

    <div className="skills-toolbar">
      <button onClick={refresh}>{loading?t("settings.checking"):t("settings.refreshHealth")}</button>
      <button onClick={testRoute}>{t("settings.testAutoRoute")}</button>
    </div>

    <div className="provider-runtime-grid">
      {rows.map(row=><article key={row.id} className="provider-runtime-card">
        <div>
          <strong>{row.manifest.name}</strong>
          <span>{row.manifest.transport}{["anthropic","gemini","xai"].includes(row.id)?` · ${t("runtime.native")}`:""}</span>
        </div>
        <b className={row.health?.available?"ok":"muted"}>{row.health?.available?t("runtime.online"):row.configured?t("runtime.offline"):t("runtime.notConfigured")}</b>
        <small>{row.health?.detail||row.lastError||t("runtime.noHealth")}</small>
        <small>{row.models.length?t("runtime.models").replace("{n}",String(row.models.length)):t("runtime.noModels")}</small>
      </article>)}
    </div>

    <p className="muted">
      API keys are read from environment/secure runtime configuration only. This panel never renders secret values.
    </p>
  </section>;
}
