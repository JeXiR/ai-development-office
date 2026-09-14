export type CliUsage={
  tokens:number;
  inputTokens:number;
  outputTokens:number;
  costUsd:number|null;
  source:"provider"|"estimate"|"unavailable";
};

function num(value:unknown){
  const n=Number(value);
  return Number.isFinite(n)&&n>=0?n:null;
}

function fromUsageObject(row:Record<string,unknown>):CliUsage|null{
  const input=num(row.input_tokens??row.inputTokens??row.prompt_tokens??row.promptTokens);
  const output=num(row.output_tokens??row.outputTokens??row.completion_tokens??row.completionTokens);
  const total=num(row.total_tokens??row.totalTokens??row.tokens)
    ?? ((input??0)+(output??0) || null);
  const cost=num(row.cost_usd??row.costUsd??row.total_cost_usd);
  if(total==null||total<=0)return null;
  return {
    tokens:total,
    inputTokens:input??0,
    outputTokens:output??0,
    costUsd:cost,
    source:"provider"
  };
}

function parseJsonBlob(text:string){
  try{
    const parsed=JSON.parse(text);
    if(parsed&&typeof parsed==="object"){
      const direct=fromUsageObject(parsed as Record<string,unknown>);
      if(direct)return direct;
      const nested=(parsed as any).usage||(parsed as any).token_usage||(parsed as any).result?.usage;
      if(nested&&typeof nested==="object")return fromUsageObject(nested);
    }
  }catch{}
  return null;
}

export function parseCliUsage(stdout:string):CliUsage|null{
  const text=String(stdout||"");
  if(!text.trim())return null;
  const direct=parseJsonBlob(text.trim());
  if(direct)return direct;

  const lines=text.split(/\r?\n/);
  for(const line of lines){
    const trimmed=line.trim();
    if(!trimmed.startsWith("{")&&!trimmed.startsWith("["))continue;
    const parsed=parseJsonBlob(trimmed);
    if(parsed)return parsed;
    try{
      const row=JSON.parse(trimmed);
      const nested=row?.usage||row?.token_count||row?.event?.usage;
      if(nested&&typeof nested==="object"){
        const usage=fromUsageObject(nested);
        if(usage)return usage;
      }
    }catch{}
  }

  const labeled=text.match(/(?:total[_\s-]?tokens|token(?:s)? used)\s*[:=]\s*(\d+)/i);
  if(labeled){
    const tokens=Number(labeled[1]);
    if(tokens>0)return {tokens,inputTokens:0,outputTokens:0,costUsd:null,source:"provider"};
  }
  return null;
}

export function resolveCliUsage(stdout:string, estimateTokens:number, estimateCost:number):CliUsage{
  const parsed=parseCliUsage(stdout);
  if(parsed){
    return {
      ...parsed,
      costUsd:parsed.costUsd??estimateCost
    };
  }
  if(estimateTokens>0){
    return {tokens:estimateTokens,inputTokens:0,outputTokens:0,costUsd:estimateCost,source:"estimate"};
  }
  return {tokens:0,inputTokens:0,outputTokens:0,costUsd:null,source:"unavailable"};
}
