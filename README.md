# Effect + Datastar Task App

A full-stack admin portal built with Bun, Effect, Effect SQL, Datastar,
KrakStack Auth, PostgreSQL, and plain CSS. The server owns application state
and renders HTML; Datastar sends actions and applies server-sent HTML patches
without a client application framework.

## Quick Start

Requirements: Bun and PostgreSQL.

```sh
cp .env.example .env
bun install
bun run dev
```

Open <http://localhost:3000/en> or <http://localhost:3000/fr>.

The server creates the `tasks` table and its index at startup. Admin routes and
task ownership use the authenticated KrakStack Auth user.

Required authentication configuration:

```text
KRAKSTACK_AUTH_URL=https://auth.example.com
KRAKSTACK_AUTH_SERVICE_API_KEY=...
```

The application proxies `/api/auth/*` to KrakStack Auth, keeping browser
sessions same-origin.

## Commands

| Command | Purpose |
| --- | --- |
| `bun run dev` | Run the Bun server in watch mode |
| `bun run build` | Build the Bun server into `dist/` |
| `bun run start` | Start the server |
| `bun run test` | Run Bun tests |
| `bun run type:check` | Type-check the TypeScript project |

## Architecture

```text
src/
  app.ts        Fetch request routing and Datastar actions
  auth.ts       KrakStack Auth sessions, proxy, organizations, and API keys
  datastar.ts   Escaped HTML and SSE patch helpers
  messages.ts   English and French messages
  server.ts     Bun server and Effect runtime boundary
  styles.css    Plain responsive CSS
  tasks.ts      Effect SQL task service and schema bootstrap
  view.ts       Server-rendered page and fragments
```

Mutation flow:

1. A Datastar attribute sends a form or action request.
2. `app.ts` validates input with Effect Schema.
3. `server.ts` runs the operation through the Effect `Tasks` service.
4. The server responds with `datastar-patch-elements` SSE events.
5. Datastar morphs the form or task list by element ID.

## Deliberate Omissions

The portal includes protected tasks, profile updates, password changes, API
keys, organizations, permissions, English/French routes, and persisted light,
dark, and system themes.

This branch removes React, TanStack, KrakStack UI, Drizzle, Vite, Tailwind,
Paraglide, Vitest, Oxlint, and Oxfmt. Before treating it as a production
template, add CSRF protection, versioned database migrations, full 2FA
QR rendering, and browser-level tests.

The Datastar `v1.0.2` browser bundle is vendored at `public/datastar.js` so the
application has no frontend package or CDN runtime dependency.
