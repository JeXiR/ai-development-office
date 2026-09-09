"use client";
import {useEffect,useState} from "react";
import {useOfficeStore} from "@/store/useOfficeStore";
import {useGitCodeStore} from "@/store/useGitCodeStore";
import {sendOffice} from "@/hooks/useOfficeSocket";
import {useOfficeI18n} from "@/i18n/officeI18n";

const send=sendOffice;

export function GitCodeIntelligencePanel(){
  const {t}=useOfficeI18n();
  const projectId=useOfficeStore(s=>s.activeProjectId);
  const store=useGitCodeStore();
  const [file,setFile]=useState("");
  const [scope,setScope]=useState("task");
  const [scopeId,setScopeId]=useState("");
  const [commit,setCommit]=useState("");
  const [good,setGood]=useState("");
  const [target,setTarget]=useState("main");

  useEffect(()=>{if(projectId)send({action:"git_policy_get",project_id:projectId});},[projectId]);

  return <section className="panel">
    <div className="section-heading">
      <div><div className="eyebrow">{t("gitCode.eyebrow")}</div><h2>{t("gitCode.title")}</h2></div>
      <button disabled={!projectId} onClick={()=>projectId&&send({action:"git_conflicts",project_id:projectId})}>{t("gitCode.scanConflicts")}</button>
    </div>

    <div className="git-code-toolbar">
      <input value={file} onChange={e=>setFile(e.target.value)} placeholder={t("gitCode.filePlaceholder")}/>
      <button disabled={!projectId||!file} onClick={()=>projectId&&send({action:"git_side_by_side",project_id:projectId,file})}>{t("gitCode.sideBySide")}</button>
      <button disabled={!projectId||!file} onClick={()=>projectId&&send({action:"git_blame",project_id:projectId,file})}>{t("gitCode.blame")}</button>
    </div>

    {store.sideBySide?<div className="side-by-side">
      <pre>{store.sideBySide.before}</pre>
      <pre>{store.sideBySide.after}</pre>
    </div>:null}

    {store.blame?<div className="blame-list">
      {store.blame.lines.slice(0,200).map(l=><article key={l.line}><span>{l.line}</span><b>{l.commit.slice(0,8)}</b><em>{l.author}</em><code>{l.content}</code></article>)}
    </div>:null}

    <div className="scoped-diff-toolbar">
      <select value={scope} onChange={e=>setScope(e.target.value)}><option value="task">Task</option><option value="agent">Agent</option></select>
      <input value={scopeId} onChange={e=>setScopeId(e.target.value)} placeholder={`${scope} id`}/>
      <button disabled={!projectId||!scopeId} onClick={()=>projectId&&send({action:"git_scoped_diff",project_id:projectId,scope,scope_id:scopeId})}>{t("gitCode.scopedDiff")}</button>
    </div>

    {store.scopedDiff?<div className="scoped-diff-list">
      {store.scopedDiff.files.map((f:any)=><article key={f.path}><strong>{f.path}</strong><span>{f.status} · +{f.additions} −{f.deletions}</span></article>)}
    </div>:null}

    <div className="git-danger-toolbar">
      <input value={commit} onChange={e=>setCommit(e.target.value)} placeholder={t("gitCode.commitPlaceholder")}/>
      <button disabled={!projectId||!commit} onClick={()=>projectId&&confirm(t("gitCode.cherryConfirm"))&&send({action:"git_cherry_pick",project_id:projectId,commit})}>{t("gitCode.cherryPick")}</button>
      <button disabled={!projectId||!commit} onClick={()=>projectId&&confirm(t("gitCode.rollbackConfirm"))&&send({action:"git_rollback",project_id:projectId,commit,mode:"mixed"})}>{t("gitCode.rollback")}</button>
    </div>

    <div className="bisect-toolbar">
      <input value={good} onChange={e=>setGood(e.target.value)} placeholder={t("gitCode.goodPlaceholder")}/>
      <button disabled={!projectId||!good} onClick={()=>projectId&&send({action:"git_bisect_plan",project_id:projectId,good,bad:"HEAD"})}>{t("gitCode.bisectPlan")}</button>
      {store.bisect?<span>{store.bisect.candidateCount} candidates · ~{store.bisect.estimatedSteps} steps</span>:null}
    </div>

    <div className="conflict-list">
      {store.conflicts.map(c=><article key={c.path}><strong>{c.path}</strong><span>{c.conflictMarkers?"markers detected":"index conflict"}</span><button onClick={()=>projectId&&send({action:"git_conflict_inspect",project_id:projectId,file:c.path})}>Inspect</button></article>)}
      {!store.conflicts.length?<div className="workspace-empty">{t("gitCode.noConflicts")}</div>:null}
    </div>

    {store.conflictInspection?<div className="conflict-inspection">
      <strong>{store.conflictInspection.path}</strong>
      <span>{store.conflictInspection.strategy} · {store.conflictInspection.reason}</span>
    </div>:null}

    <div className="git-policy-grid">
      <label><input type="checkbox" checked={!!store.policy?.autoBranch} onChange={e=>projectId&&send({action:"git_policy_set",project_id:projectId,auto_branch:e.target.checked,auto_commit:!!store.policy?.autoCommit,branch_prefix:store.policy?.branchPrefix||"office/",commit_prefix:store.policy?.commitPrefix||"office:",require_clean_base:store.policy?.requireCleanBase!==false})}/> {t("gitCode.autoBranch")}</label>
      <label><input type="checkbox" checked={!!store.policy?.autoCommit} onChange={e=>projectId&&send({action:"git_policy_set",project_id:projectId,auto_branch:!!store.policy?.autoBranch,auto_commit:e.target.checked,branch_prefix:store.policy?.branchPrefix||"office/",commit_prefix:store.policy?.commitPrefix||"office:",require_clean_base:store.policy?.requireCleanBase!==false})}/> {t("gitCode.autoCommit")}</label>
    </div>

    <div className="pr-draft-toolbar">
      <input value={target} onChange={e=>setTarget(e.target.value)} placeholder={t("gitCode.targetPlaceholder")}/>
      <button disabled={!projectId} onClick={()=>projectId&&send({action:"git_pr_draft",project_id:projectId,target_branch:target,provider:"generic"})}>{t("gitCode.prDraft")}</button>
    </div>
    {store.prDraft?<div className="pr-draft"><strong>{store.prDraft.title}</strong><pre>{store.prDraft.body}</pre></div>:null}
  </section>;
}