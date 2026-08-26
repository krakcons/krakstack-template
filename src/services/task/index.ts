import { PgClient } from "@effect/sql-pg";
import { Config, Context, Effect, Layer, PubSub, Schema, Stream } from "effect";
import { SqlClient } from "effect/unstable/sql";

import { CreateTask, Task } from "./schema";

export interface TasksService {
  readonly list: (input: {
    readonly userId: string;
  }) => Effect.Effect<ReadonlyArray<Task>, unknown>;
  readonly create: (input: {
    readonly userId: string;
    readonly payload: CreateTask;
  }) => Effect.Effect<Task, unknown>;
  readonly update: (input: {
    readonly userId: string;
    readonly id: string;
    readonly payload: CreateTask;
  }) => Effect.Effect<Task | undefined, unknown>;
  readonly toggle: (input: {
    readonly userId: string;
    readonly id: string;
  }) => Effect.Effect<Task | undefined, unknown>;
  readonly delete: (input: {
    readonly userId: string;
    readonly id: string;
  }) => Effect.Effect<Task | undefined, unknown>;
  readonly changes: (input: {
    readonly userId: string;
  }) => Stream.Stream<void>;
}

const decodeTask = Schema.decodeUnknownSync(Task);
const decodeTasks = Schema.decodeUnknownSync(Schema.Array(Task));

const SqlLayer = Layer.unwrap(
  Effect.gen(function* () {
    const url = yield* Config.redacted("DATABASE_URL");
    return PgClient.layer({ url });
  }),
);

const MigrationLayer = Layer.effectDiscard(
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;
    yield* sql`
      CREATE TABLE IF NOT EXISTS tasks (
        id UUID PRIMARY KEY,
        user_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        completed BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
  }),
);

const SqlLive = Layer.merge(SqlLayer, MigrationLayer.pipe(Layer.provide(SqlLayer)));

export class Tasks extends Context.Service<Tasks, TasksService>()("app/Tasks", {
  make: Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;
    const taskChanges = yield* PubSub.unbounded<string>();

    const changes = ({ userId }: { readonly userId: string }) =>
      Stream.fromPubSub(taskChanges).pipe(
        Stream.filter((changedUserId) => changedUserId === userId),
        Stream.map(() => undefined),
      );

    const list = Effect.fn("Tasks.list")(function* ({
      userId,
    }: {
      readonly userId: string;
    }) {
      const rows = yield* sql`
        SELECT id, user_id AS "userId", title, description, completed,
          created_at AS "createdAt", updated_at AS "updatedAt"
        FROM tasks
        WHERE user_id = ${userId}
        ORDER BY created_at DESC
      `;
      return decodeTasks(rows);
    });

    const create = Effect.fn("Tasks.create")(function* ({
      userId,
      payload,
    }: {
      readonly userId: string;
      readonly payload: CreateTask;
    }) {
      const id = crypto.randomUUID();
      const now = new Date();
      const rows = yield* sql`
        INSERT INTO tasks (id, user_id, title, description, completed, created_at, updated_at)
        VALUES (${id}, ${userId}, ${payload.title}, ${payload.description ?? null}, false, ${now}, ${now})
        RETURNING id, user_id AS "userId", title, description, completed,
          created_at AS "createdAt", updated_at AS "updatedAt"
      `;
      const task = decodeTask(rows[0]);
      yield* PubSub.publish(taskChanges, userId);
      return task;
    });

    const update = Effect.fn("Tasks.update")(function* ({
      userId,
      id,
      payload,
    }: {
      readonly userId: string;
      readonly id: string;
      readonly payload: CreateTask;
    }) {
      const rows = yield* sql`
        UPDATE tasks
        SET title = ${payload.title}, description = ${payload.description ?? null}, updated_at = NOW()
        WHERE id = ${id} AND user_id = ${userId}
        RETURNING id, user_id AS "userId", title, description, completed,
          created_at AS "createdAt", updated_at AS "updatedAt"
      `;
      if (!rows[0]) return undefined;
      const task = decodeTask(rows[0]);
      yield* PubSub.publish(taskChanges, userId);
      return task;
    });

    const toggle = Effect.fn("Tasks.toggle")(function* ({
      userId,
      id,
    }: {
      readonly userId: string;
      readonly id: string;
    }) {
      const rows = yield* sql`
        UPDATE tasks
        SET completed = NOT completed, updated_at = NOW()
        WHERE id = ${id} AND user_id = ${userId}
        RETURNING id, user_id AS "userId", title, description, completed,
          created_at AS "createdAt", updated_at AS "updatedAt"
      `;
      if (!rows[0]) return undefined;
      const task = decodeTask(rows[0]);
      yield* PubSub.publish(taskChanges, userId);
      return task;
    });

    const deleteTask = Effect.fn("Tasks.delete")(function* ({
      userId,
      id,
    }: {
      readonly userId: string;
      readonly id: string;
    }) {
      const rows = yield* sql`
        DELETE FROM tasks
        WHERE id = ${id} AND user_id = ${userId}
        RETURNING id, user_id AS "userId", title, description, completed,
          created_at AS "createdAt", updated_at AS "updatedAt"
      `;
      if (!rows[0]) return undefined;
      const task = decodeTask(rows[0]);
      yield* PubSub.publish(taskChanges, userId);
      return task;
    });

    return { changes, create, delete: deleteTask, list, toggle, update };
  }),
}) {
  static readonly baseLayer = Layer.effect(this, this.make);
  static readonly layer = this.baseLayer.pipe(Layer.provide(SqlLive));
  static readonly testLayer = (service: TasksService) =>
    Layer.succeed(this, service);
}

export { CreateTask, Task } from "./schema";
