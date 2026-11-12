import type { ComponentPropsWithoutRef } from "react";

export type CardPadding = "none" | "sm" | "md" | "lg";

interface CardProps extends ComponentPropsWithoutRef<"section"> {
  padding?: CardPadding;
}

export function Card({
  children,
  className,
  padding = "md",
  ...props
}: CardProps) {
  return (
    <section
      className={["luxe-ui-card", `luxe-ui-card--${padding}`, className]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {children}
    </section>
  );
}