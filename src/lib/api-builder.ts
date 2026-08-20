import { Effect, Layer } from "effect";
import { HttpApiBuilder } from "effect/unstable/httpapi";
import { ActorRequired, AuthMiddleware } from "@krak-stack/auth/server";
import {
  healthHandler,
  HealthService,
} from "@krak-stack/registry/service-health";

import { Api } from "@/api";
import { Access } from "@/services/auth/access";
import { DB } from "@/services/database";
import { Tasks } from "@/services/task";
import { tasksHandler } from "@/services/task/api.builder";

const healthLayer = HttpApiBuilder.group(Api, "health", healthHandler).pipe(
  Layer.provide(
    HealthService.layerWith({
      checks: {
        ready: [
          {
            name: "database",
            check: Effect.gen(function* () {
              const db = yield* DB;
              yield* db.$client`SELECT 1`;
              return HealthService.up();
            }).pipe(Effect.timeout("2 seconds")),
          },
        ],
      },
    }),
  ),
);

export const apiLayer = HttpApiBuilder.layer(Api, {
  openapiPath: "/api/openapi.json",
}).pipe(
  Layer.provide(healthLayer),
  Layer.provide(tasksHandler),
  Layer.provide(AuthMiddleware.layer()),
  Layer.provide(ActorRequired.layer(Access)),
  Layer.provide(Tasks.layer),
  Layer.provide(DB.layer),
);
