"use client";

import { useMemo, useState } from "react";
import { ViewportModal, modalAnchorFromEvent, type ModalAnchor } from "./ViewportModal";
import { useActiveProjectCoverage, useActiveFeatureContracts } from "@/hooks/useActiveProject";
import { sendOffice } from "@/hooks/useOfficeSocket";
import type { CoverageDomain, CoverageCheck, CoverageDomainId } from "@/types/coverage";
import type { FeatureContract, FeatureSurfaceExpectation } from "@/types/feature-contract";
import type { OfficeWorkItem, WorkItemType } from "@/types/work";
import { useOfficeI18n } from "@/i18n/officeI18n";

const domainOrder:CoverageDomain[]=["backend","frontend","security","tests","database","docs","devops","ai-integrations"];

const send=sendOffice;
function workType(domain:CoverageDomainId):WorkItemType{
  if(domain==="tests")return "test";
  if(domain==="ai-integrations")return "feature";
  if(domain==="flutter")return "frontend";
  return domain as WorkItemType;
}
function owner(domain:CoverageDomain){
  return {
    backend:"Backend",frontend:"Frontend",security:"Security",tests:"QA",
    database:"Database",docs:"Docs",devops:"DevOps","ai-integrations":"Backend"
  }[domain];
}
function coverageWorkItem(projectId:string,domain:CoverageDomain,c:CoverageCheck):OfficeWorkItem{
  return {
    id:`COV-${domain.toUpperCase()}-${c.id}`,
    projectId,type:workType(domain),
    title:`${domain}: ${c.label}`,
    description:c.gaps.join("; ")||`Improve ${domain} coverage for ${c.label}.`,
    status:"todo",
    priority:c.status==="missing"?"high":"medium",
    source:"coverage",
    sourceFile:".ai-kit/project-coverage.json",
    assignedRole:owner(domain),
    evidence:c.evidence,
    acceptanceCriteria:[
      `Coverage check '${c.label}' must become VERIFIED after re-audit.`,
      ...c.gaps
    ],
    createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()
  };
}
function featureWorkItem(projectId:string,f:FeatureContract,s:FeatureSurfaceExpectation):OfficeWorkItem{
  const type:WorkItemType=/test/i.test(s.key)?"test":/authorization|security/i.test(s.key)?"security":f.archetype==="dashboard"?"frontend":"feature";
  const assignedRole=type==="test"?"QA":type==="security"?"Security":type==="frontend"?"Frontend":"Backend";
  return {
    id:`FC-${f.id}-${s.key}`,projectId,type,
    title:`${f.name}: ${s.label}`,
    description:`Feature contract ${f.archetype} expects ${s.label}.`,
    status:"todo",priority:s.status==="missing"?"high":"medium",
    source:"feature-contract",sourceFile:".ai-kit/feature-contracts.json",
    assignedRole,evidence:s.evidence,
    acceptanceCriteria:[`${s.label} must be VERIFIED after re-audit.`,...s.gaps],
    createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()
  };
}

