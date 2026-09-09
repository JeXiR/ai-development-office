"use client";
import {useState} from "react";
import {useOfficeI18n} from "@/i18n/officeI18n";
import {useInstallerStore} from "@/store/useInstallerStore";
import {sendOffice} from "@/hooks/useOfficeSocket";
import {useWhenOfficeConnected} from "@/hooks/useWhenOfficeConnected";

const send=sendOffice;

export function InstallerDesktopPanel(){
  const {t}=useOfficeI18n();
  const state=useInstallerStore();
  const [provider,setProvider]=useState("claude");
  const [sourcePath,setSourcePath]=useState("");
  const [version,setVersion]=useState("2.0.0-rc.13");

  useWhenOfficeConnected(()=>{
    send({action:"installer_snapshot"});
  });

  return <section className="panel" data-help="installer">
    <div className="section-heading">
      <div><div className="eyebrow">{t("installer.eyebrow")}</div><h2>{t("installer.title")}</h2></div>
      <button onClick={()=>send({action:"installer_snapshot"})}>{t("common.refresh")}</button>
    </div>

    <div className="installer-grid">
      {state.prerequisites.map((p:any)=><article key={p.id}><strong>{p.label}</strong><span>{p.status}</span><small>{p.version||p.installHint||""}</small></article>)}
    </div>

    <div className="installer-provider-row">
      <select value={provider} onChange={e=>setProvider(e.target.value)}>
        <option value="cursor">Cursor</option><option value="claude">Claude Code</option><option value="codex">Codex CLI</option><option value="gemini">Gemini CLI</option><option value="opencode">OpenCode</option>
      </select>
      <button onClick={()=>send({action:"provider_install_launch",provider_id:provider})}>{t("settings.launchInstaller")}</button>
      <button onClick={()=>send({action:"first_run_diagnostics"})}>{t("settings.runDiagnostics")}</button>
    </div>

    <div className="installer-runtime">
      <span>{state.version?.packageVersion||"?"}</span>
      <span>{state.runtime?.platform||"?"} / {state.runtime?.arch||"?"}</span>
      <span>{state.diagnostics?.ready===true?t("common.ready"):state.diagnostics?t("common.failed"):t("common.unknown")}</span>
    </div>

    <div className="update-stage-row">
      <input value={sourcePath} onChange={e=>setSourcePath(e.target.value)} placeholder={t("settings.updateSource")}/>
      <input value={version} onChange={e=>setVersion(e.target.value)} placeholder={t("settings.version")}/>
      <button onClick={()=>sourcePath&&send({action:"update_stage",source_path:sourcePath,version})}>{t("settings.stageUpdate")}</button>
      <button disabled={!state.staged} onClick={()=>state.staged&&send({action:"update_verify",stage:state.staged})}>{t("settings.verifyUpdate")}</button>
    </div>

    {state.staged?<div className="update-stage-card"><strong>{state.staged.version}</strong><small>{state.staged.stagedPath}</small><span>{state.staged.verified?t("settings.verifyUpdate"):t("common.unknown")}</span></div>:null}
  </section>;
}
