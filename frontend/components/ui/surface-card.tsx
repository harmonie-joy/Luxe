import type { ComponentPropsWithoutRef } from "react";

type SurfaceCardPadding = "none" | "sm" | "md";

interface SurfaceCardProps extends ComponentPropsWithoutRef<"section"> {
  padding?: SurfaceCardPadding;
}

const paddingClasses = {
  none: "",
  sm: "p-5",
  md: "p-6",
} as const satisfies Record<SurfaceCardPadding, string>;

function classNames(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function SurfaceCard({
  children,
  className,
  padding = "md",
  ...props
}: SurfaceCardProps) {
  return (
    <section
      className={classNames(
        "luxe-card",
        paddingClasses[padding],
        className,
      )}
      {...props}
    >
      {children}
    </section>
  );
}
