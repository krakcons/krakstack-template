import { HttpApi, OpenApi } from "effect/unstable/httpapi";
import { AuthMiddleware } from "@krak-stack/auth/server";
import { HealthApiGroup } from "@krak-stack/registry/service-health";

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
  .middleware(AuthMiddleware)
  .add(HealthApiGroup)
  .prefix("/api");
