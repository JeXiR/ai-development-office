"use client";

import { useState } from "react";
import { useActiveProjectState } from "@/hooks/useActiveProject";
import { useOfficeStore } from "@/store/useOfficeStore";
import { sendOffice } from "@/hooks/useOfficeSocket";
import { useWhenOfficeConnected } from "@/hooks/useWhenOfficeConnected";
import { useOfficeI18n } from "@/i18n/officeI18n";

const send=sendOffice

export function ReleaseCenter(){
  const {t}=useOfficeI18n();
  const state=useActiveProjectState();
  const gates=useOfficeStore(s=>s.releaseGates);
  const result=useOfficeStore(s=>s.releaseActionResult);
  const backup=useOfficeStore(s=>s.backupResult);
  const gate=gates[state.projectId];
  const [message,setMessage]=useState("chore: verified AI Development Office release");

  useWhenOfficeConnected(()=>{if(state.projectId!=="none")send({action:"get_release_gate",project_id:state.projectId});},[state.projectId]);

  const action=(release_action:"branch"|"commit"|"pr"|"leave_uncommitted")=>{
    const label=t(`release.act.${release_action}`);
    if(!window.confirm(t("release.confirm").replace("{action}",label).replace("{project}",state.projectName)))return;
    send({action:"release_action",project_id:state.projectId,release_action,message});
  };

  return <section className="release-center">
    <article className={`panel release-final-card ${gate?.ready?"ready":"blocked"}`}>
      <div className="release-seal"><span>{gate?.ready?"✓":"!"}</span></div>
      <div><div className="eyebrow">{t("release.gateEyebrow")}</div><h2>{gate?.ready?t("release.ready"):t("release.blocked")}</h2><p>{gate?.ready?t("release.readyHint"):t("release.blockedHint")}</p></div>
      <button onClick={()=>send({action:"get_release_gate",project_id:state.projectId})}>{t("release.recheck")}</button>
    </article>
    <div className="release-layout">
      <article className="panel release-checks">
        <h3>{t("release.gateChecks")}</h3>
        {(gate?.checks||[]).map(c=><div className={c.ok?"pass":"fail"} key={c.id}><b>{c.ok?"✓":"×"}</b><span>{c.label}</span><em>{c.value}</em></div>)}
      </article>
      <article className="panel release-actions">
        <h3>{t("release.finalGit")}</h3>
        <label>{t("release.commitMessage")}<input value={message} onChange={e=>setMessage(e.target.value)} /></label>
        <div className="release-action-grid">
          <button disabled={!gate?.ready} onClick={()=>action("branch")}><strong>{t("release.createBranch")}</strong><span>{t("release.createBranchHint")}</span></button>
          <button disabled={!gate?.ready} onClick={()=>action("commit")}><strong>{t("release.createCommit")}</strong><span>{t("release.createCommitHint")}</span></button>
          <button disabled={!gate?.ready} onClick={()=>action("pr")}><strong>{t("release.createPr")}</strong><span>{t("release.createPrHint")}</span></button>
          <button disabled={!gate?.ready} onClick={()=>action("leave_uncommitted")}><strong>{t("release.leave")}</strong><span>{t("release.leaveHint")}</span></button>
        </div>
        {result?.projectId===state.projectId?<div className={`release-result ${result.ok?"ok":"bad"}`}><strong>{result.ok?t("release.success"):t("release.actionBlocked")}</strong><p>{result.message}</p>{result.branch?<code>{result.branch}</code>:null}{result.output?<pre>{result.output}</pre>:null}</div>:null}
      </article>
    </div>
    <article className="panel backup-export-panel">
      <div><div className="eyebrow">{t("release.backupEyebrow")}</div><h2>{t("release.backupTitle")}</h2><p>{t("release.backupHint")}</p></div>
      <button onClick={()=>send({action:"export_backup"})}>{t("release.exportBackup")}</button>
      {backup?<div className="backup-result"><code>{backup.path}</code><span>{t("release.backupMeta").replace("{projects}",String(backup.projects)).replace("{commands}",String(backup.commands)).replace("{audit}",String(backup.auditEntries))}</span></div>:null}
    </article>
  </section>;
}
