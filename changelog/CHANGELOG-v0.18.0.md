# AI Development Office v0.18.0 — Isolated Multi-Agent Execution

Author: JeXiR (Halil Cinkilinc)

## Execution modes
Every work item can now be dispatched as:

- `Solo` — existing direct main-working-tree execution.
- `Collaborative` — collaborator reviews followed by lead execution in an isolated Git worktree.
- `Competitive` — Cursor and Claude implement the same approved task in separate worktrees; verified candidates go to CTO selection.


## Real coding collaborators
- Collaborative task modal lets the user select which project agents are coding collaborators.
- Selected coding collaborators receive their own isolated Git worktrees.
- Lead + coding collaborators execute their role-scoped implementation candidates in parallel after read-only collaborator reviews pass.
- Each coding candidate is independently verified before merge.
- Conflict Detector compares candidate changed-file sets before touching main.
- If two coding agents changed the same file, Office blocks the task instead of guessing a merge.
- Non-coding collaborators remain read-only reviewers.
- Collaboration Graph distinguishes lead, coding collaborators, review collaborators and verifier.

## Isolated Git worktrees
- Worktrees are created under Office persistent runtime storage, outside the user project.
- Main project files are not touched during isolated implementation.
- Isolated modes require a Git project and a clean user working tree (Office runtime `.ai-kit/office-*` files are ignored by this gate).
- Worktrees and temporary branches are cleaned after completion/failure.

## Merge Gate
Before a candidate reaches the main working tree:
1. Candidate patch is extracted with binary/new-file support.
2. Main dirty files are checked for overlap.
3. `git apply --check --binary` must pass.
4. Patch is applied only after the gate succeeds.
5. Independent verifier inspects the merged main tree.
6. If verifier fails, Office reverses the patch automatically.

Merge patches persist under:

```text
.ai-kit/office-merges/
```

Execution metadata persists under:

```text
.ai-kit/office-executions/
```

## Competitive Cursor vs Claude
- Requires both Cursor CLI and Claude CLI.
- Each provider gets its own worktree.
- Each candidate receives the same approved plan and collaborator evidence.
- Each candidate is independently verified before selection.
- CTO read-only selection compares verified candidates.
- If CTO output is unavailable/malformed, a conservative deterministic fallback selects the smaller verified diff.
- Only the winning patch may pass Merge Gate.
- Winner is independently verified again after merge to the main tree.

## Skills Hub management
- Skills can now be enabled/disabled per project from Skills Hub.
- Policy persists in Office settings and `.ai-kit/office-skill-policy.json`.
- Disabled skills are included in runner policy prompts so agents are instructed not to intentionally invoke them.

## Portfolio & Quality
- Multi-Project Overview now exposes isolated, competitive and merge-waiting work.
- Quality Gate V3 visualizes:
  `Plan -> Collaborate -> Isolate -> Execute -> Merge -> Verify -> Re-audit`.
