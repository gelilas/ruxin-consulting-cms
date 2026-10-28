# Ruxin Consulting CMS — Full Backend Implementation Guide

This guide upgrades `cms/ruxin-consulting-cms` from a **single-password + JSON file** API into a real **SQL-backed CRUD backend** with **users**, **sessions/auth**, and **page/content management**.

**Target directory:** `c:\Users\yohan\OneDrive\Desktop\ruxin\cms\ruxin-consulting-cms`

**Prerequisite you will provide:** a SQL connection string (SQL Server, PostgreSQL, or MySQL). Paste it into `.env` as `DATABASE_URL` when ready.

**Package manager:** use **npm** for this CMS/backend project (`npm install`, `npm run …`, `npx …`). Do not use pnpm here.

---

## 0. Current state (what exists today)

| Piece | Today |
|--------|--------|
| UI | React CMS on Vite port `4000` (`src/App.tsx`, `src/sections.tsx`) |
| API | Vite middleware in `server/api.ts` |
| Auth | One shared `ADMIN_PASSWORD`, HMAC cookie `cms_session` |
| Storage | `data/content.json` (whole-site blob) |
| Public site | `ruxin-consulting-website-react` fetches `GET /api/content` |

**Goal:** keep the same CMS UI and public `GET /api/content` contract where possible, but replace the middleware with a real Node API + SQL.

---

## 1. Target architecture

```
┌─────────────────────────────┐     ┌──────────────────────────────────┐
│  Marketing site (:5173)     │     │  CMS admin UI (:4000 Vite)       │
│  GET /api/content (public)  │────▶│  login / users / section editors │
└─────────────────────────────┘     └──────────────┬───────────────────┘
                                                   │ /api/*
                                                   ▼
                                    ┌──────────────────────────────────┐
                                    │  Backend API (Hono or Express)   │
                                    │  Auth · Users · Pages · Content  │
                                    └──────────────┬───────────────────┘
                                                   │
                                                   ▼
                                    ┌──────────────────────────────────┐
                                    │  SQL Database (your connection)  │
                                    │  users · sessions · pages · …    │
                                    └──────────────────────────────────┘
```

**Recommended stack (fits this repo):**

| Layer | Choice | Why |
|--------|--------|-----|
| Runtime | Node.js + TypeScript | Same as Vite CMS |
| HTTP | **Hono** (or Express) | Small, typed, easy to run beside Vite |
| ORM | **Prisma** | Works with Postgres / MySQL / SQL Server |
| Auth | bcrypt + **JWT Bearer** tokens | Stateless API auth (Swagger-friendly) |
| Input safety | Zod field validation + Prisma only | Blocks injection / malformed params |
| Passwords | `bcrypt` | Never store plain text |
| Dev | Vite CMS UI + separate API process (or Vite proxy) | Clean production story |

---

## 2. What you will build (feature checklist)

### Authentication
- [ ] Register/bootstrap first admin (seed script)
- [ ] Login with email + password
- [ ] Logout
- [ ] Session check (`GET /api/session`)
- [ ] Protect all mutating routes
- [ ] Optional: roles (`admin`, `editor`)

### Users CRUD (admin only)
- [ ] `GET /api/users` — list users
- [ ] `POST /api/users` — create user
- [ ] `GET /api/users/:id` — get one
- [ ] `PATCH /api/users/:id` — update (name, role, password)
- [ ] `DELETE /api/users/:id` — delete (not yourself)

### Pages / content CRUD
Two workable models — pick **A** (simplest, closest to today) or **B** (true pages):

**Model A — Site content document (recommended first)**  
Keep one logical “site” record that stores the same `SiteContent` JSON shape as `src/types.ts`. Editors stay almost unchanged.

- [ ] `GET /api/content` — public read (for marketing site)
- [ ] `PUT /api/content` — auth write (full replace)
- [ ] Optional: `PATCH /api/content/:section` — update one section

**Model B — Pages table**  
Each page = slug + title + JSON body (or blocks).

- [ ] `GET /api/pages` — list
- [ ] `GET /api/pages/:slug` — public read
- [ ] `POST /api/pages` — create
- [ ] `PUT /api/pages/:id` — update
- [ ] `DELETE /api/pages/:id` — delete

