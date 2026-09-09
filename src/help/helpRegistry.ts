import {currentHelpLanguage,localizeHelp,type HelpUiLanguage} from "./helpI18n";

export type HelpContent={
  id?:string;
  title:string;
  purpose:string;
  how:string;
  impact?:string;
};

const exact:Record<string,HelpContent>={
  "refresh":{title:"Refresh",purpose:"Reloads the latest state for this panel.",how:"Requests a fresh snapshot from the Office bridge and updates the related store.",impact:"No project files are changed."},
  "save":{title:"Save",purpose:"Persists the current settings or record.",how:"Validates the current values and writes the related project or Office state.",impact:"May update persistent configuration."},
  "remove":{title:"Remove",purpose:"Removes the selected item from the current configuration.",how:"Sends a remove action to the relevant service and refreshes the panel.",impact:"The related configuration entry may be deleted."},
  "approve":{title:"Approve",purpose:"Approves the pending request, decision, waiver or release step.",how:"Records your approval and allows the guarded workflow to continue when all required approvals are present.",impact:"May unlock a protected action."},
  "reject":{title:"Reject",purpose:"Rejects the pending request or decision.",how:"Records the rejection and keeps the protected workflow blocked.",impact:"The related action will not proceed."},
  "run next":{title:"Run Next",purpose:"Starts the next queued distributed job.",how:"The scheduler chooses an online worker that matches the required tags and concurrency limits.",impact:"Runs a real local, SSH or Docker command when the project is trusted."},
  "queue job":{title:"Queue Job",purpose:"Adds a command to the distributed job queue.",how:"Creates a persistent job record. It does not execute until Run Next or an automation starts it.",impact:"No command runs immediately."},
  "semantic search":{title:"Semantic Search",purpose:"Searches Memory v2 by meaning, not only exact words.",how:"Combines lexical matching with the configured embedding/vector layer.",impact:"Updates memory access counters for returned records."},
  "create snapshot":{title:"Create Snapshot",purpose:"Creates a Git/recovery point before risky work.",how:"Records the current repository/state so it can be inspected or restored later.",impact:"Adds snapshot metadata; it does not publish changes."},
  "restore":{title:"Restore",purpose:"Restores the selected snapshot.",how:"Uses the recovery/Git layer to return state to the selected recovery point.",impact:"Current changes can be overwritten; confirmation is required."},
  "cherry-pick":{title:"Cherry-pick",purpose:"Applies a selected commit onto the current branch.",how:"Runs the guarded Git cherry-pick workflow with provenance tracking.",impact:"Can modify the working tree and may create conflicts."},
  "rollback":{title:"Rollback",purpose:"Moves repository state back toward the selected commit.",how:"Uses the selected rollback mode through the guarded Git service.",impact:"Can modify or discard changes; protected by trust/confirmation."},
  "build dynamic team":{title:"Build Dynamic Team",purpose:"Creates the agent roles needed for the described goal.",how:"Analyzes the goal and maps it to role/capability templates.",impact:"Creates planning state; it does not fabricate agent activity."},
  "choose provider":{title:"Choose Provider",purpose:"Selects the most suitable AI provider for the task.",how:"Scores provider health, task type, trust signals and budget preferences.",impact:"Returns a routing recommendation."},
  "classify":{title:"Classify Command",purpose:"Checks a command for destructive or risky patterns.",how:"Runs the Safety v2 classifier against known dangerous operations.",impact:"High-risk commands require approval before execution."},
  "test authorization":{title:"Test Authorization",purpose:"Shows whether the current safety policy would allow the operation.",how:"Evaluates permissions, sandbox profile and approval requirements.",impact:"This test does not execute the command itself."},
  "test ceilings":{title:"Test Ceilings",purpose:"Checks runtime, token and cost limits.",how:"Compares current usage to configured Safety v2 ceilings.",impact:"A real workflow can be stopped when a ceiling is exceeded."},
  "add memory":{title:"Add Memory",purpose:"Stores a durable project memory.",how:"Creates a Memory v2 record with scope, provenance, tags and semantic vector data.",impact:"Persists under the project’s .ai-kit memory state."},
  "prune":{title:"Prune",purpose:"Removes expired or low-retention memory/evidence state.",how:"Applies retention and decay rules to persistent records.",impact:"Old low-value records may be deleted."},
  "execute action":{title:"Execute Integration Action",purpose:"Runs the configured external integration action.",how:"Routes the request through the integration adapter with retry, masking and audit logging.",impact:"Can create or change data in an external service."},
  "add ci watch":{title:"Add CI Watch",purpose:"Creates a persistent watch for a CI status endpoint.",how:"Stores the endpoint and polling configuration for later checks.",impact:"Does not run continuously until the watch mechanism checks it."},
  "recover interrupted":{title:"Recover Interrupted",purpose:"Recovers jobs left running when Office stopped unexpectedly.",how:"Marks interrupted jobs for retry or failure based on their retry budget.",impact:"Does not silently rerun completed jobs."},
  "pull artifact":{title:"Pull Artifact",purpose:"Copies a build/test artifact from a worker.",how:"Uses local copy, SCP or docker cp depending on worker type.",impact:"Writes the artifact under the project’s .ai-kit worker artifact directory."},
  "launch installer":{title:"Launch Installer",purpose:"Opens the installer for the selected AI provider.",how:"Starts a visible PowerShell installation window.",impact:"May install software globally on the machine."},
  "run diagnostics":{title:"Run Diagnostics",purpose:"Checks whether Office prerequisites and versions are ready.",how:"Detects Node, npm, Git and other optional tools and compares package/manifest versions.",impact:"Read-only diagnostic operation."},
  "stage update":{title:"Stage Update",purpose:"Copies an update into a safe staging location.",how:"The staged copy is prepared before any live Office files are replaced.",impact:"Current Office installation is not changed yet."},
  "verify":{title:"Verify",purpose:"Verifies the staged update before application.",how:"Checks expected version metadata and staged package/manifest consistency.",impact:"Required before an update can be applied."},
  "create decision":{title:"Create Decision",purpose:"Creates a governance decision record.",how:"Stores the rationale, proposer and linked evidence in project governance state.",impact:"Does not become approved until a governance member approves it."},
  "add evidence":{title:"Add Evidence",purpose:"Adds test/build/runtime/manual evidence to governance.",how:"Stores the evidence record for release eligibility and audit review.",impact:"Can contribute to release sign-off readiness."},
  "create v2.0.0 sign-off":{title:"Create Release Sign-off",purpose:"Creates the final governance sign-off request for v2.0.0.",how:"Evaluates blockers, stable acceptance evidence and required approval count.",impact:"Stable remains blocked while required evidence or approvals are missing."},
  "verify audit chain":{title:"Verify Audit Chain",purpose:"Checks whether governance audit history is tamper-evident and intact.",how:"Recomputes the SHA-256 chain from genesis to the latest record.",impact:"Read-only verification."},
};

