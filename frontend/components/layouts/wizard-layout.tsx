import type { ComponentPropsWithoutRef, ReactNode } from "react";

export interface WizardLayoutProps extends ComponentPropsWithoutRef<"section"> {
  header?: ReactNode;
  progress?: ReactNode;
  footer?: ReactNode;
}

export function WizardLayout({ header, progress, footer, children, className, ...props }: WizardLayoutProps) {
  return <section className={className} {...props}>{header}{progress}{children}{footer}</section>;
}