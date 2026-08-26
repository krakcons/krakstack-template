import { Schema } from "effect";

export const Task = Schema.Struct({
  id: Schema.String,
  userId: Schema.String,
  title: Schema.String,
  description: Schema.NullOr(Schema.String),
  completed: Schema.Boolean,
  createdAt: Schema.Date,
  updatedAt: Schema.Date,
}).annotate({
  identifier: "Task",
  title: "Task",
  description: "A task belonging to one workspace identity",
});

export type Task = typeof Task.Type;

export const CreateTask = Schema.Struct({
  title: Schema.NonEmptyString,
  description: Schema.optional(Schema.String),
}).annotate({
  identifier: "CreateTask",
  title: "Create task",
  description: "Input accepted when creating a task",
});

export type CreateTask = typeof CreateTask.Type;

export const TaskIdParams = Schema.Struct({ id: Schema.String });
