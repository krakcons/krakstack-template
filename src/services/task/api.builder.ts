import { AuthService } from "@krak-stack/auth/server";
import { Effect, Schema, Stream } from "effect";
import { HttpServerRequest, HttpServerResponse } from "effect/unstable/http";
import { HttpApiBuilder, HttpApiError } from "effect/unstable/httpapi";

import { ApplicationApi } from "@/api";
import { datastarResponse, patchElements } from "@/datastar";
import { getMessages } from "@/messages";
import {
  renderTaskCreateDialog,
  renderTaskForm,
  renderTaskList,
} from "@/view";

import { Tasks } from ".";
import { CreateTask } from "./schema";

const internalServerError = () => new HttpApiError.InternalServerError({});
const notFound = () => new HttpApiError.NotFound({});

const decodeCreateTask = (payload: {
  readonly title: string;
  readonly description?: string | undefined;
}) => {
  const title = payload.title.trim();
  const description = payload.description?.trim() ?? "";
  return Schema.decodeUnknownSync(CreateTask)({
    title,
    ...(description ? { description } : {}),
  });
};

const redirectTo = (path: string) =>
  HttpServerResponse.redirect(path, { status: 303 });

const isDatastarRequest = (request: HttpServerRequest.HttpServerRequest) =>
  request.headers["datastar-request"] === "true";

const datastarServerResponse = (events: ReadonlyArray<string>) =>
  HttpServerResponse.fromWeb(datastarResponse(events));

const requirePageUser = Effect.gen(function* () {
  const auth = yield* AuthService;
  return yield* auth.getSession().pipe(
    Effect.catch(() => Effect.succeed(null)),
    Effect.map((session) => session?.user ?? null),
  );
});

export const taskHtmlHandler = HttpApiBuilder.group(
  ApplicationApi,
  "taskHtmlActions",
  (handlers) =>
    handlers
      .handle("stream", ({ params }) =>
        Effect.gen(function* () {
          const tasks = yield* Tasks;
          const user = yield* requirePageUser;
          if (!user) return redirectTo(`/${params.locale}/sign-in`);

          const updates = tasks.changes({ userId: user.id }).pipe(
            Stream.mapEffect(() =>
              tasks
                .list({ userId: user.id })
                .pipe(Effect.mapError(internalServerError)),
            ),
            Stream.map((taskList) =>
              patchElements(
                renderTaskList(taskList, { locale: params.locale }),
              ),
            ),
            Stream.encodeText,
          );
          return HttpServerResponse.stream(updates, {
            headers: {
              "Cache-Control": "no-cache",
              Connection: "keep-alive",
              "Content-Type": "text/event-stream",
            },
          });
        }),
      )
      .handle("create", ({ params, payload }) =>
        Effect.gen(function* () {
          const request = yield* HttpServerRequest.HttpServerRequest;
          const tasks = yield* Tasks;
          const user = yield* requirePageUser;
          if (!user) return redirectTo(`/${params.locale}/sign-in`);

          let input: CreateTask;
          try {
            input = decodeCreateTask(payload);
          } catch {
            const form = renderTaskForm(
              { locale: params.locale },
              getMessages(params.locale).titleRequired,
            );
            return isDatastarRequest(request)
              ? datastarServerResponse([patchElements(form)])
              : HttpServerResponse.fromWeb(
                  new Response(form.value, {
                    status: 400,
                    headers: { "Content-Type": "text/html; charset=utf-8" },
                  }),
                );
          }

          yield* tasks
            .create({ userId: user.id, payload: input })
            .pipe(Effect.mapError(internalServerError));
          if (!isDatastarRequest(request)) {
            return redirectTo(`/${params.locale}/admin`);
          }
          const taskList = yield* tasks
            .list({ userId: user.id })
            .pipe(Effect.mapError(internalServerError));
          return datastarServerResponse([
            patchElements(
              renderTaskCreateDialog({ locale: params.locale }),
              { mode: "replace" },
            ),
            patchElements(renderTaskList(taskList, { locale: params.locale })),
          ]);
        }),
      )
      .handle("update", ({ params, payload }) =>
        Effect.gen(function* () {
          const request = yield* HttpServerRequest.HttpServerRequest;
          const tasks = yield* Tasks;
          const user = yield* requirePageUser;
          if (!user) return redirectTo(`/${params.locale}/sign-in`);
          yield* tasks
            .update({
              userId: user.id,
              id: params.id,
              payload: decodeCreateTask(payload),
            })
            .pipe(Effect.mapError(internalServerError));
          if (!isDatastarRequest(request)) {
            return redirectTo(`/${params.locale}/admin`);
          }
          const taskList = yield* tasks
            .list({ userId: user.id })
            .pipe(Effect.mapError(internalServerError));
          return datastarServerResponse([
            patchElements(renderTaskList(taskList, { locale: params.locale })),
          ]);
        }),
      )
      .handle("toggle", ({ params }) =>
        Effect.gen(function* () {
          const request = yield* HttpServerRequest.HttpServerRequest;
          const tasks = yield* Tasks;
          const user = yield* requirePageUser;
          if (!user) return redirectTo(`/${params.locale}/sign-in`);
          yield* tasks
            .toggle({ userId: user.id, id: params.id })
            .pipe(Effect.mapError(internalServerError));
          if (!isDatastarRequest(request)) {
            return redirectTo(`/${params.locale}/admin`);
          }
          const taskList = yield* tasks
            .list({ userId: user.id })
            .pipe(Effect.mapError(internalServerError));
          return datastarServerResponse([
            patchElements(renderTaskList(taskList, { locale: params.locale })),
          ]);
        }),
      )
      .handle("delete", ({ params }) =>
        Effect.gen(function* () {
          const request = yield* HttpServerRequest.HttpServerRequest;
          const tasks = yield* Tasks;
          const user = yield* requirePageUser;
          if (!user) return redirectTo(`/${params.locale}/sign-in`);
          yield* tasks
            .delete({ userId: user.id, id: params.id })
            .pipe(Effect.mapError(internalServerError));
          if (!isDatastarRequest(request)) {
            return redirectTo(`/${params.locale}/admin`);
          }
          const taskList = yield* tasks
            .list({ userId: user.id })
            .pipe(Effect.mapError(internalServerError));
          return datastarServerResponse([
            patchElements(renderTaskList(taskList, { locale: params.locale })),
          ]);
        }),
      ),
);

