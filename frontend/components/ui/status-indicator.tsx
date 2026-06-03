export type StatusIndicatorTone =
  | "primary"
  | "neutral"
  | "critical"
  | "warning"
  | "success"
  | "info";

interface StatusIndicatorProps {
  label: string;
  tone: StatusIndicatorTone;
  className?: string;
  uppercase?: boolean;
}

function classNames(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function StatusIndicator({
  className,
  label,
  tone,
  uppercase = false,
}: StatusIndicatorProps) {
  return (
    <span
      className={classNames(
        "luxe-status-badge",
        `luxe-status-badge--${tone}`,
        uppercase && "uppercase tracking-[0.14em]",
        className,
      )}
    >
      <span className="luxe-status-badge__dot" />
      {label}
    </span>
  );
}