You can implement **A first**, then add **B** for blog/insights later.

---

## 3. Folder structure to create

Inside `cms/ruxin-consulting-cms`:

```
ruxin-consulting-cms/
├── .env                    # secrets (gitignored)
├── .env.example            # template (commit this)
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── server/
│   ├── api.ts              # keep temporarily OR replace with entry below
│   ├── index.ts            # NEW — API entry (listen on 4001)
│   ├── db.ts               # Prisma client
│   ├── auth.ts             # password hash, JWT helpers
│   ├── validation.ts       # Zod field rules + SQL-injection rejects
│   ├── middleware.ts       # requireAuth, requireAdmin
│   ├── openapi.ts          # Swagger / OpenAPI document
│   └── routes/
│       ├── auth.ts
│       ├── users.ts
│       ├── content.ts
│       └── pages.ts        # if using Model B
├── src/                    # existing React CMS UI
└── BACKEND_GUIDE.md        # this file
```

---

## 4. Environment setup

### 4.1 Create `.env` (do not commit)

When you have the connection string, set:

```env
# Paste your SQL connection string here
DATABASE_URL="YOUR_CONNECTION_STRING_HERE"

# Session signing secret (long random string)
SESSION_SECRET="replace-with-long-random-hex"

# API
API_PORT=4001
API_ORIGIN=http://localhost:4001

# Optional: allow marketing site origin
CORS_ORIGIN=http://localhost:5173

# Bootstrap admin (used only by seed)
SEED_ADMIN_EMAIL=admin@ruxin.local
SEED_ADMIN_PASSWORD=change-me-now
SEED_ADMIN_NAME=Admin
```

### 4.2 Create `.env.example` (commit)

Same keys, with fake values and no real passwords.

### 4.3 Connection string formats (reference)

**PostgreSQL**
```text
postgresql://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require
```

**MySQL**
```text
mysql://USER:PASSWORD@HOST:3306/DATABASE
```

**SQL Server (Prisma)**
```text
sqlserver://HOST:1433;database=DATABASE;user=USER;password=PASSWORD;encrypt=true
```

Tell the implementer which engine you use so `provider` in `schema.prisma` matches.

---

## 5. Prisma schema

### 5.1 Install

From `cms/ruxin-consulting-cms`:

```bash
npm install prisma @prisma/client bcrypt hono @hono/node-server zod
npm install -D @types/bcrypt tsx dotenv
npx prisma init
```

### 5.2 `prisma/schema.prisma` (Model A + users)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  // Change to mysql | sqlserver if needed
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  ADMIN
  EDITOR
}

model User {
  id           String    @id @default(cuid())
  email        String    @unique
  name         String
  passwordHash String
  role         Role      @default(EDITOR)
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  sessions     Session[]
}

model Session {
  id        String   @id @default(cuid())
  tokenHash String   @unique
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  expiresAt DateTime
  createdAt DateTime @default(now())
}

/// Single row for the public marketing site content (SiteContent JSON)
model SiteDocument {
  id        String   @id @default("main")
  content   Json
  updatedAt DateTime @updatedAt
  updatedBy String?
}

