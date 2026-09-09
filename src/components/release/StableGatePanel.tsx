"use client";
import {useOfficeStore} from "@/store/useOfficeStore";
import {sendOffice} from "@/hooks/useOfficeSocket";
import {useOfficeI18n} from "@/i18n/officeI18n";

const send=sendOffice;

export function StableGatePanel(){
  const {t}=useOfficeI18n();
  const projectId=useOfficeStore(s=>s.activeProjectId);
  const gate=useOfficeStore(s=>projectId?s.releaseGates[projectId]||null:null);

  return <section className="panel stable-gate-panel">
    <div className="section-heading">
      <div><div className="eyebrow">{t("stable.eyebrow")}</div><h2>{t("stable.title")}</h2></div>
      <span className="stable-gate-lock">{gate?.ready?"READY":t("common.locked")}</span>
    </div>
    <p>{t("stable.message")}</p>
    <div className="stable-gate-checks">
      {(gate?.checks||[]).map(check=><article key={check.id} data-ok={check.ok?"true":"false"}>
        <strong>{check.label}</strong><span>{check.value}</span>
      </article>)}
      {!gate?<><article><strong>{t("stable.automated")}</strong><span>{t("stable.automatedHint")}</span></article>
      <article><strong>{t("stable.windows")}</strong><span>{t("stable.manualRequired")}</span></article>
      <article><strong>{t("stable.callme")}</strong><span>{t("stable.manualRequired")}</span></article>
      <article><strong>{t("stable.security")}</strong><span>{t("stable.manualRequired")}</span></article></>:null}
    </div>
    <button disabled={!projectId} onClick={()=>projectId&&send({action:"get_release_gate",project_id:projectId})}>{t("stable.check")}</button>
  </section>;
}
