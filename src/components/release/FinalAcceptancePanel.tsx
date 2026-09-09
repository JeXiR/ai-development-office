"use client";

import {sendOffice} from "@/hooks/useOfficeSocket";
import {useOfficeStore} from "@/store/useOfficeStore";
import {useFinalAcceptanceStore} from "@/store/useFinalAcceptanceStore";
import {useWhenOfficeConnected} from "@/hooks/useWhenOfficeConnected";
import {useOfficeI18n} from "@/i18n/officeI18n";

export function FinalAcceptancePanel(){
  const {t}=useOfficeI18n();
  const acceptance=useFinalAcceptanceStore(s=>s.acceptance);
  const version=useFinalAcceptanceStore(s=>s.version);
  const integrity=useFinalAcceptanceStore(s=>s.integrity);
  const connected=useOfficeStore(s=>s.connected);

  useWhenOfficeConnected(()=>{
    sendOffice({action:"get_final_acceptance"});
    sendOffice({action:"get_version_consistency"});
    sendOffice({action:"get_package_integrity"});
  },[connected]);

  return <section className="panel final-acceptance-panel" data-help="final-acceptance">
    <div className="section-heading">
      <div>
        <div className="eyebrow">{t("release.accEyebrow")}</div>
        <h2>{t("release.accTitle")}</h2>
      </div>
      <span>{acceptance?.stableEligible?t("release.eligible"):t("release.pending")}</span>
    </div>

    <div className="skills-toolbar">
      <button onClick={()=>sendOffice({action:"get_version_consistency"})}>{t("release.checkVersion")}</button>
      <button onClick={()=>sendOffice({action:"get_package_integrity"})}>{t("release.verifyPackage")}</button>
      <button onClick={()=>sendOffice({action:"get_final_acceptance"})}>{t("release.refreshEvidence")}</button>
    </div>

    <div className="integration-check-grid">
      {(acceptance?.items||[]).map((row:any)=><article key={row.id} data-ok={row.status==="pass"?"true":"false"}>
        <div><strong>{row.id}</strong><span>{row.status.toUpperCase()}</span></div>
        <small>{row.message}</small>
      </article>)}
    </div>

    <div className="final-acceptance-summary">
      <span>{t("release.versionOk")}: {version?.ok?"PASS":version?"FAIL":"—"}</span>
      <span>{t("release.packageOk")}: {integrity?.ok?"PASS":integrity?`FAIL · ${integrity.issueCount||0}`:"—"}</span>
      <span>{t("release.blocking")}: {acceptance?.blockingFailures??"—"}</span>
      <span>{t("release.pendingItems")}: {acceptance?.pendingItems??"—"}</span>
    </div>
    {integrity&&!integrity.ok?<ul className="integrity-issue-list">
      {integrity.createdAt?<li className="muted">Baseline {integrity.createdAt} · {integrity.fileCount||0} files</li>:null}
      {(integrity.issues||[]).map((issue:string)=><li key={issue}>{issue}</li>)}
      {(integrity.issueCount||0)>(integrity.issues||[]).length?<li className="muted">{t("release.more").replace("{n}",String((integrity.issueCount||0)-(integrity.issues||[]).length))}</li>:null}
    </ul>:null}
  </section>;
}
