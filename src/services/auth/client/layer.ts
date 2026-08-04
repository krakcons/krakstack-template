import { Context, Effect, Layer } from "effect";
import { HttpClient, HttpClientRequest } from "effect/unstable/http";

export const CurrentApiKey = Context.Reference<string | undefined>(
  "KrakStackTemplate/CurrentApiKey",
  { defaultValue: () => undefined },
);

export const authClientLayer = (defaultApiKey?: string) =>
  Layer.effect(
    HttpClient.HttpClient,
    Effect.map(HttpClient.HttpClient, (http) =>
      http.pipe(
        HttpClient.mapRequestEffect((request) =>
          Effect.map(CurrentApiKey, (currentApiKey) => {
            const apiKey = currentApiKey ?? defaultApiKey;

            return apiKey
              ? HttpClientRequest.setHeader(request, "x-api-key", apiKey)
              : request;
          }),
        ),
      ),
    ),
  );
