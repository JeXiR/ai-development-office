---
name: risk-priority-engine
description: Rank verified findings and unfinished work using deterministic risk factors and record why the selected next action outranks alternatives.
---

# Risk Priority Engine v1

Author: JeXiR (Halil Cinkilinc)

## Goal

Choose the next action from verified evidence, not file order or arbitrary HIGH finding order.

## Priority classes

Within otherwise comparable work:

1. confirmed exploitable security/data-isolation defect
2. credential/secret exposure
3. authentication/authorization defect
4. data integrity / destructive behavior
5. externally exposed functional defect
6. operational reliability defect
7. missing verification/test coverage
8. ordinary incomplete feature
9. technical debt / cleanup
10. deferred work

Severity remains important; this ordering does not allow a LOW issue to automatically outrank a BLOCKER.

## Factors

Evaluate:
- severity
- confirmed vs suspected
- exploitability
- external exposure
- data/credential sensitivity
- blast radius
- dependency impact
- confidence/evidence quality
- validation gap
- remediation urgency

## Required output

Whenever selecting `next_action`, record:
- selected finding/task
- severity
- category
- concise `selected_reason`
- important higher/equal severity alternatives that were intentionally deferred

Example:
`Selected H6 because it is a confirmed externally reachable authorization defect; H1 is a verification gap rather than a confirmed exploit.`

Never claim mathematical precision when inputs are qualitative.
