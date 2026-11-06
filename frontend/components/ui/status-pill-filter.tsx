"use client";

import type { ReactNode } from "react";
import { Badge } from "./badge";
import { Button, type ButtonVariant } from "./button";

export interface StatusPillFilterProps<Value extends string> {
  options: readonly { value: Value; label: string; content?: ReactNode; count?: number }[];
  value: Value;
  onChange: (value: Value) => void;
  label: string;
  className?: string;
  role?: "nav" | "group";
  toggleValue?: Value;
  inactiveVariant?: ButtonVariant;
}

export function StatusPillFilter<Value extends string>({ options, value, onChange, label, className, role = "nav", toggleValue, inactiveVariant = "outline" }: StatusPillFilterProps<Value>) {
  const Container = role === "nav" ? "nav" : "div";
  return <Container className={className} aria-label={label} role={role === "group" ? "group" : undefined}>
    {options.map((option) => <Button key={option.value} type="button" size="sm" variant={value === option.value ? "secondary" : inactiveVariant} aria-pressed={value === option.value} aria-label={option.label} title={option.label} onClick={() => onChange(value === option.value && toggleValue !== undefined ? toggleValue : option.value)}>
      {option.content ?? option.label}{option.count !== undefined && <Badge variant="neutral">{option.count}</Badge>}
    </Button>)}
  </Container>;
}