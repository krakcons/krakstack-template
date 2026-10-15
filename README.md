# KrakStack Template

A full-stack web application template built with TanStack Start, Effect, Drizzle ORM, and Tailwind CSS. Ships with a task CRUD demo featuring optimistic updates, i18n, and auto-generated API documentation.

## Tech Stack

| Layer      | Technology                                       |
| ---------- | ------------------------------------------------ |
| Runtime    | Bun                                              |
| Framework  | TanStack Start (React + SSR)                     |
| State      | Effect Atom (optimistic atoms)                   |
| API        | Effect HTTP (OpenAPI + Scalar docs)              |
| Database   | PostgreSQL via Drizzle ORM                       |
| Styling    | Tailwind CSS + Shadcn (base-vega) + Lucide icons |
| Forms      | TanStack Form                                    |
| Tables     | TanStack Table                                   |
| i18n       | Paraglide.js + inlang (English & French)         |
| Linting    | Oxlint                                           |
| Formatting | Oxfmt                                            |

## Prerequisites

- [Bun](https://bun.sh/) >= 1.0
- PostgreSQL (self-hosted)

## Running Locally

1. Install [Bun](https://bun.sh/)

2. Set up a PostgreSQL database (version 14+, with `pgvector` and `postgis` extensions recommended) and note the connection string

3. Copy the environment file and fill in your database URL:

```bash
cp .env.example .env
```

Edit `.env`:

```
DATABASE_URL=postgresql://user:password@host:5432/dbname
```

4. Install dependencies:

```bash
bun install
```

5. Push the database schema:

```bash
bunx drizzle-kit push
```

6. Start the dev server:

```bash
bun --bun run dev
```

7. Open [http://localhost:3000](http://localhost:3000)

## Scripts

| Command                 | Description                        |
| ----------------------- | ---------------------------------- |
| `bun --bun run dev`     | Start Vite dev server on port 3000 |
| `bun --bun run build`   | Production build                   |
| `bun --bun run preview` | Preview production build           |
| `bun run lint`          | Run Oxlint                         |
| `bun run fmt`           | Run Oxfmt                          |
| `bun check`             | Run TypeScript type checking       |

## OpenTelemetry and browser analytics

The template pins the published `@krak-stack/registry@0.1.41` package.

Server telemetry uses `HttpApiOtlp.layer` in `src/lib/api-handler.ts`. Browser
telemetry runs once on the API client's Atom runtime, mounted by the root layout.
It sends traces, metrics, and page-view events through the same-origin
`/api/otel/v1/{traces,metrics,logs}` proxy, not directly to the collector.
The previous external analytics script is no longer used.

Configure an OTLP/HTTP collector with the server-side variables in `.env.example`:

```dotenv
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
OTEL_SERVICE_NAME=krakstack-template-api
OTEL_TRACES_EXPORTER=otlp
OTEL_METRICS_EXPORTER=otlp
OTEL_LOGS_EXPORTER=otlp
```

`OTEL_LOGS_EXPORTER=otlp` enables the browser event proxy as well as server log
export. The collector must route logs to a backend such as Loki to query analytics.
Browser telemetry uses the service name `krakstack-template-web`. Collector
credentials belong on the server/collector, never in `VITE_` variables.

With `events: {}`, the registry records `browser.page_view` on startup and each
pathname change, including back/forward navigation. Same-path, query-only, and
hash-only changes do not produce additional page views. Each event contains
`url.path` without query strings or fragments; paths can still contain sensitive
identifiers. Telemetry creates no cookies or persistent visitor IDs.
Once auth resolves, browser identity is synchronized
with the user's ID and active organization ID. Identity is cleared on logout,
while auth is revalidating, or when auth fails. No names, emails, session tokens,
or IP addresses are copied into analytics identity. The first page view can be
anonymous; identity changes only affect future events. Do not also manually
record page views unless you disable automatic tracking with
`events: { pageViews: false }`.

For custom events, import `BrowserOtlp` from
`@krak-stack/registry/opentelemetry/browser` and run
`BrowserOtlp.track("app.feature.used", { "feature.name": "example" })` as an
Effect after the browser runtime starts. `BrowserOtlp.identify` (including
`identify(null)` to clear identity) is synchronized through the auth session atom in the root
layout. Applications must apply their own consent policy before enabling
collection. Client-supplied identity is not trusted for authorization or audit
records. Server code can use `ServerOtlp.track` from
`@krak-stack/registry/opentelemetry/server` inside
the existing HTTP runtime. Use stable event names and avoid sensitive properties.

Before exposing the ingestion proxy publicly, apply payload and rate limits at
your ingress. To verify delivery, navigate between pages, inspect POST requests
to `/api/otel/v1/logs`, and query the logs backend for `browser.page_view` from
`krakstack-template-web`. A collector must be running; the template does not
provision one.

`HttpApiOtlp.layer` includes `ServerOtlp.layer`; do not install a second server
exporter on the HTTP runtime. The CLI separately provides `ServerOtlp.layer` and
wraps each execution in a `cli.run` span. HTTP requests, Effect logs, metrics,
and explicit server events share the long-lived HTTP runtime. Authenticated
server event calls inherit the auth middleware's user/organization log
annotations without maintaining global identity state.

Production shutdown handles `SIGINT` and `SIGTERM`: it drains HTTP requests, then
disposes the HTTP runtime to flush exporters and close scoped resources. Vite
also disposes the HTTP runtime on hot replacement. CLI runtime disposal flushes
its exporters when the command completes. Abrupt process termination cannot
guarantee delivery. `OTEL_SDK_DISABLED=true` disables server export; browser
collection is configured separately by `BrowserOtlp.layer`.

Run the focused Chromium checks with:

```bash
bunx playwright install chromium
bun run test:e2e -- e2e/telemetry.spec.ts
```

These tests run the template's real browser runtime and inspect outgoing OTLP
payloads for automatic page views, custom events, and identity changes. Browser
and SSR API requests are intercepted; no application database or collector is
used. They verify browser export, not delivery through the production proxy to a
logs backend.

## Database

Drizzle ORM manages the PostgreSQL schema. The schema is defined in `src/db/schema.ts`.

| Command                     | Description                                  |
| --------------------------- | -------------------------------------------- |
| `bunx drizzle-kit push`     | Push schema changes directly to the database |
| `bunx drizzle-kit generate` | Generate migration files from schema changes |
| `bunx drizzle-kit migrate`  | Run pending migrations                       |
| `bunx drizzle-kit studio`   | Open Drizzle Studio (database browser)       |

### Current schema

- **tasks** — `id` (UUID), `title`, `description`, `completed`, `created_at`, `updated_at`

## Project Structure

```
src/
├── api.ts                  # Effect HTTP API definition (endpoints & groups)
├── server.ts               # TanStack Start server entry (Paraglide middleware)
├── router.tsx              # TanStack Router config with i18n URL rewriting
├── styles.css              # Tailwind CSS entry point
├── db/
│   └── schema.ts           # Drizzle ORM schema definitions
├── services/
│   ├── database.ts         # Effect-managed Drizzle + PostgreSQL connection
│   └── task/
│       ├── index.ts        # Tasks (CRUD operations with Effect)
│       ├── schema.ts       # Effect Schema validation (Task, CreateTask, UpdateTask)
│       └── handler.ts      # Effect HTTP API handlers wired to Tasks
├── lib/
│   ├── api-builder.ts      # Effect Layer wiring (API + handlers + services)
│   ├── api-client.ts       # Client-side API client (Effect Atom HTTP)
│   ├── api-handler.ts      # Exposes API + Scalar docs as a Web Handler
│   ├── utils.ts            # Utility functions (cn, etc.)
│   └── atoms/
│       └── tasks.ts        # Effect Atom atoms (queries + optimistic mutations)
├── components/
│   ├── ui/                 # Shadcn UI primitives (button, dialog, input, etc.)
│   ├── data-table/         # Reusable data-table component (TanStack Table)
│   ├── form/               # Reusable form component (TanStack Form)
│   └── tasks/              # Task-specific components (dialog, table)
├── messages/
│   ├── en.json             # English translations
│   ├── fr.json             # French translations
│   └── components/         # Component-scoped translations
├── paraglide/              # Auto-generated Paraglide runtime (do not edit)
└── routes/
    ├── __root.tsx           # Root layout (HTML shell, locale awareness)
    ├── index.tsx            # Home page (task table + create dialog)
    └── api/                 # API route handlers
```

## API Documentation

The Effect HTTP API is served at `/api` with auto-generated docs:

- **Scalar docs**: [http://localhost:3000/api/docs](http://localhost:3000/api/docs)
- **OpenAPI spec**: [http://localhost:3000/api/openapi.json](http://localhost:3000/api/openapi.json)

### CLI

The generated CLI exposes the same typed HttpApi operations. Set
`VITE_SITE_URL` and a user API key, then run commands by API group:

```bash
KRAKSTACK_TEMPLATE_API_KEY=your-key bun run cli -- list
KRAKSTACK_TEMPLATE_API_KEY=your-key bun run cli -- tasks listTasks
```

Operation inputs use JSON flags such as `--params`, `--query`, `--headers`,
and `--body`.

### MCP

The MCP HTTP endpoint is served at `/api/mcp`. It exposes read-only GET
operations and forwards the request's `x-api-key` header to the typed API
client:

```text
http://localhost:3000/api/mcp
```

### Endpoints

| Method | Path             | Description      |
| ------ | ---------------- | ---------------- |
| GET    | `/api/tasks`     | List all tasks   |
| POST   | `/api/tasks`     | Create a task    |
| GET    | `/api/tasks/:id` | Get a task by ID |
| PATCH  | `/api/tasks/:id` | Update a task    |
| DELETE | `/api/tasks/:id` | Delete a task    |

## Internationalization (i18n)

The app supports **English** and **French** via [Paraglide.js](https://inlang.com/m/gerre34r/library-inlang-paraglideJs) and [inlang](https://inlang.com/).

- Locales are configured in `project.inlang/settings.json`
- Translation messages live in `src/messages/{locale}.json`
- URL-based locale detection with patterns like `/en/...` and `/fr/...`
- API routes (`/api/...`) are excluded from locale routing

The Paraglide runtime in `src/paraglide/` is auto-generated — do not edit it directly.

## Components

Shadcn components are configured in `components.json` using the `base-vega` style. Add new components with:

```bash
bunx shadcn@latest add <component>
```

## Building for Production

```bash
bun --bun run build
```

The output is written to `dist/`.

## Demo Files

The task CRUD feature serves as a reference implementation. To remove it, delete:

- `src/services/task/`
- `src/components/tasks/`
- `src/components/data-table/`
- `src/lib/atoms/tasks.ts`
- `src/db/schema.ts` (the `tasks` table)
- `src/api.ts` (the task endpoints)
- `src/lib/api-builder.ts`, `src/lib/api-client.ts`, `src/lib/api-handler.ts`

Then update `src/routes/index.tsx` with your own content.
