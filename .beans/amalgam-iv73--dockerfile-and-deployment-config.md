---
# amalgam-iv73
title: Dockerfile and deployment config
status: todo
type: task
priority: high
created_at: 2026-01-19T10:54:15Z
updated_at: 2026-01-19T10:54:15Z
parent: amalgam-u0rf
---

Create Dockerfile and configuration for exe.dev deployment.

## Acceptance Criteria
- Dockerfile for production build
- Multi-stage build (build + runtime)
- Node.js runtime with bun
- SQLite data volume
- Health check endpoint
- Environment variable configuration

## Dockerfile Structure
```dockerfile
# Build stage
FROM oven/bun:1 AS builder
WORKDIR /app
COPY . .
RUN bun install && bun run build

# Runtime stage
FROM oven/bun:1-slim
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3000
CMD ["bun", "run", "start"]
```

## exe.dev Config
- Port: 3000
- Persistent volume for /app/data (SQLite)
- Environment: production

## Verification
- Manual validation:
  - `docker build -t amalgam .` succeeds
  - `docker run -p 3000:3000 amalgam` starts server
  - `curl http://localhost:3000` returns expected response
  - `curl http://localhost:3000/health` returns 200 (health check)
  - Container size is reasonable (< 500MB)
- Test volume persistence:
  - Create data in container
  - Stop and restart container with same volume
  - Verify data persists