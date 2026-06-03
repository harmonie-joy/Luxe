export type WorkspaceRole = "admin" | "editor" | "reviewer" | "viewer";

export interface WorkspaceUser {
  id: string;
  name: string;
  email: string;
  role: WorkspaceRole;
  avatarUrl?: string;
}

export interface WorkspaceSummaryMetric {
  id: string;
  label: string;
  value: number;
  detail: string;
}

export interface Workspace {
  id: string;
  name: string;
  users: readonly WorkspaceUser[];
}
