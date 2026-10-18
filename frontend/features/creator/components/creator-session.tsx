"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { AuthSession } from "@/types/auth";

const CreatorSession = createContext<AuthSession | null>(null);

export function CreatorSessionProvider({ session, children }: { session: AuthSession; children: ReactNode }) {
  return <CreatorSession.Provider value={session}><div key={`${session.user.id}:${session.activeWorkspaceId}`}>{children}</div></CreatorSession.Provider>;
}

export function useCreatorSession() {
  const session = useContext(CreatorSession);
  if (!session) throw new Error("Creator workspace requires a verified session.");
  return session;
}
