import { ActorRequired, Forbidden } from "@krak-stack/auth/server";
import {
  HttpApiEndpoint,
  HttpApiError,
  HttpApiGroup,
  OpenApi,
} from "effect/http-api";
import { AuditResponse, OrganizationParams } from "./schema";
import { Query } from "@krak-stack/registry/query";

export const AuditApiGroup = HttpApiGroup.make("audit")
  .add(
    HttpApiEndpoint.get("listAudit", "/organizations/:organizationId/audit", {
      params: OrganizationParams,
      query: Query,
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
