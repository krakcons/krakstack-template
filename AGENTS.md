# AGENTS

## Stack

- Bun is the runtime, package manager, bundler, server, and test runner.
- Effect owns schemas, services, configuration, errors, and resource lifecycles.
- Effect SQL with PostgreSQL owns persistence.
- `@krak-stack/auth` owns sessions and the central authentication protocol.
- Datastar owns browser actions, signals, and server-driven DOM patches.
- Views are escaped server-rendered HTML functions.
- Styling is plain CSS.

Do not introduce React, JSX, a client router, Tailwind, an ORM, or raw `fetch`
inside domain services.

## Public Strings

All public strings require English and French entries in `src/messages.ts`.
Locale-aware pages live at `/en` and `/fr`.

## Effect

Consult `effect-solutions` before changing Effect code. Keep database access in
services, use `Effect.fn` for traced operations, and provide layers at the
application boundary.

## Checks

Run `bun run test`, `bun run type:check`, and `bun run build` after changes.
