"use client";

import { useState } from "react";
import { sendOffice } from "@/hooks/useOfficeSocket";
import { useActiveProjectState } from "@/hooks/useActiveProject";
import { useOfficeStore } from "@/store/useOfficeStore";
import { useOfficeI18n } from "@/i18n/officeI18n";
import type { RunnerProvider } from "@/types/office";

type CommandDef = {
  command: string;
  labelKey: string;
  hintKey: string;
  group: "project" | "audit" | "work" | "validation";
  mutates?: boolean;
};

const commands: CommandDef[] = [
  { command:"status",labelKey:"cmd.status",hintKey:"cmd.statusHint",group:"project" },
  { command:"sync state",labelKey:"cmd.sync",hintKey:"cmd.syncHint",group:"project" },
  { command:"review project",labelKey:"cmd.review",hintKey:"cmd.reviewHint",group:"project" },
  { command:"continue",labelKey:"cmd.continue",hintKey:"cmd.continueHint",group:"work",mutates:true },
  { command:"fix next",labelKey:"cmd.fixNext",hintKey:"cmd.fixNextHint",group:"work",mutates:true },
  { command:"check project readiness",labelKey:"cmd.readiness",hintKey:"cmd.readinessHint",group:"validation" },
  { command:"validate",labelKey:"cmd.validate",hintKey:"cmd.validateHint",group:"validation" },
  { command:"project coverage",labelKey:"cmd.coverage",hintKey:"cmd.coverageHint",group:"validation" },
  { command:"audit feature coverage",labelKey:"cmd.auditFeature",hintKey:"cmd.auditFeatureHint",group:"audit" },
  { command:"create missing work",labelKey:"cmd.createMissing",hintKey:"cmd.createMissingHint",group:"work",mutates:true },
  { command:"explain coverage frontend",labelKey:"cmd.explainFrontend",hintKey:"cmd.explainFrontendHint",group:"validation" },
  { command:"harvest project backlog",labelKey:"cmd.harvest",hintKey:"cmd.harvestHint",group:"audit" },
  { command:"audit frontend coverage",labelKey:"cmd.auditFrontend",hintKey:"cmd.auditFrontendHint",group:"audit" },
  { command:"audit backend coverage",labelKey:"cmd.auditBackend",hintKey:"cmd.auditBackendHint",group:"audit" },
  { command:"audit test gaps",labelKey:"cmd.auditTests",hintKey:"cmd.auditTestsHint",group:"audit" },
  { command:"audit security",labelKey:"cmd.auditSecurity",hintKey:"cmd.auditSecurityHint",group:"audit" },
  { command:"audit devops",labelKey:"cmd.auditDevops",hintKey:"cmd.auditDevopsHint",group:"audit" },
  { command:"find next work",labelKey:"cmd.findNext",hintKey:"cmd.findNextHint",group:"work" },
  { command:"recheck completed work",labelKey:"cmd.recheck",hintKey:"cmd.recheckHint",group:"validation" },
];

const groups = [
  ["project","cmd.group.project"],
  ["audit","cmd.group.audit"],
  ["work","cmd.group.work"],
  ["validation","cmd.group.validation"],
] as const;

const presets = [
  { command:"security sprint",labelKey:"cmd.preset.security",hintKey:"cmd.preset.securityHint" },
  { command:"frontend completion",labelKey:"cmd.preset.frontend",hintKey:"cmd.preset.frontendHint" },
  { command:"test gap sprint",labelKey:"cmd.preset.test",hintKey:"cmd.preset.testHint" },
  { command:"docs reconciliation",labelKey:"cmd.preset.docs",hintKey:"cmd.preset.docsHint" },
  { command:"release readiness",labelKey:"cmd.preset.release",hintKey:"cmd.preset.releaseHint" },
];

