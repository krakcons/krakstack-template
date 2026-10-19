import { BunRuntime } from "@effect/platform-bun";
import { Config, Effect, Layer, Redacted, Schema } from "effect";
import { Events } from "@krak-stack/registry/events";
import { Otlp } from "@krak-stack/registry/opentelemetry";
import { databaseLayer } from "../src/lib/database";
import { eventsLayer } from "../src/services/events";

const SeedArguments = Schema.Struct({
  organizationId: Schema.NonEmptyString,
  userId: Schema.NonEmptyString,
  adminId: Schema.NonEmptyString,
}).annotate({ identifier: "AuditSeedArguments" });

// Synthetic audit records only: no credentials, sessions, or auth users are created.
const program = Effect.gen(function* () {
  const databaseUrl = new URL(
    Redacted.value(yield* Config.Redacted("DATABASE_URL")),
  );
  const origin = yield* Config.URL("VITE_SITE_URL");
  const local = new Set(["localhost", "127.0.0.1", "[::1]"]);
  if (!local.has(databaseUrl.hostname) || !local.has(origin.hostname)) {
    return yield* Effect.fail(
      new Error("Audit demo seeding requires a local database and site"),
    );
  }
  const [organizationId, userId, adminId] = process.argv.slice(2);
  const input = yield* Schema.decodeUnknownEffect(SeedArguments)({
    organizationId,
    userId,
    adminId,
  });
  return yield* Effect.gen(function* () {
    const events = yield* Events;
    const cases = [
      {
        id: "session",
        label: "User session",
        userId: input.userId,
        actorType: "user",
        actorId: input.userId,
        method: "session",
        extra: {},
      },
      {
        id: "user-key",
        label: "User API key",
        userId: input.userId,
        actorType: "user",
        actorId: input.userId,
        method: "api_key",
        extra: { "app.auth.credential.id": "demo-user-key" },
      },
      {
        id: "organization-key",
        label: "Organization API key",
        actorType: "organization",
        actorId: input.organizationId,
        method: "api_key",
        extra: { "app.auth.credential.id": "demo-organization-key" },
      },
      {
        id: "impersonated",
        label: "User impersonated by admin",
        userId: "demo-effective-user",
        actorType: "user",
        actorId: "demo-effective-user",
        method: "session",
        extra: { "app.auth.impersonator.id": input.adminId },
      },
    ];
    for (const scenario of cases) {
      const annotations = {
        "organization.id": input.organizationId,
        "app.actor.type": scenario.actorType,
        "app.actor.id": scenario.actorId,
        "app.auth.method": scenario.method,
        "user.roles": scenario.userId ? ["member"] : [],
      };
      if (scenario.userId)
        Object.assign(annotations, { "user.id": scenario.userId });
      Object.assign(annotations, scenario.extra);
      yield* events
        .track({
          eventId: `local-audit-demo:${input.organizationId}:${scenario.id}`,
          name: "task.created",
          category: "audit",
          target: {
            id: `demo-${scenario.id}`,
            name: `[Demo] ${scenario.label}`,
            type: "task",
          },
          properties: { "demo.synthetic": true },
        })
        .pipe(Effect.annotateLogs(annotations));
    }
    yield* Effect.log("Local audit examples ready", {
      organizationId: input.organizationId,
      cases: cases.map((scenario) => scenario.label),
    });
  }).pipe(
    Effect.provide(
      eventsLayer.pipe(Layer.provide(databaseLayer), Layer.provide(Otlp.layer)),
    ),
  );
});

program.pipe(BunRuntime.runMain);
