import type { ReactNode } from "react";

export interface StatCounterCardProps {
  label: ReactNode;
  value: ReactNode;
  className?: string;
  valueClassName?: string;
}

export function StatCounterCard({ label, value, className, valueClassName }: StatCounterCardProps) {
  return <div className={className}><dt>{label}</dt><dd className={valueClassName}>{value}</dd></div>;
}