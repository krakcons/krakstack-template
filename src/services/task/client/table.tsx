import { useState } from "react";
import { AsyncResult } from "effect/unstable/reactivity";
import { CheckCircle2, Circle, Pencil, RotateCcw, Trash2 } from "lucide-react";
import { useAtomSet } from "@effect/atom-react";

import {
  DataTable,
  type DataTableColDef,
  type DataTableProps,
  type DataTableRowAction,
} from "@krak-stack/registry/data-table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { m } from "@/paraglide/messages";

import { TaskDialog } from "./form";
import {
  deleteTaskAtom,
  updateTaskAtom,
  useTasksAtom,
  type Task,
} from "./atom";

type TaskTableProps = Pick<DataTableProps<Task>, "onStateChange" | "state">;

export function TaskTable({ onStateChange, state }: TaskTableProps) {
  const tasksResult = useTasksAtom();
  const updateTask = useAtomSet(updateTaskAtom);
  const deleteTask = useAtomSet(deleteTaskAtom);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);
  const tasks = AsyncResult.match(tasksResult, {
    onInitial: () => [],
    onFailure: () => [],
    onSuccess: ({ value }) => Array.from(value),
  });
  const status = AsyncResult.match(tasksResult, {
    onInitial: () => ({ loading: true }),
    onFailure: () => ({ error: m.tasks_load_error() }),
    onSuccess: () => ({}),
  });

  const columnDefs: DataTableColDef<Task>[] = [
    {
      field: "title",
      headerName: m.tasks_table_task(),
      searchable: true,
      sortable: true,
      cellRenderer: ({ data }) => (
        <div className="flex min-w-52 flex-col gap-1">
          <span className="font-medium">{data.title}</span>
          {data.description ? (
            <span className="text-muted-foreground line-clamp-2 text-sm">
              {data.description}
            </span>
          ) : null}
        </div>
      ),
    },
    {
      field: "completed",
      headerName: m.tasks_table_status(),
      sortable: true,
      cellRenderer: ({ data }) => (
        <Badge variant={data.completed ? "default" : "secondary"}>
          {data.completed ? (
            <CheckCircle2 data-icon="inline-start" />
          ) : (
            <Circle data-icon="inline-start" />
          )}
          {data.completed ? m.tasks_status_done() : m.tasks_status_open()}
        </Badge>
      ),
    },
    {
      field: "updatedAt",
      headerName: m.tasks_table_updated(),
      sortable: true,
      type: "dateTime",
    },
  ];

  const rowActions: DataTableRowAction<Task>[] = [
    {
      name: m.tasks_action_edit(),
      icon: <Pencil />,
      onClick: setEditingTask,
    },
    {
      name: m.tasks_action_complete(),
      icon: <CheckCircle2 />,
      visible: (task: Task) => !task.completed,
      onClick: (task: Task) => {
        updateTask({
          params: { id: task.id },
          payload: { completed: true },
          reactivityKeys: ["tasks"],
        });
      },
    },
    {
      name: m.tasks_action_reopen(),
      icon: <RotateCcw />,
      visible: (task: Task) => task.completed,
      onClick: (task: Task) => {
        updateTask({
          params: { id: task.id },
          payload: { completed: false },
          reactivityKeys: ["tasks"],
        });
      },
    },
    {
      name: m.tasks_action_delete(),
      icon: <Trash2 />,
      variant: "destructive",
      onClick: setDeletingTask,
    },
  ];

  const confirmDelete = () => {
    if (!deletingTask) return;

    deleteTask({
      params: { id: deletingTask.id },
      reactivityKeys: ["tasks"],
    });
    setDeletingTask(null);
  };

  return (
    <>
      <DataTable
        columnDefs={columnDefs}
        rowData={tasks}
        getRowId={(task) => task.id}
        status={status}
        features={{
          export: { baseName: "tasks" },
          gallery: false,
          rowActions: { items: rowActions },
        }}
        onRowClicked={setEditingTask}
        onStateChange={onStateChange}
        state={state}
      />

      {editingTask ? (
        <TaskDialog
          task={editingTask}
          open
          onOpenChange={(open) => {
            if (!open) setEditingTask(null);
          }}
        />
      ) : null}

      <AlertDialog
        open={Boolean(deletingTask)}
        onOpenChange={(open) => !open && setDeletingTask(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{m.tasks_delete_title()}</AlertDialogTitle>
            <AlertDialogDescription>
              {deletingTask
                ? m.tasks_delete_description({ title: deletingTask.title })
                : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{m.tasks_cancel()}</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={confirmDelete}>
              {m.tasks_action_delete()}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
