import type { ReactNode } from "react";

export interface DashboardShellLayoutProps {
  header?: ReactNode;
  sidebar?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  mainId?: string;
}

export function DashboardShellLayout({ header, sidebar, children, footer, className = "", mainId }: DashboardShellLayoutProps) {
  if (sidebar === undefined) return <div className={className} id={mainId}>{header}{children}{footer}</div>;
  return <div className={className}>
    {header}
    <div className="luxe-pocs-body">
      <aside className="luxe-pocs-sidebar">{sidebar}</aside>
      <main className="luxe-pocs-main" id={mainId} tabIndex={-1}>
        <div className="luxe-pocs-content">{children}{footer}</div>
      </main>
    </div>
  </div>;
}