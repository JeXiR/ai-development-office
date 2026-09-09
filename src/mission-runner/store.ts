import {create} from "zustand";
import type {MissionRunnerEvent,MissionRunnerPhase,MissionRunnerResult} from "./types";

type State={
  goal:string;
  phase:MissionRunnerPhase;
  missionId:string|null;
  events:MissionRunnerEvent[];
  result:MissionRunnerResult|null;
  approval:any|null;
  evidence:any|null;
  replay:any|null;
  busy:boolean;

  setGoal:(goal:string)=>void;
  setBusy:(busy:boolean)=>void;
  reset:()=>void;
  ingestEvent:(event:any)=>void;
  setResult:(result:any)=>void;
  setApproval:(approval:any)=>void;
  setEvidence:(evidence:any)=>void;
  setReplay:(replay:any)=>void;
};

const phaseFor=(type:string):MissionRunnerPhase=>{
  if(type==="mission.planned"||type==="mission.started")return "planning";
  if(type==="mission.approval_required")return "approval";
  if(type.startsWith("agent."))return "running";
  if(type==="mission.testing"||type==="mission.test_result")return "testing";
  if(type==="mission.reviewing"||type==="mission.review_result")return "reviewing";
  if(type==="mission.completed")return "completed";
  if(type==="mission.failed")return "failed";
  if(type==="mission.cancelled")return "cancelled";
  return "running";
};

export const useMissionRunnerStore=create<State>((set)=>({
  goal:"",
  phase:"idle",
  missionId:null,
  events:[],
  result:null,
  approval:null,
  evidence:null,
  replay:null,
  busy:false,

  setGoal:(goal)=>set({goal}),
  setBusy:(busy)=>set({busy}),
  reset:()=>set({goal:"",phase:"idle",missionId:null,events:[],result:null,approval:null,evidence:null,replay:null,busy:false}),
  ingestEvent:(event)=>set(state=>({
    missionId:event.missionId||state.missionId,
    phase:phaseFor(String(event.type||"")),
    busy:["mission.approval_required","mission.completed","mission.failed","mission.cancelled"].includes(String(event.type||""))?false:state.busy,
    approval:event.type==="mission.approval_required"?event.data:state.approval,
    events:[...state.events.slice(-199),{
      missionId:event.missionId||state.missionId,
      phase:phaseFor(String(event.type||"")),
      message:String(event.message||event.type||"event"),
      at:String(event.at||new Date().toISOString()),
      agentId:event.agentId,
      providerId:event.providerId,
      data:event.data
    }]
  })),
  setResult:(result)=>set({
    result,
    busy:false,
    missionId:result?.missionId||null,
    phase:result?.status==="completed"?"completed":result?.status==="cancelled"?"cancelled":result?.status==="queued"?"approval":result?.status==="failed"?"failed":"completed"
  }),
  setApproval:(approval)=>set({approval,phase:"approval"}),
  setEvidence:(evidence)=>set({evidence}),
  setReplay:(replay)=>set({replay})
}));
