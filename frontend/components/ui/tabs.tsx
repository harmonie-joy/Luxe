import type { ComponentPropsWithoutRef, KeyboardEvent } from "react";

export interface TabItem {
  value: string;
  label: string;
  disabled?: boolean;
}

interface TabsProps extends Omit<ComponentPropsWithoutRef<"div">, "onChange"> {
  items: readonly TabItem[];
  value: string;
  onValueChange: (value: string) => void;
  ariaLabel: string;
}

export function Tabs({
  ariaLabel,
  className,
  items,
  onValueChange,
  value,
  ...props
}: TabsProps) {
  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const buttons = Array.from(
      event.currentTarget.querySelectorAll<HTMLButtonElement>(
        '[role="tab"]:not(:disabled)',
      ),
    );
    const focusedIndex = buttons.indexOf(document.activeElement as HTMLButtonElement);
    let nextIndex: number | undefined;

    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = buttons.length - 1;
    if (event.key === "ArrowRight") {
      nextIndex = (focusedIndex + 1 + buttons.length) % buttons.length;
    }
    if (event.key === "ArrowLeft") {
      nextIndex = (focusedIndex - 1 + buttons.length) % buttons.length;
    }

    if (nextIndex === undefined || buttons.length === 0) return;

    event.preventDefault();
    const nextButton = buttons[nextIndex];
    if (!nextButton) return;

    nextButton.focus();
    onValueChange(nextButton.value);
  }

  return (
    <div
      aria-label={ariaLabel}
      className={["luxe-ui-tabs", className].filter(Boolean).join(" ")}
      onKeyDown={handleKeyDown}
      role="tablist"
      {...props}
    >
      {items.map((item) => (
        <button
          aria-selected={value === item.value}
          className="luxe-ui-tab"
          disabled={item.disabled}
          key={item.value}
          onClick={() => onValueChange(item.value)}
          role="tab"
          tabIndex={value === item.value ? 0 : -1}
          type="button"
          value={item.value}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}