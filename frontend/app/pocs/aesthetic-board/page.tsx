"use client";

import { AestheticBoard } from "@/features/aesthetic-board/components/aesthetic-board";
import { StageFlowNavigation } from "@/app/pocs/components/stage-flow-navigation";
import { mockAestheticBoard } from "@/lib/mock-data/pocs-data";

export default function AestheticBoardPage() {
  return (
    <>
      <StageFlowNavigation />
      <AestheticBoard data={mockAestheticBoard} />
    </>
  );
}