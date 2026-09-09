"use client";
import { useOfficeI18n, type OfficeUiLanguage } from "@/i18n/officeI18n";

const OPTIONS=[
 {value:"tr",label:"Türkçe"},
 {value:"en",label:"English"},
 {value:"de",label:"Deutsch"},
 {value:"ru",label:"Русский"}
] as const;

export function OfficeUiLanguageSettings(){
  const {language,setLanguage,t}=useOfficeI18n();
  return <section className="panel ai-language-settings">
    <div className="section-heading">
      <div>
        <div className="eyebrow">{t("ui_language")}</div>
        <h2>{t("ui_language_title")}</h2>
        <p>{t("ui_language_desc")}</p>
      </div>
      <div className="ai-language-control">
        <select value={language} onChange={e=>setLanguage(e.target.value as OfficeUiLanguage)}>
          {OPTIONS.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <span>{t("current")} · {OPTIONS.find(o=>o.value===language)?.label}</span>
      </div>
    </div>
  </section>;
}
