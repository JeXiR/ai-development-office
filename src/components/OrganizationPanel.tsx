"use client";

import { useMemo } from "react";
import { useActiveProjectState } from "@/hooks/useActiveProject";
import { useOfficeI18n } from "@/i18n/officeI18n";

export function OrganizationPanel(){
  const {t}=useOfficeI18n();
  const state=useActiveProjectState();
  const core=useMemo(()=>state.agents.filter(a=>(a.kind||"core")==="core"),[state.agents]);
  const specialists=useMemo(()=>state.agents.filter(a=>a.kind==="specialist"),[state.agents]);
  const capabilityCount=new Set(specialists.flatMap(a=>a.capabilities||[])).size;

  return (
    <section className="panel organization-panel">
      <div>
        <div className="eyebrow">{t("org.eyebrow")}</div>
        <h2>{t("org.title")}</h2>
      </div>
      <div className="organization-stats">
        <div><strong>{core.length}</strong><span>{t("org.core")}</span></div>
        <div><strong>{specialists.length}</strong><span>{t("org.specialists")}</span></div>
        <div><strong>{capabilityCount}</strong><span>{t("org.capabilities")}</span></div>
      </div>
      <div className="org-flow">
        <span>{t("org.docs")}</span><b>→</b><span>{t("org.capResolver")}</span><b>→</b><span>{t("org.agentResolver")}</span><b>→</b><span>{t("org.queues")}</span>
      </div>
    </section>
  );
}
