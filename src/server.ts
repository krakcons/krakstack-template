import { paraglideMiddleware } from "./paraglide/server.js";
import handler from "@tanstack/react-start/server-entry";
import { dispose } from "./lib/api-handler";

export default {
  dispose,
  fetch(req: Request): Promise<Response> {
    return paraglideMiddleware(req, () => handler.fetch(req));
  },
};
