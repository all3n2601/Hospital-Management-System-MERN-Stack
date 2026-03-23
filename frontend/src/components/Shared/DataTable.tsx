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

function getCellValue<T>(row: T, key: string): unknown {
  const parts = key.split('.');
  let value: unknown = row;
  for (const part of parts) {
    if (value !== null && value !== undefined && typeof value === 'object') {
      value = (value as Record<string, unknown>)[part];
    } else {
      value = undefined;
      break;
    }
  }
  return value;
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
                  {col.cell ? col.cell(row) : String(getCellValue(row, String(col.accessorKey)) ?? '')}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
