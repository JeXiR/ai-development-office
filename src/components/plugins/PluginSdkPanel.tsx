"use client";
import {useState} from "react";
import {useOfficeI18n} from "@/i18n/officeI18n";
import {useOfficeStore} from "@/store/useOfficeStore";
import {usePluginV2Store} from "@/store/usePluginV2Store";
import {sendOffice} from "@/hooks/useOfficeSocket";
import {useWhenOfficeConnected} from "@/hooks/useWhenOfficeConnected";

const send=sendOffice;

export function PluginSdkPanel(){
  const {t}=useOfficeI18n();
  const projectId=useOfficeStore(s=>s.activeProjectId);
  const state=usePluginV2Store();
  const [hook,setHook]=useState("tool.invoke");
  const [payload,setPayload]=useState('{"message":"hello"}');

  useWhenOfficeConnected(()=>{if(projectId)send({action:"plugin_v2_snapshot",project_id:projectId});},[projectId]);

  return <section className="panel">
    <div className="section-heading">
      <div><div className="eyebrow">{t("plugins.sdkEyebrow")}</div><h2>{t("plugins.sdkTitle")}</h2></div>
      <button onClick={()=>projectId&&send({action:"plugin_v2_snapshot",project_id:projectId})}>{t("common.refresh")}</button>
    </div>

    <div className="plugin-sdk-grid">
      {state.manifests.map((m:any)=>{
        const runtime=state.states.find((x:any)=>x.id===m.id);
        return <article key={m.id}>
          <div><strong>{m.name}</strong><small>{m.version} · API {m.apiVersion}</small><span>{m.permissions.join(" · ")}</span></div>
          <em>{runtime?.status||t("common.unknown")} · {t("plugins.failures").replace("{n}",String(runtime?.failureCount||0))}</em>
          <button onClick={()=>projectId&&send({action:"plugin_v2_enable",project_id:projectId,plugin_id:m.id,enabled:!runtime?.enabled})}>{runtime?.enabled?t("plugins.disable"):t("plugins.enable")}</button>
        </article>;
      })}
    </div>

    <div className="plugin-contributions">
      <article><strong>{t("plugins.providers")}</strong><span>{state.contributions.providers.map((x:any)=>x.label).join(" · ")||"—"}</span></article>
      <article><strong>{t("plugins.tools")}</strong><span>{state.contributions.tools.map((x:any)=>x.label).join(" · ")||"—"}</span></article>
      <article><strong>{t("plugins.triggers")}</strong><span>{state.contributions.triggers.map((x:any)=>x.label).join(" · ")||"—"}</span></article>
      <article><strong>{t("plugins.panels")}</strong><span>{state.contributions.panels.map((x:any)=>x.title).join(" · ")||"—"}</span></article>
    </div>

    <div className="plugin-invoke-row">
      <select value={hook} onChange={e=>setHook(e.target.value)}>
        <option value="office.start">office.start</option><option value="runtime.event">runtime.event</option>
        <option value="mission.before">mission.before</option><option value="mission.after">mission.after</option>
        <option value="ledger.entry">ledger.entry</option><option value="project.changed">project.changed</option>
        <option value="provider.route">provider.route</option><option value="tool.invoke">tool.invoke</option><option value="trigger.fire">trigger.fire</option>
      </select>
      <input value={payload} onChange={e=>setPayload(e.target.value)} />
      <button onClick={()=>{let parsed={};try{parsed=JSON.parse(payload);}catch{};projectId&&send({action:"plugin_v2_invoke",project_id:projectId,hook,payload:parsed,actor:"user"});}}>{t("plugins.invoke")}</button>
    </div>

    <div className="plugin-results">
      {state.lastResult.map((r:any,i)=><article key={`${r.pluginId}-${i}`}><strong>{r.pluginId}</strong><span>{r.ok?"ok":"failed"} · {r.durationMs}ms</span><small>{r.error||JSON.stringify(r.data)}</small></article>)}
    </div>
  </section>;
}
