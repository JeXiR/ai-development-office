"use client";
import {useOfficeI18n} from "@/i18n/officeI18n";
export function LocalizedViewHeading({titleKey}:{titleKey:string}){
  const {t}=useOfficeI18n();
  const title=t(titleKey)||titleKey;
  return <section className="view-heading"><div className="eyebrow">{title.toUpperCase()}</div><h2>{title}</h2></section>;
}
