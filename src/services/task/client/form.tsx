import { useAtomSet, useAtomSubscribe, useAtomValue } from "@effect/atom-react";
import { FormBuilder, FormReact } from "@lucas-barake/effect-form-react";
import { Schema } from "effect";
import { AsyncResult } from "effect/unstable/reactivity";
import { useState, type ReactElement } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  BlockNavigation,
  SubmitButton,
  SubmitError,
  TextAreaField,
  TextField,
} from "@krak-stack/registry/effect-form";
import { FieldGroup } from "@/components/ui/field";
import { m } from "@/paraglide/messages";

import { createTaskAtom, updateTaskAtom, type Task } from "./atom";

type Props = {
  task?: Task | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: ReactElement;
};

const TaskFormSchema = Schema.Struct({
  title: Schema.String.pipe(
    Schema.refine((value): value is string => value.trim().length > 0, {
      message: m.tasks_title_required(),
    }),
  ),
  description: Schema.String,
}).annotate({ identifier: "TaskForm" });

const taskFormBuilder = FormBuilder.empty
  .addField("title", TaskFormSchema.fields.title)
  .addField("description", TaskFormSchema.fields.description);

const makeTaskForm = (task?: Task | null) =>
  FormReact.make(taskFormBuilder, {
    fields: {
      title: TextField,
      description: TextAreaField,
    },
    mode: { validation: "onSubmit" },
    reactivityKeys: ["tasks"],
    onSubmit: (_, { decoded, get }) => {
      const title = decoded.title.trim();
      const description = decoded.description.trim();

      return task
        ? get.setResult(updateTaskAtom, {
            params: { id: task.id },
            payload: { title, description: description || null },
          })
        : get.setResult(createTaskAtom, {
            payload: { title, description: description || undefined },
          });
    },
  });

const TaskForm = ({
  task,
  onSuccess,
}: Pick<Props, "task"> & {
  onSuccess: () => void;
}) => {
  const [form] = useState(() => makeTaskForm(task));
  const submit = useAtomSet(form.submit);
  const submitResult = useAtomValue(form.submit);

  useAtomSubscribe(form.submit, (result) => {
    if (AsyncResult.isSuccess(result)) onSuccess();
  });

  const isEditing = Boolean(task);

  return (
    <form.Initialize
      defaultValues={{
        title: task?.title ?? "",
        description: task?.description ?? "",
      }}
    >
      <BlockNavigation form={form} />
      <form
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <DialogHeader>
          <DialogTitle>
            {isEditing ? m.tasks_edit_title() : m.tasks_create_title()}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? m.tasks_edit_description()
              : m.tasks_create_description()}
          </DialogDescription>
        </DialogHeader>

        <FieldGroup>
          <form.title
            label={m.tasks_title_label()}
            placeholder={m.tasks_title_placeholder()}
            autoFocus
          />
          <form.description
            label={m.tasks_description_label()}
            placeholder={m.tasks_description_placeholder()}
          />
        </FieldGroup>

        <SubmitError result={submitResult} />

        <DialogFooter>
          <button type="submit" className="sr-only">
            {isEditing ? m.tasks_save() : m.tasks_create()}
          </button>
          <DialogClose render={<Button type="button" variant="outline" />}>
            {m.tasks_cancel()}
          </DialogClose>
          <SubmitButton form={form}>
            {isEditing ? m.tasks_save() : m.tasks_create()}
          </SubmitButton>
        </DialogFooter>
      </form>
    </form.Initialize>
  );
};

export function TaskDialog({
  task,
  open: controlledOpen,
  onOpenChange,
  trigger,
}: Props) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;

  const handleOpenChange = (nextOpen: boolean) => {
    if (controlledOpen === undefined) setInternalOpen(nextOpen);
    onOpenChange?.(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {trigger ? <DialogTrigger render={trigger} /> : null}
      <DialogContent>
        <TaskForm
          key={`${task?.id ?? "create"}-${open ? "open" : "closed"}`}
          task={task}
          onSuccess={() => handleOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
