"use client";
import {useUxStore} from "@/store/useUxStore";
import {useOfficeI18n} from "@/i18n/officeI18n";

export function SplitEditorShell(){
  const {t}=useOfficeI18n();
  const tabs=useUxStore(s=>s.tabs);
  const split=useUxStore(s=>s.split);
  const primary=tabs.find(x=>x.id===split.primaryTabId);
  const secondary=tabs.find(x=>x.id===split.secondaryTabId);
  if(!split.enabled)return null;

  return <div className="split-editor-shell">
    <section><strong>{primary?.title||t("workspace.primary")}</strong><small>{primary?.resource||tabs[0]?.resource||t("workspace.noResource")}</small></section>
    <section><strong>{secondary?.title||t("workspace.secondary")}</strong><small>{secondary?.resource||tabs[1]?.resource||t("workspace.noResource")}</small></section>
  </div>;
}