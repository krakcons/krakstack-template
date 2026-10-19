import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiError, HttpApiGroup } from "effect/http-api";
import { OpenApi } from "effect/http-api";

import { ActorRequired, Forbidden } from "@krak-stack/auth/server";

import {
  CreateTaskSchema,
  TaskIdParamsSchema,
  TaskSchema,
  UpdateTaskSchema,
} from "./schema";
import { OrganizationParams } from "@/services/audit/schema";

export const TasksApiGroup = HttpApiGroup.make("tasks")
  .annotateMerge(
    OpenApi.annotations({
      title: "Tasks",
      description: "Operations for managing tasks",
    }),
  )
  .add(
    HttpApiEndpoint.get("listTasks", "/organizations/:organizationId/tasks", {
      params: OrganizationParams,
      success: Schema.Array(TaskSchema),
      error: [
        HttpApiError.Unauthorized,
        Forbidden,
        HttpApiError.InternalServerError,
      ],
    }).annotateMerge(
      OpenApi.annotations({
        summary: "List all tasks",
        description: "Returns all tasks in the verified active organization",
      }),
    ),
  )
  .add(
    HttpApiEndpoint.post("createTask", "/organizations/:organizationId/tasks", {
      params: OrganizationParams,
      payload: CreateTaskSchema,
      success: TaskSchema,
      error: [
        HttpApiError.Unauthorized,
        Forbidden,
        HttpApiError.InternalServerError,
      ],
    }).annotateMerge(
      OpenApi.annotations({
        summary: "Create a task",
        description: "Creates a task in the verified active organization",
      }),
    ),
  )
  .add(
    HttpApiEndpoint.get("getTask", "/organizations/:organizationId/tasks/:id", {
      params: TaskIdParamsSchema,
      success: TaskSchema,
      error: [
        HttpApiError.Unauthorized,
        Forbidden,
        HttpApiError.NotFound,
        HttpApiError.InternalServerError,
      ],
    }).annotateMerge(
      OpenApi.annotations({
        summary: "Get a task by ID",
        description:
          "Retrieves a task by ID in the verified active organization",
      }),
    ),
  )
  .add(
    HttpApiEndpoint.patch(
      "updateTask",
      "/organizations/:organizationId/tasks/:id",
      {
        params: TaskIdParamsSchema,
        payload: UpdateTaskSchema,
        success: TaskSchema,
        error: [
          HttpApiError.Unauthorized,
          Forbidden,
          HttpApiError.NotFound,
          HttpApiError.InternalServerError,
        ],
      },
    ).annotateMerge(
      OpenApi.annotations({
        summary: "Update a task",
        description: "Updates a task in the verified active organization",
      }),
    ),
  )
  .add(
    HttpApiEndpoint.delete(
      "deleteTask",
      "/organizations/:organizationId/tasks/:id",
      {
        params: TaskIdParamsSchema,
        success: TaskSchema,
        error: [
          HttpApiError.Unauthorized,
          Forbidden,
          HttpApiError.NotFound,
          HttpApiError.InternalServerError,
        ],
      },
    ).annotateMerge(
      OpenApi.annotations({
        summary: "Delete a task",
        description: "Deletes a task in the verified active organization",
      }),
    ),
  )
  .middleware(ActorRequired());
