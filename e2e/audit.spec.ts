import { expect, test, type Page } from "@playwright/test";
import { Schema } from "effect";

const ActiveOrganizationPayload = Schema.fromJsonString(
  Schema.Struct({ organizationId: Schema.String }),
).annotate({ identifier: "TestActiveOrganizationPayload" });
const now = new Date().toISOString();
const memberId = "audit-e2e-user";
const organizations = [
  {
    id: "org-a",
    name: "Organization A",
    slug: "organization-a",
    createdAt: now,
  },
  {
    id: "org-b",
    name: "Organization B",
    slug: "organization-b",
    createdAt: now,
  },
];
const task = (organizationId: string) => ({
  id: `task-${organizationId}`,
  organizationId,
  userId: memberId,
  title: `Task for ${organizationId}`,
  description: null,
  completed: false,
  createdAt: now,
  updatedAt: now,
});
type AuditMethod =
  | "session"
  | "impersonated"
  | "impersonated-unresolved"
  | "unknown"
  | "session-mcp"
  | "organization-key"
  | "user-key"
  | "agent-mcp";
const entry = (organizationId: string, method: AuditMethod = "session") => ({
  timeUnixNano: `${BigInt(Date.now()) * 1_000_000n}`,
  eventName: "task.created",
  attributes: [
    ...Object.entries({
      "log.record.uid": `event-${organizationId}`,
      "app.audit.target.type": "task",
      "app.audit.target.id": task(organizationId).id,
      "app.audit.target.name": task(organizationId).title,
      ...(method === "session" ||
      method === "impersonated" ||
      method === "impersonated-unresolved" ||
      method === "session-mcp" ||
      method === "unknown"
        ? {
            "app.actor.type": "user",
            "app.actor.id": memberId,
            "user.id": memberId,
          }
        : {
            "app.auth.method": "api_key",
            "app.auth.credential.id": "demo-key-id",
            "app.actor.type": method === "user-key" ? "user" : "organization",
            "app.actor.id": method === "user-key" ? memberId : organizationId,
          }),
    }).map(([key, stringValue]) => ({ key, value: { stringValue } })),
    ...(method === "session" ||
    method === "session-mcp" ||
    method === "impersonated" ||
    method === "impersonated-unresolved"
      ? [{ key: "app.auth.method", value: { stringValue: "session" } }]
      : []),
    ...(method === "impersonated" || method === "impersonated-unresolved"
      ? [
          {
            key: "app.auth.impersonator.id",
            value: { stringValue: "admin-impersonator" },
          },
        ]
      : []),
    ...(method === "agent-mcp"
      ? [
          { key: "gen_ai.agent.id", value: { stringValue: "agent-1" } },
          { key: "mcp.method.name", value: { stringValue: "tools/call" } },
        ]
      : method === "session-mcp"
        ? [{ key: "mcp.method.name", value: { stringValue: "tools/call" } }]
        : []),
    {
      key: "user.roles",
      value: { arrayValue: { values: [{ stringValue: "member" }] } },
    },
  ],
});

