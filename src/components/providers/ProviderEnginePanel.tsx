"use client";
import {useOfficeI18n} from "@/i18n/officeI18n";
import {useEffect,useState} from "react";
import {useProviderStore} from "@/store/useProviderStore";
import {sendOffice} from "@/hooks/useOfficeSocket";

const send=sendOffice;

const providerLabels:Record<string,string>={
  cursor:"Cursor",claude:"Claude",codex:"Codex",gemini:"Gemini",opencode:"OpenCode",local:"Local / OpenAI-compatible"
};

export function ProviderEnginePanel(){const{t}=useOfficeI18n();
  const health=useProviderStore(s=>s.health);
  const decision=useProviderStore(s=>s.routeDecision);
  const [task,setTask]=useState("");
  const [role,setRole]=useState("backend");
  const [preferred,setPreferred]=useState("");

  useEffect(()=>{send({action:"provider_health"});},[]);

  const route=()=>send({
    action:"provider_route",
    task,
    role,
    preferred:preferred||null,
    local_only:false
  });

  return <section className="panel provider-engine-panel">
    <div className="section-heading">
      <div><div className="eyebrow">{t("provider.title").toUpperCase()}</div><h2>{t("provider.subtitle")}</h2></div>
      <button onClick={()=>send({action:"provider_health"})}>{t("provider.refreshHealth")}</button>
    </div>

    <div className="provider-health-grid">
      {health.map(row=><article key={row.provider} className={`provider-${row.status}`}>
        <strong>{providerLabels[row.provider]||row.provider}</strong>
        <span>{row.status}</span>
        <small>{row.latencyMs===null?"—":`${row.latencyMs} ms`}</small>
        <em>{row.executable||row.message}</em>
      </article>)}
      {!health.length?<div className="workspace-empty">{t("provider.noHealth")}</div>:null}
    </div>

    <div className="provider-route-form">
      <input value={task} onChange={e=>setTask(e.target.value)} placeholder={t("common.task")}/>
      <input value={role} onChange={e=>setRole(e.target.value)} placeholder={t("autonomy.rolePlaceholder")}/>
      <select value={preferred} onChange={e=>setPreferred(e.target.value)}>
        <option value="">{t("provider.auto")}</option>
        {Object.entries(providerLabels).map(([id,label])=><option key={id} value={id}>{label}</option>)}
      </select>
      <button onClick={route}>{t("provider.routeTask")}</button>
    </div>

    {decision?<div className="provider-route-result">
      <strong>{t("provider.selected").replace("{name}",decision.selected||t("common.none"))}</strong>
      <p>{decision.reason}</p>
      <div>
        {decision.ranked.map(row=><article key={row.provider}>
          <b>{providerLabels[row.provider]||row.provider}</b>
          <span>{row.score.toFixed(1)}</span>
          <small>{row.health}</small>
          <em>{row.reasons.join(" · ")}</em>
        </article>)}
      </div>
    </div>:null}
  </section>;
}
