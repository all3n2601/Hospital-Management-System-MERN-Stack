# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Backend (`cd backend`)
```bash
npm run dev          # Start dev server (nodemon + ts-node, port 4451)
npm test             # Run all Jest tests (MongoMemoryServer, no external DB needed)
npm run test:coverage  # Tests with coverage (targets 80% lines, 70% branches)
npm run lint         # ESLint
npm run typecheck    # tsc --noEmit
npm run build        # Compile TypeScript to dist/
```

### Frontend (`cd frontend`)
```bash
npm run dev      # Vite dev server (port 5173)
npm test         # Vitest
npm run lint     # ESLint
npm run typecheck  # tsc --noEmit
npm run build    # tsc + vite build
```

### Full Stack (Docker)
```bash
docker compose up         # Dev stack: MongoDB 7, Redis 7, API, Frontend
docker compose -f docker-compose.prod.yml up  # Production
```

### Run a single test file
```bash
cd backend && npx jest src/modules/lab/tests/lab.test.ts --forceExit
```

## Architecture

### Monorepo Structure
- `backend/` — Express 5 + TypeScript + Mongoose 8 API
- `frontend/` — React 18 + Vite + TypeScript + TailwindCSS + Shadcn/ui

### Backend: Modular Pattern
Each feature follows: **model → service → controller → router** under `backend/src/modules/<feature>/`.

Current modules: `auth`, `staff`, `patients`, `appointments`, `billing`, `lab`

**Planned (PLAN.md phases 6-9):** Pharmacy, Inventory, Documents, Analytics

All routes are mounted at `/api/v1` in `backend/src/server.ts`.

### Backend Middleware Stack (applied in order)
1. `helmet` — security headers
2. `cors` — origins from `CORS_ORIGINS` env
3. `authenticate` — JWT Bearer → sets `req.user`
4. `authorize` — RBAC factory with centralized permission matrix (see `backend/src/middleware/authorize.ts`)
5. `auditLog` — append-only audit trail for all mutations
6. `rateLimiter` — Redis-backed express-rate-limit
7. `errorHandler` — standardized `{ success: false, error: { code, message, details } }` envelope

### RBAC
Permissions are defined in a single matrix in `authorize.ts`. Role enum: `admin`, `doctor`, `nurse`, `receptionist`, `patient`. Never scatter permission checks outside this middleware.

### Database
- **MongoDB** via Mongoose with 5-retry connection logic (`backend/src/db/mongoose.ts`)
- **Redis** for caching, rate limiting, and Socket.io multi-instance adapter
- **Secrets** loaded from AWS Secrets Manager in production; falls back to `process.env` locally (see `backend/src/config/secrets.ts`)
- Auto-generated IDs (PAT-XXXX, LAB-XXXX, INV-XXXX) use `countDocuments` pre-save — **not race-safe**; atomic counters needed before production scale

### Models of Note
- `User` — unified auth model; role determines what companion record exists (Patient, Doctor, Nurse, Receptionist)
- `RefreshToken` — family-based invalidation for refresh token rotation
- `AuditLog` — append-only; never mutate
- `LabOrder` / `LabResult` — one-to-one relationship; LabResult has unique index on `labOrder`

### Frontend Architecture
- **Redux Toolkit** — auth state only (`authSlice`: user, token, loading, error); token persisted to `localStorage`
- **TanStack Query v5** — all server state (appointments, billing, lab data)
- **React Router v6** — role-based routing; `ProtectedRoute` guards with role checks
- Route prefixes: `/admin/*`, `/doctor/*`, `/nurse/*`, `/patient/*`; redirects on `/dashboard` based on `user.role`

### Real-Time (Socket.io)
- JWT handshake authentication; Redis adapter for multi-instance
- User rooms: `user:{userId}` + role-based rooms
- Emits on appointment/lab status changes

### Testing Conventions
- Backend: Jest + `ts-jest` + `supertest` + `MongoMemoryServer` (no real DB needed)
- Rate limiter, request logger, and socket middleware are mocked in tests
- Tests live in `backend/src/modules/<feature>/tests/<feature>.test.ts`
- Frontend: Vitest

### Environment Variables
| Variable | Default | Purpose |
|---|---|---|
| `PORT` | 4451 | API port |
| `CORS_ORIGINS` | http://localhost:5173 | Comma-separated allowed origins |
| `AWS_REGION` | us-east-1 | Secrets Manager region |
| `AWS_SECRET_NAME` | hms/app-secrets | Secrets Manager key |
| `LOG_LEVEL` | info | Winston log level |

Secrets (`MONGODB_URI`, `REDIS_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`) come from AWS Secrets Manager or `process.env` locally.
