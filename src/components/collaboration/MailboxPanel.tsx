"use client";
import {useOfficeI18n} from "@/i18n/officeI18n";
import {useState} from "react";
import {useOfficeStore} from "@/store/useOfficeStore";
import {useCollaborationStore} from "@/store/useCollaborationStore";
import {sendOffice} from "@/hooks/useOfficeSocket";

const send=sendOffice;

export function MailboxPanel(){const{t}=useOfficeI18n();
  const projectId=useOfficeStore(s=>s.activeProjectId);
  const messages=useCollaborationStore(s=>s.messages);
  const [to,setTo]=useState("qa");
  const [subject,setSubject]=useState("");
  const [body,setBody]=useState("");

  const submit=()=>{
    if(!projectId||!subject.trim()||!body.trim())return;
    send({action:"collaboration_message",project_id:projectId,from_agent_id:"director",to_agent_id:to,subject,body});
    setSubject("");setBody("");
    window.setTimeout(()=>send({action:"collaboration_snapshot",project_id:projectId}),200);
  };

  return <section className="panel mailbox-panel">
    <div className="section-heading"><div><div className="eyebrow">{t("collab.mailbox").toUpperCase()}</div><h2>{t("collab.mailboxSubtitle")}</h2></div><span>{t("collab.unread").replace("{n}",String(messages.filter(x=>!x.readAt).length))}</span></div>
    <div className="mail-compose">
      <input value={to} onChange={e=>setTo(e.target.value)} placeholder={t("collab.toAgent")}/>
      <input value={subject} onChange={e=>setSubject(e.target.value)} placeholder={t("collab.subject")}/>
      <textarea value={body} onChange={e=>setBody(e.target.value)} placeholder={t("collab.message")}/>
      <button onClick={submit}>{t("collab.send")}</button>
    </div>
    <div className="mail-list">
      {messages.slice(-10).reverse().map(m=><article key={m.id}>
        <strong>{m.fromAgentId} → {m.toAgentId}</strong><span>{m.subject}</span><p>{m.body}</p>
        {!m.readAt&&projectId?<button onClick={()=>send({action:"collaboration_mark_read",project_id:projectId,message_id:m.id})}>{t("collab.markRead")}</button>:null}
      </article>)}
      {!messages.length?<div className="workspace-empty">{t("collab.noMail")}</div>:null}
    </div>
  </section>;
}
