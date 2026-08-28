import { proxyAuthRequestEffect } from "@krak-stack/auth/server";
import { createFileRoute } from "@tanstack/react-router";
import { Effect, Schema } from "effect";
import { FetchHttpClient, HttpServerResponse } from "effect/unstable/http";

const AuthUrl = Schema.String.pipe(
  Schema.refine((value): value is string => URL.canParse(value), {
    message: "KRAKSTACK_AUTH_URL must be a valid URL",
  }),
).annotate({ identifier: "KrakstackAuthUrl" });

const proxyAuth = (request: Request) =>
  proxyAuthRequestEffect(
    request,
    Schema.decodeUnknownSync(AuthUrl)(process.env.KRAKSTACK_AUTH_URL),
  ).pipe(
    Effect.map((response) =>
      HttpServerResponse.toWeb(response, {
        withoutBody: request.method === "HEAD",
      }),
    ),
    Effect.provide(FetchHttpClient.layer),
    Effect.runPromise,
  );

export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      GET: async ({ request }) => proxyAuth(request),
      HEAD: async ({ request }) => proxyAuth(request),
      POST: async ({ request }) => proxyAuth(request),
      PUT: async ({ request }) => proxyAuth(request),
      PATCH: async ({ request }) => proxyAuth(request),
      DELETE: async ({ request }) => proxyAuth(request),
      OPTIONS: async ({ request }) => proxyAuth(request),
    },
  },
});
