import { Layer } from "effect";
import { HttpRouter } from "effect/http";
import { HttpApiScalar } from "effect/http-api";

import { Api } from "@/api";
import { apiLayer } from "@/lib/api-builder";
import { mcpLayer } from "@/lib/mcp-handler";
import { HttpApiOtlp } from "@krak-stack/registry/opentelemetry/api";
import { Otlp } from "@krak-stack/registry/opentelemetry";
import { Events } from "@krak-stack/registry/events";
import { AuthMiddleware } from "@krak-stack/auth/server";
import { databaseLayer } from "@/lib/database";
import { eventsLayer } from "@/services/events";

const docsLayer = HttpApiScalar.layer(Api, { path: "/api/docs" });
const applicationLayer = eventsLayer.pipe(
  Layer.provide(databaseLayer),
  Layer.provideMerge(Otlp.layer),
);
const telemetryLayer = HttpApiOtlp.layer.pipe(
  Layer.provide(AuthMiddleware.routerLayer({ paths: ["/api/otel/v1/logs"] })),
  Layer.provide(Events.ingestionLayer),
  Layer.provideMerge(applicationLayer),
);
const appLayer = Layer.mergeAll(apiLayer, docsLayer, mcpLayer).pipe(
  Layer.provideMerge(telemetryLayer),
);

const makeHandler = () => HttpRouter.toWebHandler(appLayer);
let web: ReturnType<typeof makeHandler> | undefined;

export const handler = (request: Request) => {
  web ??= makeHandler();
  return web.handler(request);
};

export const dispose = async () => {
  await web?.dispose();
};

if (import.meta.hot) {
  import.meta.hot.dispose(dispose);
}
