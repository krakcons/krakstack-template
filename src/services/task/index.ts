import { Context, Effect, Layer, Option } from "effect";
import { SqlClient, SqlSchema } from "effect/sql";
import { Events } from "@krak-stack/registry/events";
import {
  OwnedTaskCreateSchema,
  OwnedTaskSchema,
  OwnedTaskUpdateSchema,
  OwnedTaskDeleteSchema,
  TaskOwnerSchema,
  TaskSchema,
  TaskAuditAction,
} from "./schema";

export class Tasks extends Context.Service<Tasks>()("Tasks", {
  make: Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;
    const events = yield* Events;
    const record = (
      task: typeof TaskSchema.Type,
      name: typeof TaskAuditAction.Type,
    ) =>
      events.track({
        name,
        category: "audit",
        target: { id: task.id, name: task.title, type: "task" },
      });

    const find = SqlSchema.findAll({
      Request: TaskOwnerSchema,
      Result: TaskSchema,
      execute: ({ organizationId }) => sql`
        SELECT id, user_id, organization_id, title, description, completed, created_at, updated_at
        FROM tasks WHERE organization_id = ${organizationId} ORDER BY created_at
      `,
    });
    const findOne = SqlSchema.findOneOption({
      Request: OwnedTaskSchema,
      Result: TaskSchema,
      execute: ({ id, organizationId }) => sql`
        SELECT id, user_id, organization_id, title, description, completed, created_at, updated_at
        FROM tasks WHERE id = ${id} AND organization_id = ${organizationId} LIMIT 1
      `,
    });
    const insert = SqlSchema.findOne({
      Request: OwnedTaskCreateSchema,
      Result: TaskSchema,
      execute: ({ organizationId, member, payload }) => sql`
        INSERT INTO tasks (user_id, organization_id, title, description)
        VALUES (${member?.id ?? null}, ${organizationId}, ${payload.title}, ${payload.description ?? null})
        RETURNING id, user_id, organization_id, title, description, completed, created_at, updated_at
      `,
    });
    const patch = SqlSchema.findOneOption({
      Request: OwnedTaskUpdateSchema,
      Result: TaskSchema,
      execute: ({ organizationId, id, payload }) => sql`
        UPDATE tasks SET ${sql.update({ ...payload, updatedAt: new Date() })}
        WHERE id = ${id} AND organization_id = ${organizationId}
        RETURNING id, user_id, organization_id, title, description, completed, created_at, updated_at
      `,
    });
    const remove = SqlSchema.findOneOption({
      Request: OwnedTaskDeleteSchema,
      Result: TaskSchema,
      execute: ({ organizationId, id }) => sql`
        DELETE FROM tasks WHERE id = ${id} AND organization_id = ${organizationId}
        RETURNING id, user_id, organization_id, title, description, completed, created_at, updated_at
      `,
    });
    const create = Effect.fn("Tasks.create")(function* (
      input: typeof OwnedTaskCreateSchema.Type,
    ) {
      return yield* sql.withTransaction(
        Effect.gen(function* () {
          const task = yield* insert(input);
          yield* record(task, "task.created");
          return task;
        }),
      );
    });
    const update = Effect.fn("Tasks.update")(function* (
      input: typeof OwnedTaskUpdateSchema.Type,
    ) {
      return yield* sql.withTransaction(
        Effect.gen(function* () {
          yield* sql`SELECT id FROM tasks WHERE id = ${input.id} AND organization_id = ${input.organizationId} FOR UPDATE`;
          const previous = yield* findOne(input);
          if (Option.isNone(previous)) return Option.none();
          const task = yield* patch(input);
          if (Option.isSome(task)) {
            yield* record(task.value, "task.updated");
            if (previous.value.completed !== task.value.completed) {
              yield* record(
                task.value,
                task.value.completed ? "task.completed" : "task.reopened",
              );
            }
          }
          return task;
        }),
      );
    });
    const deleteTask = Effect.fn("Tasks.delete")(function* (
      input: typeof OwnedTaskDeleteSchema.Type,
    ) {
      return yield* sql.withTransaction(
        Effect.gen(function* () {
          const task = yield* remove(input);
          if (Option.isSome(task)) yield* record(task.value, "task.deleted");
          return task;
        }),
      );
    });
    return { find, findOne, create, update, delete: deleteTask };
  }),
}) {
  static readonly baseLayer = Layer.effect(this, this.make);
  static readonly layer = this.baseLayer;
}
