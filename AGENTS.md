# Gestion-Solicitudes-AI

## Stack

- **Astro v6** with `@astrojs/vercel` adapter, SSR mode (`output: 'server'`)
- **Node >= 22.12.0**
- **Appwrite self-hosted** — autenticación y sesiones
- **DeepSeek API** for AI features (two integration paths — see below)
- All UI in **Spanish** (`es-CO` locale), no i18n

## Commands

```sh
npm run dev       # astro dev → localhost:4321
npm run build     # astro build → dist/
npm run preview   # astro preview (local SSR preview)
npm run astro     # astro CLI passthrough
```

VS Code: launch config runs `npm run astro dev`. Recommended extension: `astro-build.astro-vscode`.

No lint, no format, no typecheck, no test scripts configured.

## Architecture

**SPA-like prototype** — all views live on `index.astro` and are shown/hidden via JS `display` toggling (`switchTab()`). No framework router, no client-side routing.

### Routes

| Path | Component | Purpose |
|---|---|---|
| `/` | `src/pages/index.astro` | Dashboard — SSR session guard via `Astro.locals.user` (set by middleware) |
| `/login` | `src/pages/login.astro` | Login/register with Appwrite email-password auth |
| `POST /api/deepseek` | `src/pages/api/deepseek.ts` | Server-side proxy to DeepSeek API |
| `POST /api/auth/login` | `src/pages/api/auth/login.ts` | Appwrite login — sets httpOnly session cookie |
| `POST /api/auth/register` | `src/pages/api/auth/register.ts` | Appwrite register — auto-login + httpOnly cookie |
| `POST /api/auth/logout` | `src/pages/api/auth/logout.ts` | Appwrite logout — clears cookie |
| `GET /api/auth/session` | `src/pages/api/auth/session.ts` | Session verification |

### Auth flow

1. **Login**: form → `POST /api/auth/login` → Appwrite `createEmailPasswordSession()` → httpOnly cookie `appwrite_session` set with session secret → redirect to `/`
2. **Register**: form → `POST /api/auth/register` → Appwrite `create()` + `createEmailPasswordSession()` + store cédula in prefs → httpOnly cookie set → redirect to `/`
3. **Session guard**: `src/middleware.ts` — runs on every SSR request. Reads `appwrite_session` cookie, verifies via Appwrite, sets `Astro.locals.user`. Redirects to `/login` if invalid.
4. **Logout**: `POST /api/auth/logout` → Appwrite `deleteSession('current')` → cookie cleared → redirect to `/login`
5. **TopBar** passes user data (name, initials, cédula) from `Astro.locals.user` — dynamic per session

### Data layer

**Tramites and notifications in `localStorage`** — no backend database.

| Key | Used by | Format |
|---|---|---|
| `tramites` | MisTramites, NuevaSolicitud | JSON array of request objects |
| `notificaciones` | Notificaciones, NuevaSolicitud | JSON array of notification objects |

### Key middleware

`src/middleware.ts` — protects all routes except public ones (`/login`, `/api/auth/*`). For API routes, returns 401 instead of redirecting.

### View components (under `src/components/views/`)

- `MisTramites.astro` — list of submitted requests, detail modal, AI risk analysis button
- `NuevaSolicitud.astro` — form with type tabs, auto-AI analysis on description blur/delay
- `ProgramasDisponibles.astro` — hardcoded programs list
- `Notificaciones.astro` — notification list from localStorage

## DeepSeek AI — two integration paths

**Path 1 — Server proxy (used by NuevaSolicitud):**
- POST to `/api/deepseek` (local endpoint)
- Reads `DEEPSEEK_API_KEY` from `import.meta.env` (set via `.env`)
- Passes the request body through to DeepSeek API, returns response

**Path 2 — Direct client call (used by MisTramites):**
- Calls `https://api.deepseek.com/chat/completions` directly from the browser
- **API key hardcoded** in `MisTramites.astro` (line 280)

## Environment

```sh
# .env (gitignored) — required for server proxy
DEEPSEEK_API_KEY=sk-...

# Appwrite self-hosted — required for auth
APPWRITE_ENDPOINT=https://appwrite.tudominio.com/v1
APPWRITE_PROJECT_ID=tu-project-id
APPWRITE_API_KEY=tu-api-key-de-servidor
```

## Gotchas

- The client-side DeepSeek key in `MisTramites.astro` is **hardcoded in source** — a security concern for production. The server proxy (`/api/deepseek`) is the intended secure path for `NuevaSolicitud`, but `MisTramites` bypasses it.
- All data is ephemeral (localStorage). Clearing browser data = full reset.
- `.astro/` directory is auto-generated (Astro types, settings, collections). Do not edit manually.
- `.vercel/` is gitignored. Commit `537be1b` explicitly removes `.vercel/output` from git tracking to fix `ERR_MODULE_NOT_FOUND` on Vercel deployment.
- Type checking uses `astro/tsconfigs/strict` — but `astro check` command is not in scripts (run via `npm run astro check`).
- Appwrite auth stores cédula in **user preferences** (`account.updatePrefs({ cedula })`). Accessed via `account.getPrefs()` on session verification.
- Appwrite self-hosted a menudo restringe el scope `account` para guests. Para evitarlo, el registro usa **admin API** (`Users` service con API key) en vez de `Account.create()`.
- Session is stored in **httpOnly cookie** (`appwrite_session`) with the Appwrite session secret. Read by middleware on every SSR request.
- Auth middleware is in `src/middleware.ts` — public routes list is defined there. If you add new public pages, update `PUBLIC_ROUTES` or `PUBLIC_PREFIXES`.

## Key files

| Path | Role |
|---|---|
| `src/middleware.ts` | SSR session guard — verifies Appwrite cookie, sets `Astro.locals.user` |
| `src/pages/index.astro` | Main dashboard, reads `Astro.locals.user` for dynamic TopBar data |
| `src/pages/login.astro` | Login/register forms with Appwrite auth |
| `src/pages/api/auth/login.ts` | Login API — creates Appwrite session, sets httpOnly cookie |
| `src/pages/api/auth/register.ts` | Register API — creates user + session + stores cédula in prefs |
| `src/pages/api/auth/logout.ts` | Logout API — deletes Appwrite session, clears cookie |
| `src/pages/api/auth/session.ts` | Session check — verifies cookie and returns user data |
| `src/pages/api/deepseek.ts` | DeepSeek API server proxy |
| `src/lib/appwrite.ts` | Appwrite client factory (serverless-safe) |
| `src/lib/auth.ts` | Auth utilities — register, login, logout, getCurrentUser |
| `src/env.d.ts` | Type declarations for `App.Locals` and `ImportMetaEnv` |
| `src/layouts/BaseLayout.astro` | Global CSS, layout shell, `switchTab()` global JS |
| `src/components/TopBar.astro` | User header — receives dynamic initials, name, idInfo |
| `src/components/views/MisTramites.astro` | List with AI risk analysis (uses direct DeepSeek call) |
| `astro.config.mjs` | SSR + Vercel adapter config |
