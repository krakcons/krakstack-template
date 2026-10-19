import { describe, expect, it } from "@effect/vitest";
import { CurrentActor, withPolicy } from "@krak-stack/auth/access";
import { Effect } from "effect";
import { Access } from "./access";
import { requireOrganization } from "./organization";

describe("organization authorization", () => {
  it.effect(
    "allows organization owners and admins, but not members or support, to read audit history",
    () =>
      Effect.gen(function* () {
        for (const role of ["owner", "admin", "member", "support"]) {
          const actor = Access.actorForUser({
            userId: "user-1",
            organizationId: "org-a",
            roles: [role],
          });
          const result = yield* requireOrganization("org-a").pipe(
            withPolicy(Access.permission("audit:read")),
            Effect.provideService(CurrentActor, actor),
            Effect.result,
          );
          expect(result._tag).toBe(
            role === "owner" || role === "admin" ? "Success" : "Failure",
          );
        }
      }),
  );

  it.effect(
    "checks current roles for user keys and never grants organization keys audit access",
    () =>
      Effect.gen(function* () {
        for (const role of ["owner", "admin", "member", "support"]) {
          const actor = Access.actorForApiKey({
            apiKeyId: "key",
            owner: {
              type: "user",
              userId: "user-1",
              organizationId: "org-a",
              roles: [role],
            },
            grant: Access.encodeGrant(["audit:read"]),
          });
          const result = yield* requireOrganization("org-a").pipe(
            withPolicy(Access.permission("audit:read")),
            Effect.provideService(CurrentActor, actor),
            Effect.result,
          );
          expect(result._tag).toBe(
            role === "owner" || role === "admin" ? "Success" : "Failure",
          );
        }
        const actor = Access.actorForApiKey({
          apiKeyId: "org-key",
          owner: { type: "organization", organizationId: "org-a" },
          grant: Access.encodeGrant(["audit:read"]),
        });
        expect(
          (yield* requireOrganization("org-a").pipe(
            withPolicy(Access.permission("audit:read")),
            Effect.provideService(CurrentActor, actor),
            Effect.result,
          ))._tag,
        ).toBe("Failure");
      }),
  );
  it.effect("permits only the verified active organization", () =>
    Effect.gen(function* () {
      expect(yield* requireOrganization("org-a")).toBe("org-a");
      expect((yield* Effect.exit(requireOrganization("org-b")))._tag).toBe(
        "Failure",
      );
    }).pipe(
      Effect.provideService(
        CurrentActor,
        Access.actorForUser({
          userId: "member",
          organizationId: "org-a",
          roles: ["member"],
        }),
      ),
    ),
  );

  it.effect("rejects missing organization and missing audit permission", () =>
    Effect.gen(function* () {
      const noOrganization = Access.actorForUser({
        userId: "member",
        organizationId: null,
        roles: ["member"],
      });
      expect(
        (yield* Effect.exit(
          requireOrganization("org-a").pipe(
            Effect.provideService(CurrentActor, noOrganization),
          ),
        ))._tag,
      ).toBe("Failure");
      const noPermission = Access.actorForUser({
        userId: "member",
        organizationId: "org-a",
        roles: [],
      });
      expect(
        (yield* Effect.exit(
          requireOrganization("org-a").pipe(
            withPolicy(Access.permission("audit:read")),
            Effect.provideService(CurrentActor, noPermission),
          ),
        ))._tag,
      ).toBe("Failure");
    }),
  );
});
