import { createFileRoute, redirect } from "@tanstack/react-router";
import { CheckSquare } from "lucide-react";

import { OrganizationSwitcher, UserButton } from "@krak-stack/auth";

import { TableSearchSchemaStandard as TableSearchSchema } from "@/components/ui/data-table";
import {
  SidebarLayout,
  SidebarPageHeader,
} from "@/components/ui/sidebar-layout";
import { TaskDialog } from "@/services/task/client/form";
import { TaskTable } from "@/services/task/client/table";
import { Button } from "@/components/ui/button";
import { m } from "@/paraglide/messages";
import { getLocale } from "@/paraglide/runtime";
import { authBaseUrl, authClient, authLoginUrl } from "@/services/auth/client";
import { LocaleSwitcher } from "@/components/ui/locale-switcher";
import { ThemeSwitcher } from "@/components/ui/theme-switcher";

export const Route = createFileRoute("/admin")({
  validateSearch: TableSearchSchema,
  ssr: false,
  beforeLoad: async () => {
    const session = await authClient.getSession();

    if (!session.data) {
      throw redirect({
        href: authLoginUrl(
          `${import.meta.env.VITE_SITE_URL}/admin`,
          getLocale(),
        ),
      });
    }

    return { session: session.data };
  },
  component: Admin,
});

function Admin() {
  return (
    <SidebarLayout
      sidebarHeader={
        <OrganizationSwitcher
          authClient={authClient}
          baseUrl={authBaseUrl}
          className="w-full group-data-[collapsible=icon]:hidden"
          side="right"
        />
      }
      groups={[
        {
          label: m.admin_sidebar_workspace,
          items: [
            { label: m.admin_sidebar_tasks, href: "/admin", icon: CheckSquare },
          ],
        },
      ]}
      headerActions={
        <>
          <ThemeSwitcher />
          <LocaleSwitcher />
          <UserButton
            apiKeyPermissions={{ projects: ["read"] }}
            authClient={authClient}
            baseUrl={authBaseUrl}
          />
        </>
      }
    >
      <SidebarPageHeader
        badge={{ label: m.admin_badge(), variant: "outline" }}
        title={m.admin_title()}
        description={m.admin_description()}
        actions={
          <TaskDialog
            trigger={<Button type="button">{m.tasks_create()}</Button>}
          />
        }
      />
      <TaskTable from="/admin" />
    </SidebarLayout>
  );
}
