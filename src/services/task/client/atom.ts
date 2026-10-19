import { useAtomValue } from "@effect/atom-react";
import { AsyncResult, Atom } from "effect/reactivity";

import { ApiClient } from "@/lib/api-client";
import { useOrganizationId } from "@/services/auth/client/organization";
import {
  CreateTaskSchema,
  TaskSchema,
  UpdateTaskSchema,
} from "@/services/task/schema";

export type Task = typeof TaskSchema.Type;
export type CreateTaskPayload = typeof CreateTaskSchema.Type;
export type UpdateTaskPayload = typeof UpdateTaskSchema.Type;

const serverTasksAtom = Atom.family((organizationId: string) =>
  ApiClient.query("tasks", "listTasks", {
    params: { organizationId },
    timeToLive: "5 minutes",
    reactivityKeys: [`tasks:${organizationId}`],
  }),
);

const current = (r: AsyncResult.AsyncResult<ReadonlyArray<Task>, unknown>) =>
  AsyncResult.match(r, {
    onInitial: () => [],
    onFailure: () => [],
    onSuccess: ({ value }) => Array.from(value),
  });

const optimisticTask = (p: CreateTaskPayload, organizationId: string): Task => {
  const now = new Date();
  return {
    id: `optimistic-${crypto.randomUUID()}`,
    userId: "optimistic",
    organizationId,
    title: p.title,
    description: p.description ?? null,
    completed: false,
    createdAt: now,
    updatedAt: now,
  };
};

export const allTasksAtom = Atom.family((organizationId: string) =>
  Atom.optimistic(serverTasksAtom(organizationId)),
);

export const createTaskAtom = Atom.family((organizationId: string) =>
  Atom.optimisticFn(allTasksAtom(organizationId), {
    reducer: (c, a: { payload: CreateTaskPayload }) =>
      AsyncResult.success([
        optimisticTask(a.payload, organizationId),
        ...current(c),
      ]),
    fn: Atom.fn((input: { payload: CreateTaskPayload }, get) =>
      get.setResult(ApiClient.mutation("tasks", "createTask"), {
        ...input,
        params: { organizationId },
        reactivityKeys: [`tasks:${organizationId}`, `audit:${organizationId}`],
      }),
    ),
  }),
);

export const updateTaskAtom = Atom.family((organizationId: string) =>
  Atom.optimisticFn(allTasksAtom(organizationId), {
    reducer: (c, a: { params: { id: string }; payload: UpdateTaskPayload }) =>
      AsyncResult.success(
        current(c).map((task) =>
          task.id === a.params.id
            ? {
                ...task,
                title: a.payload.title ?? task.title,
                description:
                  a.payload.description !== undefined
                    ? a.payload.description
                    : task.description,
                completed: a.payload.completed ?? task.completed,
                updatedAt: new Date(),
              }
            : task,
        ),
      ),
    fn: Atom.fn(
      (input: { params: { id: string }; payload: UpdateTaskPayload }, get) =>
        get.setResult(ApiClient.mutation("tasks", "updateTask"), {
          ...input,
          params: { ...input.params, organizationId },
          reactivityKeys: [
            `tasks:${organizationId}`,
            `audit:${organizationId}`,
          ],
        }),
    ),
  }),
);

export const deleteTaskAtom = Atom.family((organizationId: string) =>
  Atom.optimisticFn(allTasksAtom(organizationId), {
    reducer: (c, a: { params: { id: string } }) =>
      AsyncResult.success(current(c).filter((x) => x.id !== a.params.id)),
    fn: Atom.fn((input: { params: { id: string } }, get) =>
      get.setResult(ApiClient.mutation("tasks", "deleteTask"), {
        ...input,
        params: { ...input.params, organizationId },
        reactivityKeys: [`tasks:${organizationId}`, `audit:${organizationId}`],
      }),
    ),
  }),
);

export const useTasksAtom = () =>
  useAtomValue(allTasksAtom(useOrganizationId()));
