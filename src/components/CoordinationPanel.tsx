"use client";

import {useEffect,useState} from "react";
import {useOfficeStore} from "@/store/useOfficeStore";
import {useCoordinationStore} from "@/store/useCoordinationStore";
import {sendOffice} from "@/hooks/useOfficeSocket";
import {useOfficeI18n} from "@/i18n/officeI18n";
import type {ToolNode} from "@/observability/tool-tree";

function kindLabel(t:(key:string)=>string, kind:string){
  const key=`coord.kind.${kind}`;
  const label=t(key);
  return label===key?kind:label;
}

function ToolBranch({nodes, t}:{nodes:ToolNode[];t:(key:string)=>string}){
  if(!nodes.length)return null;
  return <ol className="coord-tree">
    {nodes.slice(-8).map(node=><li key={node.id} className={`is-${node.status}`}>
      <i className={`chip chip-${node.kind}`}>{kindLabel(t, node.kind)}</i>
      <b>{node.name}</b>
      <em>{node.agentId}</em>
      {node.children.length?<ToolBranch nodes={node.children} t={t}/>:null}
    </li>)}
  </ol>;
}

export function CoordinationPanel(){
  const {t}=useOfficeI18n();
  const projectId=useOfficeStore(s=>s.activeProjectId);
  const leases=useCoordinationStore(s=>s.leases);
  const receipts=useCoordinationStore(s=>s.receipts);
  const lastAsk=useCoordinationStore(s=>s.lastAsk);
  const mcpId=useCoordinationStore(s=>s.mcpId);
  const tools=useCoordinationStore(s=>s.tools);
  const toolTree=useCoordinationStore(s=>s.toolTree);
  const [prompt,setPrompt]=useState("");
  const [provider,setProvider]=useState("gemini");

  useEffect(()=>{
    if(projectId)sendOffice({action:"coordination_snapshot",project_id:projectId});
  },[projectId]);

  if(!projectId)return null;

  return <section className="panel coordination-panel">
    <div className="section-heading">
      <div>
        <div className="eyebrow">{t("coord.eyebrow")}</div>
        <h2>{t("coord.title")}</h2>
        <p className="muted">{t("coord.hint")}</p>
      </div>
      <div className="coord-heading-meta">
        <em className={`chip ${mcpId?"chip-ok":"chip-idle"}`}>{mcpId?t("coord.mcpOn").replace("{id}",mcpId):t("coord.mcpOff")}</em>
        <button onClick={()=>sendOffice({action:"coordination_snapshot",project_id:projectId})}>{t("common.refresh")}</button>
      </div>
    </div>

    <div className="coordination-board">
      <article className="coord-card">
        <header>
          <strong>{t("coord.leases")}</strong>
          <b>{leases.length}</b>
        </header>
        {leases.map(row=><div className="coord-row" key={row.id}>
          <code>{row.taskId}</code>
          <span>{t("coord.heldBy").replace("{agent}", row.agentId)}</span>
          <em>{row.files.filter(x=>!x.startsWith("task:")).join(", ")||row.files[0]}</em>
          <small>{t("coord.expires")} {row.expiresAt.slice(11,16)}</small>
          <button onClick={()=>sendOffice({action:"lease_release",project_id:projectId,agent_id:row.agentId,task_id:row.taskId})}>{t("coord.release")}</button>
        </div>)}
        {!leases.length?<p className="muted">{t("coord.noLeases")}</p>:null}
      </article>
      <article className="coord-card">
        <header>
          <strong>{t("coord.receipts")}</strong>
          <b>{receipts.length}</b>
        </header>
        {receipts.slice(-6).reverse().map(row=><div className={`coord-row is-${row.ok?"ok":"blocked"}`} key={row.itemId}>
          <code>{row.itemId}</code>
          <i className={`chip ${row.ok?"chip-ok":"chip-blocked"}`}>{row.ok?t("coord.passed"):t("coord.blocked")}</i>
          <em>{row.verifier}</em>
          <small>{row.evidence.slice(0,96)}</small>
        </div>)}
        {!receipts.length?<p className="muted">{t("coord.noReceipts")}</p>:null}
      </article>
      <article className="coord-card">
        <header>
          <strong>{t("coord.consult")}</strong>
        </header>
        <div className="coord-consult">
          <select value={provider} onChange={e=>setProvider(e.target.value)}>
            <option value="claude">Claude</option>
            <option value="codex">Codex</option>
            <option value="gemini">Gemini</option>
            <option value="cursor">Cursor</option>
            <option value="grok">Grok</option>
          </select>
          <input value={prompt} onChange={e=>setPrompt(e.target.value)} placeholder={t("coord.consultPlaceholder")}/>
          <button disabled={!prompt.trim()} onClick={()=>sendOffice({action:"ask_cli",project_id:projectId,provider,prompt})}>{t("coord.ask")}</button>
        </div>
        {lastAsk?<small className={lastAsk.ok?"chip-ok":"chip-blocked"}>{lastAsk.provider}: {lastAsk.ok?t("coord.passed"):t("coord.blocked")}</small>:null}
      </article>
      <article className="coord-card coord-tools">
        <header>
          <strong>{t("coord.tools")}</strong>
          <b>{tools.length}</b>
        </header>
        {toolTree.length?<ToolBranch nodes={toolTree} t={t}/>:tools.slice(-8).reverse().map(row=><div className={`coord-row is-${row.status}`} key={row.id}>
          <i className={`chip chip-${row.kind}`}>{kindLabel(t, row.kind)}</i>
          <b>{row.name}</b>
          <em>{row.agentId}</em>
        </div>)}
        {!tools.length?<p className="muted">{t("coord.noTools")}</p>:null}
      </article>
    </div>
  </section>;
}