/// Optional Model B — CMS pages
model Page {
  id          String   @id @default(cuid())
  slug        String   @unique
  title       String
  status      String   @default("draft") // draft | published
  body        Json
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  createdById String?
}
```

### 5.3 Migrate + seed

```bash
npx prisma migrate dev --name init
npx prisma db seed
```

## 6. Website analytics

The CMS now includes a privacy-conscious first-party analytics layer. The marketing site asks visitors for consent, then sends anonymous events to the CMS. The API stores only a one-way visitor hash plus aggregate-friendly fields such as event name, section, service, referrer hostname, approximate country/city headers, device, and engagement seconds. It never stores contact names, email addresses, phone numbers, or messages in analytics.

Endpoints:

- `POST /api/analytics/events` — public, rate-limited event intake.
- `GET /api/analytics/summary?from=YYYY-MM-DD&to=YYYY-MM-DD` — authenticated aggregated dashboard data.

After pulling the code, create the table and regenerate Prisma Client with:

```bash
npm run db:push
```

The CMS admin sidebar then includes **Analytics**, with visitors, visits, page views, locations, cities when available, sections reached, service interest, traffic sources, device mix, contact actions, form activity, and engagement time. Successful form validation is not a confirmed lead until contact delivery/storage is connected.

Add to `package.json`:

```json
{
  "scripts": {
    "dev": "vite",
    "dev:api": "tsx watch server/index.ts",
    "db:migrate": "prisma migrate dev",
    "db:seed": "tsx prisma/seed.ts",
    "db:studio": "prisma studio",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview"
  },
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}
```

### 5.4 Seed script outline (`prisma/seed.ts`)

1. Read `SEED_ADMIN_*` from env.
2. Hash password with bcrypt (cost 12).
3. Upsert admin user.
4. If no `SiteDocument` with `id = "main"`, load `data/content.json` and insert it.
5. Log “Admin ready: email”.

This preserves all current website copy.

---

## 6. Auth design (proper, multi-user)

### Rules
- Store **bcrypt hashes** only (`passwordHash`).
- Session cookie: `cms_session=<opaque token>`; store **hash of token** in `Session` table.
- Cookie flags: `HttpOnly; Path=/; SameSite=Lax; Secure` (Secure in production HTTPS).
- Expiry: 7 days (same as current CMS).
- On login: create `Session` row; on logout: delete it.
- `GET /api/session` returns `{ ok, user: { id, email, name, role } }` when valid.

### Password policy (minimum)
- Min 10 characters
- Reject empty / whitespace-only
- On update password: require current password (except admin resetting another user)

### Roles
| Role | Can |
|------|-----|
| `EDITOR` | Read/write content & pages |
| `ADMIN` | Everything + users CRUD |

---

## 7. API routes specification

Base URL in dev: `http://localhost:4001`

### Auth

| Method | Path | Auth | Body | Response |
|--------|------|------|------|----------|
| POST | `/api/login` | No | `{ email, password }` | `{ ok: true, user }` + Set-Cookie |
| POST | `/api/logout` | Session | — | `{ ok: true }` + clear cookie |
| GET | `/api/session` | Cookie | — | `{ ok, user? }` |

**Breaking change vs today:** login moves from `{ password }` only → `{ email, password }`.  
Update `src/api.ts` and the login form in `src/App.tsx`.

### Content (Model A — keep marketing site working)

| Method | Path | Auth | Notes |
|--------|------|------|--------|
| GET | `/api/content` | Public | Same JSON shape as `SiteContent` |
| PUT | `/api/content` | EDITOR+ | Validate with Zod against `SiteContent` |
| PATCH | `/api/content/:section` | EDITOR+ | Optional; section key from `KEYS` in old `api.ts` |

### Users (ADMIN only)

| Method | Path | Body |
|--------|------|------|
| GET | `/api/users` | — |
| POST | `/api/users` | `{ email, name, password, role? }` |
| GET | `/api/users/:id` | — |
| PATCH | `/api/users/:id` | `{ name?, role?, password? }` |
| DELETE | `/api/users/:id` | — |

### Pages (Model B — optional)

| Method | Path | Auth |
|--------|------|------|
| GET | `/api/pages` | EDITOR+ (or public list of published) |
| GET | `/api/pages/:slug` | Public if `published` |
| POST | `/api/pages` | EDITOR+ |
| PUT | `/api/pages/:id` | EDITOR+ |
| DELETE | `/api/pages/:id` | ADMIN or EDITOR |

### CORS / cookies

- Marketing site needs **public** `GET /api/content` with CORS `CORS_ORIGIN` or `*`.
- Admin UI on `:4000` calling API on `:4001` needs:
  - `credentials: 'include'` on `fetch`
  - CORS: `Access-Control-Allow-Credentials: true`
  - `Access-Control-Allow-Origin: http://localhost:4000` (not `*` when credentials are used)

---

## 8. Implementation steps (do in order)

### Step 1 — Wire database
1. Paste `DATABASE_URL` into `.env`.
2. Set `provider` in Prisma to match your SQL engine.
3. Run `npx prisma migrate dev --name init`.
4. Run seed so admin + `content.json` land in DB.

