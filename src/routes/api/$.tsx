import { createFileRoute } from "@tanstack/react-router";

import { handler as effectHandler } from "@/lib/api-handler";

export const Route = createFileRoute("/api/$")({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => effectHandler(request),
      HEAD: async ({ request }: { request: Request }) => effectHandler(request),
      POST: async ({ request }: { request: Request }) => effectHandler(request),
      PUT: async ({ request }: { request: Request }) => effectHandler(request),
      PATCH: async ({ request }: { request: Request }) =>
        effectHandler(request),
      DELETE: async ({ request }: { request: Request }) =>
        effectHandler(request),
      OPTIONS: async ({ request }: { request: Request }) =>
        effectHandler(request),
    },
  },
});
