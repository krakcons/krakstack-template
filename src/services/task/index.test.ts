import { PgClient } from "@effect/sql-pg";
import { Config, Effect, Layer, String } from "effect";
import { beforeAll, beforeEach, describe, expect, it } from "@effect/vitest";
import { SqlClient } from "effect/unstable/sql";

import { migrate } from "@/db/migrate";

import { Tasks } from "./index";

const databaseLayer = PgClient.layerConfig({
  url: Config.redacted("TEST_DATABASE_URL"),
  transformQueryNames: Config.succeed(String.camelToSnake),
  transformResultNames: Config.succeed(String.snakeToCamel),
});
const tasksLayer = Tasks.layer.pipe(Layer.provide(databaseLayer));

const resetTestDb = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient;
  yield* sql`DELETE FROM tasks`;
}).pipe(Effect.provide(databaseLayer));

beforeAll(() => Effect.runPromise(migrate.pipe(Effect.provide(databaseLayer))));
beforeEach(() => Effect.runPromise(resetTestDb));

describe("Tasks", () => {
  it.effect("creates and lists tasks scoped to a user", () =>
    Effect.gen(function* () {
      const tasks = yield* Tasks;

      const created = yield* tasks.create({
        userId: "user-a",
        payload: { title: "Write tests", description: "Add service tests" },
      });
      yield* tasks.create({
        userId: "user-b",
        payload: { title: "Other user's task" },
      });

      if (!created) throw new Error("Expected task to be created");

      const listed = yield* tasks.list({ userId: "user-a" });

      expect(created.title).toBe("Write tests");
      expect(created.description).toBe("Add service tests");
      expect(listed).toHaveLength(1);
      expect(listed[0]?.id).toBe(created.id);
      expect(listed[0]?.userId).toBe("user-a");
    }).pipe(Effect.provide(tasksLayer)),
  );

  it.effect("updates only the owning user's task", () =>
    Effect.gen(function* () {
      const tasks = yield* Tasks;
      const created = yield* tasks.create({
        userId: "user-a",
        payload: { title: "Original title" },
      });

      if (!created) throw new Error("Expected task to be created");

      const updatedByOtherUser = yield* tasks.update({
        userId: "user-b",
        id: created.id,
        payload: { title: "Wrong user update" },
      });
      const updatedByOwner = yield* tasks.update({
        userId: "user-a",
        id: created.id,
        payload: { title: "Updated title", completed: true },
      });

      expect(updatedByOtherUser).toBeUndefined();
      expect(updatedByOwner?.title).toBe("Updated title");
      expect(updatedByOwner?.completed).toBe(true);
    }).pipe(Effect.provide(tasksLayer)),
  );

  it.effect("deletes only the owning user's task", () =>
    Effect.gen(function* () {
      const tasks = yield* Tasks;
      const created = yield* tasks.create({
        userId: "user-a",
        payload: { title: "Delete me" },
      });

      if (!created) throw new Error("Expected task to be created");

      const deletedByOtherUser = yield* tasks.delete({
        userId: "user-b",
        id: created.id,
      });
      const afterOtherUserDelete = yield* tasks.get({
        userId: "user-a",
        id: created.id,
      });
      const deletedByOwner = yield* tasks.delete({
        userId: "user-a",
        id: created.id,
      });
      const afterOwnerDelete = yield* tasks.get({
        userId: "user-a",
        id: created.id,
      });

      expect(deletedByOtherUser).toBeUndefined();
      expect(afterOtherUserDelete?.id).toBe(created.id);
      expect(deletedByOwner?.id).toBe(created.id);
      expect(afterOwnerDelete).toBeUndefined();
    }).pipe(Effect.provide(tasksLayer)),
  );
});
