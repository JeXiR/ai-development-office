"use client";
import {useUxStore} from "@/store/useUxStore";
import {useOfficeStore} from "@/store/useOfficeStore";
import {sendOffice} from "@/hooks/useOfficeSocket";
import {useOfficeI18n} from "@/i18n/officeI18n";

export function WorkspaceTabs(){
  const {t}=useOfficeI18n();
  const projectId=useOfficeStore(s=>s.activeProjectId);
  const tabs=useUxStore(s=>s.tabs);
  const active=useUxStore(s=>s.activeTabId);
  const setActive=useUxStore(s=>s.setActiveTab);
  const close=useUxStore(s=>s.closeTab);
  const split=useUxStore(s=>s.split);
  const setSplit=useUxStore(s=>s.setSplit);

  const openTab=(tabId:string)=>{
    setActive(tabId);
    const tab=tabs.find(x=>x.id===tabId);
    if(projectId&&tab?.kind==="file"&&tab.resource)sendOffice({action:"workspace_read",project_id:projectId,path:tab.resource});
  };

  return <div className="workspace-tabs">
    <div className="workspace-tab-strip">
      {tabs.map(tab=><button key={tab.id} className={active===tab.id?"active":""} onClick={()=>openTab(tab.id)}><span>{tab.title}</span><i onClick={e=>{e.stopPropagation();close(tab.id);}}>×</i></button>)}
    </div>
    <button className="split-toggle" onClick={()=>setSplit({enabled:!split.enabled,primaryTabId:active,secondaryTabId:split.enabled?null:tabs.find(x=>x.id!==active)?.id||null})}>{split.enabled?t("ux.single"):t("ux.split")}</button>
  </div>;
}