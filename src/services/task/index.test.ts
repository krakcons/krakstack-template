import { randomUUID } from "node:crypto";
import { PgClient } from "@effect/sql-pg";
import { Events } from "@krak-stack/registry/events";
import { Otlp } from "@krak-stack/registry/opentelemetry";
import {
  Config,
  ConfigProvider,
  Effect,
  Layer,
  Option,
  Redacted,
  String,
} from "effect";
import { afterEach, beforeAll, describe, expect, it } from "@effect/vitest";
import { SqlClient } from "effect/sql";
import { migrate } from "@/db/migrate";
import {
  eventTextAttribute,
  eventStringArrayAttribute,
} from "@krak-stack/registry/events/record";
import { TaskMember } from "./schema";
import { Tasks } from ".";

const serviceName = `template-task-audit-${randomUUID()}`;
const orgA = `test-org-${randomUUID()}`;
const orgB = `test-org-${randomUUID()}`;
const alice = {
  id: "test-alice",
  name: "Alice",
  image: "https://example.test/alice.png",
};
const bob = { id: "test-bob", name: "Bob", image: null };
const databaseLayer = PgClient.layerConfig({
  url: Config.Redacted("TEST_DATABASE_URL"),
  transformQueryNames: Config.succeed(String.camelToSnake),
  transformResultNames: Config.succeed(String.snakeToCamel),
});
const eventLayer = Events.layer({
  origin: "https://template.example.test",
  secret: Redacted.make("test-events-secret-at-least-32-characters"),
}).pipe(Layer.provideMerge(Otlp.layer));
const layer = Tasks.layer.pipe(
  Layer.provideMerge(eventLayer),
  Layer.provideMerge(databaseLayer),
  Layer.provide(
    ConfigProvider.layerAdd(
      ConfigProvider.fromUnknown({
        OTEL_SERVICE_NAME: serviceName,
        OTEL_SDK_DISABLED: "true",
      }),
    ),
  ),
);
const actor = (member: typeof TaskMember.Type, organizationId = orgA) =>
  Effect.annotateLogs({
    "user.id": member.id,
    "organization.id": organizationId,
    "app.actor.type": "user",
    "app.actor.id": member.id,
    "user.roles": ["member"],
    "user.full_name": "Not stored in audit",
    "app.user.image": "https://example.test/not-stored.png",
  });
const listAudit = (organizationId: string) =>
  Effect.gen(function* () {
    const events = yield* Events;
    return (yield* events.listAudit({ organizationId })).data;
  });
beforeAll(() => Effect.runPromise(migrate.pipe(Effect.provide(layer))));
afterEach(() =>
  Effect.runPromise(
    Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient;
      yield* sql`DELETE FROM tasks WHERE organization_id IN (${orgA}, ${orgB})`;
      yield* sql`DELETE FROM events WHERE service_name = ${serviceName}`;
    }).pipe(Effect.provide(databaseLayer)),
  ),
);

