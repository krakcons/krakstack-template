import { createContext, useContext } from "react";

export const WorkspaceOrganization = createContext<string | null>(null);
export const useOrganizationId = () => {
  const organizationId = useContext(WorkspaceOrganization);
  if (!organizationId)
    throw new Error("Workspace requires an active organization");
  return organizationId;
};
