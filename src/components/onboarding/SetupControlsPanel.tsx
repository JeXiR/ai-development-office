"use client";
import {useOfficeI18n} from "@/i18n/officeI18n";
import {sendOffice} from "@/hooks/useOfficeSocket";

export function SetupControlsPanel(){
  const {t}=useOfficeI18n();

  const reopen=()=>{
    window.dispatchEvent(new Event("office-open-onboarding"));
  };

  const reset=()=>{
    window.localStorage.removeItem("office-onboarding-complete");
    sendOffice({action:"set_onboarding_complete",complete:false});
    window.dispatchEvent(new Event("office-open-onboarding"));
  };

  return <section className="panel" data-help="setup-wizard">
    <div className="section-heading">
      <div>
        <div className="eyebrow">{t("setup.eyebrow")}</div>
        <h2>{t("setup.title")}</h2>
      </div>
      <div className="setup-actions">
        <button onClick={reopen}>{t("setup.open")}</button>
        <button onClick={reset}>{t("setup.reset")}</button>
      </div>
    </div>
    <p className="settings-help">{t("setup.help")}</p>
  </section>;
}
