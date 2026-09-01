import { Context, Effect, Layer } from "effect";
import { SqlClient, SqlSchema } from "effect/unstable/sql";

import {
  OwnedTaskCreateSchema,
  OwnedTaskSchema,
  OwnedTaskUpdateSchema,
  TaskOwnerSchema,
  TaskSchema,
} from "@/services/task/schema";

export class Tasks extends Context.Service<Tasks>()("Tasks", {
  make: Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;

    const find = SqlSchema.findAll({
      Request: TaskOwnerSchema,
      Result: TaskSchema,
      execute: ({ userId }) => sql`
        SELECT id, user_id, title, description, completed, created_at, updated_at
        FROM tasks
        WHERE user_id = ${userId}
        ORDER BY created_at
      `,
    });

    const findOne = SqlSchema.findOneOption({
      Request: OwnedTaskSchema,
      Result: TaskSchema,
      execute: ({ id, userId }) => sql`
        SELECT id, user_id, title, description, completed, created_at, updated_at
        FROM tasks
        WHERE id = ${id} AND user_id = ${userId}
        LIMIT 1
      `,
    });

    const create = SqlSchema.findOne({
      Request: OwnedTaskCreateSchema,
      Result: TaskSchema,
      execute: ({ userId, payload }) => sql`
        INSERT INTO tasks (user_id, title, description)
        VALUES (${userId}, ${payload.title}, ${payload.description ?? null})
        RETURNING id, user_id, title, description, completed, created_at, updated_at
      `,
    });

    const update = SqlSchema.findOneOption({
      Request: OwnedTaskUpdateSchema,
      Result: TaskSchema,
      execute: ({ userId, id, payload }) => sql`
        UPDATE tasks
        SET ${sql.update({ ...payload, updatedAt: new Date() })}
        WHERE id = ${id} AND user_id = ${userId}
        RETURNING id, user_id, title, description, completed, created_at, updated_at
      `,
    });

    const remove = SqlSchema.findOneOption({
      Request: OwnedTaskSchema,
      Result: TaskSchema,
      execute: ({ userId, id }) => sql`
        DELETE FROM tasks
        WHERE id = ${id} AND user_id = ${userId}
        RETURNING id, user_id, title, description, completed, created_at, updated_at
      `,
    });

    return {
      find,
      findOne,
      create,
      update,
      delete: remove,
    };
  }),
}) {
  static readonly baseLayer = Layer.effect(this, this.make);

  static readonly layer = this.baseLayer;
}
