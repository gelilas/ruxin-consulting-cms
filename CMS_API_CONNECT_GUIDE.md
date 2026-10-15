# Connect Admin CMS UI ↔ Backend API

Implementation guide for wiring the **React admin CMS** (`src/`) to the **Hono API** (`server/`). Follow this before / while changing UI code.

**Package manager:** `npm` only.

---

## 1. Target picture

```
Browser
  │
  │  http://localhost:3030          ← Vite CMS UI
  │  fetch('/api/...')
  │  Authorization: Bearer <jwt>
  ▼
Vite dev server (:3030)
  │  proxy /api → http://localhost:4001
  ▼
Hono API (:4001)
  │  JWT verify · Zod validation · Prisma
  ▼
MySQL (raxin_db)
```

| Process | Command | URL |
|---------|---------|-----|
| API | `npm run dev:api` | http://localhost:4001 |
| Swagger | (same API) | http://localhost:4001/api/docs |
| CMS UI | `npm run dev` | http://localhost:3030 |

Both must be running. The UI never talks to MySQL directly.

---

## 2. What is already in place (baseline)

Do **not** rebuild these from scratch — verify, then fill gaps in §4.

| Piece | Location | Status |
|--------|----------|--------|
| Vite `/api` proxy → `:4001` | `vite.config.ts` | Done |
| JWT login / logout / session client | `src/api.ts` | Done |
| Token in `localStorage` (`cms_jwt`) | `src/api.ts` | Done |
| Login form (email + password) | `src/App.tsx` | Done |
| Load / save site content | `src/App.tsx` + `api.content` / `api.save` | Done |
| Users admin (ADMIN only) | `src/App.tsx` `UsersAdmin` | Done (list / create / delete) |
| API CORS `CMS_ORIGIN` | `.env` → `http://localhost:3030` | Done |
| API allows `Authorization` header | `server/index.ts` | Done |
| Seed admin | Prisma seed | `admin@ruxin.local` / `change-me-now` |

**Connection strategy (keep this):**

- In **dev**, CMS calls **relative** `/api/...` so Vite proxies to the API (same-origin cookies not required; JWT in header).
- Do **not** hardcode `http://localhost:4001` in `fetch` for the admin UI unless you also set CORS + handle production base URL via env.

---

## 3. Environment checklist

### 3.1 API (`.env` in `cms/ruxin-consulting-cms`)

```env
DATABASE_URL="mysql://..."
JWT_SECRET="long-random-secret"
API_PORT=4001
API_ORIGIN=http://localhost:4001
CMS_ORIGIN=http://localhost:3030
CORS_ORIGIN=http://localhost:5173
SEED_ADMIN_EMAIL=admin@ruxin.local
SEED_ADMIN_PASSWORD=change-me-now
SEED_ADMIN_NAME=Admin
```

`CMS_ORIGIN` **must** match the Vite UI origin (`http://localhost:3030`). If the UI port changes, update this.

### 3.2 Optional UI env (only if you later call the API without proxy)

```env
# .env / .env.local for Vite — only if abandoning the proxy
VITE_API_URL=http://localhost:4001
```

Default plan: **no `VITE_API_URL`** — keep relative `/api` + proxy.

---

## 4. Implementation plan (do in order)

### Step A — Confirm API is healthy

1. Terminal 1: `npm run dev:api`
2. Open http://localhost:4001/api/health → `{ "ok": true }`
3. Open http://localhost:4001/api/docs
4. `POST /api/login` with seed admin → copy `token`
5. Authorize in Swagger → `GET /api/session` → user returned
6. `GET /api/content` → full site JSON

If any fail, fix API/DB first. Do not touch CMS UI yet.

### Step B — Confirm Vite proxy

1. Terminal 2: `npm run dev` (from project root, **not** `server/`)
2. In browser DevTools → Network, open http://localhost:3030
3. After login attempt, requests should be to `http://localhost:3030/api/...` with status from the API (not Vite 404)
4. If `/api/*` returns HTML or connection refused: API is down or proxy target wrong in `vite.config.ts`

**Required proxy shape** (`vite.config.ts`):

```ts
server: {
  port: 3030,
  strictPort: true,
  proxy: {
    '/api': {
      target: 'http://localhost:4001',
      changeOrigin: true,
    },
  },
},
```

Same under `preview` for `npm run preview`.

### Step C — Auth contract (UI ↔ API)

| Action | UI | API |
|--------|----|-----|
| Login | `POST /api/login` `{ email, password }` | `{ ok, token, tokenType, user }` |
| Persist | `localStorage.setItem('cms_jwt', token)` | — |
| Authenticated calls | Header `Authorization: Bearer <token>` | `requireAuth` / JWT verify |
| Session restore | On load: `GET /api/session` | `{ ok, user }` or 401 |
| Logout | `POST /api/logout` + clear `cms_jwt` | `{ ok: true }` (stateless) |

**Implement / verify in `src/api.ts`:**

- [x] Store JWT on login
- [x] Attach Bearer on every protected request
- [x] Clear JWT on logout / 401 (optional improvement: global 401 → clear token + redirect login)
- [ ] **Gap to implement:** on `401` from any `request()`, clear token and force re-login so stale JWTs do not leave the UI half-broken

### Step D — Content editors

