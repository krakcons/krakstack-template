import { Config, Effect, Layer, Option } from "effect";
import { FetchHttpClient } from "effect/unstable/http";
import { HttpApiCli, runHttpApiCli } from "@krak-stack/registry/httpapi/cli";
import { ApiClient } from "@krak-stack/registry/httpapi/client";
import { HttpApiSpec } from "@krak-stack/registry/httpapi/helpers";

import { Api } from "@/api";
import { authClientLayer } from "@/services/auth/client/layer";

const apiClientLayer = Layer.unwrap(
  Effect.gen(function* () {
    const baseUrl = yield* Config.url("VITE_SITE_URL");
    const apiKey = yield* Config.option(
      Config.nonEmptyString("KRAKSTACK_TEMPLATE_API_KEY"),
    );

    return ApiClient.layer({
      api: Api,
      baseUrl: baseUrl.toString(),
    }).pipe(
      Layer.provide(
        authClientLayer(Option.getOrUndefined(apiKey)).pipe(
          Layer.provide(FetchHttpClient.layer),
        ),
      ),
    );
  }),
);

const cliLayer = HttpApiCli.layer.pipe(
  Layer.provide(
    Layer.mergeAll(
      HttpApiSpec.layer({
        api: Api,
        methods: ["get", "post", "put", "patch", "delete"],
      }),
      apiClientLayer,
    ),
  ),
);

export const runCli = (args = process.argv.slice(2)) =>
  runHttpApiCli(cliLayer, args);

if (import.meta.main) runCli();
