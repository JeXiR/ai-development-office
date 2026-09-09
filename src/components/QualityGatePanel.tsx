"use client";

import { useMemo, useState } from "react";
import { useOfficeStore } from "@/store/useOfficeStore";
import { useActiveProjectState } from "@/hooks/useActiveProject";
import { sendOffice } from "@/hooks/useOfficeSocket";
import { useOfficeI18n } from "@/i18n/officeI18n";

type StageState="done"|"active"|"failed"|"waiting"|"na";
function stageClass(value:StageState){return `pipeline-stage stage-${value}`}

export function QualityGatePanel(){
  const {t}=useOfficeI18n();
  const state=useActiveProjectState();
  const history=useOfficeStore(s=>s.commandHistory);
  const reports=useOfficeStore(s=>s.taskReports);
  const [selected,setSelected]=useState<string|null>(null);

  const rows=useMemo(()=>history.filter(c=>c.projectId===state.projectId&&(c.workItemId||c.findingId||c.taskReportPath)).slice(0,24),[history,state.projectId]);

  const openReport=(id:string)=>{
    setSelected(id);
    sendOffice({action:"get_task_report",command_id:id});
  };
  const report=selected?reports[selected]:undefined;

  return <section className="panel quality-gate-v2">
    <div className="section-heading"><div><div className="eyebrow">{t("tasks.gateEyebrow")}</div><h2>{t("tasks.gateTitle")}</h2></div></div>
    <div className="gate-pipelines">
      {rows.map(row=>{
        const collabs=Object.values(row.collaboratorStatus||{});
        const plan:StageState=row.planPath?"done":row.requiresPlan===false?"na":row.status==="planning"?"active":"waiting";
        const collaborator:StageState=!row.collaboratorRoles?.length?"na":collabs.some(x=>x==="blocked"||x==="error")?"failed":collabs.length&&collabs.every(x=>x==="passed")?"done":collabs.some(x=>x==="pending")?"active":"waiting";
        const isolation:StageState=(row.executionMode||"solo")==="solo"?"na":row.isolationStatus==="ready"?"done":row.isolationStatus==="failed"?"failed":row.isolationStatus==="pending"?"active":"waiting";
        const lead:StageState=row.status==="failed"?"failed":row.status==="running"?"active":["verifying","completed"].includes(row.status)?"done":"waiting";
        const merge:StageState=(row.executionMode||"solo")==="solo"?"na":row.mergeGateStatus==="applied"?"done":row.mergeGateStatus==="failed"||row.mergeGateStatus==="blocked"?"failed":row.mergeGateStatus==="pending"||row.mergeGateStatus==="passed"?"active":"waiting";
        const verifier:StageState=row.verifierStatus==="passed"?"done":row.verifierStatus==="failed"||row.verifierStatus==="error"?"failed":row.verifierStatus==="pending"?"active":row.verifierStatus==="not_required"?"na":"waiting";
        const reaudit:StageState=row.qualityGateStatus==="verified"?"done":row.qualityGateStatus==="failed"?"failed":row.qualityGateStatus==="pending_reaudit"?"active":"waiting";
        return <article className="gate-pipeline gate-pipeline-v3" key={row.id}>
          <div className="gate-task"><strong>{row.workItemId||row.findingId||row.command}</strong><span>{row.workItemTitle||row.findingTitle||row.command}</span><small>{row.executionMode||"solo"} · {row.leadRole||row.assignedRole||t("tasks.governance")}</small></div>
          <div className={stageClass(plan)}><i>1</i><span>{t("tasks.stagePlan")}</span><b>{plan}</b></div><em>→</em>
          <div className={stageClass(collaborator)}><i>2</i><span>{t("tasks.stageCollab")}</span><b>{row.collaboratorRoles?.length?`${row.collaboratorRoles.length} · ${collaborator}`:"n/a"}</b></div><em>→</em>
          <div className={stageClass(isolation)}><i>3</i><span>{t("tasks.stageIsolate")}</span><b>{row.executionMode||"solo"}</b></div><em>→</em>
          <div className={stageClass(lead)}><i>4</i><span>{t("tasks.stageExecute")}</span><b>{row.competitiveWinner?t("tasks.winner").replace("{name}",row.competitiveWinner):lead}</b></div><em>→</em>
          <div className={stageClass(merge)}><i>5</i><span>{t("tasks.stageMerge")}</span><b>{row.mergeGateStatus||"n/a"}</b></div><em>→</em>
          <div className={stageClass(verifier)}><i>6</i><span>{t("tasks.stageVerifier")}</span><b>{row.driftStatus==="detected"?t("tasks.drift"):verifier}</b></div><em>→</em>
          <div className={stageClass(reaudit)}><i>7</i><span>{t("tasks.stageReaudit")}</span><b>{row.qualityGateStatus||reaudit}</b></div>
          <button disabled={!row.taskReportPath} onClick={()=>openReport(row.id)}>{t("queue.report")}</button>
        </article>;
      })}
    </div>
    {report?<div className="task-report-preview quality-report-v2">
      <div><strong>{report.title}</strong><button onClick={()=>setSelected(null)}>×</button></div>
      <div className="report-summary-grid">
        <span><b>{t("tasks.mode")}</b>{report.executionMode||"solo"}</span>
        <span><b>{t("tasks.lead")}</b>{report.leadRole||report.assignedRole||"—"}</span>
        <span><b>{t("tasks.collaborators")}</b>{report.collaboratorRoles?.join(" · ")||"—"}</span>
        <span><b>{t("tasks.isolation")}</b>{report.isolationStatus||"—"}</span>
        <span><b>{t("tasks.mergeGate")}</b>{report.mergeGateStatus||"—"}</span>
        <span><b>{t("tasks.winnerLabel")}</b>{report.competitiveWinner||"—"}</span>
        <span><b>{t("tasks.stageVerifier")}</b>{report.verifierStatus||"—"}</span>
        <span><b>{t("tasks.drift")}</b>{report.driftStatus||"—"}</span>
        <span><b>{t("tasks.finalGate")}</b>{report.qualityGateStatus}</span>
      </div>
      {report.mergeGateSummary?<p><strong>{t("tasks.stageMerge")}:</strong> {report.mergeGateSummary}</p>:null}
      {report.conflictFiles?.length?<p><strong>{t("tasks.conflicts")}:</strong> {report.conflictFiles.join(", ")}</p>:null}
      {report.competitiveSummary?<p><strong>{t("tasks.competitive")}:</strong> {report.competitiveSummary}</p>:null}
      {report.collaboratorSummary?<p><strong>{t("tasks.collaboration")}:</strong> {report.collaboratorSummary}</p>:null}
      {report.driftSummary?<p><strong>{t("tasks.stageVerifier")}:</strong> {report.driftSummary}</p>:null}
      <p>{report.resultSummary}</p>
    </div>:null}
  </section>;
}
