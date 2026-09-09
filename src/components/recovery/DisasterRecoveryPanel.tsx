"use client";
import {useOfficeStore} from "@/store/useOfficeStore";
import {sendOffice} from "@/hooks/useOfficeSocket";
import {useOfficeI18n} from "@/i18n/officeI18n";
const send=sendOffice;

export function DisasterRecoveryPanel(){
  const {t}=useOfficeI18n();
  const projectId=useOfficeStore(s=>s.activeProjectId);
  return <section className="panel">
    <div className="section-heading"><div><div className="eyebrow">{t("recovery.eyebrow")}</div><h2>{t("recovery.title")}</h2></div><button disabled={!projectId} onClick={()=>projectId&&send({action:"recovery_backup",project_id:projectId})}>{t("recovery.create")}</button></div>
    <p className="settings-help">{t("recovery.help")}</p>
  </section>;
}