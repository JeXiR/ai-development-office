# v2 Recovery & Replay — rc.3

Runtime events are persisted per session under `.ai-kit/replay/sessions/<session>.jsonl`.

Recovery backups copy `.ai-kit` state plus package/composer lock metadata into the Office backup directory.

Atomic write helpers fsync temporary files before rename.
