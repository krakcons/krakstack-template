import { createFileRoute } from "@tanstack/react-router";
import { QueryStandard } from "@krak-stack/registry/query";
import { SidebarPageHeader } from "@krak-stack/registry/sidebar-layout";
import { TaskDialog } from "@/services/task/client/form";
import { TaskTable } from "@/services/task/client/table";
import { Button } from "@/components/ui/button";
import { m } from "@/paraglide/messages";

const TasksPage = () => {
  const navigate = Route.useNavigate();
  const search = Route.useSearch();
  return (
    <>
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
    </>
  );
};

export const Route = createFileRoute("/admin/")({
  validateSearch: QueryStandard,
  component: TasksPage,
});
