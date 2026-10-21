import { useAtomValue } from "@effect/atom-react";
import {
  AuditLogTable,
  type AuditLogTableProps,
} from "@krak-stack/registry/events/client";
import type { EventQuery } from "@krak-stack/registry/events/schema";
import { AsyncResult } from "effect/reactivity";
import { m } from "@/paraglide/messages";
import { useOrganizationId } from "@/services/auth/client/organization";
import { auditLogAtom } from "./atom";

export const OrganizationAuditLog = ({
  state,
  onStateChange,
}: Pick<AuditLogTableProps, "onStateChange"> & {
  state: EventQuery;
}) => {
  const organizationId = useOrganizationId();
  const result = useAtomValue(auditLogAtom(organizationId)(state));
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
      messages={{
        en: { title: m.audit_history_title({}, { locale: "en" }) },
        fr: { title: m.audit_history_title({}, { locale: "fr" }) },
      }}
      entries={page?.data ?? []}
      rowCount={page?.meta.total ?? 0}
      state={state}
      onStateChange={onStateChange}
      events={Array.from(actionLabels, ([value, label]) => ({ value, label }))}
      {...status}
    />
  );
};
