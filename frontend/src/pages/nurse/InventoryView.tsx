import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { DataTable, ColumnDef } from '@/components/Shared/DataTable';
import type { InventoryItem } from '@/types/inventory';

interface ItemsResponse {
  success: boolean;
  data: InventoryItem[];
}

export function NurseInventoryView() {
  const [search, setSearch] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);

  const { data, isLoading, isError } = useQuery<ItemsResponse>({
    queryKey: ['inventory-items-nurse', search, lowStockOnly],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (lowStockOnly) params.set('lowStock', 'true');
      const res = await api.get(`/inventory/items?${params}`);
      return res.data;
    },
  });

  const items = data?.data ?? [];

  const columns: ColumnDef<InventoryItem>[] = [
    { header: 'Name', accessorKey: 'name' },
    { header: 'Category', accessorKey: 'category' },
    {
      header: 'Quantity',
      accessorKey: 'quantity',
      cell: (row) => (
        <span
          className={
            row.quantity === 0
              ? 'text-red-600 font-semibold'
              : row.quantity <= row.reorderLevel
              ? 'text-amber-600 font-semibold'
              : undefined
          }
        >
          {row.quantity}
        </span>
      ),
    },
    { header: 'Unit', accessorKey: 'unit' },
    { header: 'Reorder Level', accessorKey: 'reorderLevel' },
    {
      header: 'Expiry Date',
      accessorKey: 'expiryDate',
      cell: (row) =>
        row.expiryDate ? new Date(row.expiryDate).toLocaleDateString() : '—',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Inventory</h1>
        <p className="text-muted-foreground">View current stock levels and supplies</p>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-wrap gap-3 items-center">
            <Input
              placeholder="Search items..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64"
            />
            <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
              <input
                type="checkbox"
                checked={lowStockOnly}
                onChange={(e) => setLowStockOnly(e.target.checked)}
                className="rounded border-gray-300"
              />
              Low Stock Only
            </label>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Items in <span className="text-red-600 font-medium">red</span> are out of stock.
            Items in <span className="text-amber-600 font-medium">amber</span> are at or below reorder level.
          </p>
        </CardHeader>
        <CardContent>
          {isError ? (
            <p className="text-center py-8 text-red-600">Failed to load inventory. Please try again.</p>
          ) : (
            <DataTable
              data={items}
              columns={columns}
              isLoading={isLoading}
              emptyMessage="No inventory items found"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