### Step 2 — Prisma client (`server/db.ts`)
```ts
import { PrismaClient } from '@prisma/client'
export const prisma = new PrismaClient()
```

### Step 3 — Auth helpers (`server/auth.ts`)
- `hashPassword` / `verifyPassword` (bcrypt)
- `createSession(userId)` → raw token + DB hash + cookie value
- `destroySession(token)`
- `getUserFromRequest(req)` → join Session + User, check `expiresAt`

### Step 4 — Hono app (`server/index.ts`)
- Mount route modules
- Global error handler → `{ error: string }` JSON
- Listen on `API_PORT` (4001)

### Step 5 — Replace Vite middleware
**Option recommended:** stop using `cmsApiPlugin` for business logic.

1. In `vite.config.ts`, remove `cmsApiPlugin(root)` (or leave a thin proxy only).
2. Add Vite proxy:

```ts
server: {
  port: 4000,
  strictPort: true,
  proxy: {
    '/api': {
      target: 'http://localhost:4001',
      changeOrigin: true,
    },
  },
},
```

3. Run two processes:
   - `npm run dev:api` → API
   - `npm run dev` → CMS UI

Admin `fetch('/api/...')` keeps working via proxy; cookies stay on `localhost:4000`.

### Step 6 — Update CMS client (`src/api.ts`)

```ts
login: (email: string, password: string) =>
  request('/api/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
    credentials: 'include',
  }),
// ensure all requests use credentials: 'include'
```

Update login UI to collect **email + password**.

### Step 7 — Users admin UI (new section)
Add a CMS section “Users” (ADMIN only):
- Table of users
- Create / edit / delete forms
- Hide nav item if `user.role !== 'ADMIN'`

### Step 8 — (Optional) Pages UI
List pages, edit slug/title/status/body JSON or form fields, publish toggle.

### Step 9 — Point marketing site at API
In `ruxin-consulting-website-react`:

```env
VITE_CMS_URL=http://localhost:4001
```

Or keep `VITE_CMS_URL=http://localhost:4000` if Vite proxies `/api` in both dev and production (production usually should hit the API URL directly).

### Step 10 — Production
- Run API as a real Node process (`node` / PM2 / Docker).
- Serve Vite `dist` as static files (Nginx) or from the same Hono app.
- HTTPS + `Secure` cookies.
- Never ship default passwords; rotate `SESSION_SECRET`.

---

## 9. Validation (Zod) — content shape + SQL injection defense

### 9.1 Content shape

Reuse the keys already used in `server/api.ts` / `server/content-schema.ts`:

`company`, `navLinks`, `hero`, `about`, `services`, `clients`, `testimonials`, `team`, `careers`, `insightCategories`, `insights`, `assistant`

On `PUT /api/content`, reject with `400` if any required section is missing. Prefer Zod schemas mirroring `src/types.ts`.

### 9.2 SQL injection prevention (required)

**Never** build SQL with string concatenation or template literals from request data. Use **Prisma Client only** (`findUnique`, `create`, `update`, …). Do **not** use `$queryRawUnsafe` / `$executeRawUnsafe` with user input.

| Layer | What to do |
|--------|------------|
| ORM | All reads/writes go through Prisma (parameterized under the hood) |
| Path params | Validate `id`, `slug`, `section` with Zod **before** querying |
| Body fields | Strict schemas (`.strict()`), max lengths, allowlists for enums |
| Suspicious input | Reject values matching SQL keywords / comment markers (`--`, `/*`, `;`, `UNION`, …) on identifier-like fields |
| Shared module | Keep rules in `server/validation.ts` and reuse across routes |

**Field rules (implement in `server/validation.ts`):**

| Field | Rules |
|--------|--------|
| `id` (path) | Trim, max 64, alphanumeric only (cuid-like), reject SQL meta |
| `email` | Trim, lowercase, max 254, email format, reject SQL meta |
| `name` | Trim, max 120, letters/numbers/spaces/`.'-` only |
| `password` | Min 10, max 128 (never log) |
| `role` | Enum `ADMIN` \| `EDITOR` only |
| `slug` | Lowercase kebab-case `^[a-z0-9]+(?:-[a-z0-9]+)*$`, max 120 |
| `title` | Trim, max 200, reject SQL meta |
| `status` | Enum `draft` \| `published` |
| `section` | Allowlist from `CONTENT_SECTIONS` only |
| page `body` | JSON via Prisma `Json` column; cap serialized size (~512KB) |

