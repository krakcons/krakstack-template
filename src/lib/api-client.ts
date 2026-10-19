import { FetchHttpClient } from "effect/http";
import { Atom, AtomHttpApi } from "effect/reactivity";

import { BrowserEvents } from "@krak-stack/registry/events/browser";
import { BrowserOtlp } from "@krak-stack/registry/opentelemetry/browser";
import { BrowserWebVitals } from "@krak-stack/registry/opentelemetry/web-vitals";
import { Layer } from "effect";
import { getLocale } from "@/paraglide/runtime";
import { Api } from "../api";

const apiRuntime = Atom.context();

if (!import.meta.env.SSR) {
  apiRuntime.addGlobalLayer(
    Layer.mergeAll(
      BrowserEvents.layer({
        locale: getLocale,
        sanitizePath: (path) => path.replace(/(\/tasks)\/[^/]+/g, "$1/$taskId"),
      }),
      BrowserWebVitals.layer(),
    ).pipe(
      Layer.provideMerge(
        BrowserOtlp.layer({
          serviceName: import.meta.env.DEV
            ? "krakstack-template-web-local"
            : "krakstack-template-web",
        }),
      ),
    ),
  );
}

export class ApiClient extends AtomHttpApi.Service<ApiClient>()("ApiClient", {
  api: Api,
  httpClient: FetchHttpClient.layer,
  baseUrl: import.meta.env.VITE_SITE_URL,
  runtime: apiRuntime,
}) {}
