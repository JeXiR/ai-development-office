const patterns=[
  /\bsk-[A-Za-z0-9_-]{20,}\b/g,
  /\bgh[pousr]_[A-Za-z0-9]{20,}\b/g,
  /\bBearer\s+[A-Za-z0-9._~+\/=-]{16,}\b/gi,
  /\bAKIA[0-9A-Z]{16}\b/g,
  /\b(api[_-]?key|token|secret|password)\s*[:=]\s*["']?[^"'\s]{8,}["']?/gi
];

export function maskSecrets(input:string){
  let text=input;
  for(const re of patterns){
    text=text.replace(re,match=>{
      if(/^Bearer\s+/i.test(match))return "Bearer ***REDACTED***";
      if(/^sk-/i.test(match))return "sk-***REDACTED***";
      if(/^gh[pousr]_/i.test(match))return match.slice(0,4)+"***REDACTED***";
      if(/^AKIA/i.test(match))return "AKIA***REDACTED***";
      const eq=match.search(/[:=]/);
      if(eq>=0)return match.slice(0,eq+1)+" ***REDACTED***";
      return "***REDACTED***";
    });
  }
  return text;
}
