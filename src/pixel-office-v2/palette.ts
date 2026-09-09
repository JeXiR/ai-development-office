export const PIXEL_PALETTE={
  outline:"#10141d",
  skin:"#d9a477",
  skinShadow:"#ae7858",
  hair:"#283346",
  shirt:"#4e78a6",
  shirtShadow:"#345372",
  trousers:"#29384e",
  shoe:"#10151e",
  idle:"#7e9aab",
  thinking:"#b69ce2",
  working:"#62b6cb",
  typing:"#62b6cb",
  testing:"#edb96f",
  talking:"#9bcf7a",
  blocked:"#e36f74",
  done:"#6fcb98",
  room:"#101d2b",
  roomEdge:"#20384d",
  floor:"#08121d",
  floorAlt:"#0b1825",
  desk:"#6c4e38",
  deskEdge:"#3f2e26",
  monitor:"#152436",
  monitorGlow:"#65b6d1",
  glass:"#173047",
  label:"#a7cfe5",
  lounge:"#354558"
} as const;

export type PixelPalette=typeof PIXEL_PALETTE;

const THEME_BACKGROUNDS:Record<string,Partial<PixelPalette>>={
  "classic-cc0":{
    floor:"#1c263a",floorAlt:"#26334c",room:"#182238",roomEdge:"#5b6175",
    desk:"#a86f45",deskEdge:"#563820",monitor:"#101927",monitorGlow:"#70d6a6",
    glass:"#1d293d",label:"#d8e4f0",lounge:"#293550"
  },
  "pixel-office-32":{
    floor:"#142b38",floorAlt:"#1c3848",room:"#152839",roomEdge:"#3d738c",
    desk:"#815c3f",deskEdge:"#402d22",monitor:"#071b27",monitorGlow:"#60d5c6",
    glass:"#18313d",label:"#b7e6e2",lounge:"#214158"
  },
  "luxury-office":{
    floor:"#32261d",floorAlt:"#4b3827",room:"#29231f",roomEdge:"#9d7f58",
    desk:"#a77a45",deskEdge:"#5c3f24",monitor:"#101419",monitorGlow:"#e1bd75",
    glass:"#302921",label:"#f0ddb8",lounge:"#44372b"
  },
  "modern-corporate":{
    floor:"#d4dde2",floorAlt:"#e4eaed",room:"#e8edf0",roomEdge:"#8fa4b1",
    desk:"#b68b62",deskEdge:"#72563e",monitor:"#22313b",monitorGlow:"#3c9e8f",
    glass:"#cdd7dd",label:"#233744",lounge:"#d8e1e7"
  },
  "call-center":{
    floor:"#102638",floorAlt:"#183246",room:"#132434",roomEdge:"#397196",
    desk:"#4c6680",deskEdge:"#26394c",monitor:"#061725",monitorGlow:"#51c5ee",
    glass:"#142b3c",label:"#b9e4f6",lounge:"#1d3d56"
  },
  "top-down-corporate":{
    floor:"#252f36",floorAlt:"#303c43",room:"#202932",roomEdge:"#657782",
    desk:"#775e49",deskEdge:"#403328",monitor:"#0c171d",monitorGlow:"#81c48e",
    glass:"#27323a",label:"#d5e3e8",lounge:"#394750"
  },
  "office-hell":{
    floor:"#1c0d0f",floorAlt:"#321517",room:"#241114",roomEdge:"#8f3538",
    desk:"#5d3527",deskEdge:"#2a1611",monitor:"#160708",monitorGlow:"#ff6f42",
    glass:"#2b0f10",label:"#f3c2b4",lounge:"#4a181a"
  }
};

export function paletteForTheme(theme?:string|null):PixelPalette{
  const patch=theme?THEME_BACKGROUNDS[theme]:null;
  return patch?{...PIXEL_PALETTE,...patch}:PIXEL_PALETTE;
}

export type ThemeLook={
  id:string;
  tile:number;
  stripes:boolean;
  denseDesks:boolean;
  plants:boolean;
  cubicles:boolean;
  hellGlow:boolean;
};

export function themeLook(theme?:string|null):ThemeLook{
  const id=theme||"classic-cc0";
  return {
    id,
    tile:id==="call-center"?24:id==="modern-corporate"?40:32,
    stripes:id==="luxury-office",
    denseDesks:id==="call-center",
    plants:id==="classic-cc0"||id==="luxury-office"||id==="modern-corporate",
    cubicles:id==="pixel-office-32"||id==="top-down-corporate",
    hellGlow:id==="office-hell"
  };
}
