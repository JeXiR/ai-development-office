import { WebSocket } from "ws";

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
] as const;

const states = ["reading", "planning", "working", "reviewing", "testing", "waiting", "done"] as const;

const socket = new WebSocket(process.env.OFFICE_WS_URL ?? "ws://localhost:8787");

socket.on("open", () => {
  let i = 0;
  setInterval(() => {
    const [id, role] = roles[i % roles.length];
    const status = states[i % states.length];

    socket.send(
      JSON.stringify({
        type: "event",
        data: {
          event_id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          project_id: "demo",
          actor: { id, role, skill: `${role.toLowerCase()}-skill` },
          event_type: "task_progress",
          status,
          task: `${role} workflow`,
          message: `${role} is ${status}`,
        },
      })
    );

    i += 1;
  }, 1500);
});
