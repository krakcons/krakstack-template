import { FetchHttpClient } from "effect/unstable/http";
import { Atom, AtomHttpApi } from "effect/unstable/reactivity";

import { BrowserOtlp } from "@krak-stack/registry/opentelemetry/browser";
import { Api } from "../api";

const apiRuntime = Atom.context();

if (!import.meta.env.SSR) {
  apiRuntime.addGlobalLayer(
    BrowserOtlp.layer({ serviceName: "krakstack-template-web" }),
  );
}

export class ApiClient extends AtomHttpApi.Service<ApiClient>()("ApiClient", {
  api: Api,
  httpClient: FetchHttpClient.layer,
  baseUrl: import.meta.env.VITE_SITE_URL,
  runtime: apiRuntime,
}) {}
