import { Context, Effect, Layer, Schema } from "effect";
import { SqlClient } from "effect/unstable/sql";

import {
  CreateTaskSchema,
  TaskSchema,
  UpdateTaskSchema,
} from "@/services/task/schema";

const decodeTasks = Schema.decodeUnknownEffect(Schema.Array(TaskSchema));

export class Tasks extends Context.Service<Tasks>()("Tasks", {
  make: Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;

    const list = Effect.fn("Tasks.list")(function* ({
      userId,
    }: {
      userId: string;
    }) {
      const rows = yield* sql`
        SELECT id, user_id, title, description, completed, created_at, updated_at
        FROM tasks
        WHERE user_id = ${userId}
        ORDER BY created_at
      `;
      const tasks = yield* decodeTasks(rows);

      return tasks;
    });

    const get = Effect.fn("Tasks.get")(function* ({
      userId,
      id,
    }: {
      userId: string;
      id: string;
    }) {
      const rows = yield* sql`
        SELECT id, user_id, title, description, completed, created_at, updated_at
        FROM tasks
        WHERE id = ${id} AND user_id = ${userId}
        LIMIT 1
      `;
      const [task] = yield* decodeTasks(rows);

      return task;
    });

    const create = Effect.fn("Tasks.create")(function* ({
      userId,
      payload,
    }: {
      userId: string;
      payload: typeof CreateTaskSchema.Type;
    }) {
      const rows = yield* sql`
        INSERT INTO tasks (user_id, title, description)
        VALUES (${userId}, ${payload.title}, ${payload.description ?? null})
        RETURNING id, user_id, title, description, completed, created_at, updated_at
      `;
      const [task] = yield* decodeTasks(rows);

      if (!task) return undefined;

      return task;
    });

    const update = Effect.fn("Tasks.update")(function* ({
      userId,
      id,
      payload,
    }: {
      userId: string;
      id: string;
      payload: typeof UpdateTaskSchema.Type;
    }) {
      const rows = yield* sql`
        UPDATE tasks
        SET ${sql.update({ ...payload, updatedAt: new Date() })}
        WHERE id = ${id} AND user_id = ${userId}
        RETURNING id, user_id, title, description, completed, created_at, updated_at
      `;
      const [task] = yield* decodeTasks(rows);

      if (!task) return undefined;

      return task;
    });

    const _delete = Effect.fn("Tasks.delete")(function* ({
      userId,
      id,
    }: {
      userId: string;
      id: string;
    }) {
      const rows = yield* sql`
        DELETE FROM tasks
        WHERE id = ${id} AND user_id = ${userId}
        RETURNING id, user_id, title, description, completed, created_at, updated_at
      `;
      const [task] = yield* decodeTasks(rows);

      if (!task) return undefined;

      return task;
    });

    return {
      list,
      get,
      create,
      update,
      delete: _delete,
    };
  }),
}) {
  static readonly baseLayer = Layer.effect(this, this.make);

  static readonly layer = this.baseLayer;
}
