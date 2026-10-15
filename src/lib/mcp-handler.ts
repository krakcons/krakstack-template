import { Config, Effect, Layer } from "effect";
import { McpProtocol, McpServer } from "effect/ai";
import { FetchHttpClient, HttpRouter, HttpServerRequest } from "effect/http";
import { HttpApiAdapter } from "@krak-stack/registry/httpapi/adapter";
import { makeHttpApiToolkit } from "@krak-stack/registry/httpapi/toolkit";

import { Api } from "@/api";
import { authClientLayer, CurrentApiKey } from "@/services/auth/client/layer";

const adapterLayer = Layer.unwrap(
  Effect.map(Config.URL("VITE_SITE_URL"), (baseUrl) =>
    HttpApiAdapter.layer({
      api: Api,
      baseUrl: baseUrl.toString(),
      methods: ["get"],
    }).pipe(
      Layer.provide(
        authClientLayer().pipe(Layer.provide(FetchHttpClient.layer)),
      ),
    ),
  ),
);

const mcpToolsLayer = Layer.effectDiscard(
  Effect.gen(function* () {
    const { toolkit, handlers } = yield* makeHttpApiToolkit({
      toolMetaKey: "krakstack-template/httpapi",
    });
    yield* McpServer.registerToolkit(toolkit).pipe(Effect.provide(handlers));
  }),
);

const mcpApiKeyMiddleware = HttpRouter.middleware((httpEffect) =>
  Effect.gen(function* () {
    const request = yield* HttpServerRequest.HttpServerRequest;
    const apiKey = request.headers["x-api-key"];

    return yield* httpEffect.pipe(Effect.provideService(CurrentApiKey, apiKey));
  }),
);

const mcpHttpLayer = McpServer.layerHttp({
  name: "krakstack-template",
  version: "1.0.0",
  path: "/api/mcp",
  protocols: [McpProtocol.v2025_11_25],
}).pipe(Layer.provide(mcpApiKeyMiddleware.layer));

export const mcpLayer = Layer.mergeAll(mcpToolsLayer).pipe(
  Layer.provideMerge(mcpHttpLayer),
  Layer.provide(adapterLayer),
);
