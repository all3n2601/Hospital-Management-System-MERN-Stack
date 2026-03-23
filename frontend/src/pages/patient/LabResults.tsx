import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/Shared/StatusBadge';
import type { LabOrder, LabOrderStatus } from '@/types/lab';

interface LabOrdersResponse {
  success: boolean;
  data: LabOrder[];
}

type FilterTab = 'all' | LabOrderStatus;

const TABS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'completed', label: 'Completed' },
];

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="animate-pulse flex items-center gap-4 p-4 border rounded-lg">
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
          </div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32" />
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-16" />
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-16" />
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16" />
        </div>
      ))}
    </div>
  );
}

export function PatientLabResults() {
  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  const { data, isLoading, isError } = useQuery<LabOrdersResponse>({
    queryKey: ['lab-orders', 'patient'],
    queryFn: async () => {
      const res = await api.get('/lab/orders');
      return res.data;
    },
  });

  const orders = data?.data ?? [];

  const filtered = orders.filter((order) => {
    if (activeTab === 'all') return true;
    return order.status === activeTab;
  });

  const counts: Record<FilterTab, number> = {
    all: orders.length,
    pending: orders.filter((o) => o.status === 'pending').length,
    in_progress: orders.filter((o) => o.status === 'in_progress').length,
    completed: orders.filter((o) => o.status === 'completed').length,
    cancelled: orders.filter((o) => o.status === 'cancelled').length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Lab Results</h1>
        <p className="text-muted-foreground">View your lab orders and test results</p>
      </div>

      {isError && (
        <p className="text-center py-10 text-sm text-red-600 dark:text-red-400">
          Failed to load lab orders. Please try again.
        </p>
      )}

      {!isError && (
        <>
          {/* Filter tabs */}
          <div className="flex gap-2 border-b">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
                <span className="ml-1.5 text-xs text-muted-foreground">({counts[tab.key]})</span>
              </button>
            ))}
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Lab Orders</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading && <LoadingSkeleton />}

              {!isLoading && filtered.length === 0 && (
                <div className="text-center py-10">
                  <p className="text-muted-foreground">No lab orders found.</p>
                </div>
              )}

              {!isLoading && filtered.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="pb-2 pr-4 font-medium">Order ID</th>
                        <th className="pb-2 pr-4 font-medium">Date</th>
                        <th className="pb-2 pr-4 font-medium">Tests</th>
                        <th className="pb-2 pr-4 font-medium">Priority</th>
                        <th className="pb-2 pr-4 font-medium">Status</th>
                        <th className="pb-2 font-medium" />
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filtered.map((order) => {
                        const date = new Date(order.orderedAt ?? order.createdAt).toLocaleDateString();
                        const testNames = order.tests.map((t) => t.name).join(', ');
                        return (
                          <tr key={order._id} className="hover:bg-muted/50 transition-colors">
                            <td className="py-3 pr-4 font-medium text-gray-900 dark:text-white">
                              {order.orderId}
                            </td>
                            <td className="py-3 pr-4 text-muted-foreground">{date}</td>
                            <td className="py-3 pr-4 max-w-xs truncate" title={testNames}>
                              {testNames || '—'}
                            </td>
                            <td className="py-3 pr-4">
                              <StatusBadge status={order.priority} />
                            </td>
                            <td className="py-3 pr-4">
                              <StatusBadge status={order.status} />
                            </td>
                            <td className="py-3">
                              <Link
                                to={`/patient/lab/${order._id}`}
                                className="inline-flex items-center justify-center rounded-md text-xs font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-3 transition-colors"
                              >
                                View
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
