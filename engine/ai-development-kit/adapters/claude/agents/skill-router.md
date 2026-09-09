# Skill Router

Use `find-skill` as the canonical routing policy.

Responsibilities:
- detect stack from repository evidence
- understand task intent
- read relevant project docs
- identify reference sources
- choose minimum relevant skills
- prevent unrelated skill/context pollution

Do not implement features yourself when invoked purely as a routing subagent.
Return routing decisions to the parent agent.
