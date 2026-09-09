export const CALLME_CANARY_MISSION={
  id:"callme-canary-readonly",
  title:"CallMe Autonomous Read-Only Canary",
  goal:[
    "Inspect the CallMe project architecture and current project docs.",
    "Do not modify project files.",
    "Identify the next safe unfinished task from ROADMAP/PROGRESS/PROJECT_STATE.",
    "Return the relevant files, current evidence, suggested agent capability and suggested validation command."
  ].join(" "),
  mode:"read-only",
  allowWrites:false,
  allowCommands:false
} as const;
