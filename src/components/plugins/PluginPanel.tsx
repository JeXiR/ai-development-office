"use client";
import {usePluginStore} from "@/store/usePluginStore";
import {sendOffice} from "@/hooks/useOfficeSocket";
import {useWhenOfficeConnected} from "@/hooks/useWhenOfficeConnected";
import {useOfficeI18n} from "@/i18n/officeI18n";

const send=sendOffice;

export function PluginPanel(){
  const {t}=useOfficeI18n();
  const plugins=usePluginStore(s=>s.plugins);

  useWhenOfficeConnected(()=>{
    send({action:"plugins_snapshot"});
  });

  return <section className="panel">
    <div className="section-heading">
      <div><div className="eyebrow">{t("plugins.eyebrow")}</div><h2>{t("plugins.title")}</h2></div>
      <button onClick={()=>send({action:"plugins_snapshot"})}>{t("common.refresh")}</button>
    </div>
    <div className="plugin-grid">
      {plugins.map(p=><article key={p.id}>
        <strong>{p.name}</strong>
        <small>{p.id} · v{p.version}</small>
        <p>{p.description}</p>
        <span>{p.permissions.join(", ")||t("common.none")}</span>
        {p.errors.length?<em>{p.errors.join(" · ")}</em>:null}
      </article>)}
      {!plugins.length?<div className="workspace-empty">{t("common.noData")}</div>:null}
    </div>
  </section>;
}
