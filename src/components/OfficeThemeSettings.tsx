"use client";

import { AIResponseLanguageSettings } from "./AIResponseLanguageSettings";
import { OfficeUiLanguageSettings } from "./OfficeUiLanguageSettings";
import { useOfficeI18n } from "@/i18n/officeI18n";

import { useOfficeStore } from "@/store/useOfficeStore";
import { sendOffice } from "@/hooks/useOfficeSocket";
import { OFFICE_THEMES } from "@/types/themes";
import type { OfficeThemeId } from "@/types/mission";

function selectTheme(theme:OfficeThemeId){
  const current=useOfficeStore.getState().missionSettings;
  useOfficeStore.getState().setMissionSettings({...current,officeTheme:theme});
  sendOffice({action:"set_office_theme",theme});
}

export function OfficeThemeSettings(){
  const current=useOfficeStore(s=>s.missionSettings.officeTheme);
  const {t}=useOfficeI18n();
  return <><OfficeUiLanguageSettings/><AIResponseLanguageSettings/><section className="panel office-theme-settings">
    <div className="section-heading">
      <div><div className="eyebrow">{t("pixel_office_themes")}</div><h2>{t("office_visual_theme")}</h2></div>
      <span className="theme-current">{t("theme.current").replace("{name}",t(`theme.name.${current}`)||OFFICE_THEMES.find(x=>x.id===current)?.name||current)}</span>
    </div>
    <p className="theme-license-note">
      {t("theme_note")}
    </p>
    <div className="theme-grid">
      {OFFICE_THEMES.map(theme=><button key={theme.id} className={`theme-card theme-preview-${theme.id} ${current===theme.id?"active":""}`} onClick={()=>selectTheme(theme.id)}>
        <i className="theme-preview-room"><b/><b/><span/><span/></i>
        <strong>{t(`theme.name.${theme.id}`)}</strong>
        <span>{theme.sourceLabel}</span>
        <small>{t(`theme.desc.${theme.id}`)}</small>
        <b className="theme-license-badge">{theme.license==="cc0-inspired"?t("theme_license_cc0"):t("theme_license_inspired")}</b>
        <em>{current===theme.id?t("selected"):t("select_theme")}</em>
      </button>)}
    </div>
  </section></>;
}
