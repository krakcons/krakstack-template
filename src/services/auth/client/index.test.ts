import { describe, expect, it } from "@effect/vitest";
import { Cause } from "effect";
import { AsyncResult, AtomRegistry } from "effect/reactivity";
import { vi } from "vitest";

import { authSessionAtom, getAuthSession } from "./index";

describe("route session queries", () => {
  it("reuses the provider registry for concurrent and repeated guard reads", async () => {
    const registry = AtomRegistry.make({
      defaultIdleTTL: 400,
    });
    const fetch = vi.spyOn(globalThis, "fetch").mockImplementation(
      async () =>
        new Response("null", {
          headers: { "content-type": "application/json" },
        }),
    );
    try {
      expect(
        await Promise.all([getAuthSession(registry), getAuthSession(registry)]),
      ).toEqual([null, null]);
      expect(await getAuthSession(registry)).toBeNull();
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(registry.get(authSessionAtom)).toMatchObject({
        _tag: "Success",
        value: null,
      });
    } finally {
      registry.dispose();
      fetch.mockRestore();
    }
  });

  it("propagates session failures rather than treating them as signed-out", async () => {
    const registry = AtomRegistry.make({
      initialValues: [
        [
          authSessionAtom,
          AsyncResult.failure(Cause.die(new Error("session unavailable"))),
        ],
      ],
    });
    try {
      await expect(getAuthSession(registry)).rejects.toThrow(
        "session unavailable",
      );
    } finally {
      registry.dispose();
    }
  });
});
