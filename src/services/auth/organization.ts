import { CurrentActor, Forbidden } from "@krak-stack/auth/access";
import { Effect } from "effect";

// The URL scopes caches; only the verified active organization authorizes access.
export const requireOrganization = Effect.fn("requireOrganization")(function* (
  organizationId: string,
) {
  const actor = yield* CurrentActor;
  if (actor.organizationId !== organizationId) return yield* new Forbidden({});
  return organizationId;
});
