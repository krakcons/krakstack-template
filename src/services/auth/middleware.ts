import { AuthService } from "@krak-stack/auth/server";
import { Context, Effect, Layer } from "effect";
import { HttpServerRequest } from "effect/unstable/http";
import { HttpApiError, HttpApiMiddleware } from "effect/unstable/httpapi";

export class CurrentUser extends Context.Service<
  CurrentUser,
  {
    id: string;
    name: string;
    email: string;
  }
>()("site/CurrentUser") {}

export class AuthMiddleware extends HttpApiMiddleware.Service<
  AuthMiddleware,
  {
    provides: CurrentUser | AuthService;
  }
>()("site/AuthMiddleware", {
  error: HttpApiError.Unauthorized,
}) {}

export const AuthMiddlewareLive = Layer.effect(
  AuthMiddleware,
  Effect.gen(function* () {
    return (httpEffect) =>
      Effect.gen(function* () {
        const request = yield* HttpServerRequest.HttpServerRequest;
        const auth = yield* AuthService.pipe(
          Effect.provide(AuthService.layer({ headers: request.headers })),
          Effect.mapError(() => new HttpApiError.Unauthorized({})),
        );
        const session = yield* auth.auth
          .getSession()
          .pipe(Effect.mapError(() => new HttpApiError.Unauthorized({})));

        if (!session) {
          return yield* new HttpApiError.Unauthorized({});
        }

        const user = {
          id: session.user.id,
          name: session.user.name,
          email: session.user.email,
        };

        return yield* httpEffect.pipe(
          Effect.provideService(AuthService, auth),
          Effect.provideService(CurrentUser, user),
        );
      });
  }),
);
