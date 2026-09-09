import {classifyMissionRequirements,requirementKeys} from "../src/orchestration/mission-classifier";
import {selectAgentsForCapabilities} from "../src/orchestration/agent-selector";

const req=classifyMissionRequirements("Review Laravel auth security and add tests");
const keys=requirementKeys(req);
if(!keys.includes("coding")||!keys.includes("reasoning")||!keys.includes("toolCalling"))throw new Error("Mission requirements failed");
const ui=classifyMissionRequirements("Build a tip calculator UI with bill, tip %, and people");
if(ui.vision)throw new Error("Tip calculator UI must not require vision");

const agents=[
  {id:"architect",name:"Architect",role:"Architect"},
  {id:"laravel",name:"Laravel Specialist",role:"Laravel Specialist"},
  {id:"security",name:"Security",role:"Security"},
  {id:"qa",name:"QA",role:"QA"}
];
const selected=selectAgentsForCapabilities(agents,["backend.laravel","security","testing"]);
const ids=selected.map(x=>x.id);
if(!ids.includes("laravel"))throw new Error("Laravel agent was not selected");
if(!ids.includes("security"))throw new Error("Security agent was not selected");
if(!ids.includes("qa"))throw new Error("QA agent was not selected");

console.log("Autonomous Provider Orchestration smoke PASS");
console.log(JSON.stringify({requirements:req,agents:ids},null,2));
