import { createFileRoute, redirect, Navigate } from "@tanstack/react-router";
import {
  activeAuthOrganizationAtom,
  usePermissions,
} from "@krak-stack/auth/components";
import { EventQueryStandard } from "@krak-stack/registry/events/schema";
import { Effect } from "effect";
import { AtomRegistry } from "effect/reactivity";
import { SidebarPageHeader } from "@krak-stack/registry/sidebar-layout";
import { OrganizationAuditLog } from "@/services/audit/client/table";
import { m } from "@/paraglide/messages";
import { Access } from "@/services/auth/access";

const AuditPage = () => {
  const permissions = usePermissions();
  const state = Route.useSearch();
  const navigate = Route.useNavigate();
  if (permissions.loading) return null;
  if (!permissions.can("audit:read")) return <Navigate to="/admin" />;
  return (
    <>
      <SidebarPageHeader
        title={m.audit_history_title()}
        description={m.audit_description()}
      />
      <OrganizationAuditLog
        state={state}
        onStateChange={(search) => {
          void navigate({ replace: true, search });
        }}
      />
    </>
  );
};
export const Route = createFileRoute("/admin/audit")({
  validateSearch: EventQueryStandard,
  beforeLoad: async ({ context }) => {
    const organizationId = context.session.session.activeOrganizationId;
    if (!organizationId) throw redirect({ to: "/admin" });
    const organization = await Effect.runPromise(
      AtomRegistry.getResult(
        context.registry,
        activeAuthOrganizationAtom(undefined)(organizationId),
      ),
    );
    const member = organization?.members.find(
      (member) => member.userId === context.session.user.id,
    );
    if (
      !Access.permissionsForRoles(member?.role).has(
        Access.qualify("audit:read"),
      )
    )
      throw redirect({ to: "/admin" });
  },
  component: AuditPage,
});
