import { TwoFactor } from "@krak-stack/auth/components";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/2fa")({
  component: () => <TwoFactor />,
});
