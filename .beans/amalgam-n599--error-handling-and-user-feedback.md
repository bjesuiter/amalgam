---
# amalgam-n599
title: Error handling and user feedback
status: completed
type: task
priority: normal
created_at: 2026-01-19T10:54:02Z
updated_at: 2026-01-19T18:47:46Z
parent: amalgam-u0rf
---

Comprehensive error handling with user-friendly feedback.

## Acceptance Criteria
- Global error boundary component
- Toast notifications for success/error
- Specific error messages (not generic 'Something went wrong')
- Network error handling with retry options
- Form validation errors displayed inline
- API error responses parsed and displayed

## Components
- Error boundary wrapper
- Toast/notification system (shadcn/ui)
- Error state components

## Error Categories
- Network errors (offline, timeout)
- Auth errors (session expired)
- Validation errors (form inputs)
- Server errors (500s)
- Not found errors (404s)

## Verification
- Use `agent-browser` skill to test UI error states
- Verify: error boundary catches and displays errors
- Verify: toast notifications appear for success/error actions
- Verify: form validation shows inline errors
- Write unit tests with `bun:test` for error parsing utilities
- Simulate network errors to test offline handling