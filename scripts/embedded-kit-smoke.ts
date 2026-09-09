import path from "node:path";
import {EmbeddedKitEngineService} from "../src/kit-engine/service";

const engine=new EmbeddedKitEngineService(process.cwd());
const snapshot=await engine.detect();

if(!snapshot.installed)throw new Error("Embedded Kit is not installed.");
if(snapshot.locationMode!=="embedded")throw new Error(`Expected embedded Kit, received ${snapshot.locationMode}`);
if(snapshot.version!=="3.5.5")throw new Error(`Expected Kit 3.5.5, received ${snapshot.version}`);
if(snapshot.skills.length<50)throw new Error(`Unexpectedly low skill count: ${snapshot.skills.length}`);
if(snapshot.commands.length<20)throw new Error(`Unexpectedly low command count: ${snapshot.commands.length}`);
if(snapshot.workflows.length<10)throw new Error(`Unexpectedly low workflow count: ${snapshot.workflows.length}`);
if(snapshot.capabilities.length<10)throw new Error(`Unexpectedly low capability count: ${snapshot.capabilities.length}`);
if(snapshot.compositions.length<5)throw new Error(`Unexpectedly low composition count: ${snapshot.compositions.length}`);

const validation=await engine.validate();
if(!validation.ok)throw new Error(`Embedded Kit validation failed: ${validation.warnings.join(" | ")}`);

console.log("Embedded Kit smoke PASS");
console.log(JSON.stringify({
  version:snapshot.version,
  mode:snapshot.locationMode,
  skills:snapshot.skills.length,
  commands:snapshot.commands.length,
  workflows:snapshot.workflows.length,
  capabilities:snapshot.capabilities.length,
  compositions:snapshot.compositions.length
},null,2));