const workspace = async (
  page: Page,
  seeded = false,
  roles = { "org-a": "admin", "org-b": "owner" },
  method: AuditMethod = "session",
) => {
  let activeId = "org-a";
  const created = new Set(seeded ? ["org-a", "org-b"] : []);
  const fullOrganization = (id: string) => ({
    ...organizations.find((organization) => organization.id === id),
    members: [
      ...(method === "impersonated"
        ? [
            {
              id: `admin-membership-${id}`,
              organizationId: id,
              userId: "admin-impersonator",
              role: "admin",
              createdAt: now,
              user: {
                id: "admin-impersonator",
                name: "Admin Alice",
                email: "alice@example.test",
                image: null,
              },
            },
          ]
        : []),
      {
        id: `membership-${id}`,
        organizationId: id,
        userId: memberId,
        role: id === "org-a" ? roles["org-a"] : roles["org-b"],
        createdAt: now,
        user: {
          id: memberId,
          name: `Member of ${id}`,
          email: "member@example.test",
          image: "/test-member.svg",
        },
      },
    ],
    invitations: [],
  });
  await page.route("**/test-member.svg", (route) =>
    route.fulfill({
      contentType: "image/svg+xml",
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><circle cx="16" cy="16" r="16" fill="blue"/></svg>',
    }),
  );
  await page.route("**/api/**", async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    if (path === "/api/auth/get-session") {
      await route.fulfill({
        json: {
          user: {
            id: memberId,
            name: "Audit tester",
            email: "audit@example.test",
            emailVerified: true,
            image: null,
            role: null,
            banned: false,
            createdAt: now,
            updatedAt: now,
          },
          session: {
            id: "audit-e2e-session",
            token: "test-token",
            userId: memberId,
            activeOrganizationId: activeId,
            expiresAt: "2099-01-01T00:00:00.000Z",
            createdAt: now,
            updatedAt: now,
          },
        },
      });
    } else if (path === "/api/auth/organization/list") {
      await route.fulfill({ json: organizations });
    } else if (path === "/api/auth/organization/get-full-organization") {
      await route.fulfill({
        json: fullOrganization(
          url.searchParams.get("organizationId") ?? activeId,
        ),
      });
    } else if (path === "/api/auth/organization/set-active") {
      activeId = Schema.decodeUnknownSync(ActiveOrganizationPayload)(
        route.request().postData(),
      ).organizationId;
      await route.fulfill({ json: fullOrganization(activeId) });
    } else if (path === `/api/organizations/${activeId}/tasks`) {
      if (route.request().method() === "POST") {
        created.add(activeId);
        await route.fulfill({ json: task(activeId) });
      } else
        await route.fulfill({
          json: created.has(activeId) ? [task(activeId)] : [],
        });
    } else if (path === `/api/organizations/${activeId}/audit`) {
      await route.fulfill({
        json: {
          data: created.has(activeId) ? [entry(activeId, method)] : [],
          meta: {
            page: 0,
            pageSize: 20,
            total: created.has(activeId) ? 1 : 0,
            pageCount: created.has(activeId) ? 1 : 0,
          },
        },
      });
    } else if (path.startsWith("/api/otel/")) {
      await route.fulfill({ json: {} });
    } else {
      // No request can reach real auth or the application database.
      await route.fulfill({ status: 404, json: {} });
    }
  });
};

