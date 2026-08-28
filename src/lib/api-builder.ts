import { Effect, Layer, Schema } from "effect";
import { HttpApiBuilder } from "effect/unstable/httpapi";
import {
  ActorRequired,
  AuthMiddleware,
  proxyAuthHttpEffect,
} from "@krak-stack/auth/server";
import {
  healthHandler,
  HealthService,
} from "@krak-stack/registry/service-health";
import { FetchHttpClient, HttpRouter } from "effect/unstable/http";

import { Api } from "@/api";
import { Access } from "@/services/auth/access";
import { DB } from "@/services/database";
import { Tasks } from "@/services/task";
import { tasksHandler } from "@/services/task/api.builder";

const AuthUrl = Schema.String.pipe(
  Schema.refine((value): value is string => URL.canParse(value), {
    message: "KRAKSTACK_AUTH_URL must be a valid URL",
  }),
).annotate({ identifier: "KrakstackAuthUrl" });

const authProxyLayer = HttpRouter.add(
  "*",
  "/api/auth/*",
  proxyAuthHttpEffect(
    Schema.decodeUnknownSync(AuthUrl)(process.env.KRAKSTACK_AUTH_URL),
  ).pipe(Effect.orDie),
).pipe(HttpRouter.provideRequest(FetchHttpClient.layer));

const healthLayer = HttpApiBuilder.group(Api, "health", healthHandler).pipe(
  Layer.provideMerge(
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

const httpApiLayer = HttpApiBuilder.layer(Api, {
  openapiPath: "/api/openapi.json",
}).pipe(
  Layer.provideMerge(healthLayer),
  Layer.provide(tasksHandler),
  Layer.provide(AuthMiddleware.layer()),
  Layer.provide(ActorRequired.layer(Access)),
  Layer.provideMerge(Tasks.layer),
  Layer.provide(DB.layer),
);

export const apiLayer = Layer.mergeAll(httpApiLayer, authProxyLayer);
