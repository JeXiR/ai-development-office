import type {PixelStationId} from "./types";

export type PixelStationLayout={
  id:PixelStationId;
  label:string;
  x:number;
  y:number;
  width:number;
  height:number;
  kind:"office"|"lab"|"meeting"|"memory"|"lounge";
};

export const PIXEL_OFFICE_WORLD={width:1280,height:760,tile:16};

export const PIXEL_STATIONS:PixelStationLayout[]=[
  {id:"director",label:"Director",x:500,y:54,width:280,height:122,kind:"office"},
  {id:"terminal",label:"Backend / Terminal",x:72,y:216,width:250,height:156,kind:"office"},
  {id:"editor",label:"Frontend / Editor",x:350,y:216,width:250,height:156,kind:"office"},
  {id:"git",label:"Git / Review",x:628,y:216,width:250,height:156,kind:"office"},
  {id:"qa",label:"QA Lab",x:906,y:216,width:250,height:156,kind:"lab"},
  {id:"security",label:"Security",x:72,y:430,width:250,height:152,kind:"lab"},
  {id:"database",label:"Database",x:350,y:430,width:250,height:152,kind:"lab"},
  {id:"devops",label:"DevOps",x:628,y:430,width:250,height:152,kind:"lab"},
  {id:"memory",label:"Memory",x:906,y:430,width:250,height:152,kind:"memory"},
  {id:"meeting",label:"Meeting",x:290,y:622,width:330,height:100,kind:"meeting"},
  {id:"lounge",label:"Lounge",x:660,y:622,width:330,height:100,kind:"lounge"}
];

export function pixelStation(id:PixelStationId){
  return PIXEL_STATIONS.find(x=>x.id===id)||PIXEL_STATIONS.find(x=>x.id==="lounge")!;
}

export type DeskSlot={
  localX:number;
  localY:number;
  width:number;
  height:number;
  seatX:number;
  seatY:number;
  monitor?:{x:number;y:number;w:number;h:number};
};

export function stationDeskCount(station:PixelStationLayout,dense=false){
  if(station.kind==="meeting"||station.kind==="lounge")return 0;
  const gap=dense?68:80;
  return Math.max(3,Math.floor(station.width/gap));
}

export function stationDeskSlots(station:PixelStationLayout,dense=false):DeskSlot[]{
  if(station.kind==="meeting"){
    const tableY=36;
    const tableH=28;
    const frontY=station.y+station.height-16;
    return [
      {localX:48,localY:tableY,width:station.width-96,height:tableH,seatX:station.x+station.width*.22,seatY:frontY},
      {localX:48,localY:tableY,width:station.width-96,height:tableH,seatX:station.x+station.width*.5,seatY:frontY},
      {localX:48,localY:tableY,width:station.width-96,height:tableH,seatX:station.x+station.width*.78,seatY:frontY},
      {localX:48,localY:tableY,width:station.width-96,height:tableH,seatX:station.x+22,seatY:station.y+tableY+tableH+6},
      {localX:48,localY:tableY,width:station.width-96,height:tableH,seatX:station.x+station.width-22,seatY:station.y+tableY+tableH+6}
    ];
  }
  if(station.kind==="lounge"){
    return [
      {localX:42,localY:42,width:90,height:24,seatX:station.x+72,seatY:station.y+72},
      {localX:42,localY:42,width:90,height:24,seatX:station.x+112,seatY:station.y+72},
      {localX:station.width-132,localY:42,width:90,height:24,seatX:station.x+station.width-87,seatY:station.y+72},
      {localX:station.width-132,localY:42,width:90,height:24,seatX:station.x+station.width-47,seatY:station.y+72},
      {localX:42,localY:42,width:90,height:24,seatX:station.x+station.width/2,seatY:station.y+station.height-16}
    ];
  }
  const deskCount=stationDeskCount(station,dense);
  const deskW=dense?46:54;
  const slots:DeskSlot[]=[];
  for(let i=0;i<deskCount;i++){
    const localX=16+i*((station.width-70)/Math.max(1,deskCount-1));
    slots.push({
      localX,
      localY:station.height-54,
      width:deskW,
      height:18,
      seatX:station.x+localX+deskW/2,
      seatY:station.y+station.height-30,
      monitor:{x:localX+7,y:station.height-75,w:dense?32:40,h:21}
    });
  }
  return slots;
}

export function stationSeat(id:PixelStationId,index:number,dense=false){
  const station=pixelStation(id);
  const slots=stationDeskSlots(station,dense);
  const slot=slots[index%slots.length];
  const extra=Math.floor(index/slots.length);
  return {
    x:slot.seatX+extra*12,
    y:slot.seatY
  };
}
