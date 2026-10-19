import { Events } from "@krak-stack/registry/events";
import { Config, Effect, Layer } from "effect";

export const eventsLayer = Layer.unwrap(
  Effect.gen(function* () {
    const origin = yield* Config.URL("VITE_SITE_URL");
    const secret = yield* Config.Redacted("EVENTS_SECRET");

    return Events.layer({
      origin: origin.origin,
      secret,
      geolocation: "cloudflare",
    });
  }),
);
