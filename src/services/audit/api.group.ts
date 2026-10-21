import { ActorRequired, Forbidden } from "@krak-stack/auth/server";
import {
  HttpApiEndpoint,
  HttpApiError,
  HttpApiGroup,
  OpenApi,
} from "effect/http-api";
import { AuditResponse, OrganizationParams } from "./schema";
import { EventQuery } from "@krak-stack/registry/events/schema";

export const AuditApiGroup = HttpApiGroup.make("audit")
  .add(
    HttpApiEndpoint.get("listAudit", "/organizations/:organizationId/audit", {
      params: OrganizationParams,
      query: EventQuery,
      success: AuditResponse,
      error: [
        HttpApiError.Unauthorized,
        Forbidden,
        HttpApiError.InternalServerError,
      ],
    }).annotateMerge(
      OpenApi.annotations({
        summary:
          "Query paginated audit events across all records in the active organization",
      }),
    ),
  )
  .middleware(ActorRequired());
