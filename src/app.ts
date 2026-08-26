import { BunHttpServer } from "@effect/platform-bun";
import { AuthMiddleware, proxyAuthRequest } from "@krak-stack/auth/server";
import { Effect, Layer } from "effect";
import {
  HttpRouter,
  HttpServerResponse,
} from "effect/unstable/http";
import { HttpApiBuilder, HttpApiScalar } from "effect/unstable/httpapi";

import { ApplicationApi } from "@/api";
import {
  accountActionsHandler,
  adminPagesHandler,
  authenticationPagesHandler,
  publicPagesHandler,
  themeHandler,
} from "@/http/api.builder";
import {
  taskHtmlHandler,
  tasksHandler,
} from "@/services/task/api.builder";
import { Tasks } from "@/services/task";

const authBaseUrl = () =>
  process.env.KRAKSTACK_AUTH_URL ?? "http://localhost:3001";

const staticFile = (path: string, contentType: string) =>
  Effect.promise(() => Bun.file(path).exists()).pipe(
    Effect.map((exists) =>
      HttpServerResponse.fromWeb(
        exists
          ? new Response(Bun.file(path), {
              headers: { "Content-Type": contentType },
            })
          : new Response("Not found", { status: 404 }),
      ),
    ),
  );

export const makeApplicationRoutes = (
  tasksLayer: Layer.Layer<Tasks, unknown> = Tasks.layer,
  authLayer: Layer.Layer<AuthMiddleware> = AuthMiddleware.layer({
    baseUrl: authBaseUrl(),
  }),
 ) => {
  const apiRoutesWithServices = HttpApiBuilder.layer(ApplicationApi, {
    openapiPath: "/api/openapi.json",
  }).pipe(
    Layer.provide(publicPagesHandler),
    Layer.provide(authenticationPagesHandler),
    Layer.provide(themeHandler),
    Layer.provide(adminPagesHandler),
    Layer.provide(accountActionsHandler),
    Layer.provide(taskHtmlHandler),
    Layer.provide(tasksHandler),
    Layer.provide(authLayer),
    Layer.provideMerge(tasksLayer),
  );
  const boundaryRoutes = Layer.mergeAll(
    HttpRouter.add("*", "/api/auth/*", (request) =>
      Effect.promise(() =>
        proxyAuthRequest(
          request.source as Request,
          authBaseUrl(),
          process.env.AUTH_COOKIE_DOMAIN
            ? { cookieDomain: process.env.AUTH_COOKIE_DOMAIN }
            : {},
        ),
      ).pipe(Effect.map(HttpServerResponse.fromWeb)),
    ),
    HttpRouter.add("GET", "/styles.css", () =>
      staticFile("src/styles.css", "text/css; charset=utf-8"),
    ),
    HttpRouter.add("GET", "/datastar.js", () =>
      staticFile("public/datastar.js", "text/javascript; charset=utf-8"),
    ),
    HttpRouter.add("GET", "/favicon.ico", () =>
      staticFile("public/favicon.ico", "image/x-icon"),
    ),
    HttpRouter.add("GET", "/favicon.svg", () =>
      staticFile("public/favicon.svg", "image/svg+xml"),
    ),
  );
  return Layer.mergeAll(
    apiRoutesWithServices,
    boundaryRoutes,
    HttpApiScalar.layer(ApplicationApi, {
      path: "/api/docs",
      scalar: { favicon: "/favicon.svg" },
    }),
  );
};

export const makeWebHandler = (
  tasksLayer?: Layer.Layer<Tasks, unknown>,
  authLayer?: Layer.Layer<AuthMiddleware>,
) =>
  HttpRouter.toWebHandler(
    makeApplicationRoutes(tasksLayer, authLayer).pipe(
      Layer.provide(BunHttpServer.layerHttpServices),
    ),
    { disableLogger: true },
  );
