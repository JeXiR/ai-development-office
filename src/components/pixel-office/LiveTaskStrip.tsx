"use client";
import {useOfficeI18n} from "@/i18n/officeI18n";
import {useCollaborationStore} from "@/store/useCollaborationStore";

export function LiveTaskStrip(){
  const {t}=useOfficeI18n();
  const tasks=useCollaborationStore(s=>s.tasks);
  const rows=tasks.filter(task=>["planned","queued","working","blocked"].includes(task.status)).slice(-8);
  return <section className="panel live-task-strip">
    <div className="section-heading">
      <div>
        <div className="eyebrow">{t("pixel.liveTasks").toUpperCase()}</div>
        <h2>{t("pixel.taskFlow")}</h2>
      </div>
      <span>{t("pixel.activeCount").replace("{n}",String(rows.length))}</span>
    </div>
    <div className="live-task-row">
      {rows.map(task=><article key={task.id} className={`task-${task.status}`}>
        <strong>{task.title}</strong>
        <small>{task.assignedAgentId||task.assignedRole} · {t(`office.${task.status}`,task.status)}</small>
        <i><u style={{width:task.status==="working"?"60%":task.status==="queued"?"20%":task.status==="blocked"?"45%":"10%"}}/></i>
      </article>)}
      {!rows.length?<div className="workspace-empty">{t("pixel.noTasks")}</div>:null}
    </div>
  </section>;
}
