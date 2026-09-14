"use client";

import { useMemo, useState } from "react";
import { useOfficeSocket } from "@/hooks/useOfficeSocket";
import { useActiveFeatureContracts, useActiveProjectState, useActiveProjectWorkbench } from "@/hooks/useActiveProject";
import { MissionSidebar, type MissionView } from "./MissionSidebar";
import { MissionTopBar } from "./MissionTopBar";
import { OfficeOverview } from "./OfficeOverview";
import { TeamPanel } from "./TeamPanel";
import { OrganizationPanel } from "./OrganizationPanel";
import { AgentTrustPanel } from "./AgentTrustPanel";
import { AgentAnalyticsPanel } from "./AgentAnalyticsPanel";
import { OperationsBoard } from "./OperationsBoard";
import { CommandCenter } from "./CommandCenter";
import { QualityGatePanel } from "./QualityGatePanel";
import { CoordinationPanel } from "./CoordinationPanel";
import { FindingsPanel } from "./FindingsPanel";
import { ProjectCoveragePanel } from "./ProjectCoveragePanel";
import { DecisionCenter } from "./DecisionCenter";
import { MemoryPanel } from "./MemoryPanel";
import { MemoryV2Panel } from "./memory/MemoryV2Panel";
import { IntegrationsV2Panel } from "./integrations/IntegrationsV2Panel";
import { DistributedExecutionPanel } from "./workers/DistributedExecutionPanel";
import { InstallerDesktopPanel } from "./settings/InstallerDesktopPanel";
import { KitEnginePanel } from "./settings/KitEnginePanel";
import { UniversalProvidersPanel } from "./settings/UniversalProvidersPanel";
import { ProviderCredentialsPanel } from "./settings/ProviderCredentialsPanel";
import { AccountConnectionsPanel } from "./settings/AccountConnectionsPanel";
import { ProviderStreamingPanel } from "./settings/ProviderStreamingPanel";
import { DesktopRuntimePanel } from "./settings/DesktopRuntimePanel";
import { IntegrationReadinessPanel } from "./settings/IntegrationReadinessPanel";
import { CallMeValidationPanel } from "./settings/CallMeValidationPanel";
import { SecurityRecoveryPanel } from "./settings/SecurityRecoveryPanel";
import { FinalAcceptancePanel } from "./release/FinalAcceptancePanel";
import { ProviderAssignmentPanel } from "./settings/ProviderAssignmentPanel";
import { MissionHistoryPanel } from "./MissionHistoryPanel";
import { MissionRunner } from "./MissionRunner";
import { ProjectDocsIntelligencePanel } from "./ProjectDocsIntelligencePanel";
import { AdaptiveRoutingPanel } from "./AdaptiveRoutingPanel";
import { ApprovalInboxPanel } from "./ApprovalInboxPanel";
import { PluginSdkPanel } from "./plugins/PluginSdkPanel";
import { GovernancePanel } from "./governance/GovernancePanel";
import { ToastCenter } from "./ux/ToastCenter";
import { ModalHost } from "./ux/ModalHost";
import { CommandPaletteV2 } from "./ux/CommandPaletteV2";
import { GlobalContextHelp } from "./help/GlobalContextHelp";
import { TaskDagPanel } from "./collaboration/TaskDagPanel";
import { ScheduledAuditsPanel } from "./ScheduledAuditsPanel";
import { ProjectsManager } from "./ProjectsManager";
import { MultiProjectOverview } from "./MultiProjectOverview";
import { SkillsHub } from "./SkillsHub";
import { DependencyGraphPanel } from "./DependencyGraphPanel";
import { CollaborationGraphPanel } from "./CollaborationGraphPanel";
import { ProductionHardeningPanel } from "./ProductionHardeningPanel";
import { SafetyControlPanel } from "./safety/SafetyControlPanel";
import { ProviderEnginePanel } from "./providers/ProviderEnginePanel";
import { OnboardingWizard } from "./onboarding/OnboardingWizard";
import { PrerequisitesPanel } from "./onboarding/PrerequisitesPanel";
import { UpdaterPanel } from "./updater/UpdaterPanel";
import { SetupControlsPanel } from "./onboarding/SetupControlsPanel";
import { AutomationPanel } from "./automation/AutomationPanel";
import { CostLedgerPanel } from "./analytics/CostLedgerPanel";
import { PluginPanel } from "./plugins/PluginPanel";
import { GitIntelligencePanel } from "./git/GitIntelligencePanel";
import { ReproducibilityPanel } from "./reproducibility/ReproducibilityPanel";
import { IntegrationsPanel } from "./integrations/IntegrationsPanel";
import { WorkersPanel } from "./workers/WorkersPanel";
import { SessionReplayPanel } from "./replay/SessionReplayPanel";
import { DisasterRecoveryPanel } from "./recovery/DisasterRecoveryPanel";
import { StableGatePanel } from "./release/StableGatePanel";
import { GitCodeIntelligencePanel } from "./git/GitCodeIntelligencePanel";
import { AutonomyPanel } from "./autonomy/AutonomyPanel";
import { SafetyV2Panel } from "./safety/SafetyV2Panel";

import { SubtaskContractPanel } from "./SubtaskContractPanel";
import { CommandPalette } from "./CommandPalette";
import { DecisionInbox } from "./DecisionInbox";
import { NotificationCenter } from "./NotificationCenter";
import { ReleaseCenter } from "./ReleaseCenter";
import { OfficeThemeSettings } from "./OfficeThemeSettings";
import { QueueManager } from "./QueueManager";
import packageJson from "../../package.json";
import { OfficeI18nProvider, type OfficeUiLanguage, useOfficeI18n } from "@/i18n/officeI18n";
import { WorkspaceView } from "./workspace/WorkspaceView";
import { CollaborationView } from "./collaboration/CollaborationView";
import { useOfficeStore } from "@/store/useOfficeStore";
import { LocalizedViewHeading } from "./LocalizedViewHeading";
import { inboxAttentionCount } from "@/lib/inbox-attention";

