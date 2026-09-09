"use client";
import {useState} from "react";
import {useOfficeStore} from "@/store/useOfficeStore";
import {useIntegrationStore} from "@/store/useIntegrationStore";
import {sendOffice} from "@/hooks/useOfficeSocket";
import {useOfficeI18n} from "@/i18n/officeI18n";
import {useWhenOfficeConnected} from "@/hooks/useWhenOfficeConnected";
const send=sendOffice;

export function IntegrationsPanel(){
  const {t}=useOfficeI18n();
  const projectId=useOfficeStore(s=>s.activeProjectId);
  const configs=useIntegrationStore(s=>s.configs);
  const status=useIntegrationStore(s=>s.status);
  const mcp=useIntegrationStore(s=>s.mcpServers);
  const [mcpId,setMcpId]=useState("filesystem");
  const [mcpCommand,setMcpCommand]=useState("npx");

  const refresh=()=>projectId&&send({action:"integrations_snapshot",project_id:projectId});
  useWhenOfficeConnected(()=>{refresh();},[projectId]);

  return <section className="panel">
    <div className="section-heading"><div><div className="eyebrow">{t("integrations.eyebrow")}</div><h2>{t("integrations.title")}</h2></div><button onClick={refresh}>{t("common.refresh")}</button></div>
    <div className="integration-grid">
      {configs.map(cfg=>{const st=status.find(x=>x.id===cfg.id);return <article key={cfg.id}>
        <strong>{cfg.label}</strong><small>{st?.configured?t("integrations.configured"):t("integrations.notConfigured")} · {cfg.enabled?"enabled":"disabled"}</small>
        <input defaultValue={cfg.endpoint||""} placeholder={t("integrations.endpoint")} onBlur={e=>projectId&&send({action:"integration_update",project_id:projectId,id:cfg.id,enabled:cfg.enabled,endpoint:e.currentTarget.value||null,token_env:cfg.tokenEnv})}/>
        <div><button onClick={()=>projectId&&send({action:"integration_update",project_id:projectId,id:cfg.id,enabled:!cfg.enabled,endpoint:cfg.endpoint,token_env:cfg.tokenEnv})}>{cfg.enabled?t("integrations.disable"):t("integrations.enable")}</button>{cfg.endpoint?<button onClick={()=>projectId&&send({action:"integration_test_webhook",project_id:projectId,id:cfg.id})}>{t("integrations.test")}</button>:null}</div>
      </article>})}
    </div>
    <div className="mcp-manager">
      <strong>{t("integrations.mcp")}</strong>
      <div><input value={mcpId} onChange={e=>setMcpId(e.target.value)} placeholder={t("integrations.idPlaceholder")}/><input value={mcpCommand} onChange={e=>setMcpCommand(e.target.value)} placeholder={t("integrations.commandPlaceholder")}/><button onClick={()=>projectId&&send({action:"mcp_upsert",project_id:projectId,id:mcpId,command:mcpCommand,args:[],env:{},enabled:true})}>{t("integrations.addUpdate")}</button></div>
      {mcp.map(s=><article key={s.id}><b>{s.id}</b><span>{s.command} {s.args.join(" ")}</span><button onClick={()=>projectId&&send({action:"mcp_remove",project_id:projectId,id:s.id})}>{t("common.remove")}</button></article>)}
    </div>
  </section>;
}