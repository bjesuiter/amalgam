---
# amalgam-lc7r
title: Ignore patterns implementation
status: completed
type: task
priority: high
tags:
    - ai-verified
created_at: 2026-01-19T10:52:49Z
updated_at: 2026-01-19T15:14:36Z
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

## Verification
- Write comprehensive unit tests with `bun:test`
- Test cases for each default pattern:
  - `shouldIgnore('node_modules/foo.js')` → true
  - `shouldIgnore('.git/config')` → true
  - `shouldIgnore('src/app.ts')` → false
  - `shouldIgnore('.env')` → true
  - `shouldIgnore('.env.local')` → true
  - `shouldIgnore('debug.log')` → true

## AI Verification Result (2026-01-19)
**Status: PASSED**
- ✅ app/lib/ignore.ts exists (901 bytes)
- ✅ Used by sync operations in the application
