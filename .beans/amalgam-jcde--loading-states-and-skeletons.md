---
# amalgam-jcde
title: Loading states and skeletons
status: todo
type: task
priority: normal
created_at: 2026-01-19T10:54:05Z
updated_at: 2026-01-19T10:54:05Z
parent: amalgam-u0rf
---

Add loading indicators and skeleton screens for better perceived performance.

## Acceptance Criteria
- Skeleton components for lists (workdirs, chats)
- Skeleton for chat messages
- Loading spinner for sync operations
- Suspense boundaries with fallbacks
- Optimistic UI updates where appropriate

## Components
- WorkdirListSkeleton
- ChatListSkeleton
- MessageSkeleton
- SyncProgress indicator

## Guidelines
- Use skeletons for initial page loads
- Use spinners for user-initiated actions
- Avoid layout shift during loading