import { createFileRoute, redirect, Outlet } from "@tanstack/react-router";
import { CheckSquare, History } from "lucide-react";
import { useAtomValue } from "@effect/atom-react";
import { AsyncResult } from "effect/reactivity";

import {
  OrganizationSwitcher,
  UserButton,
  useHasPermission,
} from "@krak-stack/auth/components";

import { SidebarLayout } from "@krak-stack/registry/sidebar-layout";
import { WorkspaceOrganization } from "@/services/auth/client/organization";
import { m } from "@/paraglide/messages";
import { getLocale } from "@/paraglide/runtime";
import {
  authCallbackUrl,
  getAuthSession,
  authLoginUrl,
  authSessionAtom,
} from "@/services/auth/client";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { ThemeSwitcher, useTheme } from "@/components/theme-switcher";

export const Route = createFileRoute("/admin")({
  ssr: false,
  beforeLoad: async ({ context }) => {
    const session = await getAuthSession(context.registry);

    if (!session) {
      throw redirect({
        href: authLoginUrl(authCallbackUrl("/admin"), getLocale()),
      });
    }

    return { session };
  },
  component: Admin,
});

function Admin() {
  const { setTheme, theme } = useTheme();
  const canReadAudit = useHasPermission("audit:read");
  const session = AsyncResult.match(useAtomValue(authSessionAtom), {
    onInitial: () => null,
    onFailure: () => null,
    onSuccess: ({ value }) => value,
  });
  const organizationId = session?.session.activeOrganizationId;

  return (
    <SidebarLayout
      sidebarHeader={<OrganizationSwitcher className="w-full" side="right" />}
      groups={[
        {
          label: m.admin_sidebar_workspace,
          items: [
            {
              label: m.admin_sidebar_tasks,
              href: "/admin",
              exact: true,
              icon: CheckSquare,
            },
            ...(canReadAudit
              ? [{ label: m.audit_title, href: "/admin/audit", icon: History }]
              : []),
          ],
        },
      ]}
      headerActions={
        <>
          <ThemeSwitcher value={theme} onChange={setTheme} />
          <LocaleSwitcher />
          <UserButton />
        </>
      }
    >
      {organizationId ? (
        <WorkspaceOrganization
          key={`${session.user.id}:${organizationId}`}
          value={organizationId}
        >
          <Outlet />
        </WorkspaceOrganization>
      ) : (
        <p className="text-muted-foreground p-6">
          {m.organization_select_required()}
        </p>
      )}
    </SidebarLayout>
  );
}
