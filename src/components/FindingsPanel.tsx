"use client";

import { useMemo, useState } from "react";
import { ViewportModal, modalAnchorFromEvent, type ModalAnchor } from "./ViewportModal";
import { sendOffice } from "@/hooks/useOfficeSocket";
import { useActiveProjectState } from "@/hooks/useActiveProject";
import { useOfficeStore } from "@/store/useOfficeStore";
import type { OfficeFinding } from "@/types/office";
import { useOfficeI18n } from "@/i18n/officeI18n";

type Tab = "open" | "fixed" | "all";

const send=sendOffice;

export function FindingsPanel() {
  const {t}=useOfficeI18n();
  const state = useActiveProjectState();
  const history = useOfficeStore((s) => s.commandHistory);
  const [tab, setTab] = useState<Tab>("open");
  const [selected, setSelected] = useState<OfficeFinding | null>(null);
  const [modalAnchor,setModalAnchor]=useState<ModalAnchor|null>(null);

  const findings = state.findings || [];
  const open = findings.filter((f) => f.status === "open" || f.status === "working");
  const fixed = findings.filter((f) => f.status === "fixed");
  const visible = tab === "open" ? open : tab === "fixed" ? fixed : findings;

  const detailCommands = useMemo(() => {
    if (!selected) return [];
    return history
      .filter((item) => item.projectId === state.projectId && item.findingId === selected.id)
      .sort((a,b) => b.createdAt.localeCompare(a.createdAt));
  }, [history, selected, state.projectId]);

  const fixOne = (finding: OfficeFinding) => {
    if (!window.confirm(t("findings.confirmOne").replace("{id}",finding.id).replace("{title}",finding.title))) return;
    send({
      action: "queue_finding",
      project_id: state.projectId,
      finding_id: finding.id,
      finding_title: finding.title,
    });
  };

  const fixAll = (severity?: string) => {
    const selectedFindings = severity ? open.filter((f) => f.severity === severity) : open;
    if (!selectedFindings.length) return;
    const label = severity ? t("findings.highCount").replace("{n}",String(selectedFindings.length)) : t("findings.openCount").replace("{n}",String(selectedFindings.length));
    if (!window.confirm(t("findings.confirmAll").replace("{label}",label))) return;
    send({
      action: "queue_findings",
      project_id: state.projectId,
      findings: selectedFindings.map((f) => ({ id:f.id, title:f.title, severity:f.severity })),
    });
  };

  return (
    <div className="panel findings-workbench">
      <div className="section-heading findings-head">
        <div>
          <div className="eyebrow">{t("findings.eyebrow")}</div>
          <h2>{t("findings.title")}</h2>
          <div className="muted">{t("findings.meta").replace("{open}",String(open.length)).replace("{fixed}",String(fixed.length))}</div>
        </div>
        <div className="finding-actions">
          <button className="mini-btn danger-soft" onClick={() => fixAll("HIGH")}>{t("findings.fixHigh")}</button>
          <button className="mini-btn" onClick={() => fixAll()}>{t("findings.fixOpen")}</button>
        </div>
      </div>

      <div className="finding-tabs">
        <button className={tab==="open"?"active":""} onClick={() => setTab("open")}>{t("findings.tabOpen").replace("{n}",String(open.length))}</button>
        <button className={tab==="fixed"?"active":""} onClick={() => setTab("fixed")}>{t("findings.tabFixed").replace("{n}",String(fixed.length))}</button>
        <button className={tab==="all"?"active":""} onClick={() => setTab("all")}>{t("findings.tabAll").replace("{n}",String(findings.length))}</button>
      </div>

      <div className="finding-list finding-list-v2">
        {visible.length === 0 && <div className="muted empty-workbench">{t("findings.empty")}</div>}
        {visible.map((finding) => (
          <div
            className={`finding finding-row-v2 finding-${finding.status}`}
            key={finding.id}
            onClick={(event) => {setModalAnchor(modalAnchorFromEvent(event));setSelected(finding);}}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === "Enter") setSelected(finding); }}
          >
            <span className={`severity severity-${finding.severity.toLowerCase()}`}>{finding.severity}</span>
            <div className="finding-copy">
              <div>
                <strong>{finding.id}</strong>
                <span>{finding.title}</span>
              </div>
              <small>
                {finding.status === "working"
                  ? t("findings.working").replace("{role}",finding.assignedRole || t("findings.assigned"))
                  : finding.status === "fixed"
                    ? `${t("findings.fixed")}${finding.fixedAt ? ` · ${new Date(finding.fixedAt).toLocaleString()}` : ""}`
                    : t("findings.open")}
              </small>
            </div>
            <div className="finding-row-actions">
              <span className={`finding-state state-${finding.status}`}>{finding.status}</span>
              {(finding.status === "open") && (
                <button
                  className="finding-fix"
                  onClick={(e) => { e.stopPropagation(); fixOne(finding); }}
                >
                  {t("findings.fix")}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <ViewportModal onClose={()=>setSelected(null)} anchor={modalAnchor} width={820} height={700} className="finding-detail-modal">
            <div className="modal-head">
              <div>
                <div className="eyebrow">{selected.severity} · {selected.status}</div>
                <h2>{selected.id} · {selected.title}</h2>
              </div>
              <button className="modal-close" onClick={() => setSelected(null)}>×</button>
            </div>

            <div className="finding-detail-grid">
              <div><span>{t("findings.status")}</span><strong>{selected.status}</strong></div>
              <div><span>{t("findings.role")}</span><strong>{selected.assignedRole || "—"}</strong></div>
              <div><span>{t("findings.firstSeen")}</span><strong>{selected.firstSeenAt ? new Date(selected.firstSeenAt).toLocaleString() : "—"}</strong></div>
              <div><span>{t("findings.fixedAt")}</span><strong>{selected.fixedAt ? new Date(selected.fixedAt).toLocaleString() : "—"}</strong></div>
            </div>

            {selected.lastResult && (
              <div className="finding-result">
                <span>{t("findings.lastResult")}</span>
                <p>{selected.lastResult}</p>
              </div>
            )}

            <div className="finding-timeline">
              <h3>{t("findings.history")}</h3>
              {detailCommands.length === 0 && <div className="muted">{t("findings.noHistory")}</div>}
              {detailCommands.map((item) => (
                <div className="timeline-item" key={item.id}>
                  <i />
                  <div>
                    <strong>{item.status} · {item.provider || "runner"}</strong>
                    <span>{new Date(item.createdAt).toLocaleString()} · {item.assignedRole || "CEO"}</span>
                    <p>{item.message || item.command}</p>
                  </div>
                </div>
              ))}
            </div>

            {selected.status === "open" && (
              <div className="modal-actions">
                <button className="primary-btn" onClick={() => { fixOne(selected); setSelected(null); }}>
                  {t("findings.assignCeo")}
                </button>
              </div>
            )}
        </ViewportModal>
      )}
    </div>
  );
}
