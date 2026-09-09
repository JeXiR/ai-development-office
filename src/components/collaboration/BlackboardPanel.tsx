"use client";
import {useOfficeI18n} from "@/i18n/officeI18n";
import {useState} from "react";
import {useOfficeStore} from "@/store/useOfficeStore";
import {useCollaborationStore} from "@/store/useCollaborationStore";
import {sendOffice} from "@/hooks/useOfficeSocket";

const send=sendOffice;

export function BlackboardPanel(){const{t}=useOfficeI18n();
  const projectId=useOfficeStore(s=>s.activeProjectId);
  const rows=useCollaborationStore(s=>s.blackboard);
  const [title,setTitle]=useState("");
  const [body,setBody]=useState("");

  const add=()=>{
    if(!projectId||!title.trim()||!body.trim())return;
    send({action:"collaboration_blackboard",project_id:projectId,author_agent_id:"director",category:"note",title,body});
    setTitle("");setBody("");
    window.setTimeout(()=>send({action:"collaboration_snapshot",project_id:projectId}),200);
  };

  return <section className="panel blackboard-panel">
    <div className="section-heading"><div><div className="eyebrow">{t("collab.blackboard").toUpperCase()}</div><h2>{t("collab.blackboardSubtitle")}</h2></div><span>{t("collab.entries").replace("{n}",String(rows.length))}</span></div>
    <div className="blackboard-compose">
      <input value={title} onChange={e=>setTitle(e.target.value)} placeholder={t("collab.titlePh")}/>
      <textarea value={body} onChange={e=>setBody(e.target.value)} placeholder={t("collab.notePh")}/>
      <button onClick={add}>{t("collab.post")}</button>
    </div>
    <div className="blackboard-list">
      {rows.slice(-12).reverse().map(row=><article key={row.id}><strong>{row.title}</strong><small>{row.category} · {row.authorAgentId}</small><p>{row.body}</p></article>)}
      {!rows.length?<div className="workspace-empty">{t("collab.emptyBoard")}</div>:null}
    </div>
  </section>;
}
