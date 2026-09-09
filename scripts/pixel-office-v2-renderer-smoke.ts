import {PIXEL_OFFICE_WORLD,PIXEL_STATIONS,stationSeat} from "../src/pixel-office-v2/layout";
import {speechCaption} from "../src/pixel-office-v2/renderer";
import {themeLook} from "../src/pixel-office-v2/palette";
import {animationFrameAt,normalizedPixelState} from "../src/pixel-office-v2/animation";
import {clampCamera,defaultCameraForHost} from "../src/pixel-office-v2/camera";
import {animationFrameCount} from "../src/pixel-office-v2/sprite-blueprint";

if(PIXEL_OFFICE_WORLD.width<1000||PIXEL_OFFICE_WORLD.height<600)throw new Error("Pixel Office world is too small");
if(PIXEL_STATIONS.length<10)throw new Error("Station layout incomplete");
if(!PIXEL_STATIONS.find(x=>x.id==="meeting"))throw new Error("Meeting room missing");
if(!PIXEL_STATIONS.find(x=>x.id==="memory"))throw new Error("Memory station missing");

const seat=stationSeat("editor",0);
if(!Number.isFinite(seat.x)||!Number.isFinite(seat.y))throw new Error("Station seat invalid");

if(normalizedPixelState("planning")!=="thinking")throw new Error("Planning state mapping failed");
if(normalizedPixelState("failed")!=="blocked")throw new Error("Failed state mapping failed");
if(animationFrameCount("walking")!==4)throw new Error("Walking frame count failed");
if(animationFrameAt("walking",1000)<0)throw new Error("Animation frame resolver failed");

const camera=clampCamera({x:0,y:0,zoom:99});
if(camera.zoom>3.4)throw new Error("Camera zoom clamp failed");
const narrow=defaultCameraForHost(364,558);
if(narrow.zoom!==1)throw new Error("Default camera should fit the whole office");
if(speechCaption({id:"qa",role:"qa",state:"working",station:"qa"})!=="Working…")throw new Error("Busy agents should show a speech caption");
if(!speechCaption({id:"qa",role:"qa",state:"idle",station:"qa",speech:"Reviewing tests"}).includes("Reviewing"))throw new Error("Spoken text should appear above the agent");
if(!themeLook("call-center").denseDesks)throw new Error("Call Center should pack desks tighter");
if(!themeLook("office-hell").hellGlow)throw new Error("Office Hell should use glow accents");
if(!themeLook("luxury-office").stripes)throw new Error("Luxury Office should use wood stripes");

console.log("Pixel Office V2 Renderer smoke PASS");
