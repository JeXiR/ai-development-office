"use client";
import {useState} from "react";
import {useOfficeStore} from "@/store/useOfficeStore";
import {useGovernanceStore} from "@/store/useGovernanceStore";
import {useOfficeI18n} from "@/i18n/officeI18n";
import {sendOffice} from "@/hooks/useOfficeSocket";
import {useWhenOfficeConnected} from "@/hooks/useWhenOfficeConnected";

const send=sendOffice;

export function GovernancePanel(){
  const {t}=useOfficeI18n();
  const projectId=useOfficeStore(s=>s.activeProjectId);
  const state=useGovernanceStore();
  const [memberId,setMemberId]=useState("owner");
  const [memberName,setMemberName]=useState("Project Owner");
  const [decisionTitle,setDecisionTitle]=useState("");
  const [decisionRationale,setDecisionRationale]=useState("");
  const [evidenceLabel,setEvidenceLabel]=useState("manual acceptance");

  const refresh=()=>projectId&&send({action:"governance_snapshot",project_id:projectId});
  useWhenOfficeConnected(()=>{refresh();},[projectId]);

  return <section className="panel">
    <div className="section-heading">
      <div><div className="eyebrow">{t("gov.eyebrow")}</div><h2>{t("gov.title")}</h2></div>
      <div><button onClick={refresh}>{t("common.refresh")}</button><button onClick={()=>projectId&&send({action:"governance_audit_verify",project_id:projectId})}>{t("gov.verifyAudit")}</button></div>
    </div>

    <div className="governance-status-grid">
      <article><strong>{t("gov.eligibility")}</strong><span>{state.release?.eligible?t("gov.eligible"):t("gov.blocked")}</span><small>{(state.release?.blockers||[]).join(" · ")||t("gov.noBlockers")}</small></article>
      <article><strong>{t("gov.stableAcc")}</strong><span>{state.stableAcceptance&&Object.values(state.stableAcceptance).every(Boolean)?t("gov.complete"):t("gov.incomplete")}</span></article>
      <article><strong>{t("gov.auditChain")}</strong><span>{state.audit?.ok?t("gov.verified"):t("gov.notVerified")}</span><small>{t("gov.entries").replace("{n}",String(state.audit?.count??0))}</small></article>
      <article><strong>{t("gov.approvals")}</strong><span>{state.policy?.requiredApprovals?.release??"—"}</span></article>
    </div>

    <div className="governance-member-row">
      <input value={memberId} onChange={e=>setMemberId(e.target.value)} placeholder={t("gov.memberId")}/>
      <input value={memberName} onChange={e=>setMemberName(e.target.value)} placeholder={t("gov.displayName")}/>
      <select id="gov-role" defaultValue="owner"><option value="owner">owner</option><option value="maintainer">maintainer</option><option value="reviewer">reviewer</option><option value="operator">operator</option><option value="auditor">auditor</option></select>
      <button onClick={()=>{const role=(document.getElementById("gov-role") as HTMLSelectElement)?.value||"owner";projectId&&send({action:"governance_member_upsert",project_id:projectId,member_id:memberId,display_name:memberName,role,actor:"user"});}}>{t("gov.saveMember")}</button>
    </div>

    <div className="governance-members">
      {state.members.map((m:any)=><span key={m.id}>{m.displayName} · {m.role}</span>)}
    </div>

    <div className="governance-decision-row">
      <input value={decisionTitle} onChange={e=>setDecisionTitle(e.target.value)} placeholder={t("gov.decisionTitle")}/>
      <textarea value={decisionRationale} onChange={e=>setDecisionRationale(e.target.value)} placeholder={t("gov.rationale")}/>
      <button onClick={()=>projectId&&decisionTitle&&send({action:"governance_decision_create",project_id:projectId,title:decisionTitle,rationale:decisionRationale,actor:memberId})}>{t("gov.createDecision")}</button>
    </div>

    <div className="governance-decision-list">
      {state.decisions.slice().reverse().map((d:any)=><article key={d.id}><div><strong>{d.title}</strong><small>{d.status} · {d.proposedBy}</small><p>{d.rationale}</p></div>{d.status==="proposed"?<div><button onClick={()=>projectId&&send({action:"governance_decision_decide",project_id:projectId,decision_id:d.id,member_id:memberId,approve:true})}>{t("common.approve")}</button><button onClick={()=>projectId&&send({action:"governance_decision_decide",project_id:projectId,decision_id:d.id,member_id:memberId,approve:false})}>{t("common.reject")}</button></div>:null}</article>)}
      {!state.decisions.length?<div className="workspace-empty">{t("gov.noDecisions")}</div>:null}
    </div>

    <div className="governance-evidence-row">
      <input value={evidenceLabel} onChange={e=>setEvidenceLabel(e.target.value)} placeholder={t("gov.evidenceLabel")}/>
      <select id="gov-evidence-type" defaultValue="manual"><option value="test">test</option><option value="build">build</option><option value="runtime">runtime</option><option value="security">security</option><option value="review">review</option><option value="manual">manual</option><option value="artifact">artifact</option></select>
      <select id="gov-evidence-status" defaultValue="pass"><option value="pass">pass</option><option value="fail">fail</option><option value="unknown">unknown</option></select>
      <button onClick={()=>{const type=(document.getElementById("gov-evidence-type") as HTMLSelectElement)?.value||"manual";const status=(document.getElementById("gov-evidence-status") as HTMLSelectElement)?.value||"unknown";projectId&&send({action:"governance_evidence_add",project_id:projectId,evidence_type:type,label:evidenceLabel,status,source:"manual-ui",actor:memberId});}}>{t("gov.addEvidence")}</button>
    </div>

    <div className="governance-signoffs">
      <button disabled={!projectId} onClick={()=>projectId&&send({action:"governance_signoff_create",project_id:projectId,version:"2.0.0",actor:memberId})}>{t("gov.signoff")}</button>
      {state.signoffs.slice().reverse().map((s:any)=><article key={s.id}><div><strong>{s.version}</strong><small>{s.status} · {t("gov.approvalsCount").replace("{have}",String(s.approvals.length)).replace("{need}",String(s.requiredApprovals))}</small><span>{s.blockers.join(" · ")||t("gov.noBlockers")}</span></div>{s.status==="pending"?<button onClick={()=>projectId&&send({action:"governance_signoff_approve",project_id:projectId,signoff_id:s.id,member_id:memberId})}>{t("common.approve")}</button>:null}</article>)}
    </div>
  </section>;
}
