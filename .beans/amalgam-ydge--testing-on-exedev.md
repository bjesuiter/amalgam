---
# amalgam-ydge
title: Testing on exe.dev
status: todo
type: task
priority: high
created_at: 2026-01-19T10:54:18Z
updated_at: 2026-01-19T10:54:18Z
parent: amalgam-u0rf
---

End-to-end testing of the deployed application on exe.dev.

## Acceptance Criteria
- Deploy to exe.dev VM
- Test authentication flow
- Test workdir creation and sync
- Test chat functionality
- Test on Chrome and Edge
- Document any issues found

## Test Cases
1. Login via exe.dev auth
2. Create new workdir
3. Select local directory
4. Upload files
5. Create chat
6. Send message and receive response
7. Download changed files
8. Delete workdir

## Performance
- Measure initial load time
- Measure sync time for typical project
- Measure chat response latency