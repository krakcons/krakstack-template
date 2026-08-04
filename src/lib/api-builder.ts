import { Layer } from "effect";
import { HttpApiBuilder } from "effect/unstable/httpapi";
import { ActorRequired, AuthMiddleware } from "@krak-stack/auth/server";

import { Api } from "@/api";
import { Access } from "@/services/auth/access";
import { Tasks } from "@/services/task";
import { tasksHandler } from "@/services/task/api.builder";

export const apiLayer = HttpApiBuilder.layer(Api, {
  openapiPath: "/api/openapi.json",
}).pipe(
  Layer.provide(tasksHandler),
  Layer.provide(AuthMiddleware.layer()),
  Layer.provide(ActorRequired.layer(Access)),
  Layer.provide(Tasks.layer),
);
