import { defineProjectAccess } from "@krak-stack/auth/access";

export const Access = defineProjectAccess({
  project: "krakstack-template",
  permissions: ["tasks:read", "tasks:create", "tasks:update", "tasks:delete"],
  roles: {
    owner: ["tasks:read", "tasks:create", "tasks:update", "tasks:delete"],
    admin: ["tasks:read", "tasks:create", "tasks:update", "tasks:delete"],
    support: ["tasks:read"],
    member: ["tasks:read", "tasks:create", "tasks:update", "tasks:delete"],
  },
  apiKeys: {
    user: ["tasks:read", "tasks:create", "tasks:update", "tasks:delete"],
    organization: [],
  },
});
