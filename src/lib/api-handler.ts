import { Layer } from "effect";
import { HttpRouter, HttpServer } from "effect/unstable/http";
import { HttpApiScalar } from "effect/unstable/httpapi";
import { OpenTelemetry } from "@krak-stack/registry/service-opentelemetry";

import { Api } from "@/api";
import { apiLayer } from "@/lib/api-builder";
import { mcpLayer } from "@/lib/mcp-handler";

const docsLayer = HttpApiScalar.layer(Api, { path: "/api/docs" });
const allRoutes = Layer.mergeAll(apiLayer, docsLayer, mcpLayer);
const appLayer = Layer.mergeAll(allRoutes, OpenTelemetry.layer).pipe(
  Layer.provide(HttpServer.layerServices),
);

export const { handler } = HttpRouter.toWebHandler(appLayer);
