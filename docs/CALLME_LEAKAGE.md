# CallMe is a project, not the product

CallMe (`D:\laragon\www\callme`) is one optional acceptance-test target. Office must run on any trusted folder.

## Why CallMe errors showed up on other work

1. **Settings always ran CallMe readiness** on the active project. Any Laravel-or-not repo got `Project does not match expected CallMe stack` and a red NOT READY strip.
2. **Inbox treated the word `CallMe` as infrastructure noise**, so CallMe-named events leaked into notifications for every project that mentioned it.
3. **UI placeholders** said `CallMe` when adding a project.
4. **Factory live smoke** defaulted to `D:\laragon\www\callme` if `OFFICE_PROJECT_PATH` was empty, so a missing/conflicted CallMe tree looked like an Office failure.
5. **Stable / release copy** still names “CallMe real project” as a promotion checkbox. That is an acceptance harness label, not a runtime dependency.

## Product-facing rule

- Do not hardcode CallMe (or SimpleTodo, or any sample app) as the default project.
- Acceptance validators may detect a CallMe-compatible stack and then run. They must stay hidden on other projects.
- Factory, hive, leases, and verify receipts are project-neutral.

## Still CallMe-named on purpose

`src/validation/callme-*`, `scripts/callme-*`, and the settings panel (now hidden unless the detector matches) remain the optional acceptance suite. Rename that suite later if you want; do not delete it as “product code.”
