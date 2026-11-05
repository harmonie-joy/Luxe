"use client";

import { createContext, useContext, type ReactNode } from "react";
import { saveStageFlowProfile, useStageFlowProfile, type StageFlowProfile } from "@/app/pocs/components/stage-flow-state";

const StageContext = createContext<{
  profile: StageFlowProfile;
  saveProfile: typeof saveStageFlowProfile;
} | null>(null);

export function StageProvider({ children }: { children: ReactNode }) {
  const profile = useStageFlowProfile();
  return (
    <StageContext.Provider value={{ profile, saveProfile: saveStageFlowProfile }}>
      {children}
    </StageContext.Provider>
  );
}

export function useStageContext() {
  const context = useContext(StageContext);
  if (!context) throw new Error("useStageContext requires StageProvider");
  return context;
}