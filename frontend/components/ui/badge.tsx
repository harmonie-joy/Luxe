import type { ComponentPropsWithoutRef } from "react";

export type BadgeVariant = "active" | "pending" | "alert" | "neutral";

interface BadgeProps extends ComponentPropsWithoutRef<"span"> {
  variant?: BadgeVariant;
}

export function Badge({
  children,
  className,
  variant = "neutral",
  ...props
}: BadgeProps) {
  return (
    <span
      className={["luxe-ui-badge", `luxe-ui-badge--${variant}`, className]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {children}
    </span>
  );
}