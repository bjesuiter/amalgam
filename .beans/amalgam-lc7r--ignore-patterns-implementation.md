---
# amalgam-lc7r
title: Ignore patterns implementation
status: todo
type: task
priority: high
created_at: 2026-01-19T10:52:49Z
updated_at: 2026-01-19T10:52:49Z
parent: amalgam-azfj
---

Implement file ignore patterns for sync operations.

## Acceptance Criteria
- Library at `app/lib/ignore.ts`
- `shouldIgnore(path: string): boolean` function
- Support glob patterns
- Default patterns from SPEC.md

## Default Patterns
```
node_modules/
.git/
.DS_Store
*.log
.env
.env.*
dist/
build/
.cache/
.amalgam/
```

## Future Enhancement
- Per-workdir custom patterns (store in DB)
- Respect .gitignore if present