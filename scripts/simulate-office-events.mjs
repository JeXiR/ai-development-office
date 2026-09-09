import fs from "node:fs";
import path from "node:path";

const projectPath = process.argv[2] || process.cwd();
const aiKit = path.join(projectPath, ".ai-kit");
const target = path.join(aiKit, "events.jsonl");

fs.mkdirSync(aiKit, { recursive: true });

const roles = [
  ["ceo", "CEO"],
  ["pm", "PM"],
  ["architect", "Architect"],
  ["backend", "Backend"],
  ["frontend", "Frontend"],
  ["database", "Database"],
  ["qa", "QA"],
  ["security", "Security"],
  ["devops", "DevOps"],
  ["docs", "Docs"],
];

const statuses = ["reading", "planning", "working", "reviewing", "testing", "waiting", "done"];

let i = 0;
setInterval(() => {
  const [id, role] = roles[i % roles.length];
  const status = statuses[i % statuses.length];

  const event = {
    event_id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    project_id: path.basename(projectPath),
    actor: { id, role, provider: "demo", skill: `${role.toLowerCase()}-skill` },
    event_type: "task_progress",
    status,
    task: `${role} workflow`,
    message: `${role} is ${status}`,
    progress_percent: (i * 13) % 100,
  };

  fs.appendFileSync(target, JSON.stringify(event) + "\n");
  console.log(event.message);
  i += 1;
}, 1200);
