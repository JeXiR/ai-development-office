"use client";

import packageJson from "../../package.json";
import { useOfficeI18n } from "@/i18n/officeI18n";

export type MissionView="office"|"workspace"|"collaboration"|"projects"|"agents"|"skills"|"tasks"|"inbox"|"findings"|"analytics"|"memory"|"release"|"settings";

const items:Array<{id:MissionView;icon:string;labelKey:string}>=[
{id:"office",icon:"⌂",labelKey:"nav.office"},{id:"workspace",icon:"⌘",labelKey:"nav.workspace"},{id:"collaboration",icon:"⇄",labelKey:"nav.collaboration"},{id:"projects",icon:"▦",labelKey:"nav.projects"},{id:"agents",icon:"◉",labelKey:"nav.agents"},{id:"skills",icon:"✦",labelKey:"nav.skills"},{id:"tasks",icon:"✓",labelKey:"nav.tasks"},{id:"inbox",icon:"!",labelKey:"nav.inbox"},{id:"findings",icon:"◆",labelKey:"nav.findings"},{id:"analytics",icon:"▥",labelKey:"nav.analytics"},{id:"memory",icon:"◎",labelKey:"nav.memory"},{id:"release",icon:"▲",labelKey:"nav.release"},{id:"settings",icon:"⚙",labelKey:"nav.settings"}];

export function MissionSidebar({view,onChange,badges}:{view:MissionView;onChange:(view:MissionView)=>void;badges:Partial<Record<MissionView,number>>}){
  const {t}=useOfficeI18n();

  return <aside className="mission-nav">
    <div className="mission-brand">
      <i>AI</i>
      <div><strong>{t("office.title")}</strong><span></span></div>
    </div>
    <nav>
      {items.map(item=><button key={item.id} className={view===item.id?"active":""} onClick={()=>onChange(item.id)}>
        <b>{item.icon}</b><span>{t(item.labelKey)}</span>{badges[item.id]?<em>{badges[item.id]}</em>:null}
      </button>)}
    </nav>
    <div className="mission-nav-foot"><span>{t("office.stable").toUpperCase()} · v{packageJson.version}</span><strong>JeXiR</strong></div>
  </aside>;
}
