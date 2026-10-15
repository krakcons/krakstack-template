import {
  BrowserOtlp,
  type BrowserIdentity,
  type EventAttributes,
} from "@krak-stack/registry/opentelemetry/browser";
import { Effect } from "effect";

// Imported through Vite so tests use the same exporter singleton as the app.
export const identify = (identity: BrowserIdentity | null) =>
  Effect.runPromise(BrowserOtlp.identify(identity));

export const track = (name: string, attributes?: EventAttributes) =>
  Effect.runPromise(BrowserOtlp.track(name, attributes));

export const flush = async (step: string) => {
  await track("app.e2e.flush", { "test.step": step });
  window.dispatchEvent(new Event("pagehide"));
};
