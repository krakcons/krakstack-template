import { Schema } from "effect";
import { EventLogRecord } from "@krak-stack/registry/events/schema";
import { PaginatedResponse } from "@krak-stack/registry/query";

export const OrganizationParams = Schema.Struct({
  organizationId: Schema.NonEmptyString,
}).annotate({ identifier: "OrganizationParams" });

export const AuditResponse = PaginatedResponse(EventLogRecord);