function OfficeFooter(){
  const {t}=useOfficeI18n();
  return <footer>{t("office.title")} v{packageJson.version} · {t("footer.alpha")} · {t("footer.builtBy")}</footer>;
}

export function OfficeDashboard({initialLanguage}:{initialLanguage?:OfficeUiLanguage}={}){
  useOfficeSocket();
  const [view,setView]=useState<MissionView>("office");
  const state=useActiveProjectState();
  const wb=useActiveProjectWorkbench();
  const history=useOfficeStore(s=>s.commandHistory);
  const recovery=useOfficeStore(s=>s.recovery);
  const features=useActiveFeatureContracts();
  const activeProjectId=useOfficeStore(s=>s.activeProjectId);

  const taskBadge=useMemo(()=>history.filter(c=>c.projectId===activeProjectId&&["queued","waiting_for_agent","running","planning","verifying"].includes(c.status)).length,[history,activeProjectId]);
  const findingBadge=state.findings.filter(f=>f.status==="open"||f.status==="working").length;
  const inboxBadge=useMemo(()=>inboxAttentionCount({
    projectId:activeProjectId,
    history,
    openQuestions:features.contracts.flatMap(c=>c.questions.filter(q=>q.status==="open")).length,
    interrupted:recovery?.interrupted||[]
  }),[history,activeProjectId,features.contracts,recovery]);

  return <OfficeI18nProvider initialLanguage={initialLanguage}><main className="mission-shell">
    <MissionSidebar view={view} onChange={setView} badges={{tasks:taskBadge,inbox:inboxBadge,findings:findingBadge,agents:state.agents.length}}/>
    <div className="mission-workspace">
      <MissionTopBar/>
      <section className="mission-view">
        {view==="office"&&<><OfficeOverview/><MissionRunner/><ProjectDocsIntelligencePanel/></>}
        {view==="workspace"&&<><LocalizedViewHeading titleKey="heading.workspace"/><WorkspaceView/></>}
        {view==="collaboration"&&<><LocalizedViewHeading titleKey="heading.collaboration"/><CollaborationView/><TaskDagPanel/></>}
        {view==="projects"&&<><LocalizedViewHeading titleKey="heading.projects"/><MultiProjectOverview/><ProjectsManager/></>}
        {view==="agents"&&<><LocalizedViewHeading titleKey="heading.agents"/><div className="two-col"><TeamPanel/><div><OrganizationPanel/><AgentTrustPanel/></div></div></>}
        {view==="skills"&&<><LocalizedViewHeading titleKey="heading.skills"/><SkillsHub/></>}
        {view==="tasks"&&<><LocalizedViewHeading titleKey="heading.tasks"/><CommandCenter/><QueueManager/><CoordinationPanel/><AdaptiveRoutingPanel/><SubtaskContractPanel/><DependencyGraphPanel/><CollaborationGraphPanel/><OperationsBoard/><QualityGatePanel/></>}
        {view==="inbox"&&<><LocalizedViewHeading titleKey="heading.inbox"/><DecisionInbox/><NotificationCenter/></>}
        {view==="findings"&&<><LocalizedViewHeading titleKey="heading.findings"/><ProjectCoveragePanel/><DecisionCenter/><FindingsPanel/></>}
        {view==="analytics"&&<><LocalizedViewHeading titleKey="heading.analytics"/><div className="two-col analytics-layout"><AgentAnalyticsPanel/><AgentTrustPanel/></div><CostLedgerPanel/><ProjectCoveragePanel/></>}
        {view==="memory"&&<><LocalizedViewHeading titleKey="heading.memory"/><MemoryV2Panel/><MemoryPanel/><DecisionCenter/></>}
        {view==="release"&&<><LocalizedViewHeading titleKey="heading.release"/><FinalAcceptancePanel/><StableGatePanel/><ReleaseCenter/><GitIntelligencePanel/><GitCodeIntelligencePanel/><GovernancePanel/><SessionReplayPanel/></>}
        {view==="settings"&&<><LocalizedViewHeading titleKey="heading.settings"/><OfficeThemeSettings/><SecurityRecoveryPanel/><CallMeValidationPanel/><IntegrationReadinessPanel/><DesktopRuntimePanel/><KitEnginePanel/><AccountConnectionsPanel/><ProviderCredentialsPanel/><UniversalProvidersPanel/><ProviderAssignmentPanel/><MissionHistoryPanel/><ApprovalInboxPanel/><ProviderStreamingPanel/><SetupControlsPanel/><InstallerDesktopPanel/><PluginSdkPanel/><AutonomyPanel/><SafetyV2Panel/><IntegrationsV2Panel/><DistributedExecutionPanel/><ReproducibilityPanel/><DisasterRecoveryPanel/><AutomationPanel/><IntegrationsPanel/><WorkersPanel/><PrerequisitesPanel/><ProviderEnginePanel/><PluginPanel/><UpdaterPanel/><SafetyControlPanel/><ProductionHardeningPanel/><ScheduledAuditsPanel/><OrganizationPanel/></>}
      </section>
      <OfficeFooter/>
    </div>
  </main><OnboardingWizard/><CommandPalette onNavigate={setView}/><ToastCenter/><ModalHost/><CommandPaletteV2/><GlobalContextHelp/></OfficeI18nProvider>;
}
