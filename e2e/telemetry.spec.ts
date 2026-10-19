import { expect, test, type Page } from "@playwright/test";
import { Schema } from "effect";

const Attribute = Schema.Struct({
  key: Schema.String,
  value: Schema.Struct({
    stringValue: Schema.optional(Schema.String),
    intValue: Schema.optional(Schema.Number),
    doubleValue: Schema.optional(Schema.Number),
    boolValue: Schema.optional(Schema.Boolean),
  }),
}).annotate({ identifier: "TestOtlpAttribute" });

const LogRecord = Schema.Struct({
  eventName: Schema.String,
  attributes: Schema.Array(Attribute),
}).annotate({ identifier: "TestOtlpLogRecord" });

const LogsPayload = Schema.fromJsonString(
  Schema.Struct({
    resourceLogs: Schema.Array(
      Schema.Struct({
        resource: Schema.Struct({ attributes: Schema.Array(Attribute) }),
        scopeLogs: Schema.Array(
          Schema.Struct({ logRecords: Schema.Array(LogRecord) }),
        ),
      }),
    ),
  }),
).annotate({ identifier: "TestOtlpLogsPayload" });

type CapturedLog = typeof LogRecord.Type;

const captureTelemetry = async (page: Page) => {
  const records: CapturedLog[] = [];
  const serviceNames: string[] = [];
  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (path === "/api/otel/v1/logs") {
      const payload = Schema.decodeUnknownSync(LogsPayload)(request.postData());
      for (const resource of payload.resourceLogs) {
        const service = resource.resource.attributes.find(
          ({ key }) => key === "service.name",
        )?.value.stringValue;
        if (service) serviceNames.push(service);
        for (const scope of resource.scopeLogs)
          records.push(...scope.logRecords);
      }
      await route.fulfill({ json: {} });
    } else if (path.startsWith("/api/otel/")) {
      await route.fulfill({ json: {} });
    } else if (path === "/api/auth/get-session") {
      await route.fulfill({ json: null });
    } else {
      // No API request can reach the real backend or database in these tests.
      await route.fulfill({
        status: 503,
        json: { error: "Not used by this test" },
      });
    }
  });

  const flush = async (step: string) => {
    await page.evaluate(async (step) => {
      const moduleUrl = "/e2e/telemetry.fixture.ts";
      const telemetry: typeof import("./telemetry.fixture") = await import(
        moduleUrl
      );
      await telemetry.flush(step);
    }, step);
    await expect
      .poll(() =>
        records.some(
          (record) =>
            record.eventName === "app.e2e.flush" &&
            record.attributes.some(
              ({ key, value }) =>
                key === "app.test.step" && value.stringValue === step,
            ),
        ),
      )
      .toBe(true);
  };

  const authReady = page.waitForResponse(
    (response) => new URL(response.url()).pathname === "/api/auth/get-session",
  );
  await page.goto("/en/");
  await authReady;
  await flush("initial");

  return { records, serviceNames, flush };
};

test("records initial and SPA page views without query/hash duplicates or sensitive URL data", async ({
  page,
}) => {
  const { records, serviceNames, flush } = await captureTelemetry(page);
  const pageViews = () =>
    records.filter(({ eventName }) => eventName === "browser.page_view");
  const paths = () =>
    pageViews().map(
      ({ attributes }) =>
        attributes.find(({ key }) => key === "url.path")?.value.stringValue,
    );
  expect(paths()).toEqual(["/en/"]);
  expect(serviceNames).toContain("krakstack-template-web-local");

  await page.evaluate(() => {
    history.pushState(
      {},
      "",
      "/telemetry-first?token=sensitive-query#private-fragment",
    );
  });
  await flush("first-path");
  expect(paths()).toEqual(["/en/", "/telemetry-first"]);

  await page.evaluate(() => {
    history.pushState(
      {},
      "",
      "/telemetry-first?token=changed#another-fragment",
    );
    history.replaceState(
      {},
      "",
      "/telemetry-first?token=replaced#final-fragment",
    );
    history.replaceState(
      {},
      "",
      "/telemetry-first?token=replaced#hash-only-change",
    );
  });
  await flush("same-path");
  expect(paths()).toEqual(["/en/", "/telemetry-first"]);

  await page.evaluate(() => history.replaceState({}, "", "/telemetry-second"));
  await flush("replacement-path");
  expect(paths()).toEqual(["/en/", "/telemetry-first", "/telemetry-second"]);

  await page.goBack();
  await flush("back");
  expect(paths()).toEqual([
    "/en/",
    "/telemetry-first",
    "/telemetry-second",
    "/telemetry-first",
  ]);
  await page.goBack();
  await flush("back-to-home");
  expect(paths()).toEqual([
    "/en/",
    "/telemetry-first",
    "/telemetry-second",
    "/telemetry-first",
    "/en/",
  ]);
  await page.goForward();
  await flush("forward");
  expect(paths()).toEqual([
    "/en/",
    "/telemetry-first",
    "/telemetry-second",
    "/telemetry-first",
    "/en/",
    "/telemetry-first",
  ]);
  expect(JSON.stringify(pageViews())).not.toMatch(
    /sensitive-query|private-fragment|token=/,
  );
});

test("exports custom event properties without browser-owned identity", async ({
  page,
}) => {
  const { records, flush } = await captureTelemetry(page);
  await page.evaluate(async () => {
    const moduleUrl = "/e2e/telemetry.fixture.ts";
    const telemetry: typeof import("./telemetry.fixture") = await import(
      moduleUrl
    );
    await telemetry.track("app.e2e.action", {
      "action.source": "template",
      "action.count": 2,
      "action.success": true,
    });
  });
  await flush("custom-events");

  const action = records.find(
    ({ eventName }) => eventName === "app.e2e.action",
  );
  expect(action?.attributes).toEqual(
    expect.arrayContaining([
      { key: "app.action.source", value: { stringValue: "template" } },
      { key: "app.action.count", value: { intValue: 2 } },
      { key: "app.action.success", value: { boolValue: true } },
    ]),
  );
  expect(
    action?.attributes.some(({ key }) =>
      [
        "user.id",
        "organization.id",
        "session.id",
        "analytics.anonymous_id",
      ].includes(key),
    ),
  ).toBe(false);
});
