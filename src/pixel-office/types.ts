export type AgentVisualState="idle"|"thinking"|"working"|"moving"|"blocked"|"paused"|"done"|"offline";
export type OfficeStationId="director"|"terminal"|"editor"|"git"|"qa"|"security"|"database"|"devops"|"mailbox"|"memory"|"lounge";
export type PixelAgent={id:string;role:string;provider:string;state:AgentVisualState;station:OfficeStationId;targetStation:OfficeStationId|null;speech:string|null;taskLabel:string|null;progress:number|null;lastEventAt:string};
export type OfficeEnvelope={id:string;fromAgentId:string;toAgentId:string;subject:string;createdAt:string;status:"flying"|"delivered"};
export type FilePulse={id:string;relativePath:string;agentId:string|null;createdAt:string};
export type PixelOfficeSnapshot={agents:PixelAgent[];envelopes:OfficeEnvelope[];filePulses:FilePulse[]};
