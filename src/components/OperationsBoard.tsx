"use client";

import { useMemo, useState } from "react";
import { useActiveProjectWorkbench, useActiveProjectEvents, useActiveProjectState } from "@/hooks/useActiveProject";
import { sendOffice } from "@/hooks/useOfficeSocket";
import type { OfficeWorkItem, WorkItemType } from "@/types/work";
import { ViewportModal, modalAnchorFromEvent, type ModalAnchor } from "./ViewportModal";
import { useOfficeI18n } from "@/i18n/officeI18n";

const filters:Array<"all"|WorkItemType>=["all","security","frontend","backend","test","docs","devops","database","feature"];

const send=sendOffice;

export function OperationsBoard(){
  const {t}=useOfficeI18n();
  const wb=useActiveProjectWorkbench();
  const events=useActiveProjectEvents();
  const state=useActiveProjectState();
  const [filter,setFilter]=useState<"all"|WorkItemType>("all");
  const [selected,setSelected]=useState<OfficeWorkItem|null>(null);
  const [modalAnchor,setModalAnchor]=useState<ModalAnchor|null>(null);
  const [executionMode,setExecutionMode]=useState<"solo"|"collaborative"|"competitive">("collaborative");
  const [codingCollaborators,setCodingCollaborators]=useState<string[]>([]);

  const todo=useMemo(()=>{
    const rank=(item:OfficeWorkItem)=>{
      const harvest=["frontend-audit","coverage","feature-contract"].includes(item.source);
      const sourceRank=harvest?20:item.source==="canonical-backlog"?0:item.source==="security-audit"?1:item.source==="roadmap"?2:item.source==="progress"?3:10;
      const pri={critical:0,high:1,medium:2,low:3,info:4}[item.priority]??5;
      return sourceRank*10+pri;
    };
    return wb.workItems
      .filter(x=>["todo","queued","blocked"].includes(x.status)&&(filter==="all"||x.type===filter))
      .slice()
      .sort((a,b)=>rank(a)-rank(b)||a.id.localeCompare(b.id));
  },[wb.workItems,filter]);
  const fixing=useMemo(()=>wb.workItems.filter(x=>x.status==="working"),[wb.workItems]);

  const queue=(item:OfficeWorkItem,mode:"solo"|"collaborative"|"competitive"="collaborative")=>{
    if(!window.confirm(t("tasks.assignConfirm").replace("{id}",item.id).replace("{mode}",mode).replace("{title}",item.title)))return;
    send({action:"queue_work_item",project_id:wb.projectId,item:{...item,executionMode:mode,collaboratorCodingRoles:mode==="collaborative"?codingCollaborators:[]}});
  };

  return (
    <>
      <section className="ops-3lane">
        <div className="panel ops-lane todo-lane">
          <div className="lane-head">
            <div><div className="eyebrow">{t("tasks.todoEyebrow")}</div><h2>{t("tasks.readyWork")} <span>{todo.length}</span></h2></div>
            <button className="mini-btn" onClick={()=>send({action:"queue_command",project_id:wb.projectId,command:"refresh backlog"})}>{t("queue.reaudit")}</button>
          </div>
          <div className="lane-filters">
            {filters.map(f=><button className={filter===f?"active":""} key={f} onClick={()=>setFilter(f)}>{t(`tasks.filter.${f}`)}</button>)}
          </div>
          <div className="lane-scroll">
            {todo.length===0&&<div className="muted lane-empty">{t("tasks.noTodo")}</div>}
            {todo.map(item=>(
              <article className={`ops-work-card priority-${item.priority}`} key={item.id} onClick={(event)=>{setModalAnchor(modalAnchorFromEvent(event));setExecutionMode(item.executionMode||"collaborative");setCodingCollaborators(item.collaboratorCodingRoles||[]);setSelected(item);}}>
                <div className="ops-work-top"><span className={`work-type type-${item.type}`}>{item.type}</span><span className="work-priority">{item.priority}</span></div>
                <strong>{item.id}</strong>
                <h3>{item.title}</h3>
                <div className="ops-work-meta"><span>{item.source}</span><span>{item.assignedRole||t("tasks.unassigned")}</span></div>
                {item.verificationStatus==="failed"&&<small className="work-recheck-warning">{t("tasks.recheckWarn")}</small>}
                <button onClick={(e)=>{e.stopPropagation();queue(item,"collaborative");}}>{t("queue.assignCollab")}</button>
              </article>
            ))}
          </div>
        </div>

        <div className="panel ops-lane fixing-lane">
          <div className="lane-head"><div><div className="eyebrow">{t("tasks.fixingEyebrow")}</div><h2>{t("tasks.activeWork")} <span>{fixing.length}</span></h2></div></div>
          <div className="lane-scroll">
            {fixing.length===0&&<div className="muted lane-empty">{t("tasks.noActive")}</div>}
            {fixing.map(item=>(
              <article className="ops-fixing-card" key={item.id} onClick={(event)=>{setModalAnchor(modalAnchorFromEvent(event));setExecutionMode(item.executionMode||"collaborative");setCodingCollaborators(item.collaboratorCodingRoles||[]);setSelected(item);}}>
                <div className="working-dot"/><div>
                  <strong>{item.id}</strong><span>{item.assignedRole||"CEO"} · {item.status}</span>
                  <h3>{item.title}</h3><small>{item.source}</small>
                </div>
              </article>
            ))}
          </div>
          <div className="frontend-mini">
            <div className="eyebrow">{t("tasks.frontendCoverage")}</div>
            {wb.frontendCoverage.map(c=><div className="frontend-mini-row" key={c.id}><i className={`coverage-dot coverage-${c.status}`}/><span>{c.label}</span><b>{c.status}</b></div>)}
          </div>
        </div>

        <div className="panel ops-lane events-lane">
          <div className="lane-head"><div><div className="eyebrow">{t("tasks.liveEvents")}</div><h2>{t("tasks.activityStream")} <span>{events.length}/80</span></h2></div></div>
          <div className="lane-scroll event-stream-v9">
            {events.map(event=>(
              <article className={`event-row event-${event.status}`} key={event.event_id}>
                <div className="event-row-top"><strong>{event.actor.role}</strong><span>{event.event_type}</span><time>{new Date(event.timestamp).toLocaleTimeString()}</time></div>
                <p>{event.message??event.task??event.file??t("tasks.activity")}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {selected&&(
        <ViewportModal onClose={()=>setSelected(null)} anchor={modalAnchor} width={780} height={680} className="work-detail-modal">
            <div className="modal-head"><div><div className="eyebrow">{selected.type} · {selected.priority}</div><h2>{selected.id} · {selected.title}</h2></div><button className="modal-close" onClick={()=>setSelected(null)}>×</button></div>
            <div className="work-detail-grid">
              <div><span>{t("tasks.colStatus")}</span><strong>{selected.status}</strong></div>
              <div><span>{t("tasks.source")}</span><strong>{selected.source}</strong></div>
              <div><span>{t("tasks.lead")}</span><strong>{selected.leadRole||selected.assignedRole||"—"}</strong></div>
              <div><span>{t("tasks.sourceFile")}</span><strong>{selected.sourceFile||"—"}</strong></div>
            </div>
            <div className="work-collaborators"><span>{t("tasks.collaborators")}</span><strong>{selected.collaboratorRoles?.length?selected.collaboratorRoles.join(" · "):t("tasks.noneAssigned")}</strong></div>
            {executionMode==="collaborative"?<div className="coding-collaborator-picker">
              <span>{t("tasks.codingCollabs")}</span>
              <div>
                {state.agents
                  .filter(agent=>agent.role!==(selected.leadRole||selected.assignedRole)&&!["CEO","CTO","PM","Architect"].includes(String(agent.role)))
                  .map(agent=>{
                    const role=String(agent.role);
                    const active=codingCollaborators.includes(role);
                    return <button key={agent.id} className={active?"active":""} onClick={()=>setCodingCollaborators(current=>active?current.filter(x=>x!==role):[...current,role])}>
                      <strong>{role}</strong><small>{active?t("tasks.writesIsolated"):t("tasks.reviewOnly")}</small>
                    </button>;
                  })}
              </div>
              <p>{t("tasks.codingHint")}</p>
            </div>:null}
            <div className="execution-mode-picker">
              <span>{t("tasks.execMode")}</span>
              <div>
                {(["solo","collaborative","competitive"] as const).map(mode=><button key={mode} className={executionMode===mode?"active":""} onClick={()=>setExecutionMode(mode)}>
                  <strong>{mode}</strong>
                  <small>{mode==="solo"?t("tasks.modeSoloHint"):mode==="collaborative"?t("tasks.modeCollabHint"):t("tasks.modeCompHint")}</small>
                </button>)}
              </div>
              {executionMode!=="solo"?<p>{t("tasks.needsCleanGit")}</p>:<p>{t("tasks.soloKeeps")}</p>}
            </div>
            {selected.description&&<p className="work-description">{selected.description}</p>}
            <div className="work-evidence"><h3>{t("tasks.evidence")}</h3>{selected.evidence?.length?selected.evidence.map(e=><code key={e}>{e}</code>):<span className="muted">{t("tasks.noEvidence")}</span>}</div>
            {["todo","blocked"].includes(selected.status)&&<div className="modal-actions"><button className="primary-btn" onClick={()=>{queue(selected,executionMode);setSelected(null);}}>{t("tasks.assign")} · {executionMode}</button></div>}
        </ViewportModal>
      )}
    </>
  );
}
