import { Atom } from "effect/reactivity";
import { ApiClient } from "@/lib/api-client";
import type { EventQuery } from "@krak-stack/registry/events/schema";

export const auditLogAtom = Atom.family((organizationId: string) =>
  Atom.family((query: EventQuery) =>
    Atom.optimistic(
      ApiClient.query("audit", "listAudit", {
        params: { organizationId },
        query,
        timeToLive: "5 minutes",
        reactivityKeys: [`audit:${organizationId}`],
      }),
    ),
  ),
);
