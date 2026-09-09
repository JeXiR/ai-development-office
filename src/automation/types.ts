export type MissionStatus="scheduled"|"running"|"completed"|"failed"|"paused";
export type MissionCadence="once"|"hourly"|"daily"|"weekly";

export type ScheduledMission={
  id:string;
  projectId:string;
  title:string;
  prompt:string;
  provider:string;
  role:string;
  cadence:MissionCadence;
  nextRunAt:string;
  enabled:boolean;
  status:MissionStatus;
  retryCount:number;
  maxRetries:number;
  lastRunAt:string|null;
  lastResult:string|null;
  createdAt:string;
  updatedAt:string;
};

export type HeartbeatState={
  projectId:string;
  enabled:boolean;
  intervalMinutes:number;
  lastBeatAt:string|null;
  nextBeatAt:string|null;
  missedBeats:number;
};

export type AutomationSnapshot={
  missions:ScheduledMission[];
  heartbeats:HeartbeatState[];
};