**Reject with `400`** (do not query the DB) when validation fails — including payloads like:

```text
email: "admin@ruxin.local' OR 1=1--"
id: "abc; DROP TABLE User;--"
slug: "about' UNION SELECT *"
```

**Acceptance checks for injection:**

1. Login with email containing `' OR 1=1--` → `400` or `401`, never open a session for another user.
2. `GET /api/users/<sql-junk>` → `400` Invalid id.
3. `GET /api/pages/<sql-junk>` → `400` Invalid slug.
4. Create user with name `Robert'); DROP TABLE User;--` → `400` invalid name characters.
5. Confirm no raw SQL helpers are called from route handlers.

---

## 10. Security checklist

- [ ] No plain-text passwords
- [ ] Timing-safe password compare (bcrypt handles this)
- [ ] JWT Bearer auth (`Authorization: Bearer <token>`); rotate `JWT_SECRET`
- [ ] Rate-limit `POST /api/login` (e.g. 5/min per IP)
- [ ] Zod validation on **all** path params and bodies (`server/validation.ts`)
- [ ] No `$queryRawUnsafe` / string-built SQL with request data
- [ ] Do not log passwords, JWTs, or connection strings
- [ ] `.env` in `.gitignore` (already ignores `.env*`)
- [ ] Admins cannot delete their own account
- [ ] Editors cannot hit `/api/users`

---

## 11. Migration from `data/content.json`

| Phase | Action |
|--------|--------|
| Seed | Copy JSON → `SiteDocument.content` |
| Dual-read (optional) | Prefer DB; fallback to file once |
| Cutover | API reads/writes DB only |
| Archive | Keep `content.json` as backup / seed source |

Do **not** delete `content.json` until you confirm DB content matches the live site.

---

## 12. Dev workflow (day to day)

```bash
cd cms/ruxin-consulting-cms

# Terminal 1 — API + SQL
npm run dev:api

# Terminal 2 — CMS UI
npm run dev

# Optional — marketing site
cd ../../ruxin-consulting-website-react
# set VITE_CMS_URL=http://localhost:4001
npm run dev
```

Login: seed admin email/password from `.env`.

---

## 13. Acceptance tests (manual)

1. Seed creates admin; login with email+password works; wrong password → 401.
2. `GET /api/content` without login returns full site JSON.
3. Marketing site still renders CMS content.
4. Editor can Save content; refresh shows updates.
5. Admin can create an EDITOR user; that user can edit content but not list users → 403.
6. Logout clears session; Save then fails until login.
7. Restart API; session still valid until expiry (DB-backed sessions).
8. (If pages) create/publish page; public GET by slug works; draft returns 404.

---

## 14. When you send the connection string

Provide:

1. Full `DATABASE_URL` (or host, port, db, user, password separately).
2. Engine: **PostgreSQL / MySQL / SQL Server**.
3. Whether SSL is required.
4. Whether you want **Model A only**, or **A + Pages (B)**.
5. Preferred first admin email.

Then implementation order is: Prisma schema → migrate → seed → auth routes → content routes → proxy → UI login/users → optional pages.

---

## 15. Out of scope for v1 (later)

- Media upload / image CDN
- Content revision history
- Email notifications / contact form backend
- Real AI assistant
- OAuth / SSO

---

## Quick map: old → new

| Old (`server/api.ts`) | New |
|------------------------|-----|
| `ADMIN_PASSWORD` | `User` rows + bcrypt |
| HMAC cookie, no DB | `Session` table + opaque token |
| `data/content.json` | `SiteDocument.content` (JSON column) |
| Vite middleware only | Hono/Express on `:4001` + Vite proxy |
| No users UI | Users CRUD for `ADMIN` |

---

*Next step from you:* paste the SQL connection string (and engine). After that, this guide can be executed as concrete code in `cms/ruxin-consulting-cms`.
