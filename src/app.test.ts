import { afterEach, describe, expect, it } from "bun:test";
import { AuthMiddleware, AuthService } from "@krak-stack/auth/server";
import { Effect, Layer, PubSub, Stream } from "effect";

import { makeWebHandler } from "@/app";
import {
  Tasks,
  type TasksService,
  type Task,
} from "@/services/task";

const makeTasks = () => {
  const tasks: Task[] = [];
  const taskChanges = Effect.runSync(PubSub.unbounded<string>());
  const service: TasksService = {
    changes: ({ userId }) =>
      Stream.fromPubSub(taskChanges).pipe(
        Stream.filter((changedUserId) => changedUserId === userId),
        Stream.map(() => undefined),
      ),
    list: ({ userId }) =>
      Effect.succeed(tasks.filter((task) => task.userId === userId)),
    create: ({ userId, payload }) => Effect.sync(() => {
      const now = new Date("2026-08-26T00:00:00.000Z");
      const task: Task = {
        id: crypto.randomUUID(),
        userId,
        title: payload.title,
        description: payload.description ?? null,
        completed: false,
        createdAt: now,
        updatedAt: now,
      };
      tasks.push(task);
      Effect.runSync(PubSub.publish(taskChanges, userId));
      return task;
    }),
    update: ({ userId, id, payload }) => Effect.sync(() => {
      const index = tasks.findIndex(
        (task) => task.id === id && task.userId === userId,
      );
      const task = tasks[index];
      if (!task) return undefined;
      const updated = {
        ...task,
        title: payload.title,
        description: payload.description ?? null,
      };
      tasks[index] = updated;
      Effect.runSync(PubSub.publish(taskChanges, userId));
      return updated;
    }),
    toggle: ({ userId, id }) => Effect.sync(() => {
      const index = tasks.findIndex(
        (task) => task.id === id && task.userId === userId,
      );
      const task = tasks[index];
      if (!task) return undefined;
      const updated = { ...task, completed: !task.completed };
      tasks[index] = updated;
      Effect.runSync(PubSub.publish(taskChanges, userId));
      return updated;
    }),
    delete: ({ userId, id }) => Effect.sync(() => {
      const index = tasks.findIndex(
        (task) => task.id === id && task.userId === userId,
      );
      if (index < 0) return undefined;
      const deleted = tasks.splice(index, 1)[0];
      Effect.runSync(PubSub.publish(taskChanges, userId));
      return deleted;
    }),
  };
  return { layer: Tasks.testLayer(service), service };
};

const makeAuthLayer = (authenticated = true) => {
  const now = new Date("2026-08-26T00:00:00.000Z");
  const user = {
    id: "demo",
    name: "Ada Lovelace",
    email: "ada@example.com",
    image: null,
    emailVerified: true,
    role: null,
    banned: null,
    createdAt: now,
    updatedAt: now,
  };
  const session = {
    id: "session-1",
    token: "token",
    userId: user.id,
    activeOrganizationId: "org-1",
    createdAt: now,
    updatedAt: now,
    expiresAt: new Date("2027-08-26T00:00:00.000Z"),
  };
  const value = {
    session,
    user,
    isSuperAdminImpersonation: false as const,
    authMethod: { type: "cookie" as const },
  };
  const authService = {
    getSession: () => Effect.succeed(authenticated ? value : null),
    requireUser: () =>
      authenticated ? Effect.succeed(value) : Effect.die("Unauthorized"),
    organizations: {
      listOrganizations: () =>
        Effect.succeed({
          data: [
            {
              id: "org-1",
              name: "Analytical Engine",
              slug: "analytical-engine",
            },
          ],
        }),
    },
    authExtra: {
      createApiKey: () => Effect.succeed({ id: "key-1", key: "secret-key" }),
    },
  } as unknown as typeof AuthService.Service;
  return Layer.succeed(AuthMiddleware, {
    apiKey: (effect) => effect.pipe(Effect.provideService(AuthService, authService)),
  });
};

const disposers: Array<() => Promise<void>> = [];
const makeHandler = (tasks = makeTasks(), authenticated = true) => {
  const webHandler = makeWebHandler(tasks.layer, makeAuthLayer(authenticated));
  disposers.push(webHandler.dispose);
  return webHandler.handler;
};

afterEach(async () => {
  await Promise.all(disposers.splice(0).map((dispose) => dispose()));
});

