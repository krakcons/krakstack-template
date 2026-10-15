import { defineConfig, mergeConfig } from "vite";

import appConfig from "../vite.config.ts";

export default mergeConfig(
  appConfig,
  defineConfig({
    plugins: [
      {
        name: "telemetry-test-api-isolation",
        configureServer(server) {
          // SSR auth requests do not pass through Playwright's browser routing.
          server.middlewares.use((request, response, next) => {
            const path = new URL(request.url ?? "/", "http://localhost")
              .pathname;
            if (!path.startsWith("/api/")) return next();
            response.setHeader("Content-Type", "application/json");
            if (path === "/api/auth/get-session") {
              response.end("null");
            } else {
              response.statusCode = 503;
              response.end(
                '{"error":"Backend disabled for browser telemetry tests"}',
              );
            }
          });
        },
      },
    ],
  }),
);
