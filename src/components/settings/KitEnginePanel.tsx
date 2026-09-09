"use client";

import {useState} from "react";
import {getOfficeSocket,sendOffice} from "@/hooks/useOfficeSocket";
import {useWhenOfficeConnected} from "@/hooks/useWhenOfficeConnected";
import {useOfficeStore} from "@/store/useOfficeStore";
import {useOfficeI18n} from "@/i18n/officeI18n";

type Snapshot={
  installed:boolean;
  root:string|null;
  locationMode:"embedded"|"developer-override"|"missing";
  version:string|null;
  skills:Array<unknown>;
  commands:Array<unknown>;
  workflows:Array<unknown>;
  capabilities:Array<unknown>;
  compositions:Array<unknown>;
  warnings:string[];
};

export function KitEnginePanel(){
  const {t}=useOfficeI18n();
  const activeProjectId=useOfficeStore(s=>s.activeProjectId);
  const [snapshot,setSnapshot]=useState<Snapshot|null>(null);
  const [validation,setValidation]=useState<{ok:boolean;warnings:string[]}|null>(null);
  const [resolution,setResolution]=useState<any>(null);

  useWhenOfficeConnected(()=>{
    const socket=getOfficeSocket();
    if(!socket)return;
    const onMessage=(event:MessageEvent)=>{
      try{
        const m=JSON.parse(String(event.data));
        if(m.type==="kit_engine")setSnapshot(m.data);
        if(m.type==="kit_engine_validation")setValidation(m.data);
        if(m.type==="kit_project_resolution"&&m.projectId===activeProjectId)setResolution(m.data);
      }catch{}
    };
    socket.addEventListener("message",onMessage);
    sendOffice({action:"get_kit_engine"});
    return()=>socket.removeEventListener("message",onMessage);
  },[activeProjectId]);

  const send=(action:string)=>{
    sendOffice({action,project_id:activeProjectId});
  };

  return <section className="panel kit-engine-panel" data-help="kit-engine">
    <div className="section-heading">
      <div>
        <div className="eyebrow">{t("kit.eyebrow")}</div>
        <h2>{t("kit.title")}</h2>
      </div>
      <span>{snapshot?.installed?t("kit.online"):t("kit.missing")}</span>
    </div>

    <div className="office-kpis">
      <div><span>{t("kit.version")}</span><strong>{snapshot?.version||"—"}</strong><small>{t(`kit.mode.${snapshot?.locationMode||"missing"}`,snapshot?.locationMode||t("health.unknown"))}</small></div>
      <div><span>{t("kit.skills")}</span><strong>{snapshot?.skills?.length??0}</strong><small>{t("kit.embeddedSource")}</small></div>
      <div><span>{t("kit.commands")}</span><strong>{snapshot?.commands?.length??0}</strong><small>{t("kit.kitCommands")}</small></div>
      <div><span>{t("kit.workflows")}</span><strong>{snapshot?.workflows?.length??0}</strong><small>{t("kit.kitWorkflows")}</small></div>
      <div><span>{t("kit.capabilities")}</span><strong>{snapshot?.capabilities?.length??0}</strong><small>{t("kit.compositions").replace("{n}",String(snapshot?.compositions?.length??0))}</small></div>
    </div>

    <div className="skills-toolbar">
      <button onClick={()=>send("get_kit_engine")}>{t("settings.refreshKit")}</button>
      <button onClick={()=>send("validate_kit_engine")}>{t("settings.validateKit")}</button>
      <button onClick={()=>send("resolve_kit_project")} disabled={!activeProjectId}>{t("settings.resolveProject")}</button>
      <button onClick={()=>send("sync_kit_project")} disabled={!activeProjectId}>{t("settings.syncProject")}</button>
    </div>

    {validation?<p className="muted">{t("kit.validation")}: <strong>{validation.ok?t("kit.pass"):t("kit.fail")}</strong>{validation.warnings.length?` · ${validation.warnings.join(" · ")}`:""}</p>:null}
    {resolution?<p className="muted">{t("kit.resolved").replace("{n}",String(resolution.resolvedCapabilities?.length??0))}</p>:null}
    {snapshot?.warnings?.length?<p className="muted">{snapshot.warnings.join(" · ")}</p>:null}
    <code>{snapshot?.root||"engine/ai-development-kit"}</code>
  </section>;
}
