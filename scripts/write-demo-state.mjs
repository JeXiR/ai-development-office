import fs from "node:fs";
import path from "node:path";

const projectPath = process.argv[2] || process.cwd();
const aiKit = path.join(projectPath, ".ai-kit");
fs.mkdirSync(aiKit, { recursive: true });

const state = {
  projectId: path.basename(projectPath),
  projectName: path.basename(projectPath),
  milestone: "Stability / test hardening",
  activeTask: "Review project",
  health: "warning",
  roadmapPercent: 78,
  counts: { done: 42, partial: 6, todo: 9, bugs: 5, blockers: 0 },
  findings: [
    { id: "H6", severity: "HIGH", title: "Widget conversation binding", status: "open" },
    { id: "H10", severity: "HIGH", title: "Password in Inertia props", status: "open" }
  ],
  agents: [
    { id: "ceo", role: "CEO", status: "planning", task: "Coordinate project" },
    { id: "pm", role: "PM", status: "reading", task: "Read roadmap" },
    { id: "architect", role: "Architect", status: "reviewing", task: "Architecture audit" },
    { id: "backend", role: "Backend", status: "working", task: "Laravel review" },
    { id: "frontend", role: "Frontend", status: "idle" },
    { id: "database", role: "Database", status: "reading", task: "Migration audit" },
    { id: "qa", role: "QA", status: "testing", task: "Test suite" },
    { id: "security", role: "Security", status: "reviewing", task: "Security audit" },
    { id: "devops", role: "DevOps", status: "waiting" },
    { id: "docs", role: "Docs", status: "reading", task: "Sync state" }
  ]
};

fs.writeFileSync(path.join(aiKit, "office-state.json"), JSON.stringify(state, null, 2));
console.log("Demo office-state.json written.");