export function ProjectCoveragePanel(){
  const {t}=useOfficeI18n();
  const coverage=useActiveProjectCoverage();
  const features=useActiveFeatureContracts();
  const [domain,setDomain]=useState<CoverageDomain|null>(null);
  const [feature,setFeature]=useState<FeatureContract|null>(null);
  const [selectedChecks,setSelectedChecks]=useState<Set<string>>(()=>new Set());
  const [selectedSurface,setSelectedSurface]=useState<Set<string>>(()=>new Set());
  const [modalAnchor,setModalAnchor]=useState<ModalAnchor|null>(null);

  const openQuestions=useMemo(
    ()=>features.contracts.flatMap(c=>c.questions.filter(q=>q.status==="open").map(q=>({contract:c,question:q}))),
    [features]
  );

  const answer=(featureId:string,questionId:string,value:string)=>{
    const key=questionId.split(":").slice(1).join(":");
    send({action:"answer_feature_decision",project_id:coverage.projectId,feature_id:featureId,key,answer:value});
  };

  const currentActionable=domain?coverage.domains[domain].checks.filter(c=>["missing","partial"].includes(c.status)):[];
  const currentFeatureActionable=feature?feature.surface.filter(s=>["missing","partial"].includes(s.status)&&s.level!=="excluded"&&s.level!=="decision_required"):[];

  const toggleCheck=(key:string)=>{
    setSelectedChecks(prev=>{const next=new Set(prev);next.has(key)?next.delete(key):next.add(key);return next;});
  };
  const toggleSurface=(key:string)=>{
    setSelectedSurface(prev=>{const next=new Set(prev);next.has(key)?next.delete(key):next.add(key);return next;});
  };

  const queueCoverageSelected=()=>{
    if(!domain)return;
    const selected=currentActionable.filter(c=>selectedChecks.has(c.id));
    if(!selected.length)return;
    const items=selected.map(c=>coverageWorkItem(coverage.projectId,domain,c));
    if(!window.confirm(t("coverage.assignConfirm").replace("{n}",String(items.length)).replace("{domain}",domain)))return;
    send({action:"queue_work_items",project_id:coverage.projectId,items});
    setSelectedChecks(new Set());
    setDomain(null);
  };

  const queueFeatureSelected=()=>{
    if(!feature)return;
    const selected=currentFeatureActionable.filter(s=>selectedSurface.has(s.key));
    if(!selected.length)return;
    const items=selected.map(s=>featureWorkItem(coverage.projectId,feature,s));
    if(!window.confirm(t("coverage.featureConfirm").replace("{n}",String(items.length))))return;
    send({action:"queue_work_items",project_id:coverage.projectId,items});
    setSelectedSurface(new Set());
    setFeature(null);
  };

  return (
    <section className="panel project-coverage-panel">
      <div className="coverage-head">
        <div>
          <div className="eyebrow">{t("coverage.eyebrow")}</div>
          <h2>{t("coverage.overall").replace("{n}",String(coverage.overallScore))}</h2>
          <div className="muted">{t("coverage.confidence").replace("{level}",coverage.overallConfidence.toUpperCase()).replace("{n}",String(coverage.unknownCount))}</div>
        </div>
        <div className="overall-ring" style={{"--score":coverage.overallScore} as React.CSSProperties}><strong>{coverage.overallScore}%</strong></div>
      </div>

      <div className="coverage-domain-grid">
        {[...domainOrder.map(id=>coverage.domains[id]),...(coverage.extras||[])].filter(Boolean).map(r=>{
          const id=r.domain;
          return <button className="coverage-domain-card" key={id} onClick={(event)=>{if(domainOrder.includes(id as CoverageDomain)){setModalAnchor(modalAnchorFromEvent(event));setSelectedChecks(new Set());setDomain(id as CoverageDomain);}}}>
            <div className="coverage-domain-title"><strong>{t(`coverage.domain.${id}`,id.replace("-"," "))}</strong><span>{r.score}%</span></div>
            <div className="coverage-bar"><i style={{width:`${r.score}%`}}/></div>
            <div className="coverage-domain-meta">
              <span>{t("coverage.verified").replace("{n}",String(r.verified))}</span><span>{t("coverage.partial").replace("{n}",String(r.partial))}</span>
              <span>{t("coverage.missing").replace("{n}",String(r.missing))}</span><span>{t("coverage.unknown").replace("{n}",String(r.unknown))}</span>
            </div>
          </button>;
        })}
      </div>

      <div className="feature-contract-summary">
        <div className="feature-contract-head">
          <div><div className="eyebrow">{t("coverage.features")}</div><h3>{t("coverage.detected").replace("{n}",String(features.contracts.length)).replace("{q}",String(openQuestions.length))}</h3></div>
        </div>
        <div className="feature-contract-list">
          {features.contracts.slice(0,16).map(c=>{
            const missing=c.surface.filter(s=>s.status==="missing").length;
            const questions=c.questions.filter(q=>q.status==="open").length;
            return <button key={c.id} className="feature-contract-row" onClick={(event)=>{setModalAnchor(modalAnchorFromEvent(event));setSelectedSurface(new Set());setFeature(c);}}>
              <div><strong>{c.name}</strong><span>{c.archetype}</span></div>
              <div className="feature-contract-stats"><span>{t("coverage.missing").replace("{n}",String(missing))}</span><span>{t("coverage.questions").replace("{n}",String(questions))}</span></div>
            </button>;
          })}
        </div>
      </div>

      {domain&&(
        <ViewportModal onClose={()=>setDomain(null)} anchor={modalAnchor} width={980} height={720} className="coverage-detail-modal actionable-coverage-modal">
            <div className="modal-head">
              <div><div className="eyebrow">{t("coverage.actionable")}</div><h2>{domain} · {coverage.domains[domain].score}%</h2></div>
              <button className="modal-close" onClick={()=>setDomain(null)}>×</button>
            </div>
            <div className="coverage-confidence">
              {t("coverage.selectHint").replace("{level}",String(coverage.domains[domain].confidence))}
            </div>

            <div className="coverage-select-tools">
              <button onClick={()=>setSelectedChecks(new Set(currentActionable.filter(c=>c.status==="missing").map(c=>c.id)))}>{t("coverage.selectMissing")}</button>
              <button onClick={()=>setSelectedChecks(new Set(currentActionable.map(c=>c.id)))}>{t("coverage.selectBoth")}</button>
              <button onClick={()=>setSelectedChecks(new Set())}>{t("coverage.clear")}</button>
              <strong>{t("coverage.selected").replace("{n}",String(selectedChecks.size))}</strong>
            </div>

            <div className="coverage-check-list">
              {coverage.domains[domain].checks.map(c=>{
                const actionable=["missing","partial"].includes(c.status);
                return <label className={`coverage-check cc-${c.status} ${actionable?"coverage-actionable":""}`} key={c.id}>
                  {actionable&&<input type="checkbox" checked={selectedChecks.has(c.id)} onChange={()=>toggleCheck(c.id)}/>}
                  <div className="coverage-check-body">
                    <div><strong>{c.label}</strong><span>{c.status}</span></div>
                    {c.evidence.length>0&&<small>{t("coverage.evidence").replace("{items}",c.evidence.slice(0,3).join(", "))}</small>}
                    {c.gaps.length>0&&<p>{c.gaps.join(" · ")}</p>}
                  </div>
                </label>;
              })}
            </div>

            <div className="modal-actions sticky-action-bar">
              <button className="primary-btn" disabled={!selectedChecks.size} onClick={queueCoverageSelected}>
                {t("coverage.assignCeo").replace("{n}",String(selectedChecks.size))}
              </button>
            </div>
        </ViewportModal>
      )}

      {feature&&(
        <ViewportModal onClose={()=>setFeature(null)} anchor={modalAnchor} width={900} height={700} className="feature-detail-modal">
            <div className="modal-head">
              <div><div className="eyebrow">{feature.archetype}</div><h2>{feature.name}</h2></div>
              <button className="modal-close" onClick={()=>setFeature(null)}>×</button>
            </div>

            <div className="coverage-select-tools">
              <button onClick={()=>setSelectedSurface(new Set(currentFeatureActionable.filter(s=>s.status==="missing").map(s=>s.key)))}>{t("coverage.selectMissing")}</button>
              <button onClick={()=>setSelectedSurface(new Set(currentFeatureActionable.map(s=>s.key)))}>{t("coverage.selectBoth")}</button>
              <button onClick={()=>setSelectedSurface(new Set())}>{t("coverage.clear")}</button>
              <strong>{t("coverage.selected").replace("{n}",String(selectedSurface.size))}</strong>
            </div>

            <div className="feature-surface-grid">
              {feature.surface.map(s=>{
                const actionable=["missing","partial"].includes(s.status)&&s.level!=="excluded"&&s.level!=="decision_required";
                return <label className={`feature-surface fs-${s.status} ${actionable?"feature-actionable":""}`} key={s.key}>
                  {actionable&&<input type="checkbox" checked={selectedSurface.has(s.key)} onChange={()=>toggleSurface(s.key)}/>}
                  <div><strong>{s.label}</strong><span>{s.level}</span></div>
                  <b>{s.status}</b>
                  {s.evidence.length>0&&<small>{s.evidence.slice(0,2).join(", ")}</small>}
                </label>;
              })}
            </div>

            {feature.questions.filter(q=>q.status==="open").length>0&&(
              <div className="feature-questions">
                <h3>{t("coverage.decisionsRequired")}</h3>
                {feature.questions.filter(q=>q.status==="open").map(q=>(
                  <div className="feature-question" key={q.id}>
                    <strong>{q.question}</strong>
                    <div>{q.options.map(opt=><button key={opt} onClick={()=>answer(feature.id,q.id,opt)}>{opt}</button>)}</div>
                  </div>
                ))}
              </div>
            )}

            <div className="modal-actions sticky-action-bar">
              <button className="primary-btn" disabled={!selectedSurface.size} onClick={queueFeatureSelected}>
                {t("coverage.assignCeo").replace("{n}",String(selectedSurface.size))}
              </button>
            </div>
        </ViewportModal>
      )}
    </section>
  );
}
