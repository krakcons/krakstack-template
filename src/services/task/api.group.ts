import { AuthMiddleware } from "@krak-stack/auth/server";
import { Schema } from "effect";
import {
  HttpApiEndpoint,
  HttpApiError,
  HttpApiGroup,
  HttpApiSchema,
  OpenApi,
} from "effect/unstable/httpapi";

import { CreateTask, Task, TaskIdParams } from "./schema";

const LocaleParams = Schema.Struct({
  locale: Schema.Literals(["en", "fr"]),
});
const HtmlTaskIdParams = Schema.Struct({
  locale: Schema.Literals(["en", "fr"]),
  id: Schema.String,
});
const TaskForm = Schema.Struct({
  title: Schema.String,
  description: Schema.optional(Schema.String),
});
const encodedForm = <S extends Schema.Top>(schema: S) =>
  [
    schema.pipe(HttpApiSchema.asFormUrlEncoded()),
    schema.pipe(HttpApiSchema.asMultipart()),
  ] as const;

export const TaskHtmlApiGroup = HttpApiGroup.make("taskHtmlActions")
  .add(
    HttpApiEndpoint.get("stream", "/:locale/admin/tasks/stream", {
      params: LocaleParams,
      success: Schema.Unknown,
      error: HttpApiError.InternalServerError,
    }),
  )
  .add(
    HttpApiEndpoint.post("create", "/:locale/admin/tasks", {
      params: LocaleParams,
      payload: encodedForm(TaskForm),
      success: Schema.Unknown,
      error: HttpApiError.InternalServerError,
    }),
  )
  .add(
    HttpApiEndpoint.put("update", "/:locale/admin/tasks/:id", {
      params: HtmlTaskIdParams,
      payload: encodedForm(TaskForm),
      success: Schema.Unknown,
      error: HttpApiError.InternalServerError,
    }),
  )
  .add(
    HttpApiEndpoint.patch("toggle", "/:locale/admin/tasks/:id/toggle", {
      params: HtmlTaskIdParams,
      success: Schema.Unknown,
      error: HttpApiError.InternalServerError,
    }),
  )
  .add(
    HttpApiEndpoint.delete("delete", "/:locale/admin/tasks/:id", {
      params: HtmlTaskIdParams,
      success: Schema.Unknown,
      error: HttpApiError.InternalServerError,
    }),
  )
  .middleware(AuthMiddleware);

export const TasksApiGroup = HttpApiGroup.make("tasks")
  .annotateMerge(
    OpenApi.annotations({
      title: "Tasks",
      description: "Operations for managing tasks",
    }),
  )
  .add(
    HttpApiEndpoint.get("listTasks", "/api/tasks", {
      success: Schema.Array(Task),
      error: [HttpApiError.Unauthorized, HttpApiError.InternalServerError],
    }),
  )
  .add(
    HttpApiEndpoint.post("createTask", "/api/tasks", {
      payload: CreateTask,
      success: Task.pipe(HttpApiSchema.status(201)),
      error: [HttpApiError.Unauthorized, HttpApiError.InternalServerError],
    }),
  )
  .add(
    HttpApiEndpoint.put("updateTask", "/api/tasks/:id", {
      params: TaskIdParams,
      payload: CreateTask,
      success: Task,
      error: [
        HttpApiError.Unauthorized,
        HttpApiError.NotFound,
        HttpApiError.InternalServerError,
      ],
    }),
  )
  .add(
    HttpApiEndpoint.patch("toggleTask", "/api/tasks/:id", {
      params: TaskIdParams,
      success: Task,
      error: [
        HttpApiError.Unauthorized,
        HttpApiError.NotFound,
        HttpApiError.InternalServerError,
      ],
    }),
  )
  .add(
    HttpApiEndpoint.delete("deleteTask", "/api/tasks/:id", {
      params: TaskIdParams,
      success: Task,
      error: [
        HttpApiError.Unauthorized,
        HttpApiError.NotFound,
        HttpApiError.InternalServerError,
      ],
    }),
  )
  .middleware(AuthMiddleware);
