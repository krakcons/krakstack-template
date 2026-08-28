import { createFileRoute, redirect } from "@tanstack/react-router";
import { CheckSquare } from "lucide-react";

import { OrganizationSwitcher, UserButton } from "@krak-stack/auth/components";

import { QueryStandard as TableSearchSchema } from "@krak-stack/registry/query";
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
  getAuthSession,
  authLoginUrl,
} from "@/services/auth/client";
import { LocaleSwitcher } from "@krak-stack/registry/locale-switcher";
import { ThemeSwitcher, useTheme } from "@krak-stack/registry/theme-switcher";

export const Route = createFileRoute("/admin")({
  validateSearch: TableSearchSchema,
  ssr: false,
  beforeLoad: async () => {
    const session = await getAuthSession();

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
  const navigate = Route.useNavigate();
  const search = Route.useSearch();

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
      <TaskTable
        state={search}
        onStateChange={(state) => {
          void navigate({ replace: true, search: state });
        }}
      />
    </SidebarLayout>
  );
}
