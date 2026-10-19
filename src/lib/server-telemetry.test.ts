import { describe, expect, it } from "@effect/vitest";
import { Otlp } from "@krak-stack/registry/opentelemetry";
import { ConfigProvider, Effect } from "effect";
import { FetchHttpClient } from "effect/http";

describe("server telemetry tarball integration", () => {
  it.effect("flushes queued server events when the runtime is disposed", () => {
    const requests: { url: string; body: string }[] = [];
    const fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const request = new Request(input, init);
      requests.push({ url: request.url, body: await request.text() });
      return new Response(null, { status: 200 });
    };

    return Effect.gen(function* () {
      yield* Otlp.event("app.telemetry.checked", {
        "check.source": "test",
      }).pipe(
        Effect.annotateLogs({
          "user.id": "user-1",
          "organization.id": "org-1",
        }),
        Effect.provide(Otlp.layer),
        Effect.provideService(FetchHttpClient.Fetch, fetch),
        Effect.provide(
          ConfigProvider.layer(
            ConfigProvider.fromUnknown({
              OTEL_SERVICE_NAME: "krakstack-template-api",
              OTEL_EXPORTER_OTLP_ENDPOINT: "http://collector.example.test:4318",
              OTEL_LOGS_EXPORTER: "otlp",
              OTEL_TRACES_EXPORTER: "none",
              OTEL_METRICS_EXPORTER: "none",
            }),
          ),
        ),
      );

      const events = requests.find((request) =>
        request.body.includes("app.telemetry.checked"),
      );
      expect(events?.url).toBe("http://collector.example.test:4318/v1/logs");
      expect(events?.body).toContain("krakstack-template-api");
      expect(events?.body).toContain('"key":"user.id"');
      expect(events?.body).toContain('"stringValue":"user-1"');
      expect(events?.body).toContain('"key":"organization.id"');
      expect(events?.body).toContain('"stringValue":"org-1"');
    });
  });
});