test("shows an organization action with its member name and profile photo", async ({
  page,
}) => {
  await workspace(page);
  await page.goto("/en/admin/audit");
  await expect(
    page
      .getByRole("region", { name: "Audit log" })
      .getByText("Created task", { exact: true }),
  ).toHaveCount(0);
  await page.getByRole("link", { name: "Tasks", exact: true }).click();
  await page.getByRole("button", { name: "Create task", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog
    .getByRole("textbox", { name: "Title", exact: true })
    .fill(task("org-a").title);
  await dialog
    .getByRole("textbox", { name: "Title", exact: true })
    .press("Enter");
  await expect(dialog).not.toBeVisible();
  await page.getByRole("link", { name: "Audit log", exact: true }).click();
  const audit = page.getByRole("region", { name: "Audit log" });
  const headers = audit.getByRole("columnheader");
  await expect(headers).toHaveCount(5);
  for (const [index, label] of [
    "Time",
    "Action",
    "Target",
    "Actor",
    "Method",
  ].entries()) {
    await expect(
      headers.nth(index).getByText(label, { exact: true }),
    ).toBeVisible();
  }
  await expect(audit.getByText("Created task", { exact: true })).toBeVisible();
  await expect(
    audit.getByRole("cell", { name: "User session", exact: true }),
  ).toBeVisible();
  await expect(audit.getByText("task-org-a", { exact: true })).toBeVisible();
  await expect(
    audit.getByText("Member of org-a", { exact: true }),
  ).toBeVisible();
  await expect(
    audit.getByText("member@example.test", { exact: true }),
  ).toBeVisible();
  await expect(
    audit.getByRole("img", { name: "Member of org-a", exact: true }),
  ).toBeVisible();
  await expect(
    audit.getByText(task("org-a").title, { exact: true }),
  ).toBeVisible();
});

for (const scenario of [
  { method: "organization-key", actor: "Organization A", label: "API Key" },
  { method: "user-key", actor: "Member of org-a", label: "API Key" },
  { method: "unknown", actor: "Member of org-a", label: "Unknown" },
  {
    method: "session-mcp",
    actor: "Member of org-a",
    label: "User session",
  },
  {
    method: "agent-mcp",
    actor: "Organization A",
    label: "API Key",
  },
] satisfies ReadonlyArray<{
  method: AuditMethod;
  actor: string;
  label: string;
}>) {
  test(`separates the responsible actor from the ${scenario.method} method`, async ({
    page,
  }) => {
    await workspace(
      page,
      true,
      { "org-a": "admin", "org-b": "owner" },
      scenario.method,
    );
    await page.goto("/en/admin/audit");
    const audit = page.getByRole("region", { name: "Audit log" });
    const row = audit
      .getByRole("row")
      .filter({ has: page.getByText("Task for org-a", { exact: true }) });
    await expect(
      row.getByRole("cell").nth(3).getByText(scenario.actor, { exact: true }),
    ).toBeVisible();
    await expect(row.getByRole("cell").nth(4)).toHaveText(scenario.label);
  });
}

for (const method of [
  "impersonated",
  "impersonated-unresolved",
] satisfies ReadonlyArray<AuditMethod>) {
  test(`shows the effective actor and ${method} admin without changing authentication`, async ({
    page,
  }) => {
    await workspace(page, true, { "org-a": "admin", "org-b": "owner" }, method);
    await page.goto("/en/admin/audit");
    const row = page
      .getByRole("region", { name: "Audit log" })
      .getByRole("row")
      .filter({ has: page.getByText("Task for org-a", { exact: true }) });
    const actor = row.getByRole("cell").nth(3);
    await expect(
      actor.getByText("Member of org-a", { exact: true }),
    ).toBeVisible();
    await expect(
      actor.getByText(
        `Impersonated by: ${method === "impersonated" ? "Admin Alice" : "admin-impersonator"}`,
        { exact: true },
      ),
    ).toBeVisible();
    await expect(row.getByRole("cell").nth(4)).toHaveText("User session");
    if (method === "impersonated-unresolved")
      await expect(
        actor.getByText("Admin Alice", { exact: false }),
      ).toHaveCount(0);
  });
}

test("switches task and audit caches with the active organization", async ({
  page,
}) => {
  await workspace(page, true);
  await page.goto("/en/admin/audit");
  const audit = page.getByRole("region", { name: "Audit log" });
  await expect(audit.getByText("task-org-a", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: /Organization A/ }).click();
  await page.getByRole("menuitem", { name: /Organization B/ }).click();
  await expect(audit.getByText("task-org-b", { exact: true })).toBeVisible();
  await expect(audit.getByText("task-org-a", { exact: true })).toHaveCount(0);
  await page.getByRole("link", { name: "Tasks", exact: true }).click();
  await expect(page.getByText("Task for org-b", { exact: true })).toBeVisible();
  await expect(page.getByText("Task for org-a", { exact: true })).toHaveCount(
    0,
  );
});

for (const role of ["member", "support"]) {
  test(`blocks direct audit access and hides navigation for an organization ${role}`, async ({
    page,
  }) => {
    await workspace(page, true, { "org-a": role, "org-b": "owner" });
    const auditRequests: string[] = [];
    page.on("request", (request) => {
      if (new URL(request.url()).pathname.endsWith("/audit"))
        auditRequests.push(request.url());
    });
    await page.goto("/en/admin/audit");
    await expect(
      page.getByText("Task for org-a", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Audit log", exact: true }),
    ).toHaveCount(0);
    expect(
      auditRequests.filter((url) => new URL(url).pathname.startsWith("/api/")),
    ).toEqual([]);
  });
}

test("removes audit access when switching from an admin organization to a member organization", async ({
  page,
}) => {
  await workspace(page, true, { "org-a": "admin", "org-b": "member" });
  await page.goto("/en/admin/audit");
  await expect(
    page
      .getByRole("region", { name: "Audit log" })
      .getByText("task-org-a", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: /Organization A/ }).click();
  await page.getByRole("menuitem", { name: /Organization B/ }).click();
  await expect(page.getByText("Task for org-b", { exact: true })).toBeVisible();
  await expect(page.getByRole("region", { name: "Audit log" })).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: "Audit log", exact: true }),
  ).toHaveCount(0);
});
