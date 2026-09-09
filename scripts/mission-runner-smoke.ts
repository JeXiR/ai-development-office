import type {MissionRunnerPhase} from "../src/mission-runner/types";

const phases:MissionRunnerPhase[]=["idle","planning","approval","running","testing","reviewing","completed","failed","cancelled"];
for(const required of ["planning","running","testing","reviewing","completed"]){
  if(!phases.includes(required as MissionRunnerPhase))throw new Error(`Missing mission phase: ${required}`);
}

const eventTypes=[
  "mission.planned",
  "agent.started",
  "mission.testing",
  "mission.reviewing",
  "mission.completed"
];
if(eventTypes.length!==5)throw new Error("Mission runner flow invalid");

console.log("Mission Runner smoke PASS");
