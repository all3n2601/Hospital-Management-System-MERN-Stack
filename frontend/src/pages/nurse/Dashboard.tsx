import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppSelector } from '@/store/hooks';

interface Prescription {
  _id: string;
  status?: string;
}

interface LabOrder {
  _id: string;
  orderId?: string;
  testName?: string;
  status?: string;
  priority?: string;
}

export function NurseDashboard() {
  const user = useAppSelector(s => s.auth.user);

  const rxQuery = useQuery<{ success: boolean; data: Prescription[] }>({
    queryKey: ['nurse-dashboard', 'prescriptions'],
    queryFn: () => api.get('/pharmacy/prescriptions?status=active').then(r => r.data),
  });

  const labQuery = useQuery<{ success: boolean; data: LabOrder[] }>({
    queryKey: ['nurse-dashboard', 'lab'],
    queryFn: () => api.get('/lab/orders').then(r => r.data),
  });

  const activePrescriptions = rxQuery.data?.data ?? [];
  const labOrders = labQuery.data?.data ?? [];
  // Lab orders that need results (pending or collected)
  const labNeedingResults = labOrders.filter(o => o.status === 'pending' || o.status === 'collected');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Nurse Overview</h1>
        <p className="text-muted-foreground">
          Welcome, {user?.firstName} {user?.lastName}
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Dispensing Queue</CardTitle>
          </CardHeader>
          <CardContent>
            {rxQuery.isLoading ? (
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            ) : (
              <>
                <p className="text-2xl font-bold">{activePrescriptions.length}</p>
                <p className="text-xs text-muted-foreground mt-1">Active prescriptions</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Lab — Needs Results</CardTitle>
          </CardHeader>
          <CardContent>
            {labQuery.isLoading ? (
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            ) : (
              <>
                <p className="text-2xl font-bold">{labNeedingResults.length}</p>
                <p className="text-xs text-muted-foreground mt-1">Pending / collected</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Inventory Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">—</p>
            <p className="text-xs text-muted-foreground mt-1">Check inventory for low stock items</p>
          </CardContent>
        </Card>
      </div>

      {/* Dispensing Queue */}
      <Card>
        <CardHeader>
          <CardTitle>Dispensing Queue</CardTitle>
        </CardHeader>
        <CardContent>
          {rxQuery.isLoading && (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              ))}
            </div>
          )}
          {rxQuery.isError && (
            <p className="text-sm text-destructive">Failed to load prescriptions.</p>
          )}
          {!rxQuery.isLoading && !rxQuery.isError && activePrescriptions.length === 0 && (
            <p className="text-sm text-muted-foreground">No active prescriptions in queue.</p>
          )}
          {activePrescriptions.length > 0 && (
            <p className="text-sm text-muted-foreground">
              {activePrescriptions.length} prescription{activePrescriptions.length !== 1 ? 's' : ''} awaiting dispensing.
            </p>
          )}
          <div className="mt-3">
            <Link to="/nurse/dispensing" className="text-sm text-primary hover:underline">Go to dispensing queue →</Link>
          </div>
        </CardContent>
      </Card>

      {/* Lab Management */}
      <Card>
        <CardHeader>
          <CardTitle>Lab Management</CardTitle>
        </CardHeader>
        <CardContent>
          {labQuery.isLoading && (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              ))}
            </div>
          )}
          {labQuery.isError && (
            <p className="text-sm text-destructive">Failed to load lab orders.</p>
          )}
          {!labQuery.isLoading && !labQuery.isError && labNeedingResults.length === 0 && (
            <p className="text-sm text-muted-foreground">No lab orders currently awaiting results.</p>
          )}
          {labNeedingResults.length > 0 && (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="pb-2 font-medium text-muted-foreground">Order ID</th>
                  <th className="pb-2 font-medium text-muted-foreground">Test</th>
                  <th className="pb-2 font-medium text-muted-foreground">Priority</th>
                  <th className="pb-2 font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {labNeedingResults.slice(0, 5).map(order => (
                  <tr key={order._id} className="border-b last:border-0">
                    <td className="py-2">{order.orderId ?? order._id.slice(-6)}</td>
                    <td className="py-2">{order.testName ?? '—'}</td>
                    <td className="py-2 capitalize">{order.priority ?? '—'}</td>
                    <td className="py-2 capitalize">{order.status ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <div className="mt-3">
            <Link to="/admin/lab" className="text-sm text-primary hover:underline">Go to lab management →</Link>
          </div>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Links</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Link to="/nurse/dispensing" className="text-sm text-primary hover:underline">Dispensing Queue</Link>
            <Link to="/admin/lab" className="text-sm text-primary hover:underline">Lab Management</Link>
            <Link to="/nurse/inventory" className="text-sm text-primary hover:underline">Inventory</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
