import { useAtomValue } from "@effect/atom-react";
import {
  activeAuthOrganizationAtom,
  assetUrl,
  useKrakstackAuth,
} from "@krak-stack/auth/components";
import {
  AuditLogTable,
  type AuditActor,
} from "@krak-stack/registry/events/client";
import type { QueryType } from "@krak-stack/registry/query";
import type { DataTableProps } from "@krak-stack/registry/data-table";
import type { EventLogRecord } from "@krak-stack/registry/events/schema";
import { AsyncResult } from "effect/reactivity";
import { m } from "@/paraglide/messages";
import { useOrganizationId } from "@/services/auth/client/organization";
import { auditLogAtom } from "./atom";
import { krakstackAuthUrl } from "@/services/auth/client";

export const OrganizationAuditLog = ({
  state,
  onStateChange,
}: Pick<DataTableProps<EventLogRecord>, "onStateChange"> & {
  state: QueryType;
}) => {
  const organizationId = useOrganizationId();
  const auth = useKrakstackAuth();
  const organization = AsyncResult.getOrElse(
    useAtomValue(activeAuthOrganizationAtom(auth?.baseUrl)(organizationId)),
    () => null,
  );
  const result = useAtomValue(auditLogAtom(organizationId)(state));
  const actors: AuditActor[] = organization
    ? [
        {
          type: "organization",
          id: organization.id,
          label: organization.name,
          description: organization.id,
          imageSrc: assetUrl(organization.logo, krakstackAuthUrl),
        },
        ...organization.members.map((member): AuditActor => ({
          type: "user",
          id: member.userId,
          label: member.user.name,
          description: member.user.email,
          imageSrc: assetUrl(member.user.image, krakstackAuthUrl),
        })),
      ]
    : [];
  const page = AsyncResult.match(result, {
    onInitial: () => undefined,
    onFailure: () => undefined,
    onSuccess: ({ value }) => value,
  });
  const status = AsyncResult.match(result, {
    onInitial: () => ({ loading: true }),
    onFailure: () => ({ error: m.audit_load_error() }),
    onSuccess: () => ({}),
  });
  const actionLabels = new Map([
    ["task.created", m.audit_created()],
    ["task.updated", m.audit_updated()],
    ["task.completed", m.audit_completed()],
    ["task.reopened", m.audit_reopened()],
    ["task.deleted", m.audit_deleted()],
  ]);
  return (
    <AuditLogTable
      entries={page?.data ?? []}
      rowCount={page?.meta.total ?? 0}
      state={state}
      onStateChange={onStateChange}
      actors={actors}
      renderAction={(entry) =>
        actionLabels.get(entry.eventName) ?? entry.eventName
      }
      {...status}
    />
  );
};
