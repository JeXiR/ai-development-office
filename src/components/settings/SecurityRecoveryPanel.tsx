"use client";

import {useState} from "react";
import {getOfficeSocket, sendOffice} from "@/hooks/useOfficeSocket";
import {useWhenOfficeConnected} from "@/hooks/useWhenOfficeConnected";
import {useOfficeI18n} from "@/i18n/officeI18n";

export function SecurityRecoveryPanel(){
  const {t}=useOfficeI18n();
  const [snapshot,setSnapshot]=useState<any>(null);
  const [backup,setBackup]=useState<any>(null);
  const [migration,setMigration]=useState<any>(null);

  const send=(action:string,data?:any)=>{sendOffice({action,data});};

  useWhenOfficeConnected(()=>{
    const socket=getOfficeSocket(); if(!socket)return;
    const onMessage=(event:MessageEvent)=>{
      try{
        const m=JSON.parse(String(event.data));
        if(m.type==="rc_security_snapshot")setSnapshot(m.data);
        if(m.type==="runtime_backup_created")setBackup(m.data);
        if(m.type==="runtime_migration_result")setMigration(m.data);
      }catch{}
    };
    socket.addEventListener("message",onMessage);
    send("get_rc_security_snapshot");
    return()=>socket.removeEventListener("message",onMessage);
  });

  return <section className="panel security-recovery-panel" data-help="security-recovery">
    <div className="section-heading">
      <div>
        <div className="eyebrow">{t("settings.safetyEyebrow")}</div>
        <h2>{t("settings.safetyTitle")}</h2>
      </div>
      <span>{snapshot?.security?.passed&&snapshot?.compatibility?.ok?"READY":"CHECK"}</span>
    </div>

    <div className="skills-toolbar">
      <button onClick={()=>send("get_rc_security_snapshot")}>{t("common.refresh")}</button>
      <button onClick={()=>send("create_runtime_backup")}>{t("settings.createBackup")}</button>
      <button onClick={()=>send("migrate_runtime_state")}>{t("settings.migrateRuntime")}</button>
    </div>

    <div className="integration-check-grid">
      {(snapshot?.security?.checks||[]).map((row:any)=><article key={row.id} data-ok={row.ok?"true":"false"}>
        <div><strong>{row.id}</strong><span>{row.ok?"PASS":"FAIL"}</span></div>
        <small>{row.message}</small>
      </article>)}
    </div>

    {snapshot?.compatibility?<p className="muted">
      Runtime schema {snapshot.compatibility.runtimeSchema}/{snapshot.compatibility.supportedRuntimeSchema} · Office {snapshot.compatibility.officeVersion||"unknown"}
    </p>:null}
    {backup?<p className="muted">Backup: {backup.target}</p>:null}
    {migration?<p className="muted">Migration {migration.from} → {migration.to}: {(migration.applied||[]).join(", ")||"no changes"}</p>:null}
  </section>;
}
