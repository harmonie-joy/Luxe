import type { ReactNode } from "react";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppTopbar } from "@/components/layout/app-topbar";

interface PageShellProps {
  children: ReactNode;
}

export function PageShell({ children }: PageShellProps) {
  return (
    <div className="luxe-app-shell min-h-screen">
      <div className="flex min-h-screen">
        <AppSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <AppTopbar />
          <main className="flex-1 px-4 py-8 md:px-8 lg:px-10 lg:py-12">
            <div className="luxe-page-transition mx-auto w-full max-w-[var(--layout-container-max)]">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
