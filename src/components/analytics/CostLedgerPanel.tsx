"use client";
import {useOfficeStore} from "@/store/useOfficeStore";
import {useLedgerStore} from "@/store/useLedgerStore";
import {sendOffice} from "@/hooks/useOfficeSocket";
import {useWhenOfficeConnected} from "@/hooks/useWhenOfficeConnected";
import {useOfficeI18n} from "@/i18n/officeI18n";

const send=sendOffice;

export function CostLedgerPanel(){
  const {t}=useOfficeI18n();
  const projectId=useOfficeStore(s=>s.activeProjectId);
  const summary=useLedgerStore(s=>s.summary);
  const entries=useLedgerStore(s=>s.entries);

  useWhenOfficeConnected(()=>{
    if(projectId)send({action:"ledger_snapshot",project_id:projectId});
  },[projectId]);

  return <section className="panel" data-help="provider usage & latency telemetry">
    <div className="section-heading">
      <div><div className="eyebrow">{t("ledger.eyebrow")}</div><h2>{t("ledger.title")}</h2></div>
      <button disabled={!projectId} onClick={()=>projectId&&send({action:"ledger_snapshot",project_id:projectId})}>{t("common.refresh")}</button>
    </div>

    <div className="ledger-kpis">
      <article><strong>{t("ledger.entries")}</strong><span>{summary?.entries??0}</span></article>
      <article><strong>{t("ledger.tokens")}</strong><span>{summary?.totalTokens??0}</span></article>
      <article><strong>{t("ledger.cost")}</strong><span>${(summary?.totalCostUsd??0).toFixed(4)}</span></article>
    </div>

    <div className="ledger-provider-grid">
      {Object.entries(summary?.byProvider||{}).map(([provider,row])=><article key={provider}>
        <strong>{provider}</strong>
        <small>{t("ledger.entryMeta").replace("{n}",String(row.entries)).replace("{tokens}",String(row.tokens))}</small>
        <span>${row.costUsd.toFixed(4)} · {row.avgLatencyMs===null?"—":`${row.avgLatencyMs} ms`}</span>
      </article>)}
    </div>

    <div className="ledger-entries">
      {entries.slice(-12).reverse().map(e=><article key={e.id}>
        <strong>{e.provider} · {e.agentId}</strong>
        <small>{t("ledger.tokenCount").replace("{n}",String(e.totalTokens))} · ${e.estimatedCostUsd.toFixed(4)} · {e.durationMs??"—"} ms</small>
      </article>)}
      {!entries.length?<div className="workspace-empty">{t("ledger.empty")}</div>:null}
    </div>
  </section>;
}
