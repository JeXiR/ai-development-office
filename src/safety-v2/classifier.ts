import type {CommandRisk,RiskLevel} from "./types";

const rules:ReadonlyArray<readonly [RegExp,RiskLevel,string]>=[
  [/\brm\s+-rf\b/i,"critical","Recursive forced deletion"],
  [/\brmdir\b.*\/s/i,"critical","Recursive directory deletion"],
  [/\bdel\b.*\/[sq]\b/i,"high","Recursive or quiet deletion"],
  [/\bgit\s+reset\s+--hard\b/i,"high","Hard Git reset"],
  [/\bgit\s+clean\s+-[a-z]*f/i,"high","Forced Git clean"],
  [/\bgit\s+push\b.*--force/i,"high","Force push"],
  [/\bdrop\s+(database|table)\b/i,"critical","Destructive SQL DROP"],
  [/\btruncate\s+table\b/i,"high","Destructive SQL truncate"],
  [/\bformat\b|\bdiskpart\b/i,"critical","Disk mutation"],
  [/\bshutdown\b|\breboot\b/i,"high","Machine restart/shutdown"],
  [/\bnpm\s+publish\b|\bpnpm\s+publish\b/i,"high","Package publication"],
  [/\bterraform\s+(apply|destroy)\b/i,"critical","Infrastructure mutation"],
  [/\bInvoke-WebRequest\b|\bcurl\b|\bwget\b/i,"medium","Network access"]
];

const rank:Record<RiskLevel,number>={low:0,medium:1,high:2,critical:3};

export class DestructiveCommandClassifier{
  classify(command:string):CommandRisk{
    const hits=rules.filter(([pattern])=>pattern.test(command));
    if(!hits.length)return {level:"low",destructive:false,reasons:[]};
    const level=hits.map(([,risk])=>risk).sort((a,b)=>rank[b]-rank[a])[0];
    return {level,destructive:level==="high"||level==="critical",reasons:hits.map(([, ,reason])=>reason)};
  }
}
