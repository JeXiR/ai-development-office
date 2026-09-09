export type ReplayFrame={
  missionId?:string;
  at:string;
  type:string;
  agentId?:string;
  providerId?:string|null;
  data?:unknown;
  message?:string;
};

export type MissionReplay={
  missionId:string;
  frames:ReplayFrame[];
};

export function buildMissionReplay(events:ReplayFrame[]):MissionReplay{
  const missionId=events[0]?.missionId||"unknown";
  return {
    missionId:String(missionId),
    frames:events.map(e=>({
      at:e.at,
      type:e.type,
      agentId:e.agentId,
      providerId:e.providerId,
      data:e.data,
      message:e.message
    }))
  };
}
