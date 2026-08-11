import { createFileRoute, redirect } from "@tanstack/react-router";
import { CheckSquare } from "lucide-react";

import { OrganizationSwitcher, UserButton } from "@krak-stack/auth";

import { TableSearchSchemaStandard as TableSearchSchema } from "@krak-stack/registry/data-table";
import {
  SidebarLayout,
  SidebarPageHeader,
} from "@krak-stack/registry/sidebar-layout";
import { TaskDialog } from "@/services/task/client/form";
import { TaskTable } from "@/services/task/client/table";
import { Button } from "@/components/ui/button";
import { m } from "@/paraglide/messages";
import { getLocale } from "@/paraglide/runtime";
import {
  authCallbackUrl,
  authClient,
  authLoginUrl,
} from "@/services/auth/client";
import { LocaleSwitcher } from "@krak-stack/registry/locale-switcher";
import { ThemeSwitcher, useTheme } from "@krak-stack/registry/theme-switcher";

export const Route = createFileRoute("/admin")({
  validateSearch: TableSearchSchema,
  ssr: false,
  beforeLoad: async () => {
    const session = await authClient.getSession();

    if (!session.data) {
      throw redirect({
        href: authLoginUrl(authCallbackUrl("/admin"), getLocale()),
      });
    }

    return { session: session.data };
  },
  component: Admin,
});

function Admin() {
  const { setTheme, theme } = useTheme();

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
              icon: CheckSquare,
            },
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
