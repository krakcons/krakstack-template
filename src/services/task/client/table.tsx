import { useState } from "react";
import { AsyncResult } from "effect/unstable/reactivity";
import { CheckCircle2, Circle, Pencil, RotateCcw, Trash2 } from "lucide-react";
import { useAtomSet } from "@effect/atom-react";

import {
  DataTable,
  type DataTableColDef,
  type DataTableProps,
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

import { TaskDialog } from "./form";
import {
  deleteTaskAtom,
  updateTaskAtom,
  useTasksAtom,
  type Task,
} from "./atom";

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);

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

  const columnDefs: DataTableColDef<Task>[] = [
    {
      field: "title",
      headerName: "Task",
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
      headerName: "Status",
      sortable: true,
      cellRenderer: ({ data }) => (
        <Badge variant={data.completed ? "default" : "secondary"}>
          {data.completed ? (
            <CheckCircle2 data-icon="inline-start" />
          ) : (
            <Circle data-icon="inline-start" />
          )}
          {data.completed ? "Done" : "Open"}
        </Badge>
      ),
    },
    {
      field: "updatedAt",
      headerName: "Updated",
      sortable: true,
      cellRenderer: ({ data }) => (
        <span className="text-muted-foreground text-sm">
          {formatDate(data.updatedAt)}
        </span>
      ),
    },
  ];

  const rowActions = [
    {
      name: "Edit",
      icon: <Pencil />,
      onClick: setEditingTask,
    },
    {
      name: "Complete",
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
      name: "Reopen",
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
      name: "Delete",
      icon: <Trash2 />,
      variant: "destructive" as const,
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

  return AsyncResult.match(tasksResult, {
    onInitial: () => (
      <div className="bg-card text-muted-foreground rounded-xl border p-6">
        Loading tasks...
      </div>
    ),
    onFailure: () => (
      <div className="bg-card text-destructive rounded-xl border p-6">
        Unable to load tasks.
      </div>
    ),
    onSuccess: () => {
      return (
        <>
          <DataTable
            columnDefs={columnDefs}
            rowData={tasks}
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
                <AlertDialogTitle>Delete task?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete{" "}
                  {deletingTask ? `"${deletingTask.title}"` : "this task"}.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  variant="destructive"
                  onClick={confirmDelete}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      );
    },
  });
}