| Action | Method | Auth |
|--------|--------|------|
| Load editors | `GET /api/content` | Public (still send Bearer if present) |
| Save | `PUT /api/content` | EDITOR or ADMIN |
| Optional per-section | `PATCH /api/content/:section` | EDITOR or ADMIN |

**Verify in UI:**

1. Login → sections load from DB (`SiteDocument`)
2. Edit hero → Save → refresh page → changes still there
3. Open marketing site with CMS URL pointing at API (or proxied content) and confirm copy updates

**Gap to implement (optional):** use `PATCH /api/content/:section` for faster saves; not required if full `PUT` works.

### Step E — Users admin (ADMIN)

Already wired for list / create / delete. Remaining polish:

| Gap | Why |
|-----|-----|
| Edit user (`PATCH /api/users/:id`) | Role / name / password reset from UI |
| Clearer 403 for EDITOR | Hide Users nav (already) + friendly message if they hit the route |
| Password policy hints | Match API (min 10 chars) — partially done |

### Step F — Pages (optional Model B)

API routes exist (`/api/pages`). **CMS UI has no Pages section yet.**

When implementing:

1. Add `api.pages` / `createPage` / `updatePage` / `deletePage` in `src/api.ts`
2. Add nav item “Pages” for EDITOR+
3. List / create / edit slug, title, status, body JSON
4. Drafts only visible when JWT present (API already enforces)

### Step G — Production connection

| Concern | Approach |
|---------|----------|
| Same host | Nginx: `/` → static CMS `dist`, `/api` → Node `:4001` |
| Separate hosts | Set `VITE_API_URL`, enable CORS for CMS origin, send Bearer |
| HTTPS | Required in prod; JWT still in `Authorization` (prefer not putting JWT in query strings) |
| Secrets | Never ship `.env` to the browser; only `VITE_*` is public |

---

## 5. Client module contract (`src/api.ts`)

Keep a single API module. Target surface:

```ts
api.session()
api.login(email, password)      // stores JWT
api.logout()                    // clears JWT
api.content()                   // GET site JSON
api.save(content)               // PUT site JSON
api.users()                     // ADMIN
api.createUser(body)            // ADMIN
api.updateUser(id, body)        // ADMIN — implement if missing in UI
api.deleteUser(id)              // ADMIN
// later:
api.pages() / api.getPage(slug) / api.createPage / api.updatePage / api.deletePage
```

Rules:

1. Always `Content-Type: application/json` for JSON bodies.
2. Always attach Bearer when token exists.
3. Throw `Error(data.error)` on non-OK so UI can show API messages.
4. Paths stay relative (`/api/...`) while using the Vite proxy.

---

## 6. CORS / headers (when proxy is not used)

If the UI ever calls `http://localhost:4001` directly:

- API must allow origin `http://localhost:3030` (`CMS_ORIGIN`)
- `Access-Control-Allow-Headers` must include `Authorization` and `Content-Type`
- Prefer keeping the **proxy** in dev so you avoid CORS entirely

---

## 7. Day-to-day workflow

```bash
cd cms/ruxin-consulting-cms

# Terminal 1 — API + MySQL
npm run dev:api

# Terminal 2 — Admin CMS
npm run dev
```

1. Open http://localhost:3030  
2. Login: seed email / password from `.env`  
3. Edit content → Save  
4. (Admin) open Users → create EDITOR → logout → login as EDITOR → confirm Users nav hidden  

Swagger remains at http://localhost:4001/api/docs for isolated API debugging.

---

## 8. Acceptance tests (CMS ↔ API)

1. API down → CMS login fails with a clear error (not infinite loading).
2. Wrong password → 401 message in login form.
3. Valid login → lands in editor; `localStorage.cms_jwt` set.
4. Refresh browser → still logged in (`GET /api/session` with Bearer).
5. Logout → token cleared → refresh shows login.
6. Save content → `PUT /api/content` 200 → reload shows same data.
7. EDITOR cannot open Users (nav hidden); direct `GET /api/users` → 403.
8. ADMIN can create / delete users (not self).
9. Injection-like email / id in UI forms → API `400`, UI shows error string.
10. Port conflict: only one `dev:api` / one `dev` process.

---

## 9. Suggested implementation order (next coding session)

1. **Smoke test** Steps A–B (API + proxy) — no code if green.
2. **Hardening** `src/api.ts`: on 401 clear JWT + surface “Signed out”.
3. **Users polish**: wire `updateUser` in UI (edit role / reset password).
4. **Pages UI** (optional): client methods + section.
5. **Marketing site**: point `VITE_CMS_URL` at API or CMS proxy so public site reads `GET /api/content`.
6. **Prod notes**: document Nginx `/api` reverse proxy when deploying.

---

## 10. Quick file map

| File | Role in connection |
|------|--------------------|
| `vite.config.ts` | Proxy `/api` → API |
| `src/api.ts` | All HTTP + JWT storage |
| `src/App.tsx` | Login, editors, users, save/logout |
| `server/index.ts` | CORS, mount routes, Swagger |
| `server/routes/*` | Auth, content, users, pages |
| `server/validation.ts` | Input / injection guards |
| `.env` | `CMS_ORIGIN`, `JWT_SECRET`, DB |

---

## 11. Out of scope for this connection pass

- Media uploads
- OAuth / SSO
- Replacing JWT with cookies again
- Changing MySQL schema (already pushed)

---

*When ready to implement:* start at **§9 item 1** (smoke test), then harden `src/api.ts` 401 handling, then users edit + optional pages.
