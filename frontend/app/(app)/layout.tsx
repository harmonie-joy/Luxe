import type { ReactNode } from "react";
import { PageShell } from "@/components/layout/page-shell";

export default function AppLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <div className="luxe-app-font">
      <PageShell>{children}</PageShell>
    </div>
  );
}
