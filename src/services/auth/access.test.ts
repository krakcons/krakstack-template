import { describe, expect, it } from "@effect/vitest";
import { CurrentActor, Forbidden } from "@krak-stack/auth/access";
import { Effect, Layer } from "effect";

import { Access } from "@/services/auth/access";

describe("template access", () => {
  it("gives signed-in members task permissions", () => {
    const actor = Access.actorForUser({
      userId: "user-1",
      organizationId: "org-1",
      roles: ["member"],
    });

    expect(actor.permissions.has("krakstack-template:tasks:read")).toBe(true);
    expect(actor.permissions.has("krakstack-template:tasks:update")).toBe(true);
  });

  it("restricts user keys to their explicit grants", () => {
    const actor = Access.actorForApiKey({
      apiKeyId: "key-1",
      owner: {
        type: "user",
        userId: "user-1",
        organizationId: "org-1",
        roles: ["member"],
      },
      grant: { "krakstack-template": ["tasks:read"] },
    });

    expect(actor.permissions.has("krakstack-template:tasks:read")).toBe(true);
    expect(actor.permissions.has("krakstack-template:tasks:update")).toBe(
      false,
    );
  });

  it.effect("denies a policy not present in the current actor", () => {
    const actor = Access.actorForApiKey({
      apiKeyId: "key-1",
      owner: {
        type: "user",
        userId: "user-1",
        organizationId: "org-1",
        roles: ["member"],
      },
      grant: { "krakstack-template": ["tasks:read"] },
    });

    return Effect.gen(function* () {
      const denied = yield* Access.permission("tasks:update").pipe(Effect.flip);
      expect(denied).toBeInstanceOf(Forbidden);
    }).pipe(Effect.provide(Layer.succeed(CurrentActor, actor)));
  });
});
