import { BunHttpServer, BunRuntime } from "@effect/platform-bun";
import { Effect, Layer } from "effect";
import { HttpRouter } from "effect/unstable/http";

import { makeApplicationRoutes } from "@/app";
import { Tasks } from "@/services/task";

const port = Number(process.env.PORT ?? 3000);
const ServerLive = HttpRouter.serve(
  makeApplicationRoutes(),
  { disableListenLog: true },
).pipe(Layer.provide(BunHttpServer.layer({ port })));

Effect.log(`Effect + Datastar listening on http://localhost:${port}`).pipe(
  Effect.andThen(Layer.launch(ServerLive)),
  Effect.provide(Tasks.layer),
  BunRuntime.runMain,
);
