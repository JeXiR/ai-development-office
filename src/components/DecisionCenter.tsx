"use client";

import { useMemo } from "react";
import { useActiveFeatureContracts, useActiveProjectQueue, useActiveProjectState } from "@/hooks/useActiveProject";
import { sendOffice } from "@/hooks/useOfficeSocket";
import { useOfficeI18n } from "@/i18n/officeI18n";

const send=sendOffice;

export function DecisionCenter(){
  const {t}=useOfficeI18n();
  const state=useActiveProjectState();
  const features=useActiveFeatureContracts();
  const queue=useActiveProjectQueue();

  const questions=useMemo(
    ()=>features.contracts.flatMap(contract=>
      contract.questions.filter(q=>q.status==="open").map(question=>({contract,question}))
    ),
    [features]
  );

  const dependencyBlocks=useMemo(
    ()=>queue.filter(item=>item.blockedBy&&item.blockedBy.length>0),
    [queue]
  );

  const answer=(featureId:string,questionId:string,answer:string)=>{
    const key=questionId.split(":").slice(1).join(":");
    send({action:"answer_feature_decision",project_id:state.projectId,feature_id:featureId,key,answer});
  };

  if(!questions.length&&!dependencyBlocks.length)return null;

  return (
    <section className="panel decision-center">
      <div className="decision-head">
        <div><div className="eyebrow">{t("decision.eyebrow")}</div><h2>{t("decision.title")}</h2></div>
        <div className="decision-count">{questions.length+dependencyBlocks.length}</div>
      </div>

      <div className="decision-grid">
        {questions.map(({contract,question})=>(
          <article className="decision-card" key={question.id}>
            <span>{contract.name}</span>
            <strong>{question.question}</strong>
            <div>
              {question.options.map(option=>
                <button key={option} onClick={()=>answer(contract.id,question.id,option)}>{option}</button>
              )}
            </div>
          </article>
        ))}

        {dependencyBlocks.map(item=>(
          <article className="decision-card dependency-card" key={item.id}>
            <span>{t("decision.wait")}</span>
            <strong>{item.workItemTitle||item.findingTitle||item.command}</strong>
            <small>{t("decision.waitingFor").replace("{items}",item.blockedBy?.join(", ")||"—")}</small>
          </article>
        ))}
      </div>
    </section>
  );
}
