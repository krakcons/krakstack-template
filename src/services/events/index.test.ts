import { randomUUID } from "node:crypto";
import { describe, expect, it } from "@effect/vitest";
import { Events } from "@krak-stack/registry/events";
import { AuthMiddleware } from "@krak-stack/auth/server";
import { HttpApiOtlp } from "@krak-stack/registry/opentelemetry/api";
import { Otlp } from "@krak-stack/registry/opentelemetry";
import {
  Config,
  ConfigProvider,
  DateTime,
  Effect,
  Layer,
  Redacted,
  Schema,
} from "effect";
import { FetchHttpClient, HttpRouter, HttpServerRequest } from "effect/http";
import { SqlClient, SqlSchema } from "effect/sql";

import { databaseLayer } from "@/lib/database";
import { eventsLayer } from "./index";

const StoredEvent = Schema.Struct({
  eventId: Schema.String,
  source: Schema.String,
  userId: Schema.NullOr(Schema.String),
  organizationId: Schema.NullOr(Schema.String),
  sessionId: Schema.NullOr(Schema.String),
  anonymousId: Schema.NullOr(Schema.String),
}).annotate({ identifier: "TestStoredEvent" });

const ForwardedLogs = Schema.fromJsonString(
  Schema.Struct({
    resourceLogs: Schema.Array(
      Schema.Struct({
        scopeLogs: Schema.Array(
          Schema.Struct({
            logRecords: Schema.Array(
              Schema.Struct({
                attributes: Schema.Array(
                  Schema.Struct({
                    key: Schema.String,
                    value: Schema.Struct({
                      stringValue: Schema.optional(Schema.String),
                    }),
                  }),
                ),
              }),
            ),
          }),
        ),
      }),
    ),
  }),
).annotate({ identifier: "TestForwardedLogs" });

const testConfigLayer = (serviceName: string) =>
  Layer.unwrap(
    Effect.gen(function* () {
      const url = yield* Config.Redacted("TEST_DATABASE_URL");
      return ConfigProvider.layer(
        ConfigProvider.fromUnknown({
          DATABASE_URL: Redacted.value(url),
          VITE_SITE_URL: "https://template.example.test",
          EVENTS_SECRET: "test-events-secret-at-least-32-characters",
          KRAKSTACK_AUTH_URL: "https://auth.example.test",
          KRAKSTACK_AUTH_SERVICE_API_KEY: "test-service-key",
          OTEL_SERVICE_NAME: serviceName,
          OTEL_SDK_DISABLED: "true",
          OTEL_EXPORTER_OTLP_ENDPOINT: "https://collector.example.test",
          OTEL_LOGS_EXPORTER: "otlp",
          OTEL_TRACES_EXPORTER: "none",
          OTEL_METRICS_EXPORTER: "none",
        }),
      );
    }),
  );

