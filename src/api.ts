import { HttpApi, OpenApi } from "effect/unstable/httpapi";
import { AuthMiddleware } from "@krak-stack/auth/server";

import { TasksApiGroup } from "@/services/task/api.group";

export const Api = HttpApi.make("Api")
  .annotateMerge(
    OpenApi.annotations({
      title: "KrakStack API",
      version: "1.0.0",
      description: "API for the KrakStack template application",
    }),
  )
  .add(TasksApiGroup)
  .prefix("/api")
  .middleware(AuthMiddleware);
