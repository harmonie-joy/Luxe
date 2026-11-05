"use client";

import { WebPortalPrototype } from "@/features/web-portal/components/web-portal-prototype";
import { mockWebPortal } from "@/lib/mock-data/pocs-data";

export default function WebPortalPage() {
  return <WebPortalPrototype data={mockWebPortal} />;
}