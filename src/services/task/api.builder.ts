import { Effect } from "effect";
import { actorUserId, withPolicy } from "@krak-stack/auth/access";
import { HttpApiBuilder, HttpApiError } from "effect/unstable/httpapi";

import { Api } from "@/api";
import { Access } from "@/services/auth/access";
import { Tasks } from "@/services/task";

const internalServerError = () => new HttpApiError.InternalServerError({});

export const tasksHandler = HttpApiBuilder.group(Api, "tasks", (handlers) =>
  handlers
    .handle("listTasks", () =>
      Effect.gen(function* () {
        const tasks = yield* Tasks;
        const userId = yield* actorUserId;

        return yield* tasks
          .list({ userId })
          .pipe(Effect.mapError(internalServerError));
      }).pipe(withPolicy(Access.permission("tasks:read"))),
    )
    .handle("getTask", ({ params }) =>
      Effect.gen(function* () {
        const tasks = yield* Tasks;
        const userId = yield* actorUserId;
        const task = yield* tasks
          .get({ userId, id: params.id })
          .pipe(Effect.mapError(internalServerError));

        if (!task) return yield* new HttpApiError.NotFound({});

        return task;
      }).pipe(withPolicy(Access.permission("tasks:read"))),
    )
    .handle("createTask", ({ payload }) =>
      Effect.gen(function* () {
        const tasks = yield* Tasks;
        const userId = yield* actorUserId;

        const task = yield* tasks
          .create({ userId, payload })
          .pipe(Effect.mapError(internalServerError));

        if (!task) return yield* new HttpApiError.InternalServerError({});

        return task;
      }).pipe(withPolicy(Access.permission("tasks:create"))),
    )
    .handle("updateTask", ({ params, payload }) =>
      Effect.gen(function* () {
        const tasks = yield* Tasks;
        const userId = yield* actorUserId;

        const task = yield* tasks
          .update({ userId, id: params.id, payload })
          .pipe(Effect.mapError(internalServerError));

        if (!task) return yield* new HttpApiError.NotFound({});

        return task;
      }).pipe(withPolicy(Access.permission("tasks:update"))),
    )
    .handle("deleteTask", ({ params }) =>
      Effect.gen(function* () {
        const tasks = yield* Tasks;
        const userId = yield* actorUserId;

        const task = yield* tasks
          .delete({ userId, id: params.id })
          .pipe(Effect.mapError(internalServerError));

        if (!task) return yield* new HttpApiError.NotFound({});

        return task;
      }).pipe(withPolicy(Access.permission("tasks:delete"))),
    ),
);
