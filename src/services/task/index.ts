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
} from "./schema";

export class Tasks extends Context.Service<Tasks>()("Tasks", {
  make: Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;
    const events = yield* Events;

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
    const create = Effect.fn("Tasks.create")(function* (
      input: typeof OwnedTaskCreateSchema.Type,
    ) {
      const task = yield* SqlSchema.findOne({
        Request: OwnedTaskCreateSchema,
        Result: TaskSchema,
        execute: ({ organizationId, member, payload }) => sql`
        INSERT INTO tasks (user_id, organization_id, title, description)
        VALUES (${member?.id ?? null}, ${organizationId}, ${payload.title}, ${payload.description ?? null})
        RETURNING id, user_id, organization_id, title, description, completed, created_at, updated_at
      `,
      })(input);
      yield* events.track({
        name: "task.created",
        category: "audit",
        target: { id: task.id, name: task.title, type: "task" },
      });
      return task;
    }, sql.withTransaction);

    const update = Effect.fn("Tasks.update")(function* (
      input: typeof OwnedTaskUpdateSchema.Type,
    ) {
      yield* sql`SELECT id FROM tasks WHERE id = ${input.id} AND organization_id = ${input.organizationId} FOR UPDATE`;
      const previous = yield* findOne(input);
      if (Option.isNone(previous)) return Option.none();
      const task = yield* SqlSchema.findOneOption({
        Request: OwnedTaskUpdateSchema,
        Result: TaskSchema,
        execute: ({ organizationId, id, payload }) => sql`
        UPDATE tasks SET ${sql.update({ ...payload, updatedAt: new Date() })}
        WHERE id = ${id} AND organization_id = ${organizationId}
        RETURNING id, user_id, organization_id, title, description, completed, created_at, updated_at
      `,
      })(input);
      if (Option.isSome(task)) {
        // One domain action per update, with completion taking precedence over
        // generic edits. Timestamp-only retries are diagnostic, not audit events.
        const completionChanged =
          previous.value.completed !== task.value.completed;
        if (
          completionChanged ||
          previous.value.title !== task.value.title ||
          previous.value.description !== task.value.description
        ) {
          yield* events.track({
            name: completionChanged
              ? task.value.completed
                ? "task.completed"
                : "task.reopened"
              : "task.updated",
            category: "audit",
            target: { id: task.value.id, name: task.value.title, type: "task" },
          });
        }
        yield* Effect.logDebug("Task update persisted", {
          taskId: task.value.id,
        });
      }
      return task;
    }, sql.withTransaction);

    const deleteTask = Effect.fn("Tasks.delete")(function* (
      input: typeof OwnedTaskDeleteSchema.Type,
    ) {
      const task = yield* SqlSchema.findOneOption({
        Request: OwnedTaskDeleteSchema,
        Result: TaskSchema,
        execute: ({ organizationId, id }) => sql`
        DELETE FROM tasks WHERE id = ${id} AND organization_id = ${organizationId}
        RETURNING id, user_id, organization_id, title, description, completed, created_at, updated_at
      `,
      })(input);
      if (Option.isSome(task))
        yield* events.track({
          name: "task.deleted",
          category: "audit",
          target: { id: task.value.id, name: task.value.title, type: "task" },
        });
      return task;
    }, sql.withTransaction);
    return { find, findOne, create, update, delete: deleteTask };
  }),
}) {
  static readonly baseLayer = Layer.effect(this, this.make);
  static readonly layer = this.baseLayer;
}
