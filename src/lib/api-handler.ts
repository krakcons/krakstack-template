import { Layer } from "effect";
import { HttpRouter } from "effect/unstable/http";
import { HttpApiScalar } from "effect/unstable/httpapi";

import { Api } from "@/api";
import { apiLayer } from "@/lib/api-builder";
import { mcpLayer } from "@/lib/mcp-handler";
import { HttpApiOtlp } from "@krak-stack/registry/opentelemetry/api";

const docsLayer = HttpApiScalar.layer(Api, { path: "/api/docs" });
const appLayer = Layer.mergeAll(apiLayer, docsLayer, mcpLayer).pipe(
  Layer.provideMerge(HttpApiOtlp.layer),
);

export const { handler } = HttpRouter.toWebHandler(appLayer);
