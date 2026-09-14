export type ParsedProgressItem={
  section:string;
  title:string;
  raw:string;
  done:boolean;
  kind:"checkbox"|"bullet"|"numbered";
  lineIndex:number;
};

const SKIP_TITLE=/^(none recorded\.?|n\/?a|-)?$/i;
const SECTION_RE=/^##\s+(.+?)\s*$/;

export function normalizeProgressTitle(title:string){
  return title
    .replace(/^\s*-\s+/, "")
    .replace(/^\s*\d+\.\s+/, "")
    .replace(/^\[[ xX]\]\s*/, "")
    .replace(/\*\*/g, "")
    .replace(/~~/g, "")
    .replace(/\((?:road|impl|prog|feat|next)-[a-z0-9-]+\)/gi, "")
    .replace(/^(?:road|impl|prog|feat|next)-[a-z0-9]+\s*[—–:\-]+\s*/i, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export function isNonShippingExecutorResult(text:string){
  const t=String(text||"");
  if(!t.trim())return false;
  return /planning only/i.test(t)
    || /no product files changed/i.test(t)
    || /this turn does(?:\s+\*\*)?\s*not(?:\*\*)?\s+implement/i.test(t);
}

export function titlesMatch(a:string, b:string){
  const left=normalizeProgressTitle(a);
  const right=normalizeProgressTitle(b);
  if(!left||!right)return false;
  return left===right||left.includes(right)||right.includes(left);
}

export function isSkippableProgressTitle(title:string){
  const raw=String(title||"").trim();
  if(/^\s*\[!\]/.test(raw)||/^\s*\[~\]/.test(raw))return true;
  const normalized=normalizeProgressTitle(title);
  return !normalized||SKIP_TITLE.test(normalized);
}

const CONFLICT_RE=/^(<<<<<<<|=======|>>>>>>>)/;

export function hasConflictMarkers(text:string){
  return text.split(/\r?\n/).some(line=>CONFLICT_RE.test(line));
}

export function canonicalConflictFiles(projectPath:string, files=["PROGRESS.md","docs/ROADMAP.md","docs/PROJECT_STATE.md"]){
  const fs=require("node:fs") as typeof import("node:fs");
  const path=require("node:path") as typeof import("node:path");
  return files
    .map(rel=>path.join(projectPath,rel))
    .filter(file=>{
      try{return fs.existsSync(file)&&hasConflictMarkers(fs.readFileSync(file,"utf8"));}
      catch{return false;}
    });
}

export function parseProgressItems(text:string):ParsedProgressItem[]{
  const lines=text.split(/\r?\n/);
  const out:ParsedProgressItem[]=[];
  let section="Body";
  lines.forEach((line, lineIndex)=>{
    if(CONFLICT_RE.test(line))return;
    const sectionMatch=line.match(SECTION_RE);
    if(sectionMatch){
      section=sectionMatch[1].trim();
      return;
    }
    const checkbox=line.match(/^\s*-\s+\[([ xX])\]\s+(.*)$/);
    if(checkbox){
      const title=checkbox[2].trim();
      if(isSkippableProgressTitle(title))return;
      out.push({section, title, raw:line, done:checkbox[1].toLowerCase()==="x", kind:"checkbox", lineIndex});
      return;
    }
    const numbered=line.match(/^\s*(\d+)\.\s+(.*)$/);
    if(numbered && /^next actions$/i.test(section)){
      const rest=numbered[2].trim();
      if(isSkippableProgressTitle(rest))return;
      const done=/^\[[xX]\]\s+/.test(rest);
      const title=rest.replace(/^\[[ xX]\]\s+/, "").trim();
      if(isSkippableProgressTitle(title))return;
      out.push({section, title, raw:line, done, kind:"numbered", lineIndex});
      return;
    }
    const bullet=line.match(/^\s*-\s+(.+)$/);
    if(bullet && /^(todo|in progress|bugs \/ errors|technical debt \/ improvements|blockers)$/i.test(section)){
      const title=bullet[1].replace(/^\[[ xX]\]\s+/, "").trim();
      if(isSkippableProgressTitle(title))return;
      out.push({section, title, raw:line, done:false, kind:"bullet", lineIndex});
    }
  });
  return out;
}

export function openProgressItems(text:string){
  const seen=new Set<string>();
  const out:ParsedProgressItem[]=[];
  for(const item of parseProgressItems(text)){
    if(item.done)continue;
    const key=normalizeProgressTitle(item.title);
    if(!key||seen.has(key))continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

export function checklistCompletion(texts:string[]){
  const seen=new Set<string>();
  let done=0;
  let todo=0;
  for(const text of texts){
    for(const item of parseProgressItems(text||"")){
      const key=normalizeProgressTitle(item.title);
      if(!key||seen.has(key))continue;
      seen.add(key);
      if(item.done)done+=1;
      else todo+=1;
    }
  }
  const total=done+todo;
  if(!total)return {total:0,done:0,todo:0,percent:null as number|null,remaining:null as number|null};
  const percent=Math.round(done/total*100);
  return {total,done,todo,percent,remaining:Math.max(0,100-percent)};
}

function ensureCompletedEntry(lines:string[], title:string){
  const completedAt=lines.findIndex(line=>/^##\s+Completed\s*$/i.test(line));
  if(completedAt<0){
    lines.push("", "## Completed", "", `- [x] ${title}`);
    return;
  }
  const already=lines.some((line, index)=>index>completedAt && titlesMatch(line, title) && /\[x\]/i.test(line));
  if(already)return;
  let insertAt=completedAt+1;
  while(insertAt<lines.length && !SECTION_RE.test(lines[insertAt]))insertAt++;
  const entry=`- [x] ${title}`;
  const before=lines[insertAt-1]||"";
  if(before.trim()!=="" && !/^\s*-\s+/.test(before)){
    lines.splice(insertAt, 0, "", entry);
  }else{
    lines.splice(insertAt, 0, entry);
  }
}

function stampLastUpdated(lines:string[]){
  const stamp=new Date().toISOString().slice(0, 10);
  const idx=lines.findIndex(line=>/\*\*Last Updated:\*\*/i.test(line));
  if(idx>=0){
    lines[idx]=lines[idx].replace(/(\*\*Last Updated:\*\*\s*).*$/i, `$1${stamp}`);
    return;
  }
}

function maybeMarkOverallComplete(text:string, lines:string[]){
  if(openProgressItems(text).length>0)return;
  const idx=lines.findIndex(line=>/\*\*Overall:\*\*/i.test(line));
  if(idx>=0)lines[idx]=lines[idx].replace(/(\*\*Overall:\*\*\s*).*$/i, "$1COMPLETE");
}

export function markProgressItemComplete(text:string, title:string, evidence?:string){
  const lines=text.split(/\r?\n/);
  const matches=parseProgressItems(text).filter(item=>!item.done && titlesMatch(item.title, title));
  if(!matches.length)return {text, changed:false, matched:null as string|null};

  for(const match of matches){
    if(match.kind==="checkbox"){
      lines[match.lineIndex]=lines[match.lineIndex].replace(/\[ \]/, "[x]").replace(/\[x\]/i, "[x]");
    }else if(match.kind==="numbered"){
      lines[match.lineIndex]=lines[match.lineIndex].replace(/^(\s*\d+\.\s+)(?:\[[ xX]\]\s+)?/, "$1[x] ");
    }else{
      lines[match.lineIndex]=lines[match.lineIndex].replace(/^\s*-\s+/, "- [x] ");
    }
  }

  ensureCompletedEntry(lines, matches[0].title);
  stampLastUpdated(lines);
  if(evidence){
    const note=`- Evidence: ${evidence}`;
    if(!lines.some(line=>line.trim()===note.trim()))lines.push("", note);
  }
  const next=lines.join("\n");
  const stamped=next.split(/\r?\n/);
  maybeMarkOverallComplete(next, stamped);
  return {text:stamped.join("\n"), changed:true, matched:matches[0].title};
}

export function writeProgressFile(file:string, title:string, evidence?:string){
  const fs=require("node:fs") as typeof import("node:fs");
  if(!fs.existsSync(file))return {changed:false, matched:null as string|null};
  const current=fs.readFileSync(file, "utf8");
  if(hasConflictMarkers(current))return {changed:false, matched:null as string|null};
  const result=markProgressItemComplete(current, title, evidence);
  if(result.changed)fs.writeFileSync(file, result.text.endsWith("\n")?result.text:result.text+"\n", "utf8");
  return {changed:result.changed, matched:result.matched};
}

export function extractTestFailures(text:string){
  const src=String(text||"");
  const out:string[]=[];
  const push=(line:string)=>{
    const clean=line.replace(/\s+/g," ").trim().slice(0,220);
    if(clean&&!out.includes(clean))out.push(clean);
  };
  if(/Verifier timed out/i.test(src))push("Independent verifier timed out");
  if(/FAILED ·/i.test(src)){
    const hit=src.match(/FAILED ·[^\n]*/i);
    if(hit)push(hit[0]);
  }
  for(const line of src.split(/\r?\n/)){
    if(/^\s*(?:FAIL|FAILED)\s+\S/.test(line)||/Failed asserting/.test(line)){
      push(line);
    }else{
      const count=line.match(/\b(\d+)\s+failed\b/i);
      if(count&&count[1]!=="0")push(line);
    }
    if(out.length>=8)break;
  }
  return out;
}

function upsertSection(lines:string[], heading:string, bodyLines:string[], keepChecklists=false){
  const head=`## ${heading}`;
  const start=lines.findIndex(line=>new RegExp(`^##\\s+${heading.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}\\s*$`,"i").test(line));
  if(start<0){
    while(lines.length&&lines[lines.length-1]==="")lines.pop();
    lines.push("", head, "", ...bodyLines, "");
    return;
  }
  let end=start+1;
  while(end<lines.length&&!SECTION_RE.test(lines[end]))end++;
  const keep=keepChecklists
    ? lines.slice(start+1, end).filter(line=>/^\s*-\s+\[[ xX]\]\s+/.test(line)||/^\s*\d+\.\s+/.test(line))
    : [];
  const next=[head, ""];
  if(bodyLines.length)next.push(...bodyLines);
  if(keep.length){
    if(bodyLines.length)next.push("");
    next.push(...keep);
  }
  next.push("");
  lines.splice(start, end-start, ...next);
}

export type LivingProgressUpdate={
  title:string;
  ok:boolean;
  summary?:string;
  evidence?:string;
  testFailures?:string[];
  gaps?:string[];
  nextAction?:string;
  role?:string;
};

export function syncLivingProgress(text:string, update:LivingProgressUpdate){
  let current=String(text||"");
  if(hasConflictMarkers(current))return {text:current, changed:false};
  let changed=false;
  if(update.ok){
    const marked=markProgressItemComplete(current, update.title, update.evidence);
    if(marked.changed){
      current=marked.text;
      changed=true;
    }
  }
  const lines=current.split(/\r?\n/);
  const stamp=new Date().toISOString().replace("T"," ").slice(0,16)+"Z";
  const title=String(update.title||"work item").trim();
  const summary=String(update.summary||"").replace(/\s+/g," ").trim().slice(0,420);
  const failures=[...new Set((update.testFailures||[]).map(x=>x.trim()).filter(Boolean))].slice(0,8);
  const gaps=[...new Set((update.gaps||[]).map(x=>x.trim()).filter(Boolean))].slice(0,6);
  const open=openProgressItems(current).filter(item=>!titlesMatch(item.title, title)||!update.ok);
  const nextOpen=open[0]?.title||update.nextAction||"Re-read docs/ROADMAP.md and pick the next numbered phase.";

  if(update.ok){
    upsertSection(lines, "In Progress", [
      `None — **${title}** verified ${stamp}.`,
      gaps.length?`Gaps still open: ${gaps.join("; ")}`:`Next coding = ${nextOpen}`
    ], true);
  }else{
    upsertSection(lines, "In Progress", [
      `**${title}** — not closed${update.role?` (${update.role})`:""}.`,
      summary?summary:"Verification did not pass. Re-read project docs and fill the gap.",
      failures.length?`Test/verifier errors: ${failures.join(" · ")}`:""
    ].filter(Boolean), true);
  }

  upsertSection(lines, "Next", [
    nextOpen,
    "Re-read `docs/ROADMAP.md` and project docs before starting the next slice.",
    "When a role closes, run the relevant test suite and write failures here."
  ], true);

  const bugLines=failures.length
    ? failures.map(line=>`- [!] ${line}`)
    : update.ok?["- None recorded."]:[`- [!] ${summary||`${title} failed verification`}`];
  upsertSection(lines, "Bugs / errors", bugLines);

  upsertSection(lines, "Validation", [
    update.ok
      ? `- PASS · ${title}${update.evidence?` · ${update.evidence}`:""} · ${stamp}`
      : `- FAIL · ${title}${failures.length?` · ${failures[0]}`:summary?` · ${summary}`:""} · ${stamp}`
  ]);

  stampLastUpdated(lines);
  const next=lines.join("\n").replace(/\n{3,}/g,"\n\n");
  return {text:next.endsWith("\n")?next:next+"\n", changed:changed||next!==current};
}

export function writeLivingProgressFile(file:string, update:LivingProgressUpdate){
  const fs=require("node:fs") as typeof import("node:fs");
  if(!fs.existsSync(file))return {changed:false};
  const current=fs.readFileSync(file, "utf8");
  const result=syncLivingProgress(current, update);
  if(result.changed)fs.writeFileSync(file, result.text, "utf8");
  return {changed:result.changed};
}

export function livingProgressPrompt(){
  return [
    "PROGRESS.md is the living office ledger. Update it every close, not only on success.",
    "When a role finishes: run the relevant tests, then write pass/fail counts into ## Validation.",
    "If tests fail, copy the failing names into ## Bugs / errors and keep the checkbox open.",
    "If gaps remain, re-read docs/ROADMAP.md and project docs and put the next concrete slice in ## In Progress and ## Next.",
    "Do not leave In Progress as a stale paragraph after the work moved."
  ].join(" ");
}
