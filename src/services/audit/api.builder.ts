import { withPolicy } from "@krak-stack/auth/access";
import { Effect } from "effect";
import { HttpApiBuilder, HttpApiError } from "effect/http-api";
import { Api } from "@/api";
import { Access } from "@/services/auth/access";
import { requireOrganization } from "@/services/auth/organization";
import { Events } from "@krak-stack/registry/events";

export const auditHandler = HttpApiBuilder.group(Api, "audit", (handlers) =>
  handlers.handle("listAudit", ({ params, query }) =>
    Effect.gen(function* () {
      const organizationId = yield* requireOrganization(params.organizationId);
      const events = yield* Events;
      return yield* events
        .listAudit({ organizationId, ...query })
        .pipe(Effect.mapError(() => new HttpApiError.InternalServerError({})));
    }).pipe(withPolicy(Access.permission("audit:read"))),
  ),
);
