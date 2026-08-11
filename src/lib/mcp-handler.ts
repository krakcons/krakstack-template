import { Config, Effect, Layer } from "effect";
import {
  FetchHttpClient,
  HttpRouter,
  HttpServerRequest,
} from "effect/unstable/http";
import { ApiClient } from "@krak-stack/registry/httpapi/client";
import { HttpApiSpec } from "@krak-stack/registry/httpapi/helpers";
import {
  HttpApiMcp,
  httpApiMcpServerLayer,
  httpApiMcpToolsLayer,
} from "@krak-stack/registry/httpapi/mcp";

import { Api } from "@/api";
import { authClientLayer, CurrentApiKey } from "@/services/auth/client/layer";

const apiClientLayer = Layer.unwrap(
  Effect.map(Config.url("VITE_SITE_URL"), (baseUrl) =>
    ApiClient.layer({ api: Api, baseUrl: baseUrl.toString() }).pipe(
      Layer.provide(
        authClientLayer().pipe(Layer.provide(FetchHttpClient.layer)),
      ),
    ),
  ),
);

const httpApiLayer = Layer.mergeAll(
  HttpApiSpec.layer({ api: Api, methods: ["get"] }),
  apiClientLayer,
);

const mcpToolsLayer = httpApiMcpToolsLayer.pipe(
  Layer.provide(
    HttpApiMcp.layer({
      toolMetaKey: "krakstack-template/httpapi",
    }),
  ),
);

const mcpApiKeyMiddleware = HttpRouter.middleware((httpEffect) =>
  Effect.gen(function* () {
    const request = yield* HttpServerRequest.HttpServerRequest;
    const apiKey = request.headers["x-api-key"];

    return yield* httpEffect.pipe(Effect.provideService(CurrentApiKey, apiKey));
  }),
);

const mcpHttpLayer = httpApiMcpServerLayer("/api/mcp").pipe(
  Layer.provide(mcpApiKeyMiddleware.layer),
);

export const mcpLayer = Layer.mergeAll(mcpToolsLayer).pipe(
  Layer.provideMerge(mcpHttpLayer),
  Layer.provide(httpApiLayer),
);