describe("organization tasks and audit", () => {
  it.effect(
    "records organization-key task actions without inventing a human creator",
    () =>
      Effect.gen(function* () {
        const tasks = yield* Tasks;
        const task = yield* tasks.create({
          organizationId: orgA,
          member: null,
          payload: { title: "Created by organization key" },
        });
        expect(task.userId).toBeNull();
        expect(yield* tasks.find({ organizationId: orgB })).toEqual([]);
        expect(
          Option.isNone(
            yield* tasks.update({
              organizationId: orgB,
              member: null,
              id: task.id,
              payload: { completed: true },
            }),
          ),
        ).toBe(true);
        expect(
          Option.isNone(
            yield* tasks.delete({
              organizationId: orgB,
              member: null,
              id: task.id,
            }),
          ),
        ).toBe(true);
        yield* tasks.update({
          organizationId: orgA,
          member: null,
          id: task.id,
          payload: { completed: true },
        });
        yield* tasks.delete({
          organizationId: orgA,
          member: null,
          id: task.id,
        });
        const audit = yield* listAudit(orgA);
        expect(audit.map((entry) => entry.eventName).sort()).toEqual([
          "task.completed",
          "task.created",
          "task.deleted",
          "task.updated",
        ]);
        for (const entry of audit) {
          expect(eventTextAttribute(entry, "app.actor.type")).toBe(
            "organization",
          );
          expect(eventTextAttribute(entry, "app.actor.id")).toBe(orgA);
          expect(eventTextAttribute(entry, "app.auth.method")).toBe("api_key");
          expect(eventTextAttribute(entry, "app.auth.credential.id")).toBe(
            "organization-key-1",
          );
          expect(eventTextAttribute(entry, "user.id")).toBeNull();
          expect(eventTextAttribute(entry, "app.audit.target.name")).toBe(
            task.title,
          );
        }
      }).pipe(
        Effect.annotateLogs({
          "organization.id": orgA,
          "app.actor.type": "organization",
          "app.actor.id": orgA,
          "app.auth.method": "api_key",
          "app.auth.credential.id": "organization-key-1",
        }),
        Effect.provide(layer),
      ),
  );
  it.effect(
    "shares tasks between members in one organization, not across organizations",
    () =>
      Effect.gen(function* () {
        const tasks = yield* Tasks;
        const first = yield* tasks.create({
          organizationId: orgA,
          member: alice,
          payload: { title: "Private task contents" },
        });
        yield* tasks
          .create({
            organizationId: orgA,
            member: bob,
            payload: { title: "Bob's task" },
          })
          .pipe(actor(bob));
        yield* tasks
          .create({
            organizationId: orgB,
            member: alice,
            payload: { title: "Other organization" },
          })
          .pipe(actor(alice, orgB));
        const listed = yield* tasks.find({ organizationId: orgA });
        expect(listed).toHaveLength(2);
        expect(listed.find((task) => task.id === first.id)).toMatchObject({
          userId: alice.id,
          organizationId: orgA,
        });
        expect(yield* tasks.find({ organizationId: orgB })).toHaveLength(1);
        const audit = yield* listAudit(orgA);
        expect(audit).toHaveLength(2);
        const aliceEvent = audit.find(
          (event) => eventTextAttribute(event, "user.id") === alice.id,
        );
        expect(aliceEvent).toBeDefined();
        if (aliceEvent) {
          expect(eventStringArrayAttribute(aliceEvent, "user.roles")).toEqual([
            "member",
          ]);
          expect(eventTextAttribute(aliceEvent, "app.audit.target.type")).toBe(
            "task",
          );
          expect(eventTextAttribute(aliceEvent, "app.audit.target.id")).toBe(
            first.id,
          );
          expect(eventTextAttribute(aliceEvent, "app.audit.target.name")).toBe(
            first.title,
          );
        }
        expect(
          audit.some(
            (event) => eventTextAttribute(event, "user.id") === bob.id,
          ),
        ).toBe(true);
        expect(JSON.stringify(audit)).toContain("Private task contents");
        const sql = yield* SqlClient.SqlClient;
        const stored = JSON.stringify(
          yield* sql`SELECT payload_json FROM events WHERE service_name = ${serviceName}`,
        );
        expect(stored).not.toContain("Not stored in audit");
        expect(stored).not.toContain("not-stored.png");
      }).pipe(actor(alice), Effect.provide(layer)),
  );

  it.effect(
    "includes the organization predicate in every read, update, and delete",
    () =>
      Effect.gen(function* () {
        const tasks = yield* Tasks;
        const task = yield* tasks.create({
          organizationId: orgA,
          member: alice,
          payload: { title: "Protected" },
        });
        expect(
          Option.isNone(
            yield* tasks.findOne({ organizationId: orgB, id: task.id }),
          ),
        ).toBe(true);
        expect(
          Option.isNone(
            yield* tasks.update({
              organizationId: orgB,
              member: alice,
              id: task.id,
              payload: { title: "Wrong organization" },
            }),
          ),
        ).toBe(true);
        expect(
          Option.isNone(
            yield* tasks.delete({
              organizationId: orgB,
              member: alice,
              id: task.id,
            }),
          ),
        ).toBe(true);
        expect(
          Option.getOrThrow(
            yield* tasks.findOne({ organizationId: orgA, id: task.id }),
          ).title,
        ).toBe("Protected");
        expect(yield* listAudit(orgA)).toHaveLength(1);
        expect(yield* listAudit(orgB)).toEqual([]);
      }).pipe(actor(alice), Effect.provide(layer)),
  );

  it.effect(
    "attributes collaborative updates and completion transitions to the acting member",
    () =>
      Effect.gen(function* () {
        const tasks = yield* Tasks;
        const task = yield* tasks.create({
          organizationId: orgA,
          member: alice,
          payload: { title: "Shared task" },
        });
        for (const completed of [true, true, false]) {
          const updated = yield* tasks
            .update({
              organizationId: orgA,
              member: bob,
              id: task.id,
              payload: { completed },
            })
            .pipe(actor(bob));
          expect(Option.isSome(updated)).toBe(true);
        }
        const audit = yield* listAudit(orgA);
        expect(
          audit.filter((entry) => entry.eventName === "task.updated"),
        ).toHaveLength(3);
        expect(
          audit.filter((entry) => entry.eventName === "task.completed"),
        ).toHaveLength(1);
        expect(
          audit.filter((entry) => entry.eventName === "task.reopened"),
        ).toHaveLength(1);
        expect(
          audit
            .filter((entry) => entry.eventName !== "task.created")
            .every(
              (entry) =>
                eventTextAttribute(entry, "app.actor.id") === bob.id &&
                eventStringArrayAttribute(entry, "user.roles").includes(
                  "member",
                ),
            ),
        ).toBe(true);
      }).pipe(actor(alice), Effect.provide(layer)),
  );

  it.effect(
    "keeps actor identity and historical roles after another member deletes the task",
    () =>
      Effect.gen(function* () {
        const tasks = yield* Tasks;
        const task = yield* tasks.create({
          organizationId: orgA,
          member: alice,
          payload: { title: "Delete me" },
        });
        yield* tasks
          .update({
            organizationId: orgA,
            member: bob,
            id: task.id,
            payload: { title: "Renamed task" },
          })
          .pipe(actor(bob));
        yield* tasks
          .delete({ organizationId: orgA, member: bob, id: task.id })
          .pipe(actor(bob));
        expect(yield* tasks.find({ organizationId: orgA })).toEqual([]);
        const audit = yield* listAudit(orgA);
        expect(audit.map((entry) => entry.eventName).sort()).toEqual([
          "task.created",
          "task.deleted",
          "task.updated",
        ]);
        const created = audit.find(
          (entry) => entry.eventName === "task.created",
        );
        const deleted = audit.find(
          (entry) => entry.eventName === "task.deleted",
        );
        expect(created).toBeDefined();
        expect(deleted).toBeDefined();
        if (created)
          expect(eventTextAttribute(created, "app.audit.target.name")).toBe(
            "Delete me",
          );
        if (deleted)
          expect(eventTextAttribute(deleted, "app.audit.target.name")).toBe(
            "Renamed task",
          );
        if (created)
          expect(eventStringArrayAttribute(created, "user.roles")).toEqual([
            "member",
          ]);
        if (deleted)
          expect(eventTextAttribute(deleted, "user.id")).toBe(bob.id);
      }).pipe(actor(alice), Effect.provide(layer)),
  );

  it.effect("rolls back writes when audit attribution is missing", () =>
    Effect.gen(function* () {
      const tasks = yield* Tasks;
      expect(
        (yield* Effect.exit(
          tasks.create({
            organizationId: orgA,
            member: alice,
            payload: { title: "Rollback" },
          }),
        ))._tag,
      ).toBe("Failure");
      expect(yield* tasks.find({ organizationId: orgA })).toEqual([]);
      const task = yield* tasks
        .create({
          organizationId: orgA,
          member: alice,
          payload: { title: "Keep me" },
        })
        .pipe(actor(alice));
      expect(
        (yield* Effect.exit(
          tasks.update({
            organizationId: orgA,
            member: alice,
            id: task.id,
            payload: { completed: true },
          }),
        ))._tag,
      ).toBe("Failure");
      expect(
        (yield* Effect.exit(
          tasks.delete({ organizationId: orgA, member: alice, id: task.id }),
        ))._tag,
      ).toBe("Failure");
      expect(
        Option.getOrThrow(
          yield* tasks.findOne({ organizationId: orgA, id: task.id }),
        ).completed,
      ).toBe(false);
      expect(yield* listAudit(orgA)).toHaveLength(1);
    }).pipe(Effect.provide(layer)),
  );

  it.effect("rolls back task and audit with the caller transaction", () =>
    Effect.gen(function* () {
      const tasks = yield* Tasks;
      const sql = yield* SqlClient.SqlClient;
      yield* Effect.exit(
        sql.withTransaction(
          Effect.gen(function* () {
            yield* tasks.create({
              organizationId: orgA,
              member: alice,
              payload: { title: "Rollback" },
            });
            return yield* Effect.fail("rollback");
          }),
        ),
      );
      expect(yield* tasks.find({ organizationId: orgA })).toEqual([]);
      expect(yield* listAudit(orgA)).toEqual([]);
    }).pipe(actor(alice), Effect.provide(layer)),
  );

  it.effect(
    "lists audit events for any record type, excluding analytics and other tenants",
    () =>
      Effect.gen(function* () {
        const events = yield* Events;
        yield* events.track({
          category: "audit",
          name: "document.published",
          target: { type: "document", id: "document-1", name: "Document 1" },
        });
        yield* events.track({
          eventId: randomUUID(),
          name: "analytics.clicked",
          category: "analytics",
        });
        yield* events
          .track({
            category: "audit",
            name: "invoice.created",
            target: { type: "invoice", id: "invoice-1", name: "Invoice 1" },
          })
          .pipe(actor(bob, orgB));
        const entries = yield* listAudit(orgA);
        expect(entries).toHaveLength(1);
        expect(entries[0]).toMatchObject({
          eventName: "document.published",
        });
        expect(eventTextAttribute(entries[0], "app.audit.target.type")).toBe(
          "document",
        );
        expect(eventTextAttribute(entries[0], "app.audit.target.id")).toBe(
          "document-1",
        );
        expect(eventStringArrayAttribute(entries[0], "user.roles")).toEqual([
          "member",
        ]);
      }).pipe(actor(alice), Effect.provide(layer)),
  );
});
