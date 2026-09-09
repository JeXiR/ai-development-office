import type { OfficeThemeId } from "./mission";

export interface OfficeThemeDefinition {
  id: OfficeThemeId;
  name: string;
  sourceLabel: string;
  sourceUrl: string;
  renderer: "native";
  assetStatus: "native-adaptation" | "asset-ready";
  license: "cc0-inspired" | "paid-inspired";
  description: string;
}

export const OFFICE_THEMES: OfficeThemeDefinition[] = [
  {
    id:"classic-cc0",
    name:"Classic Pixel Office",
    sourceLabel:"2dPig Pixel Office",
    sourceUrl:"https://2dpig.itch.io/pixel-office",
    renderer:"native",
    assetStatus:"native-adaptation",
    license:"cc0-inspired",
    description:"Warm wood desks and plants. Default Office-drawn look."
  },
  {
    id:"pixel-office-32",
    name:"Pixel Office 32",
    sourceLabel:"Masalimov Ilnur Pixel Office 32x32",
    sourceUrl:"https://masalimov-ilnur.itch.io/pixel-office",
    renderer:"native",
    assetStatus:"native-adaptation",
    license:"paid-inspired",
    description:"Cubicle dividers and teal monitors. Office-drawn, not the paid pack."
  },
  {
    id:"luxury-office",
    name:"Luxury Office",
    sourceLabel:"LennoxStudio Luxury Office",
    sourceUrl:"https://lennoxstudio.itch.io/luxury-office-pixel-art-asset-pack",
    renderer:"native",
    assetStatus:"native-adaptation",
    license:"paid-inspired",
    description:"Gold trim, wood stripes and lounge plants. Office-drawn, not the paid pack."
  },
  {
    id:"modern-corporate",
    name:"Modern Corporate",
    sourceLabel:"LennoxStudio Modern Corporate Office",
    sourceUrl:"https://lennoxstudio.itch.io/modern-corporate-office-pixel-art-asset-pack",
    renderer:"native",
    assetStatus:"native-adaptation",
    license:"paid-inspired",
    description:"Light floor and open desks. Office-drawn, not the paid pack."
  },
  {
    id:"call-center",
    name:"Call Center",
    sourceLabel:"LennoxStudio Call Center Office",
    sourceUrl:"https://lennoxstudio.itch.io/call-center-office-pixel-art-asset-pack",
    renderer:"native",
    assetStatus:"native-adaptation",
    license:"paid-inspired",
    description:"Denser workstations and cooler lighting. Office-drawn, not the paid pack."
  },
  {
    id:"top-down-corporate",
    name:"Top-Down Corporate",
    sourceLabel:"LennoxStudio Top-Down Modern Corporate",
    sourceUrl:"https://lennoxstudio.itch.io/top-down-modern-corporate-office-pixel-art-asset-pack",
    renderer:"native",
    assetStatus:"native-adaptation",
    license:"paid-inspired",
    description:"Strong outlines and cubicles. Office-drawn, not the paid pack."
  },
  {
    id:"office-hell",
    name:"Office Hell",
    sourceLabel:"Masalimov Ilnur Office Hell",
    sourceUrl:"https://masalimov-ilnur.itch.io/office-hell",
    renderer:"native",
    assetStatus:"native-adaptation",
    license:"paid-inspired",
    description:"Red glow and after-hours lighting. Office-drawn, not the paid pack."
  }
];

export const DEFAULT_OFFICE_THEME: OfficeThemeId = "classic-cc0";
