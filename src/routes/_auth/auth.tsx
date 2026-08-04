import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/auth")({
  beforeLoad: ({ search }) => {
    throw redirect({ to: "/sign-in", search });
  },
});
