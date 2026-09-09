"use client";
import {useState} from "react";
import {useOfficeStore} from "@/store/useOfficeStore";
import {useWorkspaceStore} from "@/store/useWorkspaceStore";
import {sendOffice} from "@/hooks/useOfficeSocket";
import {useOfficeI18n} from "@/i18n/officeI18n";

export function GitDiffViewer(){
  const {t}=useOfficeI18n();
  const projectId=useOfficeStore(s=>s.activeProjectId);
  const diff=useWorkspaceStore(s=>s.gitDiff);
  const gitError=useWorkspaceStore(s=>s.gitError);
  const [sel,setSel]=useState<string|null>(null);
  const cur=diff.find(x=>x.path===sel)||diff[0]||null;
  return <section className="workspace-pane git-diff-viewer">
    <header>
      <strong>{t("workspace.gitChanges")}</strong>
      <button onClick={()=>projectId&&sendOffice({action:"workspace_git_diff",project_id:projectId})}>{t("common.refresh")}</button>
    </header>
    <div className="git-diff-layout">
      <aside>{diff.length?diff.map(f=><button key={f.path} className={cur?.path===f.path?"active":""} onClick={()=>setSel(f.path)}><span>{f.status}</span><strong>{f.path}</strong><em>+{f.additions} −{f.deletions}</em></button>):<div className="workspace-empty">{gitError||t("workspace.noChanges")}</div>}</aside>
      <pre>{gitError&&!diff.length?gitError:(cur?.diff||t("workspace.selectChanged"))}</pre>
    </div>
  </section>;
}
