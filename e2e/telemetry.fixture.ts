import {
  BrowserEvents,
  type EventAttributes,
} from "@krak-stack/registry/events/browser";
import { Effect } from "effect";

// Imported through Vite so tests use the same exporter singleton as the app.
export const track = (name: string, attributes?: EventAttributes) =>
  Effect.runPromise(BrowserEvents.track(name, attributes));

export const flush = async (step: string) => {
  await track("app.e2e.flush", { "test.step": step });
  window.dispatchEvent(new Event("pagehide"));
};
