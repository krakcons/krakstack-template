import { describe, expect, it } from "@effect/vitest";
import { ConfigProvider, Layer } from "effect";
import type { JsonObject } from "effect/Schema";
import { HttpRouter } from "effect/http";
import { vi } from "vitest";

import { mcpLayer } from "./mcp-handler";

describe("MCP registry integration", () => {
  it("exposes only reads and forwards each request's API key", async () => {
    const requests: Request[] = [];
    vi.stubGlobal(
      "fetch",
      async (input: RequestInfo | URL, init?: RequestInit) => {
        requests.push(new Request(input, init));
        return Response.json([]);
      },
    );
    const web = HttpRouter.toWebHandler(
      mcpLayer.pipe(
        Layer.provide(
          ConfigProvider.layer(
            ConfigProvider.fromUnknown({
              VITE_SITE_URL: "http://api.example.test",
            }),
          ),
        ),
      ),
      { disableLogger: true },
    );
    const post = (
      body: JsonObject,
      session?: string | null,
      apiKey?: string,
    ) => {
      const headers = new Headers({
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
        "MCP-Protocol-Version": "2025-11-25",
      });
      if (session) headers.set("Mcp-Session-Id", session);
      if (apiKey) headers.set("x-api-key", apiKey);
      return web.handler(
        new Request("http://localhost/api/mcp", {
          method: "POST",
          headers,
          body: JSON.stringify(body),
        }),
      );
    };

    try {
      const initialized = await post({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2025-11-25",
          capabilities: {},
          clientInfo: { name: "test", version: "1.0" },
        },
      });
      expect(initialized.status).toBe(200);
      const session = initialized.headers.get("mcp-session-id");
      const listed = await post(
        { jsonrpc: "2.0", id: 2, method: "tools/list" },
        session,
      );
      expect(listed.status).toBe(200);
      const tools = await listed.text();
      expect(tools).toContain('"name":"tasks_listTasks"');
      expect(tools).not.toContain('"name":"tasks_createTask"');
      expect(tools).not.toContain('"name":"tasks_updateTask"');
      expect(tools).not.toContain('"name":"tasks_deleteTask"');

      for (const [index, key] of ["first-key", "second-key"].entries()) {
        const response = await post(
          {
            jsonrpc: "2.0",
            id: index + 3,
            method: "tools/call",
            params: {
              name: "tasks_listTasks",
              arguments: { params: { organizationId: "test-organization" } },
            },
          },
          session,
          key,
        );
        expect(response.status).toBe(200);
        expect(await response.text()).toContain('"isError":false');
      }
      expect(requests.map((request) => request.url)).toEqual([
        "http://api.example.test/api/organizations/test-organization/tasks",
        "http://api.example.test/api/organizations/test-organization/tasks",
      ]);
      expect(
        requests.map((request) => request.headers.get("x-api-key")),
      ).toEqual(["first-key", "second-key"]);
    } finally {
      await web.dispose();
      vi.unstubAllGlobals();
    }
  });
});
