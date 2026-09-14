import type {ProviderDefinition,ProviderId} from "./types";

const definitions:ProviderDefinition[]=[
  {
    id:"cursor",displayName:"Cursor Agent",
    executableCandidates:["cursor-agent","agent.cmd"],
    capabilities:{coding:true,planning:true,review:true,security:true,testing:true,local:false,resume:true,streaming:true},
    cost:{inputCostWeight:1,outputCostWeight:1,relativeCost:1.0},
    defaultArgs:[]
  },
  {
    id:"claude",displayName:"Claude Code",
    executableCandidates:["claude","claude.exe"],
    capabilities:{coding:true,planning:true,review:true,security:true,testing:true,local:false,resume:true,streaming:true},
    cost:{inputCostWeight:1.2,outputCostWeight:1.2,relativeCost:1.15},
    defaultArgs:[]
  },
  {
    id:"codex",displayName:"Codex CLI",
    executableCandidates:["codex","codex.exe"],
    capabilities:{coding:true,planning:true,review:true,security:true,testing:true,local:false,resume:true,streaming:true},
    cost:{inputCostWeight:0.9,outputCostWeight:0.9,relativeCost:0.9},
    defaultArgs:[]
  },
  {
    id:"gemini",displayName:"Gemini CLI",
    executableCandidates:["gemini","gemini.cmd","gemini.exe"],
    capabilities:{coding:true,planning:true,review:true,security:false,testing:true,local:false,resume:true,streaming:true},
    cost:{inputCostWeight:0.8,outputCostWeight:0.8,relativeCost:0.8},
    defaultArgs:[]
  },
  {
    id:"copilot",displayName:"GitHub Copilot CLI",
    executableCandidates:["copilot","copilot.exe","copilot.cmd"],
    capabilities:{coding:true,planning:true,review:true,security:false,testing:true,local:false,resume:true,streaming:true},
    cost:{inputCostWeight:1,outputCostWeight:1,relativeCost:1.0},
    defaultArgs:[]
  },
  {
    id:"kimi",displayName:"Kimi Code CLI",
    executableCandidates:["kimi","kimi.exe","kimi.cmd"],
    capabilities:{coding:true,planning:true,review:true,security:true,testing:true,local:false,resume:true,streaming:true},
    cost:{inputCostWeight:0.85,outputCostWeight:0.85,relativeCost:0.85},
    defaultArgs:[]
  },
  {
    id:"qwen",displayName:"Qwen Code",
    executableCandidates:["qwen","qwen.exe","qwen.cmd"],
    capabilities:{coding:true,planning:true,review:true,security:false,testing:true,local:false,resume:true,streaming:true},
    cost:{inputCostWeight:0.7,outputCostWeight:0.7,relativeCost:0.7},
    defaultArgs:[]
  },
  {
    id:"crush",displayName:"Crush",
    executableCandidates:["crush","crush.exe"],
    capabilities:{coding:true,planning:true,review:true,security:false,testing:true,local:false,resume:true,streaming:true},
    cost:{inputCostWeight:0.65,outputCostWeight:0.65,relativeCost:0.65},
    defaultArgs:[]
  },
  {
    id:"pi",displayName:"Pi",
    executableCandidates:["pi","pi.exe"],
    capabilities:{coding:true,planning:true,review:true,security:false,testing:true,local:false,resume:true,streaming:true},
    cost:{inputCostWeight:0.6,outputCostWeight:0.6,relativeCost:0.6},
    defaultArgs:[]
  },
  {
    id:"grok",displayName:"Grok CLI",
    executableCandidates:["grok","grok.exe","grok.cmd"],
    capabilities:{coding:true,planning:true,review:true,security:true,testing:true,local:false,resume:true,streaming:true},
    cost:{inputCostWeight:0.9,outputCostWeight:0.9,relativeCost:0.9},
    defaultArgs:[]
  },
  {
    id:"custom",displayName:"Custom command",
    executableCandidates:[],
    capabilities:{coding:true,planning:true,review:true,security:false,testing:true,local:true,resume:false,streaming:false},
    cost:{inputCostWeight:0.2,outputCostWeight:0.2,relativeCost:0.2},
    defaultArgs:[]
  },
  {
    id:"opencode",displayName:"OpenCode",
    executableCandidates:["opencode","opencode.exe","opencode.cmd"],
    capabilities:{coding:true,planning:true,review:true,security:true,testing:true,local:false,resume:true,streaming:true},
    cost:{inputCostWeight:0.7,outputCostWeight:0.7,relativeCost:0.75},
    defaultArgs:[]
  },
  {
    id:"local",displayName:"Local / OpenAI-Compatible",
    executableCandidates:["ollama","ollama.exe"],
    capabilities:{coding:true,planning:true,review:true,security:false,testing:true,local:true,resume:false,streaming:true},
    cost:{inputCostWeight:0.05,outputCostWeight:0.05,relativeCost:0.1},
    defaultArgs:[]
  }
];

export class ProviderRegistry{
  list(){return definitions.map(x=>({...x,capabilities:{...x.capabilities},cost:{...x.cost},defaultArgs:[...x.defaultArgs],executableCandidates:[...x.executableCandidates]}));}
  get(id:ProviderId){return definitions.find(x=>x.id===id)||null;}
}
