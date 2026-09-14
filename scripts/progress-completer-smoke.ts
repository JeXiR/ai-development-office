import {checklistCompletion,extractTestFailures,hasConflictMarkers,isNonShippingExecutorResult,markProgressItemComplete,normalizeProgressTitle,openProgressItems,parseProgressItems,syncLivingProgress,titlesMatch} from "../src/project-intelligence/progress-completer";
import {liveCompletion} from "../src/coverage/live-completion";

const source=`# PROGRESS

**Overall:** IN PROGRESS
**Last Updated:** 2026-01-01

## Completed

- [x] Initial project analysis

## In Progress

- [ ] Auth form

## Todo

- [ ] Billing webhooks
- [ ]
- [ ] None recorded

## Next Actions

1. Auth form
2. Billing webhooks
`;

const open=openProgressItems(source);
if(open.length!==2)throw new Error(`expected 2 open items, got ${open.map(x=>x.title).join(" | ")}`);
if(parseProgressItems(source).some(x=>/none recorded/i.test(x.title)))throw new Error("none recorded leaked");

const first=markProgressItemComplete(source, "Auth form", "verified in tests");
if(!first.changed||!first.matched)throw new Error("auth form was not marked");
if(!/\[x\] Auth form/.test(first.text))throw new Error("checkbox not checked");
if(openProgressItems(first.text).some(x=>x.title==="Auth form"))throw new Error("auth form still open");

const second=markProgressItemComplete(first.text, "Billing webhooks");
const leftover=openProgressItems(second.text);
if(leftover.length)throw new Error(`still open: ${leftover.map(x=>x.title).join(", ")}`);
if(!/\*\*Overall:\*\*\s+COMPLETE/.test(second.text))throw new Error("overall not complete");

const conflicted=`# PROGRESS
<<<<<<< HEAD
- [ ] Ours only
=======
- [ ] Theirs only
>>>>>>> branch
- [ ] Shared open
`;
if(!hasConflictMarkers(conflicted))throw new Error("conflict markers not detected");
if(!isNonShippingExecutorResult("Architect turn complete — planning only; no product files changed."))throw new Error("planning-only result should be non-shipping");
if(!isNonShippingExecutorResult("This turn does **not** implement (plan §4.11)."))throw new Error("explicit non-implement result should be non-shipping");
if(isNonShippingExecutorResult("Site CRUD shipped; 12 tests passed."))throw new Error("shipping result should not be flagged");
if(parseProgressItems(conflicted).some(x=>/<<<<<<</.test(x.title)))throw new Error("conflict marker leaked as work");

const road02="ROAD-02 — Phase 0 follow-ons: Auth → Orgs → i18n/theme → admin/audit";
const road01="Phase 0 follow-ons: Auth → Orgs → i18n/theme → admin/audit (ROAD-02)";
const backlog=checklistCompletion([source]);
if(backlog.total!==3||backlog.done!==1||backlog.remaining!==67)throw new Error(`checklist remaining should move, got ${JSON.stringify(backlog)}`);
const after=checklistCompletion([second.text]);
if(after.remaining!==0)throw new Error("completed checklist remaining should be 0");

const live=liveCompletion({coverageScore:40,roadmapPercent:70,remainingPercent:30});
if(live.overallScore!==70||live.remainingPercent!==30)throw new Error("live remaining must follow the checklist, not a frozen coverage score");

if(normalizeProgressTitle(road02)!==normalizeProgressTitle(road01))throw new Error("work-item id prefixes must not split the same checkbox");
if(!titlesMatch(road02, road01))throw new Error("ROAD-01/ROAD-02 auth titles must match");

const livingSource=`# PROGRESS

**Overall:** IN PROGRESS
**Last Updated:** 2026-01-01

## Current Status

- [x] Phase 15 Deployment Intelligence
- [ ] Phase 16 Unified Intelligence

## Completed

- [x] Phase 15 Deployment Intelligence

## In Progress

Collaborative Phase 16 is planning.
- [ ] Phase 16 Unified Intelligence

## Next

Phase 16 Unified Intelligence

## Bugs / errors

- None recorded.

## Validation

- PASS · Phase 15
`;

const failExtract=extractTestFailures("Independent verifier timed out\nTests: 2 failed, 10 passed\n0 failed assertions ignored\nFAIL Feature/DeployHealthTest");
if(!failExtract.some(x=>/verifier timed out/i.test(x)))throw new Error("timeout must be extracted");
if(!failExtract.some(x=>/2 failed/.test(x)))throw new Error("failed count must be extracted");
if(!failExtract.some(x=>/FAIL Feature\/DeployHealthTest/.test(x)))throw new Error("FAIL line must be extracted");
if(failExtract.some(x=>/^0 failed/.test(x)))throw new Error("0 failed must not be treated as a failure");

const livingFail=syncLivingProgress(livingSource,{
  title:"Phase 16 Unified Intelligence",
  ok:false,
  summary:"Independent verifier timed out",
  testFailures:failExtract,
  role:"Architect"
});
if(!livingFail.changed)throw new Error("failed living progress must write");
if(!/\[ \] Phase 16 Unified Intelligence/.test(livingFail.text))throw new Error("failed item must stay open");
if(!/## Bugs \/ errors[\s\S]*\[!\] Independent verifier timed out/.test(livingFail.text))throw new Error("test errors must land in Bugs / errors");
if(!/## Validation[\s\S]*FAIL · Phase 16/.test(livingFail.text))throw new Error("failed validation must be recorded");
if(!/not closed \(Architect\)/.test(livingFail.text))throw new Error("In Progress must keep the failed role");
if(checklistCompletion([livingFail.text]).todo!==checklistCompletion([livingSource]).todo)throw new Error("bug lines must not inflate remaining checklist");

const livingOk=syncLivingProgress(livingFail.text,{
  title:"Phase 16 Unified Intelligence",
  ok:true,
  evidence:"verified in suite"
});
if(!/\[x\] Phase 16 Unified Intelligence/.test(livingOk.text))throw new Error("passed item must be checked");
if(!/## Validation[\s\S]*PASS · Phase 16/.test(livingOk.text))throw new Error("passed validation must be recorded");
if(!/## In Progress[\s\S]*None —/.test(livingOk.text))throw new Error("In Progress must clear after a verified close");
if(openProgressItems(livingOk.text).some(x=>titlesMatch(x.title,"Phase 16 Unified Intelligence")))throw new Error("verified item still open");

console.log("Progress completer smoke PASS");
