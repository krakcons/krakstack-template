import { BunRuntime, BunServices } from "@effect/platform-bun";
import { Config, Effect, Layer, Option } from "effect";
import { FetchHttpClient } from "effect/http";
import { makeHttpApiCli } from "@krak-stack/registry/httpapi/cli";
import { HttpApiAdapter } from "@krak-stack/registry/httpapi/adapter";
import { Otlp } from "@krak-stack/registry/opentelemetry";

import { Api } from "@/api";
import { authClientLayer } from "@/services/auth/client/layer";

const adapterLayer = Layer.unwrap(
  Effect.gen(function* () {
    const baseUrl = yield* Config.URL("VITE_SITE_URL");
    const apiKey = yield* Config.option(
      Config.NonEmptyString("KRAKSTACK_TEMPLATE_API_KEY"),
    );

    return HttpApiAdapter.layer({
      api: Api,
      baseUrl: baseUrl.toString(),
      methods: ["get", "post", "put", "patch", "delete"],
    }).pipe(
      Layer.provide(
        authClientLayer(Option.getOrUndefined(apiKey)).pipe(
          Layer.provide(FetchHttpClient.layer),
        ),
      ),
    );
  }),
);

export const runCli = (args = process.argv.slice(2)) =>
  Effect.gen(function* () {
    const { run } = yield* makeHttpApiCli();
    yield* run(args);
  }).pipe(
    Effect.withSpan("cli.run"),
    Effect.provide(adapterLayer),
    Effect.provide(BunServices.layer),
    Effect.provide(Otlp.layer),
    BunRuntime.runMain,
  );

if (import.meta.main) runCli();
