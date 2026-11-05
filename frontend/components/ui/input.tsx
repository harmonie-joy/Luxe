import type { ComponentPropsWithoutRef } from "react";

export type InputProps = ComponentPropsWithoutRef<"input">;
export type SelectProps = ComponentPropsWithoutRef<"select">;
export type SearchInputProps = Omit<InputProps, "type">;

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={["luxe-ui-input", className].filter(Boolean).join(" ")}
      {...props}
    />
  );
}

export function SearchInput({ className, ...props }: SearchInputProps) {
  return (
    <Input
      className={className}
      type="search"
      {...props}
    />
  );
}

export function Select({ className, ...props }: SelectProps) {
  return (
    <select
      className={["luxe-ui-select", className].filter(Boolean).join(" ")}
      {...props}
    />
  );
}