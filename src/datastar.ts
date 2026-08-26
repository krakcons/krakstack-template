const htmlType = Symbol("Html");

export type Html = {
  readonly [htmlType]: true;
  readonly value: string;
};

type HtmlValue = Html | string | number | boolean | null | undefined;

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const renderValue = (value: HtmlValue | ReadonlyArray<HtmlValue>): string => {
  if (Array.isArray(value)) return value.map(renderValue).join("");
  if (value === null || value === undefined || value === false) return "";
  if (typeof value === "object" && htmlType in value) return value.value;
  return escapeHtml(String(value));
};

export const html = (
  strings: TemplateStringsArray,
  ...values: ReadonlyArray<HtmlValue | ReadonlyArray<HtmlValue>>
): Html => ({
  [htmlType]: true,
  value: strings.reduce(
    (output, part, index) => output + part + renderValue(values[index]),
    "",
  ),
});

const dataLines = (name: string, value: string) =>
  value
    .replaceAll("\r\n", "\n")
    .split("\n")
    .map((line) => `data: ${name} ${line}\n`)
    .join("");

export const patchElements = (
  elements: Html,
  options?: { readonly mode?: "outer" | "replace"; readonly selector?: string },
) =>
  `event: datastar-patch-elements\n${options?.selector ? `data: selector ${options.selector}\n` : ""}${options?.mode ? `data: mode ${options.mode}\n` : ""}${dataLines("elements", elements.value)}\n`;

export const datastarResponse = (events: ReadonlyArray<string>) =>
  new Response(events.join(""), {
    headers: {
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Content-Type": "text/event-stream",
    },
  });
