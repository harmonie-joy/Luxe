import type { ComponentPropsWithoutRef, ReactNode } from "react";

export interface SplitPaneLayoutProps extends ComponentPropsWithoutRef<"div"> {
  as?: "div" | "section";
  primary: ReactNode;
  secondary?: ReactNode;
}

export function SplitPaneLayout({ as: Container = "div", primary, secondary, className, ...props }: SplitPaneLayoutProps) {
  return <Container className={className} {...props}>{primary}{secondary}</Container>;
}