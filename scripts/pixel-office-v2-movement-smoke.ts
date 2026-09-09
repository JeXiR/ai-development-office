import {pixelStation,stationSeat} from "../src/pixel-office-v2/layout";
import {findPixelPath,pathLength} from "../src/pixel-office-v2/pathfinding";
import {createMovement,retargetMovement,updateMovement} from "../src/pixel-office-v2/movement";
import {mapOfficeRuntimeEvent,roleDefaultStation} from "../src/pixel-office-v2/event-map";
import {roleToStation} from "../src/pixel-office-v2/runtime-map";
import {envelopePoint} from "../src/pixel-office-v2/message-animation";

const path=findPixelPath({x:40,y:40},{x:900,y:650});
if(path.length<2)throw new Error(`Pathfinding failed: ${JSON.stringify(path)}`);
if(path[0].x!==40||path[0].y!==40)throw new Error("Pathfinding did not preserve origin");
if(pathLength(path)<=0)throw new Error("Path length invalid");

const movement=createMovement({x:40,y:40},{x:200,y:40});
updateMovement(movement,1);
if(movement.position.x<=40)throw new Error("Movement interpolation failed");
retargetMovement(movement,{x:200,y:200});
updateMovement(movement,.5);
if(!["up","down","left","right"].includes(movement.facing))throw new Error("Facing failed");

const qa=mapOfficeRuntimeEvent({type:"mission.testing",agentId:"qa"});
if(qa.station!=="qa"||qa.state!=="testing")throw new Error("Testing event mapping failed");

const sec=roleDefaultStation("Security Reviewer");
if(sec!=="security")throw new Error("Role station mapping failed");
if(roleToStation("Backend Spec")!=="terminal")throw new Error("Backend should sit at terminal");
if(roleToStation("Flutter Spec")!=="editor")throw new Error("Flutter should sit at editor");
if(roleToStation("Worker/Que")!=="terminal")throw new Error("Worker should sit at terminal");
if(roleToStation("Observability")!=="devops")throw new Error("Observability should sit at devops");
if(roleToStation("Architect")!=="meeting")throw new Error("Architect should sit at meeting");

const mid=envelopePoint({x:0,y:0},{x:100,y:0},.5);
if(mid.y>=0)throw new Error("Envelope arc failed");

const desk=stationSeat("terminal",0);
const desk2=stationSeat("terminal",1);
const terminal=pixelStation("terminal");
const toDesk=findPixelPath({x:40,y:200},desk);
const end=toDesk[toDesk.length-1];
if(Math.hypot(end.x-desk.x,end.y-desk.y)>1)throw new Error("Desk seat is not the path destination");
if(desk.y<terminal.y+terminal.height-42)throw new Error("Desk seat is not in front of the furniture");
if(Math.abs(desk.y-desk2.y)>8)throw new Error("Adjacent desk seats should share the front row");
if(Math.abs(desk.x-desk2.x)<40)throw new Error("Adjacent seats should sit at different desks");
const meetingSeat=stationSeat("meeting",0);
const meeting=pixelStation("meeting");
if(meetingSeat.y<meeting.y+70)throw new Error("Meeting seats should sit in front of the table, not on it");
if(roleToStation("unknown-specialist")==="lounge")throw new Error("Unknown roles should sit at a desk, not pile in the lounge");

console.log("Pixel Office V2 Movement smoke PASS");
