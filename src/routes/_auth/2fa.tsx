import { TwoFactor } from "@krak-stack/auth";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/2fa")({
  component: () => <TwoFactor />,
});
