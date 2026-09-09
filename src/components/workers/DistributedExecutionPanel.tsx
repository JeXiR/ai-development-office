"use client";
import {useState} from "react";
import {useOfficeStore} from "@/store/useOfficeStore";
import {useDistributedStore} from "@/store/useDistributedStore";
import {sendOffice} from "@/hooks/useOfficeSocket";
import {useOfficeI18n} from "@/i18n/officeI18n";
import {useWhenOfficeConnected} from "@/hooks/useWhenOfficeConnected";

const send=sendOffice;

export function DistributedExecutionPanel(){
  const {t}=useOfficeI18n();
  const projectId=useOfficeStore(s=>s.activeProjectId);
  const state=useDistributedStore();
  const [command,setCommand]=useState("npm test");
  const [tags,setTags]=useState("");
  const [selectedJob,setSelectedJob]=useState<string|null>(null);
  const [remotePath,setRemotePath]=useState("");

  const refresh=()=>projectId&&send({action:"distributed_snapshot",project_id:projectId});
  useWhenOfficeConnected(()=>{refresh();},[projectId]);

  const selected=state.jobs.find(x=>x.id===selectedJob)||null;

  return <section className="panel">
    <div className="section-heading">
      <div><div className="eyebrow">{t("distributed.eyebrow")}</div><h2>{t("distributed.title")}</h2></div>
      <div><button onClick={refresh}>{t("common.refresh")}</button><button onClick={()=>projectId&&send({action:"distributed_recover",project_id:projectId})}>{t("distributed.recover")}</button></div>
    </div>

    <div className="worker-cap-grid">
      {state.capabilities.map(c=><article key={c.workerId}><strong>{c.workerId}</strong><small>{c.kind} · {c.online?"online":"offline"}</small><span>{c.activeJobs}/{c.maxConcurrent} jobs · score {c.score}</span><em>{c.tags.join(" · ")||t("distributed.noTags")}</em></article>)}
    </div>

    <div className="distributed-compose">
      <input value={command} onChange={e=>setCommand(e.target.value)} />
      <input value={tags} onChange={e=>setTags(e.target.value)} placeholder={t("distributed.tags")}/>
      <button onClick={()=>projectId&&send({action:"distributed_job_create",project_id:projectId,command,required_tags:tags.split(",").map(x=>x.trim()).filter(Boolean),max_attempts:3})}>{t("distributed.queue")}</button>
      <button onClick={()=>projectId&&send({action:"distributed_run_next",project_id:projectId})}>{t("distributed.runNext")}</button>
    </div>

    <div className="distributed-job-list">
      {state.jobs.slice().reverse().map(j=><article key={j.id} className={selectedJob===j.id?"active":""} onClick={()=>{setSelectedJob(j.id);projectId&&send({action:"distributed_job_log",project_id:projectId,job_id:j.id});}}>
        <div><strong>{j.command}</strong><small>{j.workerId||"unassigned"} · attempt {j.attempt}/{j.maxAttempts}</small></div><span>{j.status}</span>
      </article>)}
    </div>

    {selected?<div className="distributed-detail">
      <strong>{selected.id}</strong>
      <pre>{state.logs[selected.id]||t("distributed.noLogs")}</pre>
      <div className="artifact-row">
        <input value={remotePath} onChange={e=>setRemotePath(e.target.value)} placeholder={t("distributed.artifactPlaceholder")}/>
        <button disabled={!selected.workerId||!remotePath} onClick={()=>projectId&&selected.workerId&&send({action:"distributed_artifact_pull",project_id:projectId,job_id:selected.id,worker_id:selected.workerId,remote_path:remotePath})}>{t("distributed.pullArtifact")}</button>
      </div>
      {selected.artifactPaths.length?<small>{selected.artifactPaths.join(" · ")}</small>:null}
    </div>:null}
  </section>;
}