const titleRules:Array<[RegExp,(label:string)=>HelpContent]>=[
  [/dashboard|development office|office$/i,label=>({id:"nav.office",title:label,purpose:"Shows the project’s operational overview.",how:"Aggregates active project state, agents, tasks, findings and runtime status from shared stores.",impact:"Overview only unless you use an action inside the panel."})],
  [/workspace|çalışma alanı/i,label=>({id:"nav.workspace",title:label,purpose:"Main coding workspace for files, editor, terminal and Git changes.",how:"Reads project files and communicates with runtime sessions through the bridge.",impact:"Editing files or using terminal actions can change the project."})],
  [/collaboration|iş birliği/i,label=>({id:"nav.collaboration",title:label,purpose:"Coordinates Director plans, agent messages, shared decisions and handoffs.",how:"Uses collaboration state and runtime events to keep agents aligned.",impact:"Can create tasks, plans and agent-to-agent coordination records."})],
  [/projects|projeler/i,label=>({id:"nav.projects",title:label,purpose:"Manages registered development projects.",how:"Reads the Office project registry and active project selection.",impact:"Project removal from Office does not delete project source files."})],
  [/agents|ajanlar/i,label=>({id:"nav.agents",title:label,purpose:"Shows available AI agents, roles and capabilities.",how:"Combines registered project agents with runtime state.",impact:"Starting an agent may create a real provider/runtime session."})],
  [/skills|yetenekler/i,label=>({id:"nav.skills",title:label,purpose:"Shows reusable AI Development Kit capabilities.",how:"Reads discovered Kit skills/capabilities for the active project.",impact:"Skills guide agent behavior; viewing them is read-only."})],
  [/tasks|görevler/i,label=>({id:"nav.tasks",title:label,purpose:"Shows planned and active development work.",how:"Combines Director/project task state, dependencies and execution status.",impact:"Task actions can trigger agent execution."})],
  [/inbox|gelen kutusu/i,label=>({id:"nav.inbox",title:label,purpose:"Collects decisions, blockers and items that need attention.",how:"Reads project inbox/notification state and routes decisions back to the relevant workflow.",impact:"Approving or resolving an item may allow work to continue."})],
  [/findings|bulgular/i,label=>({id:"nav.findings",title:label,purpose:"Shows review, security, coverage and decision findings.",how:"Aggregates findings produced by audits, agents and validation workflows.",impact:"Resolving findings affects release readiness."})],
  [/analytics|analitik/i,label=>({id:"nav.analytics",title:label,purpose:"Shows execution, reliability, cost and coverage information.",how:"Aggregates runtime, ledger and project evidence.",impact:"Analytics is primarily read-only."})],
  [/memory|hafıza/i,label=>({id:"nav.memory",title:label,purpose:"Stores and retrieves durable project knowledge.",how:"Uses project-scoped memory records, provenance and semantic recall.",impact:"Saved memories can influence later agent context and routing."})],
  [/release|yayın|stable gate/i,label=>({id:"nav.release",title:label,purpose:"Controls release readiness and final Stable eligibility.",how:"Combines tests, Git evidence, governance and explicit acceptance.",impact:"Stable cannot be released until required gates pass."})],
  [/settings|ayarlar|connections|integrations|entegrasyon/i,label=>({id:"nav.settings",title:label,purpose:"Configures Office, providers, integrations, workers, plugins and safety behavior.",how:"Writes Office or project-scoped configuration depending on the panel.",impact:"Changes here can alter runtime behavior and external connectivity."})],
];

