import { Atom } from "effect/reactivity";
import { ApiClient } from "@/lib/api-client";
import type { QueryType } from "@krak-stack/registry/query";

export const auditLogAtom = Atom.family((organizationId: string) =>
  Atom.family((query: QueryType) =>
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