export const tasksHandler = HttpApiBuilder.group(
  ApplicationApi,
  "tasks",
  (handlers) =>
    handlers
      .handle("listTasks", () =>
        Effect.gen(function* () {
          const tasks = yield* Tasks;
          const auth = yield* AuthService;
          const session = yield* auth.requireUser();
          return yield* tasks
            .list({ userId: session.user.id })
            .pipe(Effect.mapError(internalServerError));
        }),
      )
      .handle("createTask", ({ payload }) =>
        Effect.gen(function* () {
          const tasks = yield* Tasks;
          const auth = yield* AuthService;
          const session = yield* auth.requireUser();
          return yield* tasks
            .create({ userId: session.user.id, payload })
            .pipe(Effect.mapError(internalServerError));
        }),
      )
      .handle("updateTask", ({ params, payload }) =>
        Effect.gen(function* () {
          const tasks = yield* Tasks;
          const auth = yield* AuthService;
          const session = yield* auth.requireUser();
          const task = yield* tasks
            .update({ userId: session.user.id, id: params.id, payload })
            .pipe(Effect.mapError(internalServerError));
          if (!task) return yield* notFound();
          return task;
        }),
      )
      .handle("toggleTask", ({ params }) =>
        Effect.gen(function* () {
          const tasks = yield* Tasks;
          const auth = yield* AuthService;
          const session = yield* auth.requireUser();
          const task = yield* tasks
            .toggle({ userId: session.user.id, id: params.id })
            .pipe(Effect.mapError(internalServerError));
          if (!task) return yield* notFound();
          return task;
        }),
      )
      .handle("deleteTask", ({ params }) =>
        Effect.gen(function* () {
          const tasks = yield* Tasks;
          const auth = yield* AuthService;
          const session = yield* auth.requireUser();
          const task = yield* tasks
            .delete({ userId: session.user.id, id: params.id })
            .pipe(Effect.mapError(internalServerError));
          if (!task) return yield* notFound();
          return task;
        }),
      ),
);
