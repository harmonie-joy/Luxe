import type { WorkspaceRole } from "@/types/workspace";

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  displayName: string;
}

export interface AuthWorkspace {
  id: string;
  name: string;
  role: WorkspaceRole;
}

export interface AuthSession {
  user: AuthUser;
  workspaces: readonly AuthWorkspace[];
  activeWorkspaceId: string | null;
}
