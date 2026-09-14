import fs from "node:fs";
import path from "node:path";
import {openProgressItems} from "./progress-completer";
import type {ProjectBootstrapInput} from "./types";

function ensureDir(p:string){fs.mkdirSync(p,{recursive:true});}
function writeIfMissing(file:string,content:string){
  if(!fs.existsSync(file))fs.writeFileSync(file,content,"utf8");
}

export function isDocsBootstrapGoal(goal:string){
  const g=String(goal||"").trim();
  if(!g)return false;
  return /^(create|bootstrap|generate|write)\s+(the\s+)?(project\s+)?docs\b/i.test(g)
    || /^create project docs$/i.test(g)
    || /^proje dok[uü]manlar[iı]n[iı] olu[sş]tur$/i.test(g);
}

function progressSkeleton(projectName:string){
  return `# ${projectName} Progress

## Current Status

- [ ] TODO: Discover current project architecture
- [ ] TODO: Resolve required AI Development Kit capabilities
- [ ] TODO: Define the next safe implementation task

## Completed

- None yet.

## In Progress

Project initialized in AI Development Office.

## Next

- Discover project and plan next safe task.

## Bugs / errors

- None recorded.

## Validation

- None recorded.

`;
}

export function bootstrapProjectDocs(input:ProjectBootstrapInput){
  const docsDir=path.join(input.projectPath,"docs");
  ensureDir(docsDir);

  const goals=input.goals||[];
  const constraints=input.constraints||[];

  writeIfMissing(path.join(docsDir,"ROADMAP.md"),`# ${input.projectName} Roadmap

## Product Brief

${input.brief}

## Goals

${goals.length?goals.map(x=>`- [ ] TODO: ${x}`).join("\n"):"- [ ] TODO: Define first implementation milestone"}

## Constraints

${constraints.length?constraints.map(x=>`- ${x}`).join("\n"):"- None recorded yet."}

## Milestones

### Milestone 1 — Foundation
- [ ] TODO: Discover current project architecture
- [ ] TODO: Resolve required AI Development Kit capabilities
- [ ] TODO: Define the next safe implementation task

`);

  writeIfMissing(path.join(input.projectPath,"PROGRESS.md"),progressSkeleton(input.projectName));

  writeIfMissing(path.join(docsDir,"PROJECT_STATE.md"),`# ${input.projectName} Project State

## Summary
${input.brief}

## Runtime Evidence Precedence
1. runtime/tests
2. docs
3. roadmap/TODO
4. generated state

## Current Decision State
UNKNOWN

## Current Task
Not assigned.

## Last Office Sync
${new Date().toISOString()}

`);

  writeIfMissing(path.join(docsDir,"decisions.md"),`# Decisions

No project decisions have been recorded yet.
`);

  return {
    docsDir,
    roadmap:path.join(docsDir,"ROADMAP.md"),
    progress:path.join(input.projectPath,"PROGRESS.md"),
    state:path.join(docsDir,"PROJECT_STATE.md"),
    decisions:path.join(docsDir,"decisions.md")
  };
}

export function ensureOfficeProjectDocs(input:ProjectBootstrapInput){
  const created=bootstrapProjectDocs(input);
  const progressFile=created.progress;
  const text=fs.existsSync(progressFile)?fs.readFileSync(progressFile,"utf8"):"";
  if(openProgressItems(text).length)return {...created,repaired:false};

  const archive=path.join(created.docsDir,"office-mission-log.md");
  if(text.trim()){
    fs.appendFileSync(archive,`\n\n## ${new Date().toISOString()}\n\n${text.trim()}\n`,"utf8");
  }
  fs.writeFileSync(progressFile,progressSkeleton(input.projectName),"utf8");
  if(fs.existsSync(created.state)){
    const stateText=fs.readFileSync(created.state,"utf8");
    if(/OLLAMA_MODEL is not configured/i.test(stateText)){
      fs.writeFileSync(created.state,`# ${input.projectName} Project State

## Summary
${input.brief}

## Runtime Evidence Precedence
1. runtime/tests
2. docs
3. roadmap/TODO
4. generated state

## Current Decision State
UNKNOWN

## Current Task
Not assigned.

## Last Office Sync
${new Date().toISOString()}

`,"utf8");
    }
  }
  return {...created,repaired:true};
}
