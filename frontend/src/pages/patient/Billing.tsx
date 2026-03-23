import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '@/lib/api';
import { fmt } from '@/lib/format';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/Shared/StatusBadge';
import type { Invoice } from '@/types/billing';

interface BillingResponse {
  success: boolean;
  data: Invoice[];
}

type FilterTab = 'all' | 'pending' | 'paid' | 'void';

const PENDING_STATUSES = new Set(['draft', 'issued', 'partial', 'overdue']);

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="animate-pulse flex items-center gap-4 p-4 border rounded-lg">
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
          </div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16" />
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-16" />
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16" />
        </div>
      ))}
    </div>
  );
}

export function PatientBilling() {
  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  const { data, isLoading, isError } = useQuery<BillingResponse>({
    queryKey: ['billing', 'patient'],
    queryFn: async () => {
      const res = await api.get('/billing');
      return res.data;
    },
  });

  const invoices = data?.data ?? [];

  const filtered = invoices.filter((inv) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'pending') return PENDING_STATUSES.has(inv.status);
    if (activeTab === 'paid') return inv.status === 'paid';
    if (activeTab === 'void') return inv.status === 'void';
    return true;
  });

  const pendingCount = invoices.filter((inv) => PENDING_STATUSES.has(inv.status)).length;
  const paidCount = invoices.filter((inv) => inv.status === 'paid').length;
  const voidCount = invoices.filter((inv) => inv.status === 'void').length;

  const tabs: { key: FilterTab; label: string; count?: number }[] = [
    { key: 'all', label: 'All', count: invoices.length },
    { key: 'pending', label: 'Pending', count: pendingCount },
    { key: 'paid', label: 'Paid', count: paidCount },
    { key: 'void', label: 'Voided', count: voidCount },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Bills</h1>
        <p className="text-muted-foreground">View and track your invoices and payments</p>
      </div>

      {isError && (
        <p className="text-center py-10 text-sm text-red-600 dark:text-red-400">
          Failed to load invoices. Please try again.
        </p>
      )}

      {!isError && (
        <>
          {/* Filter tabs */}
          <div className="flex gap-2 border-b">
            {tabs.map((tab) => (
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
                {tab.count !== undefined && (
                  <span className="ml-1.5 text-xs text-muted-foreground">({tab.count})</span>
                )}
              </button>
            ))}
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Invoices</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading && <LoadingSkeleton />}

              {!isLoading && filtered.length === 0 && (
                <div className="text-center py-10">
                  <p className="text-muted-foreground">No invoices found.</p>
                </div>
              )}

              {!isLoading && filtered.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="pb-2 pr-4 font-medium">Invoice #</th>
                        <th className="pb-2 pr-4 font-medium">Date</th>
                        <th className="pb-2 pr-4 font-medium">Total</th>
                        <th className="pb-2 pr-4 font-medium">Balance Due</th>
                        <th className="pb-2 pr-4 font-medium">Status</th>
                        <th className="pb-2 font-medium" />
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filtered.map((inv) => {
                        const dateStr = inv.issuedDate ?? inv.createdAt;
                        const date = new Date(dateStr).toLocaleDateString();
                        return (
                          <tr key={inv._id} className="hover:bg-muted/50 transition-colors">
                            <td className="py-3 pr-4 font-medium text-gray-900 dark:text-white">
                              {inv.invoiceId}
                            </td>
                            <td className="py-3 pr-4 text-muted-foreground">{date}</td>
                            <td className="py-3 pr-4">{fmt(inv.total)}</td>
                            <td className="py-3 pr-4">{fmt(inv.balance)}</td>
                            <td className="py-3 pr-4">
                              <StatusBadge status={inv.status} />
                            </td>
                            <td className="py-3">
                              <Link
                                to={`/patient/billing/${inv._id}`}
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
