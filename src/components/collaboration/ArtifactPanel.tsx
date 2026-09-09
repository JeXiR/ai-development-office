"use client";
import {useOfficeI18n} from "@/i18n/officeI18n";
import {useCollaborationStore} from "@/store/useCollaborationStore";

export function ArtifactPanel(){const{t}=useOfficeI18n();
  const artifacts=useCollaborationStore(s=>s.artifacts);
  return <section className="panel artifact-panel">
    <div className="section-heading"><div><div className="eyebrow">{t("collab.artifacts").toUpperCase()}</div><h2>{t("collab.artifactsSubtitle")}</h2></div><span>{t("collab.artifactCount").replace("{n}",String(artifacts.length))}</span></div>
    <div className="artifact-list">
      {artifacts.slice(-12).reverse().map(a=><article key={a.id}>
        <div><strong>{a.title}</strong><small>{a.type} · {a.producerAgentId}</small></div>
        <code>{a.taskId||t("collab.noTaskId")}</code>
      </article>)}
      {!artifacts.length?<div className="workspace-empty">{t("collab.noArtifacts")}</div>:null}
    </div>
  </section>;
}