function alias(keys:string[],content:HelpContent){
  for(const key of keys)exact[key.trim().toLowerCase()]=content;
}

alias(["mission-runner","mission commands","mission.activity","live progress"],{
  title:"Mission runner",
  purpose:"Starts and tracks a Director mission for the active project.",
  how:"Write a goal, then start the mission. Live events appear as agents plan, ask for approval, work, test and review.",
  impact:"A real start can write into a trusted project. Empty goals do not run."
});
alias(["project-docs-intelligence","docs.title","project docs"],{
  title:"Project docs",
  purpose:"Reads README and kit docs to suggest the next safe piece of work.",
  how:"Scans project documents and can fill the mission goal from the next finding.",
  impact:"Read-only unless you start a mission from a suggestion."
});
alias(["final-acceptance","stable.title","son kabul kilidi","final acceptance lock","stable promotion gate"],{
  title:"Stable gate",
  purpose:"Keeps Stable locked until automated checks and your final acceptance pass.",
  how:"Review the gate rows, then accept only when evidence is honest and complete.",
  impact:"Acceptance is the last human lock before a Stable release."
});
alias(["approval-inbox","human decisions & blocked work"],{
  title:"Approval inbox",
  purpose:"Collects decisions and blockers that need a person.",
  how:"Approve, reject or retry the item. Finished and solo-blocked cards stay out of the badge count.",
  impact:"An approval can unblock a guarded workflow."
});
alias(["mission-history"],{
  title:"Mission history",
  purpose:"Shows recent missions and their outcomes.",
  how:"Newest items stay visible; older cards remain if they still need inbox attention.",
  impact:"History is a record. It does not restart a mission."
});
alias(["adaptive-routing"],{
  title:"Adaptive routing",
  purpose:"Chooses which provider or worker should take the next job.",
  how:"Scores health, tags, cost and trust, then recommends a route.",
  impact:"A recommendation does not run a job until you start one."
});
alias(["provider-assignment","agent routing policy","ajan yönlendirme politikası"],{
  title:"Agent routing",
  purpose:"Maps each agent role to a preferred AI provider.",
  how:"Change the role → provider pairs, then save.",
  impact:"Later missions use these providers for those roles."
});
alias(["universal-provider-runtime","ai provider runtime","ai sağlayıcı çalışma zamanı"],{
  title:"Provider runtime",
  purpose:"Shows which AI CLIs are installed and reachable.",
  how:"Office probes Cursor, Claude and other configured binaries.",
  impact:"Offline providers are skipped when routing work."
});
alias(["provider-streaming","provider stream monitor"],{
  title:"Provider streams",
  purpose:"Watches live token streams from the active provider.",
  how:"Open this while a mission runs to see partial output.",
  impact:"Read-only telemetry. It does not start a provider."
});
alias(["provider-credentials"],{
  title:"Provider credentials",
  purpose:"Stores API keys and login material for providers.",
  how:"Paste a key or connect an account, then save.",
  impact:"Secrets stay on this machine. They are sent only to that provider."
});
alias(["account-connections"],{
  title:"Account connections",
  purpose:"Links GitHub, chat and other accounts Office can use.",
  how:"Connect or disconnect a service from this list.",
  impact:"A connected account can create remote data when you run an action."
});
alias(["kit-engine","ai development kit"],{
  title:"AI Development Kit",
  purpose:"Loads project skills, adapters and kit manifests.",
  how:"Reads `.ai-kit` for the active project and lists usable capabilities.",
  impact:"Viewing the kit is read-only."
});
alias(["desktop-runtime"],{
  title:"Desktop runtime",
  purpose:"Shows the packaged Office desktop process and its project selection.",
  how:"Used when Office runs as a desktop app rather than only in the browser.",
  impact:"Changing the project here changes what the desktop window drives."
});
alias(["integration-readiness","unified system health","birleşik sistem sağlığı"],{
  title:"System health",
  purpose:"One checklist for providers, kit, git and recovery readiness.",
  how:"Each row is a probe. Red rows need a fix before a real mission.",
  impact:"Read-only. It does not change the project."
});
alias(["security-recovery","release safety gate","yayın güvenlik kapısı"],{
  title:"Release safety",
  purpose:"Blocks release when recovery or security evidence is missing.",
  how:"Review interrupted jobs, snapshots and safety flags before you ship.",
  impact:"A failed row keeps Stable locked."
});
alias(["callme-validation","callme autonomous validation","callme otonom doğrulama"],{
  title:"CallMe validation",
  purpose:"Runs read-only checks against the CallMe acceptance project.",
  how:"Uses the registered CallMe path. It does not start a write mission by itself.",
  impact:"Validation may read CallMe files. It should not edit them unless you start a mission."
});
alias(["provider usage & latency telemetry","cost / token ledger","cost ledger"],{
  title:"Cost ledger",
  purpose:"Shows token use, estimated spend and average latency per provider.",
  how:"Office records each provider call for the active project. Refresh reloads the snapshot.",
  impact:"Read-only. Refresh does not call a paid model."
});
alias(["project skills & capability mapping","skills hub"],{
  title:"Skills hub",
  purpose:"Lists kit skills and project adapters the agents can use.",
  how:"The list refreshes when the project or bridge connection changes.",
  impact:"Viewing skills is read-only."
});
alias(["queued task control","kuyruk görevi kontrolü","steuerung der warteschlange","управление очередью задач"],{
  title:"Queue",
  purpose:"Holds tasks that are waiting for a worker.",
  how:"Use Run Next or an automation to start the first matching job.",
  impact:"A start can run a real local, SSH or Docker command on a trusted project."
});
alias(["team presence"],{
  title:"Team presence",
  purpose:"Shows which agents are online and what they last claimed.",
  how:"Presence comes from the project roster and live runtime events.",
  impact:"Read-only unless you open an agent action."
});
alias(["recurring read-only checks","scheduled audits","zamanlanmış denetimler","tekrarlayan salt okunur kontroller"],{
  title:"Scheduled audits",
  purpose:"Repeats read-only quality and security checks.",
  how:"Each audit writes findings. It does not merge or deploy.",
  impact:"Findings can block release until you resolve them."
});
alias(["ready work","hazır iş","bereite arbeit","готовая работа"],{
  title:"Ready Work",
  purpose:"Lists TODO work waiting to be assigned.",
  how:"Open a card or assign it collaboratively to queue it.",
  impact:"Assigning can give the CEO a real task."
});
alias(["active work","aktif iş","aktive arbeit","активная работа"],{
  title:"Active Work",
  purpose:"Shows work that is currently executing.",
  how:"Cards move from ready to active as agents pick them up.",
  impact:"Opening a card shows detail. It does not stop the work."
});
alias(["activity stream","aktivite akışı","aktivitätsstrom","поток активности"],{
  title:"Activity Stream",
  purpose:"Shows live runtime events.",
  how:"Newest events stay at the top.",
  impact:"Read-only telemetry."
});
alias(["execution boundaries","yürütme sınırları","ausführungsgrenzen","границы выполнения"],{
  title:"Execution boundaries",
  purpose:"Shows subtask contracts and file ownership.",
  how:"Check which role may write which files.",
  impact:"An ownership clash can block merge."
});
alias(["execution order & blocked work","yürütme sırası ve engelli iş","ausführungsreihenfolge & blockierte arbeit","порядок выполнения и заблокированная работа"],{
  title:"Execution order & blocked work",
  purpose:"Shows task order and dependency blocks.",
  how:"Look at waiting and blocked nodes on the graph.",
  impact:"The next job does not start until its dependency is cleared."
});
alias(["lead, coding collaborators & verification","lider, kod iş birlikçileri ve doğrulama","lead, coding-mitarbeitende & prüfung","лид, код-участники и проверка"],{
  title:"Lead, coding collaborators & verification",
  purpose:"Shows who writes, who reviews and who verifies a task.",
  how:"Read lead, collaborator and verifier status.",
  impact:"Merge stays blocked until verification passes."
});
alias(["plan → collaborate → isolate → execute → merge → verify → re-audit","quality gate v3","kalite kapısı v3","planla → iş birliği → izole et → çalıştır → birleştir → doğrula → yeniden denetle"],{
  title:"Quality gate",
  purpose:"The required path from plan to merge and re-audit.",
  how:"Work must pass each stage. A failed verify or re-audit sends the item back.",
  impact:"Skipping a stage keeps merge blocked."
});
alias(["security & quality findings"],{
  title:"Findings",
  purpose:"Review, security, coverage and decision issues for the project.",
  how:"Open a finding to see evidence. Resolving it updates release readiness.",
  impact:"Open findings can keep Stable locked."
});
alias(["roles, decisions, evidence, waivers & release sign-off","roller, kararlar, kanıt, muafiyet ve yayın imzası"],{
  title:"Governance",
  purpose:"Records who decided what, with evidence, before release.",
  how:"Add a decision or evidence, then collect the required approvals.",
  impact:"Sign-off is blocked while evidence or approvals are missing."
});
alias(["office control-plane snapshot","office kontrol düzlemi anlık görüntüsü"],{
  title:"Office backup",
  purpose:"Exports Office settings, history and audit — not project source.",
  how:"Creates a control-plane snapshot you can keep or restore later.",
  impact:"Project source files are not copied."
});
alias(["release blocked","ready to release","not ready","yayın engelli","yayına hazır"],{
  title:"Release status",
  purpose:"Says whether every mandatory Office release check currently passes.",
  how:"Read the failing rows, fix them, then refresh.",
  impact:"A blocked gate prevents the final Git release action."
});
alias(["gate checks","kapı kontrolleri"],{
  title:"Gate checks",
  purpose:"The individual proofs behind the release decision.",
  how:"Each row is a test, git, integrity or acceptance check.",
  impact:"Any failed row keeps release blocked."
});
alias(["final git action","son git işlemi"],{
  title:"Final Git action",
  purpose:"The last explicit Git step after gates pass.",
  how:"Choose the action yourself. Office will not push or tag silently.",
  impact:"This can create a commit, tag or release in the Office repo."
});
alias(["interrupted & stale runtime","kesilen ve bayat runtime"],{
  title:"Recovery",
  purpose:"Finds jobs left running when Office stopped.",
  how:"Resume or discard each interrupted command.",
  impact:"Resume may retry real work. Discard only clears the recovery record."
});
alias(["artifact lifecycle","artefakt yaşam döngüsü"],{
  title:"Retention",
  purpose:"How long reports, audit logs and worktrees are kept.",
  how:"Change the day counts, then run cleanup.",
  impact:"Cleanup deletes old Office artifacts, not project source."
});
alias(["who · what · why · outcome","kim · ne · neden · sonuç"],{
  title:"Audit trail",
  purpose:"A chronological record of who did what and what happened.",
  how:"Refresh to pull the latest audit rows.",
  impact:"Read-only."
});
alias(["add another project","add project"],{
  title:"Add project",
  purpose:"Registers another folder with Office.",
  how:"Pick a folder. Existing projects stay registered.",
  impact:"Office never deletes project source files from this action."
});
alias(["prerequisites, provider setup, staged updates & rollback","installer","installer-desktop"],{
  title:"Installer",
  purpose:"Checks tools, installs providers and stages Office updates.",
  how:"Run diagnostics first. Stage an update before replacing live files.",
  impact:"Install and apply can change software on this machine."
});
alias(["runtime, permissions, hooks, tools, triggers & ui contributions","office plugin sdk","çalışma zamanı, izinler, kancalar, araçlar, tetikleyiciler ve ui katkıları"],{
  title:"Plugins",
  purpose:"Loads Office plugins and the permissions they asked for.",
  how:"Enable a plugin only if you trust its hooks and tools.",
  impact:"A plugin can add UI and run tools you grant it."
});
alias(["görev akışı","task flow"],{
  title:"Task flow",
  purpose:"Shows ready and active work for the current project.",
  how:"Cards move from ready to active as agents pick them up.",
  impact:"Opening a card can assign or start work."
});
alias(["office visual theme","ofis görsel teması","pixel office themes","setup-wizard","setup wizard","kurulum sihirbazı"],{
  title:"Office theme",
  purpose:"Changes how the live pixel floor looks: colors, desks and lighting.",
  how:"Pick a card. Office draws the look itself. Paid itch.io sprite packs are not installed.",
  impact:"Only the office view changes. Project files are not touched."
});
alias(["pixel.title","pixel.subtitle","live office floor","pixel office","pixel ofis","live agent workspace","canlı ajan çalışma alanı","live-arbeitsbereich der agenten"],{
  title:"Pixel office",
  purpose:"Shows agents at their desks, walking between rooms and talking.",
  how:"Click an agent to open that desk. Type or speak a task. The agent reports it to the CEO, who assigns the right specialist — the clicked desk may be wrong.",
  impact:"Send to CEO starts Office work on the active project. The CEO picks who runs it."
});
alias(["agent desk chat","ajan masa sohbeti","floor wire","kat teli","kat telli"],{
  title:"Agent desk chat",
  purpose:"Live transcript of agents talking to each other from real office facts.",
  how:"Read the right-side log. Pause if you need the thread still. New findings and failed gates start a new turn.",
  impact:"Read-only. It does not start missions or write project files."
});

