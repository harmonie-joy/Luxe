import type { ComponentPropsWithoutRef } from "react";

type TableProps = ComponentPropsWithoutRef<"table">;
type TableSectionProps = ComponentPropsWithoutRef<"thead">;
type TableBodyProps = ComponentPropsWithoutRef<"tbody">;
type TableRowProps = ComponentPropsWithoutRef<"tr">;
type TableHeadProps = ComponentPropsWithoutRef<"th">;
type TableCellProps = ComponentPropsWithoutRef<"td">;
type TableCaptionProps = ComponentPropsWithoutRef<"caption">;

function classNames(...values: Array<string | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function Table({ className, ...props }: TableProps) {
  return (
    <div className="luxe-ui-table-wrap">
      <table className={classNames("luxe-ui-table", className)} {...props} />
    </div>
  );
}

export function TableHeader({ className, ...props }: TableSectionProps) {
  return <thead className={classNames("luxe-ui-table__head", className)} {...props} />;
}

export function TableBody({ className, ...props }: TableBodyProps) {
  return <tbody className={classNames("luxe-ui-table__body", className)} {...props} />;
}

export function TableRow({ className, ...props }: TableRowProps) {
  return <tr className={classNames("luxe-ui-table__row", className)} {...props} />;
}

export function TableHead({ className, ...props }: TableHeadProps) {
  return <th className={classNames("luxe-ui-table__heading", className)} {...props} />;
}

export function TableCell({ className, ...props }: TableCellProps) {
  return <td className={classNames("luxe-ui-table__cell", className)} {...props} />;
}

export function TableCaption({ className, ...props }: TableCaptionProps) {
  return <caption className={classNames("luxe-ui-table__caption", className)} {...props} />;
}