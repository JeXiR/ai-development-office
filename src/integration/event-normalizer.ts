export type UnifiedOfficeEvent={
  source:"mission"|"provider"|"project"|"desktop"|"auth"|"docs";
  type:string;
  at:string;
  missionId:string|null;
  agentId:string|null;
  data:unknown;
};

export function normalizeOfficeEvent(message:any):UnifiedOfficeEvent|null{
  const type=String(message?.type||"");
  const data=message?.data??message;

  if(type==="autonomous_mission_event"){
    return {
      source:"mission",
      type:String(data?.type||type),
      at:String(data?.at||new Date().toISOString()),
      missionId:data?.missionId?String(data.missionId):null,
      agentId:data?.agentId?String(data.agentId):null,
      data
    };
  }

  if(type==="provider_stream_event"){
    return {
      source:"provider",
      type:String(data?.type||type),
      at:String(data?.at||new Date().toISOString()),
      missionId:data?.missionId?String(data.missionId):null,
      agentId:data?.agentId?String(data.agentId):null,
      data
    };
  }

  if(type==="real_project_execution"){
    return {
      source:"project",type,
      at:new Date().toISOString(),
      missionId:data?.missionId?String(data.missionId):null,
      agentId:null,data
    };
  }

  if(type.startsWith("project_docs_")){
    return {source:"docs",type,at:new Date().toISOString(),missionId:null,agentId:null,data};
  }

  if(type.startsWith("account_")){
    return {source:"auth",type,at:new Date().toISOString(),missionId:null,agentId:null,data};
  }

  if(type==="desktop_runtime_status"){
    return {source:"desktop",type,at:new Date().toISOString(),missionId:null,agentId:null,data};
  }

  return null;
}
