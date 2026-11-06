import type { ComponentPropsWithoutRef, ReactNode } from "react";

export interface GalleryGridLayoutProps extends ComponentPropsWithoutRef<"div"> {
  header?: ReactNode;
  toolbar?: ReactNode;
  filters?: ReactNode;
  footer?: ReactNode;
}

export function GalleryGridLayout({ header, toolbar, filters, footer, children, className, ...props }: GalleryGridLayoutProps) {
  return <div className={className} {...props}>{header}{toolbar}{filters}{children}{footer}</div>;
}