describe("events tarball integration", () => {
  it.effect(
    "enriches events from Cloudflare without exporting the raw IP",
    () =>
      Effect.gen(function* () {
        const events = yield* Events;
        const attribute = (key: string, value: string) => ({
          key,
          value: { stringValue: value },
        });
        const result = yield* events.process(
          new TextEncoder().encode(
            JSON.stringify({
              resourceLogs: [
                {
                  scopeLogs: [
                    {
                      scope: { name: "krakstack.application.events" },
                      logRecords: [
                        {
                          eventName: "browser.page_view",
                          timeUnixNano: (
                            BigInt(
                              DateTime.toEpochMillis(yield* DateTime.now),
                            ) * 1_000_000n
                          ).toString(),
                          attributes: [
                            attribute("app.event.schema.version", "1"),
                            attribute("log.record.uid", randomUUID()),
                            attribute("analytics.page_view.id", randomUUID()),
                            attribute("url.path", "/en/"),
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            }),
          ),
        );
        const body = new TextDecoder().decode(result.body);
        const logs = yield* Schema.decodeUnknownEffect(ForwardedLogs)(body);
        const attributes =
          logs.resourceLogs[0]!.scopeLogs[0]!.logRecords[0]!.attributes;
        expect(attributes.filter(({ key }) => key.startsWith("geo."))).toEqual(
          expect.arrayContaining([
            attribute("geo.country.iso_code", "CA"),
            attribute("geo.region.iso_code", "CA-ON"),
            attribute("geo.locality.name", "Ottawa"),
          ]),
        );
        expect(
          attributes.some(({ key }) => key === "analytics.anonymous_id"),
        ).toBe(true);
        expect(body).not.toContain("203.0.113.42");
      }).pipe(
        Effect.provide(eventsLayer),
        Effect.provide(Otlp.layer),
        Effect.provideService(
          HttpServerRequest.HttpServerRequest,
          HttpServerRequest.fromWeb(
            new Request("https://template.example.test/api/otel/v1/logs", {
              headers: {
                origin: "https://template.example.test",
                "user-agent": "cloudflare-enrichment-test",
                "cf-connecting-ip": "203.0.113.42",
                "cf-ipcountry": "CA",
                "cf-region-code": "ON",
                "cf-ipcity": "Ottawa",
              },
            }),
          ),
        ),
        Effect.provide(
          ConfigProvider.layer(
            ConfigProvider.fromUnknown({
              VITE_SITE_URL: "https://template.example.test",
              EVENTS_SECRET: "test-events-secret-at-least-32-characters",
              OTEL_SERVICE_NAME: "cloudflare-config-test",
              OTEL_SDK_DISABLED: "true",
            }),
          ),
        ),
      ),
  );
  it.effect(
    "persists and deduplicates server events and rolls back with the caller transaction",
    () => {
      const serviceName = `events-test-${randomUUID()}`;
      const layer = eventsLayer.pipe(
        Layer.provideMerge(databaseLayer),
        Layer.provideMerge(Otlp.layer),
        Layer.provide(testConfigLayer(serviceName)),
      );

      return Effect.gen(function* () {
        const events = yield* Events;
        const sql = yield* SqlClient.SqlClient;
        yield* Effect.addFinalizer(() =>
          sql`DELETE FROM events WHERE service_name = ${serviceName}`.pipe(
            Effect.orDie,
          ),
        );
        const input = {
          eventId: randomUUID(),
          name: "task.created",
          category: "audit" as const,
          identity: { userId: "untrusted-fallback-user" },
          properties: { taskId: "task-1" },
        };
        expect(yield* events.track(input)).toEqual({
          eventId: input.eventId,
          inserted: true,
        });
        expect(yield* events.track(input)).toEqual({
          eventId: input.eventId,
          inserted: false,
        });
        const conflict = yield* events
          .track({ ...input, properties: { taskId: "other" } })
          .pipe(Effect.flip);
        expect(conflict._tag).toBe("EventConflictError");

        yield* events
          .track({ ...input, eventId: "rolled-back" })
          .pipe(
            Effect.andThen(Effect.fail("rollback")),
            sql.withTransaction,
            Effect.flip,
          );
        const rows = yield* SqlSchema.findAll({
          Request: Schema.String,
          Result: StoredEvent,
          execute: (name) => sql`
          SELECT event_id, source, user_id, organization_id, session_id, anonymous_id
          FROM events WHERE service_name = ${name}
        `,
        })(serviceName);
        expect(rows).toEqual([
          {
            eventId: input.eventId,
            source: "server",
            userId: "verified-user",
            organizationId: null,
            sessionId: null,
            anonymousId: null,
          },
        ]);
      }).pipe(
        Effect.annotateLogs({
          "user.id": "verified-user",
          "app.actor.type": "user",
          "app.actor.id": "verified-user",
        }),
        Effect.scoped,
        Effect.provide(layer),
      );
    },
  );

  it.effect(
    "ingests browser OTLP through the configured processor, rejects spoofing and survives collector failure",
    () => {
      const serviceName = `events-test-${randomUUID()}`;
      const forwarded: string[] = [];
      let authUnavailable = false;
      let authenticated = true;
      const fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        const request = new Request(input, init);
        if (request.url.startsWith("https://auth.example.test/")) {
          const now = new Date().toISOString();
          return Response.json(
            authenticated
              ? {
                  session: {
                    id: "verified-session",
                    token: "verified-token",
                    userId: "verified-user",
                    activeOrganizationId: "verified-org",
                    createdAt: now,
                    updatedAt: now,
                    expiresAt: new Date(Date.now() + 60_000).toISOString(),
                  },
                  user: {
                    id: "verified-user",
                    name: "Test User",
                    email: "test@example.test",
                    emailVerified: true,
                    image: null,
                    role: null,
                    banned: false,
                    createdAt: now,
                    updatedAt: now,
                  },
                }
              : null,
            { status: authUnavailable ? 503 : 200 },
          );
        }
        forwarded.push(await request.text());
        return new Response(null, { status: 503 });
      };
      const telemetryLayer = HttpApiOtlp.layer.pipe(
        Layer.provide(
          AuthMiddleware.routerLayer({
            paths: ["/api/otel/v1/logs"],
            baseUrl: "https://auth.example.test",
            apiKey: Redacted.make("test-service-key"),
          }),
        ),
        Layer.provide(Events.ingestionLayer),
        Layer.provideMerge(eventsLayer),
        Layer.provideMerge(databaseLayer),
        Layer.provideMerge(Otlp.layer),
        Layer.provideMerge(
          Layer.succeed(
            FetchHttpClient.Fetch,
            Object.assign(fetch, {
              preconnect: globalThis.fetch.preconnect,
            }),
          ),
        ),
        Layer.provide(testConfigLayer(serviceName)),
      );

      return Effect.gen(function* () {
        const sql = yield* SqlClient.SqlClient;
        yield* Effect.addFinalizer(() =>
          sql`DELETE FROM events WHERE service_name = ${serviceName}`.pipe(
            Effect.orDie,
          ),
        );
        const web = yield* Effect.acquireRelease(
          Effect.sync(() => HttpRouter.toWebHandler(telemetryLayer)),
          (web) => Effect.promise(() => web.dispose()),
        );
        const attribute = (key: string, value: string) => ({
          key,
          value: { stringValue: value },
        });
        const eventId = randomUUID();
        const makeBody = (id: string) =>
          JSON.stringify({
            resourceLogs: [
              {
                resource: {
                  attributes: [
                    attribute("service.name", "untrusted-browser-name"),
                  ],
                },
                scopeLogs: [
                  {
                    scope: {
                      name: "krakstack.application.events",
                      version: "1",
                    },
                    logRecords: [
                      {
                        eventName: "browser.page_view",
                        timeUnixNano: (
                          BigInt(Date.now()) * 1_000_000n
                        ).toString(),
                        attributes: [
                          attribute("app.event.schema.version", "1"),
                          attribute("log.record.uid", id),
                          attribute("analytics.page_view.id", randomUUID()),
                          attribute("url.path", "/en/"),
                          attribute("user.id", "forged-user"),
                          attribute("session.id", "forged-session"),
                          attribute("app.actor.id", "forged-actor"),
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          });
        const body = makeBody(eventId);
        const send = (
          origin = "https://template.example.test",
          payload = body,
        ) =>
          Effect.promise(() =>
            web.handler(
              new Request("https://template.example.test/api/otel/v1/logs", {
                method: "POST",
                headers: {
                  origin,
                  "content-type": "application/json",
                  "user-agent": "events-integration-test",
                  cookie: `test-session=${randomUUID()}`,
                  "cf-connecting-ip": "203.0.113.42",
                },
                body: payload,
              }),
            ),
          );
        expect((yield* send()).status).toBe(200);
        expect((yield* send()).status).toBe(200);
        expect(forwarded).toHaveLength(2);
        expect(forwarded.join()).not.toMatch(
          /forged-user|forged-session|forged-actor/,
        );
        const forwardedAttributes = (yield* Schema.decodeUnknownEffect(
          ForwardedLogs,
        )(forwarded[0])).resourceLogs[0]!.scopeLogs[0]!.logRecords[0]!
          .attributes;
        expect(forwardedAttributes).toEqual(
          expect.arrayContaining([
            { key: "app.actor.type", value: { stringValue: "user" } },
            { key: "app.actor.id", value: { stringValue: "verified-user" } },
            { key: "app.event.category", value: { stringValue: "analytics" } },
          ]),
        );
        const findStored = SqlSchema.findAll({
          Request: Schema.String,
          Result: StoredEvent,
          execute: (name) => sql`
          SELECT event_id, source, user_id, organization_id, session_id, anonymous_id
          FROM events WHERE service_name = ${name}
        `,
        });
        const rows = yield* findStored(serviceName);
        expect(rows).toHaveLength(1);
        expect(rows[0]).toMatchObject({
          eventId,
          source: "browser",
          userId: "verified-user",
          organizationId: "verified-org",
        });
        // Cloudflare ingress supplies visitor attribution; browser session claims are discarded.
        expect(rows[0]?.anonymousId).toEqual(expect.any(String));
        expect(rows[0]?.sessionId).toEqual(expect.any(String));
        expect(rows[0]?.sessionId).not.toBe("forged-session");
        authenticated = false;
        const anonymousId = randomUUID();
        expect((yield* send(undefined, makeBody(anonymousId))).status).toBe(
          200,
        );
        // Changed verified identity is a conflict, not a rewrite of the stored event.
        expect((yield* send()).status).toBe(409);
        const afterSignOut = yield* findStored(serviceName);
        expect(afterSignOut).toHaveLength(2);
        expect(
          afterSignOut.find((row) => row.eventId === anonymousId),
        ).toMatchObject({
          userId: null,
          organizationId: null,
        });
        expect(
          afterSignOut.find((row) => row.eventId === eventId),
        ).toMatchObject({
          userId: "verified-user",
          organizationId: "verified-org",
        });
        expect((yield* send("https://evil.example.test")).status).toBe(403);
        authUnavailable = true;
        expect((yield* send()).status).toBe(503);
      }).pipe(
        Effect.scoped,
        Effect.provide(databaseLayer),
        Effect.provide(testConfigLayer(serviceName)),
      );
    },
  );
});
