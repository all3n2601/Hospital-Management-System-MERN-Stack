import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { LoadingSkeleton } from './LoadingSkeleton';
import { EmptyState } from './EmptyState';

export interface ColumnDef<T> {
  header: string;
  accessorKey: keyof T | string;
  cell?: (row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  isLoading?: boolean;
  emptyMessage?: string;
}

function getCellValue<T>(row: T, accessorKey: keyof T | string): React.ReactNode {
  const keys = (accessorKey as string).split('.');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let value: any = row;
  for (const key of keys) {
    if (value == null) return '';
    value = value[key];
  }
  if (value == null) return '';
  return String(value);
}

export function DataTable<T>({ data, columns, isLoading = false, emptyMessage }: DataTableProps<T>) {
  if (isLoading) {
    return <LoadingSkeleton rows={5} cols={columns.length} />;
  }

  if (data.length === 0) {
    return <EmptyState message={emptyMessage ?? 'No data found'} />;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <TableHead key={String(col.accessorKey)}>{col.header}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, rowIdx) => (
            <TableRow key={rowIdx}>
              {columns.map((col) => (
                <TableCell key={String(col.accessorKey)}>
                  {col.cell ? col.cell(row) : getCellValue(row, col.accessorKey)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