export function helpFor(label:string,kind:"button"|"checkbox"|"input"|"select"|"heading"|"status",lang:HelpUiLanguage=currentHelpLanguage()):HelpContent{
  const clean=label.trim().replace(/\s+/g," ").replace(/\s+\d+$/,"");
  const key=clean.toLowerCase();
  let content:HelpContent|null=exact[key]||null;

  if(!content){
    for(const [re,fn] of titleRules){
      if(re.test(clean)){content=fn(clean);break;}
    }
  }

  if(!content&&kind==="checkbox"){
    content={
      title:clean||"Option",
      purpose:`Turns "${clean||"this option"}" on or off.`,
      how:"When checked, the related feature/policy is enabled; when unchecked it is disabled.",
      impact:"The effect is limited to the panel or project configuration that owns this option."
    };
  }else if(!content&&kind==="select"){
    content={
      title:clean||"Selection",
      purpose:`Chooses the value used for "${clean||"this setting"}".`,
      how:"The selected option is passed to the related workflow or persisted setting.",
      impact:"Changing the selection does not run an action until the related Save/Run button is used, unless the control explicitly says otherwise."
    };
  }else if(!content&&kind==="input"){
    content={
      title:clean||"Input",
      purpose:`Provides the value for "${clean||"this field"}".`,
      how:"The entered value is used by the related action or saved configuration.",
      impact:"Typing alone normally does not execute a workflow."
    };
  }else if(!content&&kind==="heading"){
    content={
      title:clean||"Section",
      purpose:"This panel groups related Office status and actions.",
      how:"Read the values under this heading, then use the nearby buttons. Each control has its own i.",
      impact:"The heading itself does not change the project."
    };
  }else if(!content&&kind==="status"){
    content={
      title:clean||"Status",
      purpose:"Shows the current state of this item.",
      how:"The value is derived from the related project/runtime/store state.",
      impact:"Status indicators are read-only."
    };
  }else if(!content){
    content={
      title:clean||"Action",
      purpose:`Runs the "${clean||"selected"}" action.`,
      how:"The action is routed through the current panel to the Office bridge/service that owns this workflow.",
      impact:"The exact effect depends on the active project and the safety/trust policy."
    };
  }

  return localizeHelp(content,lang);
}
