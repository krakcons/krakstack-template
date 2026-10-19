import { Schema } from "effect";

export const TaskMember = Schema.Struct({ id: Schema.NonEmptyString }).annotate(
  { identifier: "TaskMember" },
);

export const TaskSchema = Schema.Struct({
  id: Schema.String,
  userId: Schema.NullOr(Schema.String),
  organizationId: Schema.String,
  title: Schema.String,
  description: Schema.NullOr(Schema.String),
  completed: Schema.Boolean,
  createdAt: Schema.Date,
  updatedAt: Schema.Date,
}).annotate({
  identifier: "Task",
  title: "Task",
  description:
    "A task belonging to an organization; userId identifies its human creator, or is null for an organization API key",
  examples: [
    {
      id: "1",
      userId: "1",
      organizationId: "org-1",
      title: "Buy groceries",
      description: null,
      completed: false,
      createdAt: new Date("2026-01-01"),
      updatedAt: new Date("2026-01-01"),
    },
  ],
});

export const CreateTaskSchema = Schema.Struct({
  title: Schema.NonEmptyString,
  description: Schema.optional(Schema.String),
}).annotate({
  identifier: "CreateTask",
  title: "Create Task",
  description: "Payload for creating a new task",
  examples: [{ title: "Buy groceries", description: "Milk, eggs, bread" }],
});

export const UpdateTaskSchema = Schema.Struct({
  title: Schema.optional(Schema.NonEmptyString),
  description: Schema.optional(Schema.NullOr(Schema.String)),
  completed: Schema.optional(Schema.Boolean),
}).annotate({
  identifier: "UpdateTask",
  title: "Update Task",
  description: "Payload for updating an existing task",
  examples: [{ title: "Buy groceries", completed: true }],
});

export const TaskIdParamsSchema = Schema.Struct({
  id: Schema.String,
  organizationId: Schema.NonEmptyString,
}).annotate({
  identifier: "TaskIdParamsSchema",
  title: "Task ID Params",
  description: "Path parameters for task endpoints requiring an ID",
  examples: [{ id: "1", organizationId: "org-1" }],
});

export const TaskOwnerSchema = Schema.Struct({
  organizationId: Schema.NonEmptyString,
}).annotate({ identifier: "TaskOwner" });

export const OwnedTaskSchema = Schema.Struct({
  id: Schema.String,
  organizationId: Schema.NonEmptyString,
}).annotate({ identifier: "OwnedTask" });

export const OwnedTaskCreateSchema = Schema.Struct({
  organizationId: Schema.NonEmptyString,
  member: Schema.NullOr(TaskMember),
  payload: CreateTaskSchema,
}).annotate({ identifier: "OwnedTaskCreate" });

export const OwnedTaskUpdateSchema = Schema.Struct({
  id: Schema.String,
  organizationId: Schema.NonEmptyString,
  member: Schema.NullOr(TaskMember),
  payload: UpdateTaskSchema,
}).annotate({ identifier: "OwnedTaskUpdate" });

export const TaskSchemaStandard = Schema.toStandardSchemaV1(TaskSchema);

export const TaskAuditAction = Schema.Literals([
  "task.created",
  "task.updated",
  "task.completed",
  "task.reopened",
  "task.deleted",
]).annotate({ identifier: "TaskAuditAction" });

export const OwnedTaskDeleteSchema = Schema.Struct({
  ...OwnedTaskSchema.fields,
  member: Schema.NullOr(TaskMember),
}).annotate({ identifier: "OwnedTaskDelete" });
