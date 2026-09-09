import {laneFor,pickQueueItems} from "../bridge/queue-lanes";

function item(command:string,extra:Partial<{id:string;assignedRole:string|null;executionLane:string|null;queueSequence:number;createdAt:string}>= {}){
  return {
    command,
    assignedRole:extra.assignedRole??null,
    executionLane:extra.executionLane??null,
    queueSequence:extra.queueSequence??1,
    createdAt:extra.createdAt||"2026-09-08T00:00:00.000Z",
    id:extra.id||command
  };
}

const statusLane=laneFor(item("status"));
const reviewLane=laneFor(item("review project"));
const validateLane=laneFor(item("validate"));
const coverageLane=laneFor(item("project coverage"));
if(statusLane!=="read-status")throw new Error(`status lane was ${statusLane}`);
if(reviewLane!=="read-review-project")throw new Error(`review lane was ${reviewLane}`);
if(validateLane!=="read-validate")throw new Error(`validate lane was ${validateLane}`);
if(coverageLane!=="read-project-coverage")throw new Error(`coverage lane was ${coverageLane}`);
if(statusLane===reviewLane)throw new Error("status and review must not share a lane");

const roleLane=laneFor(item("fix next",{assignedRole:"Laravel Specialist"}));
if(roleLane!=="laravel-specialist")throw new Error(`role lane was ${roleLane}`);

const pinned=laneFor(item("status",{executionLane:"ceo-review"}));
if(pinned!=="ceo-review")throw new Error(`executionLane override was ${pinned}`);

const writeLane=laneFor(item("fix next"));
if(writeLane!=="fix-next")throw new Error(`unassigned write lane was ${writeLane}`);

const queued=[
  item("status",{queueSequence:1,id:"s"}),
  item("review project",{queueSequence:2,id:"r"}),
  item("fix next",{queueSequence:3,id:"f"})
];

const behindStatus=pickQueueItems(queued,["read-status"],2,laneFor);
if(!behindStatus.some(x=>x.command==="fix next"))throw new Error("mutating work must start while status is running");
if(!behindStatus.some(x=>x.command==="review project"))throw new Error("review must start while status is running");
if(behindStatus.some(x=>x.command==="status"))throw new Error("second status must stay serial on its own lane");

const scarce=pickQueueItems(queued,[],1,laneFor);
if(scarce.length!==1||scarce[0].command!=="fix next")throw new Error("mutating work must take the last free slot");

const twoReads=pickQueueItems([
  item("status",{queueSequence:1}),
  item("review project",{queueSequence:2})
],[],2,laneFor);
if(twoReads.length!==2)throw new Error("independent read-only commands should start together");

const sameRole=pickQueueItems([
  item("fix next",{assignedRole:"Frontend",queueSequence:1,id:"a"}),
  item("continue",{assignedRole:"Frontend",queueSequence:2,id:"b"})
],[],2,laneFor);
if(sameRole.length!==1||sameRole[0].id!=="a")throw new Error("same specialist must stay serial");

console.log("Queue lanes smoke PASS");
