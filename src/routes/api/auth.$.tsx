import { proxyAuthRequest } from "@krak-stack/auth/server";
import { createFileRoute } from "@tanstack/react-router";
import { Schema } from "effect";

const AuthUrl = Schema.String.pipe(
  Schema.refine((value): value is string => URL.canParse(value), {
    message: "KRAKSTACK_AUTH_URL must be a valid URL",
  }),
).annotate({ identifier: "KrakstackAuthUrl" });

const proxyAuth = (request: Request) =>
  proxyAuthRequest(
    request,
    Schema.decodeUnknownSync(AuthUrl)(process.env.KRAKSTACK_AUTH_URL),
  );

export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      GET: async ({ request }) => proxyAuth(request),
      POST: async ({ request }) => proxyAuth(request),
      PUT: async ({ request }) => proxyAuth(request),
      PATCH: async ({ request }) => proxyAuth(request),
      DELETE: async ({ request }) => proxyAuth(request),
    },
  },
});
