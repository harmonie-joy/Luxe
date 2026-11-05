"use client";

import { IdeaBoxBoard } from "@/app/pocs/components/idea-box-board";
import { mockIdeaBoxIdeas } from "@/lib/mock-data/pocs-data";

export default function IdeaBoxPage() {
  return <IdeaBoxBoard initialIdeas={mockIdeaBoxIdeas} />;
}