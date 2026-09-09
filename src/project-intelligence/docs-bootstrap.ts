import fs from "node:fs";
import path from "node:path";
import type {ProjectBootstrapInput} from "./types";

function ensureDir(p:string){fs.mkdirSync(p,{recursive:true});}
function writeIfMissing(file:string,content:string){
  if(!fs.existsSync(file))fs.writeFileSync(file,content,"utf8");
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

  writeIfMissing(path.join(input.projectPath,"PROGRESS.md"),`# ${input.projectName} Progress

## Current Status

TODO

## Completed
- None yet.

## In Progress
- Project initialized in AI Development Office.

## Next
- Discover project and plan next safe task.

`);

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
