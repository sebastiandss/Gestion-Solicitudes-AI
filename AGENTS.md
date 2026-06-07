# Gestion-Solicitudes-AI

## Stack

- **Astro v6** with `@astrojs/vercel` adapter, SSR mode (`output: 'server'`)
- **Node >= 22.12.0**
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
| `/` | `src/pages/index.astro` | Dashboard — loads all 4 views (shown/hidden via tabs) |
| `/login` | `src/pages/login.astro` | Mock auth — sets `localStorage.isLoggedIn` |
| `POST /api/deepseek` | `src/pages/api/deepseek.ts` | Server-side proxy to DeepSeek API |

### Data layer

**All state is in `localStorage`** — no backend database, no API.

| Key | Used by | Format |
|---|---|---|
| `isLoggedIn` | index.astro, login.astro | `"true"` / absent |
| `tramites` | MisTramites, NuevaSolicitud | JSON array of request objects |
| `notificaciones` | Notificaciones, NuevaSolicitud | JSON array of notification objects |

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

### Environment

```sh
# .env (gitignored) — required for server proxy
DEEPSEEK_API_KEY=sk-...
```

## Gotchas

- The client-side DeepSeek key in `MisTramites.astro` is **hardcoded in source** — a security concern for production. The server proxy (`/api/deepseek`) is the intended secure path for `NuevaSolicitud`, but `MisTramites` bypasses it.
- Auth is fully simulated (localStorage flag). No real authentication, no sessions, no tokens.
- All data is ephemeral (localStorage). Clearing browser data = full reset.
- `.astro/` directory is auto-generated (Astro types, settings, collections). Do not edit manually.
- `.vercel/` is gitignored. Commit `537be1b` explicitly removes `.vercel/output` from git tracking to fix `ERR_MODULE_NOT_FOUND` on Vercel deployment.
- Type checking uses `astro/tsconfigs/strict` — but `astro check` command is not in scripts (run via `npm run astro check`).

## Key files

| Path | Role |
|---|---|
| `src/pages/index.astro` | Main dashboard, session guard (localStorage check) |
| `src/pages/login.astro` | Mock login/register forms |
| `src/pages/api/deepseek.ts` | DeepSeek API server proxy |
| `src/layouts/BaseLayout.astro` | Global CSS, shared layout shell, global JS functions (`switchTab`, `logoutFunc`) |
| `src/components/views/NuevaSolicitud.astro` | Form with AI analysis (uses server proxy) |
| `src/components/views/MisTramites.astro` | List with AI risk analysis (uses direct DeepSeek call) |
| `astro.config.mjs` | SSR + Vercel adapter config |