export function CommandCenter() {
  const {t} = useOfficeI18n();
  const state = useActiveProjectState();
  const runner = useOfficeStore((s) => s.runnerStatus);
  const projects = useOfficeStore((s) => s.projects);
  const project = projects.find((p) => p.id === state.projectId);
  const provider = project?.provider ?? "auto";
  const trusted = !!project?.runnerTrusted;
  const [expanded, setExpanded] = useState(true);

  const history = useOfficeStore((s) => s.commandHistory)
    .filter((item) => item.projectId === state.projectId)
    .slice(0, 12);

  const send = sendOffice;

  const trustWorkspace = () => {
    if (!project) return;
    const ok = window.confirm(t("cmd.trustConfirm").replace("{path}", project.path));
    if (ok) send({ action:"set_project_trust", project_id:state.projectId, trusted:true });
  };

  const run = (def: Pick<CommandDef,"command"|"labelKey"|"hintKey"|"group"|"mutates">) => {
    if (!trusted) { trustWorkspace(); return; }
    const label = t(def.labelKey);
    if (def.mutates && !window.confirm(t("cmd.writeConfirm").replace("{label}", label))) return;
    send({ action:"queue_command", project_id:state.projectId, command:def.command });
  };

  const cursorOnline = !!runner?.providers.cursor.available;
  const claudeOnline = !!runner?.providers.claude.available;
  const selectedAvailable =
    provider === "auto" ? cursorOnline || claudeOnline :
    provider === "cursor" ? cursorOnline : claudeOnline;

  return (
    <section className="command-hub panel">
      <div className="command-hub-top">
        <div>
          <div className="eyebrow">{t("cmd.eyebrow")}</div>
          <h2>{t("cmd.title")}</h2>
          <div className="muted">{t("cmd.subtitle")}</div>
        </div>

        <div className="command-meta">
          <select
            className="provider-select"
            value={provider}
            onChange={(e) => send({action:"set_project_provider",project_id:state.projectId,provider:e.target.value as RunnerProvider})}
          >
            <option value="auto">{t("cmd.autoRunner")}</option>
            <option value="cursor">Cursor</option>
            <option value="claude">Claude</option>
          </select>
          <span className={cursorOnline?"provider-ok":"provider-bad"}>CURSOR {cursorOnline?t("cmd.on"):t("cmd.off")}</span>
          <span className={claudeOnline?"provider-ok":"provider-bad"}>CLAUDE {claudeOnline?t("cmd.on"):t("cmd.off")}</span>
          <button className={`workspace-trust ${trusted?"trusted":"untrusted"}`} onClick={() =>
            trusted
              ? send({action:"set_project_trust",project_id:state.projectId,trusted:false})
              : trustWorkspace()
          }>
            {trusted?t("cmd.trusted"):t("cmd.trustWorkspace")}
          </button>
          <button className="command-collapse" onClick={() => setExpanded((v)=>!v)}>
            {expanded?t("cmd.compact"):t("cmd.expand")}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="command-groups">
          {groups.map(([group,labelKey]) => (
            <div className="command-group" key={group}>
              <div className="command-group-title">{t(labelKey)}</div>
              <div className="command-group-grid">
                {commands.filter((c)=>c.group===group).map((def)=>(
                  <button
                    key={def.command}
                    className={`mission-command ${def.mutates?"mission-command-write":""}`}
                    disabled={!selectedAvailable || state.projectId==="none"}
                    onClick={()=>run(def)}
                  >
                    <strong>{t(def.labelKey)}</strong>
                    <span>{t(def.hintKey)}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="workflow-presets">
        <div className="command-group-title">{t("cmd.presets")}</div>
        <div className="workflow-preset-grid">
          {presets.map((preset)=>(
            <button key={preset.command} className="workflow-preset"
              onClick={()=>run({...preset,group:"audit",mutates:false})}>
              <strong>{t(preset.labelKey)}</strong><span>{t(preset.hintKey)}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="command-queue-mini">
        <div className="command-queue-mini-title">{t("cmd.recent")}</div>
        {history.length===0 && <span className="muted">{t("cmd.noHistory")}</span>}
        {history.slice(0,6).map((item)=>(
          <div className="command-mini-row" key={item.id}>
            <b>#{item.queueSequence || "—"}</b>
            <span>{item.workItemId || item.findingId || item.command}{item.planPath ? " · PLAN ✓" : ""}</span>
            <i className={`queue-status queue-${item.status}`}>{item.status}</i>
          </div>
        ))}
      </div>
    </section>
  );
}
