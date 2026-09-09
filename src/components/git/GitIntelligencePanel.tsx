"use client";
import {useEffect,useMemo,useState} from "react";
import {useOfficeStore} from "@/store/useOfficeStore";
import {useGitIntelligenceStore} from "@/store/useGitIntelligenceStore";
import {sendOffice} from "@/hooks/useOfficeSocket";
import {useOfficeI18n} from "@/i18n/officeI18n";

const send=sendOffice;

export function GitIntelligencePanel(){
  const {t}=useOfficeI18n();
  const projectId=useOfficeStore(s=>s.activeProjectId);
  const graph=useGitIntelligenceStore(s=>s.graph);
  const working=useGitIntelligenceStore(s=>s.workingTree);
  const snapshots=useGitIntelligenceStore(s=>s.snapshots);
  const [branch,setBranch]=useState("");
  const [message,setMessage]=useState("");
  const [snapshotLabel,setSnapshotLabel]=useState("Before change");

  const refresh=()=>{
    if(!projectId)return;
    send({action:"git_graph",project_id:projectId});
    send({action:"git_working_tree",project_id:projectId});
    send({action:"git_snapshots",project_id:projectId});
  };

  useEffect(()=>{refresh();},[projectId]);

  const lines=useMemo(()=>graph?.commits.slice(0,60)||[],[graph]);

  return <section className="panel">
    <div className="section-heading">
      <div><div className="eyebrow">{t("gitIntel.eyebrow")}</div><h2>{t("gitIntel.title")}</h2></div>
      <button onClick={refresh}>{t("common.refresh")}</button>
    </div>

    <div className="git-intel-toolbar">
      <input value={branch} onChange={e=>setBranch(e.target.value)} placeholder={t("gitIntel.branchPlaceholder")}/>
      <button disabled={!branch.trim()||!projectId} onClick={()=>projectId&&send({action:"git_create_branch",project_id:projectId,name:branch.trim()})}>{t("gitIntel.createBranch")}</button>
      <input value={message} onChange={e=>setMessage(e.target.value)} placeholder={t("gitIntel.commitPlaceholder")}/>
      <button disabled={!message.trim()||!projectId} onClick={()=>projectId&&send({action:"git_commit",project_id:projectId,message:message.trim()})}>{t("gitIntel.commitAll")}</button>
    </div>

    <div className="git-intel-grid">
      <div>
        <strong>{t("gitIntel.branches")}</strong>
        <div className="git-branches">
          {(graph?.branches||[]).map(b=><button key={b.name} className={b.current?"active":""} onClick={()=>projectId&&!b.current&&send({action:"git_checkout",project_id:projectId,name:b.name})}>
            <b>{b.current?"● ":"○ "}{b.name}</b><small>{b.upstream||"local"} · +{b.ahead}/-{b.behind}</small>
          </button>)}
        </div>
      </div>

      <div>
        <strong>{t("gitIntel.commitGraph")}</strong>
        <div className="commit-graph">
          {lines.map((c,index)=><article key={c.hash}>
            <i>{index===lines.length-1?"●":"●│"}</i>
            <div><b>{c.shortHash} {c.subject}</b><small>{c.author} · {new Date(c.timestamp).toLocaleString()}</small><em>{c.refs.join(" · ")}</em></div>
          </article>)}
        </div>
      </div>
    </div>

    <div className="snapshot-toolbar">
      <input value={snapshotLabel} onChange={e=>setSnapshotLabel(e.target.value)} placeholder={t("gitIntel.snapshotPlaceholder")}/>
      <button disabled={!projectId} onClick={()=>projectId&&send({action:"git_snapshot_create",project_id:projectId,label:snapshotLabel,include_working_tree:true})}>{t("gitIntel.createSnapshot")}</button>
    </div>

    <div className="snapshot-list">
      {snapshots.map(s=><article key={s.id}>
        <div><strong>{s.label}</strong><small>{new Date(s.createdAt).toLocaleString()} · {s.branch||"detached"} · {s.commit?.slice(0,8)||"no commit"}</small></div>
        <button onClick={()=>projectId&&confirm(t("gitIntel.restoreConfirm"))&&send({action:"git_snapshot_restore",project_id:projectId,snapshot_id:s.id})}>{t("gitIntel.restore")}</button>
      </article>)}
      {!snapshots.length?<div className="workspace-empty">{t("gitIntel.noSnapshots")}</div>:null}
    </div>

    <div className="git-working-tree">
      <strong>{t("gitIntel.workingTree")}</strong>
      {working.map(f=><article key={f.path}><span>{f.status}</span><b>{f.path}</b><em>+{f.additions} −{f.deletions}</em></article>)}
      {!working.length?<div className="workspace-empty">{t("gitIntel.clean")}</div>:null}
    </div>
  </section>;
}