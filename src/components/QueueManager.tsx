"use client";

import { useMemo, useState } from "react";
import { useActiveProjectQueue } from "@/hooks/useActiveProject";
import { useOfficeStore } from "@/store/useOfficeStore";
import { sendOffice } from "@/hooks/useOfficeSocket";
import { useOfficeI18n } from "@/i18n/officeI18n";

const send=sendOffice;

const cancellable=new Set(["queued","waiting_for_agent","plan_ready"]);

export function QueueManager(){
  const {t}=useOfficeI18n();
  const queue=useActiveProjectQueue();
  const projectId=useOfficeStore(s=>s.activeProjectId);
  const [selected,setSelected]=useState<string[]>([]);

  const rows=useMemo(()=>queue.filter(item=>cancellable.has(item.status)),[queue]);
  const selectedSet=new Set(selected.filter(id=>rows.some(row=>row.id===id)));
  const allSelected=rows.length>0&&rows.every(row=>selectedSet.has(row.id));
  const activeCount=queue.filter(x=>["running","planning","verifying"].includes(x.status)).length;

  const toggle=(id:string)=>setSelected(current=>current.includes(id)?current.filter(x=>x!==id):[...current,id]);

  const cancelSelected=()=>{
    if(!projectId||selectedSet.size===0)return;
    if(!confirm(t("tasks.cancelSelectedConfirm").replace("{n}",String(selectedSet.size))))return;
    send({action:"cancel_commands",project_id:projectId,command_ids:[...selectedSet]});
    setSelected([]);
  };

  const cancelAll=()=>{
    if(!projectId||rows.length===0)return;
    if(!confirm(t("tasks.cancelAllConfirm").replace("{n}",String(rows.length))))return;
    send({action:"cancel_all_queued",project_id:projectId});
    setSelected([]);
  };

  const clearStale=()=>{
    if(!projectId)return;
    if(!confirm(t("tasks.clearStaleConfirm")))return;
    send({action:"clear_stale_queue",project_id:projectId});
    setSelected([]);
  };

  return <section className="panel queue-manager">
    <div className="section-heading">
      <div>
        <div className="eyebrow">{t("tasks.queueEyebrow")}</div>
        <h2>{t("tasks.queueTitle")}</h2>
        <p>{t("tasks.queueStats").replace("{n}",String(rows.length)).replace("{active}",String(activeCount))}</p>
      </div>
      <div className="queue-manager-actions">
        <button disabled={!selectedSet.size} onClick={cancelSelected}>{t("queue.cancelSelected")}</button>
        <button disabled={!rows.length} onClick={cancelAll}>{t("queue.cancelAll")}</button>
        <button disabled={!rows.length} onClick={clearStale}>{t("queue.clearStale")}</button>
      </div>
    </div>
    {!rows.length?<div className="empty-inline">{t("tasks.queueEmpty")}</div>:
      <div className="queue-manager-table">
        <div className="queue-manager-row head">
          <span><input type="checkbox" checked={allSelected} onChange={()=>setSelected(allSelected?[]:rows.map(row=>row.id))}/></span>
          <span>{t("tasks.colTask")}</span><span>{t("tasks.colStatus")}</span><span>{t("tasks.colRole")}</span><span>{t("tasks.colBlocked")}</span><span>{t("tasks.colAction")}</span>
        </div>
        {rows.map(item=><div className="queue-manager-row" key={item.id}>
          <span><input type="checkbox" checked={selectedSet.has(item.id)} onChange={()=>toggle(item.id)}/></span>
          <div><strong>{item.workItemId||item.findingId||item.command}</strong><small>{item.workItemTitle||item.findingTitle||item.command}</small></div>
          <b className={`queue-status queue-${item.status}`}>{item.status}</b>
          <span>{item.assignedRole||item.executionLane||"—"}</span>
          <span>{item.blockedBy?.length??0}</span>
          <button onClick={()=>send({action:"cancel_command",command_id:item.id})}>{t("tasks.cancel")}</button>
        </div>)}
      </div>
    }
    <small className="queue-manager-note">{t("tasks.queueNote")}</small>
  </section>;
}
