export type PixelAgentState=
  |"idle"
  |"thinking"
  |"walking"
  |"working"
  |"typing"
  |"testing"
  |"talking"
  |"blocked"
  |"done";

export type PixelStationId=
  |"director"
  |"editor"
  |"terminal"
  |"git"
  |"qa"
  |"security"
  |"database"
  |"devops"
  |"memory"
  |"meeting"
  |"lounge";

export type PixelAgentVisual={
  agentId:string;
  displayName:string;
  role:string;
  state:PixelAgentState;
  x:number;
  y:number;
  facing:"up"|"down"|"left"|"right";
  homeStation:PixelStationId;
  targetStation:PixelStationId|null;
  taskId:string|null;
};

export type PixelOfficeScene={
  width:number;
  height:number;
  zoom:number;
  cameraX:number;
  cameraY:number;
  agents:PixelAgentVisual[];
};
