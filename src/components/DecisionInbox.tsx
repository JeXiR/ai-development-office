"use client";

import { useMemo } from "react";
import { useActiveFeatureContracts, useActiveProjectState } from "@/hooks/useActiveProject";
import { useOfficeStore } from "@/store/useOfficeStore";
import { sendOffice } from "@/hooks/useOfficeSocket";
import { needsInboxAttention } from "@/lib/inbox-attention";
import { useOfficeI18n } from "@/i18n/officeI18n";

export function DecisionInbox(){
  const {t}=useOfficeI18n();
  const state=useActiveProjectState();
  const features=useActiveFeatureContracts();
  const history=useOfficeStore(s=>s.commandHistory);
  const recovery=useOfficeStore(s=>s.recovery);

  const questions=useMemo(()=>features.contracts.flatMap(contract=>contract.questions.filter(q=>q.status==="open").map(question=>({contract,question}))),[features]);
  const blocked=useMemo(()=>history.filter(c=>c.projectId===state.projectId&&needsInboxAttention(c)).slice(0,30),[history,state.projectId]);
  const interrupted=(recovery?.interrupted||[]).filter(x=>x.projectId===state.projectId&&["queued","waiting_for_agent","planning","plan_ready","running","verifying"].includes(x.status));

  const answer=(featureId:string,questionId:string,answer:string)=>{
    const key=questionId.split(":").slice(1).join(":");
    sendOffice({action:"answer_feature_decision",project_id:state.projectId,feature_id:featureId,key,answer});
  };

  const blockedKind=(item:typeof blocked[number])=>{
    if(item.ownershipConflicts?.length)return t("inbox.ownership");
    if(item.mergeGateStatus==="blocked")return t("inbox.merge");
    if(item.driftStatus==="detected")return t("inbox.drift");
    return t("inbox.wait");
  };

  const total=questions.length+blocked.length+interrupted.length;
  return <section className="panel decision-inbox">
    <div className="section-heading"><div><div className="eyebrow">{t("inbox.eyebrow")}</div><h2>{total?total===1?t("inbox.needOne"):t("inbox.needs").replace("{n}",String(total)):t("inbox.none")}</h2></div></div>
    <div className="inbox-cards">
      {questions.map(({contract,question})=><article className="inbox-card decision" key={question.id}>
        <div><span>{t("inbox.product")}</span><strong>{contract.name}</strong></div>
        <p>{question.question}</p>
        <div className="inbox-actions">{question.options.map(option=><button key={option} onClick={()=>answer(contract.id,question.id,option)}>{option}</button>)}</div>
      </article>)}
      {blocked.map(item=><article className="inbox-card blocked" key={item.id}>
        <div><span>{blockedKind(item)}</span><strong>{item.workItemId||item.findingId||item.command}</strong></div>
        <p>{item.ownershipConflicts?.join(" · ")||item.mergeGateSummary||item.driftSummary||t("inbox.waitingFor").replace("{items}",(item.blockedBy||[]).join(", "))}</p>
        <small>{t("inbox.lead")}: {item.leadRole||item.assignedRole||"—"} · {t("inbox.mode")}: {item.executionMode||"solo"}</small>
        <div className="inbox-actions">
          <button onClick={()=>sendOffice({action:"retry_command_solo",command_id:item.id})}>{t("inbox.retrySolo")}</button>
          <button onClick={()=>sendOffice({action:"dismiss_inbox_item",command_id:item.id})}>{t("inbox.dismiss")}</button>
        </div>
      </article>)}
      {interrupted.map(item=><article className="inbox-card recovery" key={item.id}>
        <div><span>{t("inbox.recovery")}</span><strong>{item.title}</strong></div><p>{item.message}</p>
        <div className="inbox-actions"><button onClick={()=>sendOffice({action:"recover_command",command_id:item.id})}>{t("hardening.resume")}</button><button onClick={()=>sendOffice({action:"discard_recovery",command_id:item.id})}>{t("hardening.discard")}</button></div>
      </article>)}
      {!total?<div className="inbox-empty"><b>✓</b><span>{t("inbox.empty")}</span></div>:null}
    </div>
  </section>;
}
