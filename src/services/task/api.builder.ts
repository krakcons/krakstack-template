import { Effect, Option } from "effect";
import { CurrentActor, withPolicy } from "@krak-stack/auth/access";
import { HttpApiBuilder, HttpApiError } from "effect/http-api";
import { Api } from "@/api";
import { Access } from "@/services/auth/access";
import { requireOrganization } from "@/services/auth/organization";
import { Tasks } from ".";

const internalServerError = () => new HttpApiError.InternalServerError({});
const currentMember = Effect.gen(function* () {
  const { actor } = yield* CurrentActor;
  const member = actor.type === "user" ? actor : actor.owner;
  return member.type === "user" ? { id: member.userId } : null;
});

export const tasksHandler = HttpApiBuilder.group(Api, "tasks", (handlers) =>
  handlers
    .handle("listTasks", ({ params }) =>
      Effect.gen(function* () {
        const organizationId = yield* requireOrganization(
          params.organizationId,
        );
        const tasks = yield* Tasks;
        return yield* tasks
          .find({ organizationId })
          .pipe(Effect.mapError(internalServerError));
      }).pipe(withPolicy(Access.permission("tasks:read"))),
    )
    .handle("getTask", ({ params }) =>
      Effect.gen(function* () {
        const organizationId = yield* requireOrganization(
          params.organizationId,
        );
        const tasks = yield* Tasks;
        const task = yield* tasks
          .findOne({ organizationId, id: params.id })
          .pipe(Effect.mapError(internalServerError));
        if (Option.isNone(task)) return yield* new HttpApiError.NotFound({});
        return task.value;
      }).pipe(withPolicy(Access.permission("tasks:read"))),
    )
    .handle("createTask", ({ params, payload }) =>
      Effect.gen(function* () {
        const organizationId = yield* requireOrganization(
          params.organizationId,
        );
        const member = yield* currentMember;
        const tasks = yield* Tasks;
        return yield* tasks
          .create({ organizationId, member, payload })
          .pipe(Effect.mapError(internalServerError));
      }).pipe(withPolicy(Access.permission("tasks:create"))),
    )
    .handle("updateTask", ({ params, payload }) =>
      Effect.gen(function* () {
        const organizationId = yield* requireOrganization(
          params.organizationId,
        );
        const member = yield* currentMember;
        const tasks = yield* Tasks;
        const task = yield* tasks
          .update({ organizationId, member, id: params.id, payload })
          .pipe(Effect.mapError(internalServerError));
        if (Option.isNone(task)) return yield* new HttpApiError.NotFound({});
        return task.value;
      }).pipe(withPolicy(Access.permission("tasks:update"))),
    )
    .handle("deleteTask", ({ params }) =>
      Effect.gen(function* () {
        const organizationId = yield* requireOrganization(
          params.organizationId,
        );
        const member = yield* currentMember;
        const tasks = yield* Tasks;
        const task = yield* tasks
          .delete({ organizationId, member, id: params.id })
          .pipe(Effect.mapError(internalServerError));
        if (Option.isNone(task)) return yield* new HttpApiError.NotFound({});
        return task.value;
      }).pipe(withPolicy(Access.permission("tasks:delete"))),
    ),
);
