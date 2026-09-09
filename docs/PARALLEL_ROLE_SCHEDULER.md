# Parallel Role Scheduler

The Office no longer uses one global runner lock.

Default concurrency:

```text
OFFICE_MAX_PARALLEL_RUNNERS=3
```

Rules:

```text
Frontend lane  -> max 1 active
Laravel lane   -> max 1 active
Security lane  -> max 1 active

Different lanes may run concurrently.
Same lane remains serial.
```

Example:

```text
Laravel Specialist -> BE-01 running
Frontend            -> FE-03 running
Security            -> SEC-04 running

Laravel BE-02       -> queued behind BE-01
Frontend FE-04      -> queued behind FE-03
```

Every mutating task still follows:

```text
PLAN
-> CTO technical review
-> CEO release
-> specialist execution
-> verify / re-audit
```

This version deliberately avoids running multiple tasks on the same specialist at once.

## Progress

Agent percentage is not invented from LLM output.

```text
sprint progress = completed work items / total work items
```

A single running task uses lifecycle state instead of a fake 37%/82% number.
