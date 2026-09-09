# v2 Workspace Architecture — alpha.2

Workspace = File Explorer + Monaco Editor + xterm.js Live Terminal + Git Diff Viewer.

Bridge actions: `workspace_list`, `workspace_read`, `workspace_write`, `workspace_git_diff`, `workspace_watch`, `workspace_unwatch`.

Safety: path confinement to project root, 2 MB editor limit, trusted-project gate for writes.