describe("Datastar task application", () => {
  it("renders English and French pages", async () => {
    const handler = makeHandler();
    const english = await handler(new Request("http://localhost/en"));
    const french = await handler(new Request("http://localhost/fr"));

    expect(await english.text()).toContain("A quieter full-stack application");
    expect(await french.text()).toContain("Une application complète plus sereine");
  });

  it("creates escaped tasks through an SSE patch", async () => {
    const form = new FormData();
    form.set("title", "Escape <script>");

    const response = await makeHandler()(
      new Request("http://localhost/en/admin/tasks", {
        method: "POST",
        body: form,
        headers: { "Datastar-Request": "true" },
      }),
    );
    const body = await response.text();

    expect(response.headers.get("content-type")).toBe("text/event-stream");
    expect(body).toContain("event: datastar-patch-elements");
    expect(body).toContain("data: mode replace");
    expect(body).toContain('id="task-create-dialog"');
    expect(body).toContain("Escape &lt;script&gt;");
    expect(body).not.toContain("Escape <script>");
  });

  it("toggles and deletes tasks", async () => {
    const tasks = makeTasks();
    const created = await Effect.runPromise(
      tasks.service.create({ userId: "demo", payload: { title: "Ship it" } }),
    );
    const handler = makeHandler(tasks);

    const toggled = await handler(
      new Request(`http://localhost/en/admin/tasks/${created.id}/toggle`, {
        method: "PATCH",
        headers: { "Datastar-Request": "true" },
      }),
    );
    expect(await toggled.text()).toContain("Done");

    const deleted = await handler(
      new Request(`http://localhost/en/admin/tasks/${created.id}`, {
        method: "DELETE",
        headers: { "Datastar-Request": "true" },
      }),
    );
    const body = await deleted.text();
    expect(body).toContain("No tasks yet.");
    expect(body).not.toContain("Ship it");
  });

  it("returns localized validation feedback", async () => {
    const form = new FormData();
    form.set("title", "   ");

    const response = await makeHandler()(
      new Request("http://localhost/fr/admin/tasks", {
        method: "POST",
        body: form,
        headers: { "Datastar-Request": "true" },
      }),
    );

    expect(await response.text()).toContain("Le titre est obligatoire");
  });

  it("protects the admin portal", async () => {
    const response = await makeHandler(makeTasks(), false)(
      new Request("http://localhost/en/admin"),
    );

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("/en/sign-in");
  });

  it("renders the authenticated account portal", async () => {
    const response = await makeHandler()(
      new Request("http://localhost/en/admin/account"),
    );
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(body).toContain("Ada Lovelace");
    expect(body).toContain("ada@example.com");
    expect(body).toContain("Profile image URL");
    expect(body).toContain("Analytical Engine");
    expect(body).toContain('class="dropdown switcher theme-switcher"');
    expect(body).toContain('class="dropdown switcher locale-switcher"');
    expect(body).toContain('class="dropdown user-button"');
    expect(body).toContain('data-on:click__outside="el.removeAttribute(\'open\')"');
  });

  it("persists theme signals in a cookie", async () => {
    const response = await makeHandler()(
      new Request("http://localhost/en/theme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme: "dark" }),
      }),
    );

    expect(await response.json()).toEqual({ theme: "dark" });
    expect(response.headers.get("set-cookie")).toContain("theme=dark");
  });

  it("decodes form-urlencoded task payloads", async () => {
    const response = await makeHandler()(
      new Request("http://localhost/en/admin/tasks", {
        method: "POST",
        body: new URLSearchParams({ title: "Encoded task" }),
        headers: { "Datastar-Request": "true" },
      }),
    );

    expect(response.status).toBe(200);
    expect(await response.text()).toContain("Encoded task");
  });

  it("streams repeated task changes to every tab", async () => {
    const handler = makeHandler();
    const firstStreamResponse = await handler(
      new Request("http://localhost/en/admin/tasks/stream"),
    );
    const secondStreamResponse = await handler(
      new Request("http://localhost/en/admin/tasks/stream"),
    );
    const firstReader = firstStreamResponse.body?.getReader();
    const secondReader = secondStreamResponse.body?.getReader();
    expect(firstReader).toBeDefined();
    expect(secondReader).toBeDefined();
    if (!firstReader || !secondReader) {
      throw new Error("Task stream body is missing");
    }

    const firstTabFirstPatch = firstReader.read();
    const secondTabFirstPatch = secondReader.read();
    await handler(
      new Request("http://localhost/en/admin/tasks", {
        method: "POST",
        body: new URLSearchParams({ title: "First tab task" }),
        headers: { "Datastar-Request": "true" },
      }),
    );
    const [firstPatch, secondPatch] = await Promise.all([
      firstTabFirstPatch,
      secondTabFirstPatch,
    ]);

    const firstTabSecondPatch = firstReader.read();
    const secondTabSecondPatch = secondReader.read();
    await handler(
      new Request("http://localhost/en/admin/tasks", {
        method: "POST",
        body: new URLSearchParams({ title: "Second tab task" }),
        headers: { "Datastar-Request": "true" },
      }),
    );
    const [thirdPatch, fourthPatch] = await Promise.all([
      firstTabSecondPatch,
      secondTabSecondPatch,
    ]);
    await Promise.all([firstReader.cancel(), secondReader.cancel()]);

    expect(firstStreamResponse.headers.get("content-type")).toBe(
      "text/event-stream",
    );
    expect(new TextDecoder().decode(firstPatch.value)).toContain(
      "First tab task",
    );
    expect(new TextDecoder().decode(secondPatch.value)).toContain(
      "First tab task",
    );
    expect(new TextDecoder().decode(thirdPatch.value)).toContain(
      "Second tab task",
    );
    expect(new TextDecoder().decode(fourthPatch.value)).toContain(
      "Second tab task",
    );
  });

  it("matches JSON task routes and validates their payloads", async () => {
    const handler = makeHandler();
    const created = await handler(
      new Request("http://localhost/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "API task" }),
      }),
    );
    const invalid = await handler(
      new Request("http://localhost/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "" }),
      }),
    );

    expect(created.status).toBe(201);
    expect((await created.json()).title).toBe("API task");
    expect(invalid.status).toBe(400);
  });

  it("exposes Scalar documentation", async () => {
    const response = await makeHandler()(
      new Request("http://localhost/api/docs"),
    );

    expect(response.status).toBe(200);
    const body = await response.text();
    expect(body).toContain("api-reference-container");
    expect(body).toContain("/favicon.svg");
  });
});
