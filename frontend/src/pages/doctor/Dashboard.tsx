import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppSelector } from '@/store/hooks';

interface Appointment {
  _id: string;
  patientName?: string;
  date?: string;
  time?: string;
  status?: string;
  reason?: string;
}

interface LabOrder {
  _id: string;
  orderId?: string;
  testName?: string;
  priority?: string;
  status?: string;
}

interface Prescription {
  _id: string;
  status?: string;
}

export function DoctorDashboard() {
  const user = useAppSelector(s => s.auth.user);
  const today = new Date().toISOString().split('T')[0];

  const apptQuery = useQuery<{ success: boolean; data: Appointment[] }>({
    queryKey: ['doctor-dashboard', 'appointments', today],
    queryFn: () => api.get(`/appointments?date=${today}`).then(r => r.data),
  });

  const labQuery = useQuery<{ success: boolean; data: LabOrder[] }>({
    queryKey: ['doctor-dashboard', 'lab'],
    queryFn: () => api.get('/lab/orders?limit=5').then(r => r.data),
  });

  const rxQuery = useQuery<{ success: boolean; data: Prescription[] }>({
    queryKey: ['doctor-dashboard', 'prescriptions'],
    queryFn: () => api.get('/pharmacy/prescriptions?status=active').then(r => r.data),
  });

  const todayAppts = apptQuery.data?.data ?? [];
  const labOrders = labQuery.data?.data ?? [];
  const activePrescriptions = rxQuery.data?.data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Doctor Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, Dr. {user?.firstName} {user?.lastName}
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Today's Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            {apptQuery.isLoading ? (
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            ) : (
              <>
                <p className="text-2xl font-bold">{todayAppts.length}</p>
                <p className="text-xs text-muted-foreground mt-1">Scheduled for {today}</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Recent Lab Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {labQuery.isLoading ? (
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            ) : (
              <>
                <p className="text-2xl font-bold">{labOrders.length}</p>
                <p className="text-xs text-muted-foreground mt-1">Last 5 orders</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Prescriptions</CardTitle>
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
      </div>

      {/* Today's Schedule */}
      <Card>
        <CardHeader>
          <CardTitle>Today's Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          {apptQuery.isLoading && (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              ))}
            </div>
          )}
          {apptQuery.isError && (
            <p className="text-sm text-destructive">Failed to load appointments.</p>
          )}
          {!apptQuery.isLoading && !apptQuery.isError && todayAppts.length === 0 && (
            <p className="text-sm text-muted-foreground">No appointments scheduled for today.</p>
          )}
          {todayAppts.length > 0 && (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="pb-2 font-medium text-muted-foreground">Patient</th>
                  <th className="pb-2 font-medium text-muted-foreground">Time</th>
                  <th className="pb-2 font-medium text-muted-foreground">Reason</th>
                  <th className="pb-2 font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {todayAppts.map(appt => (
                  <tr key={appt._id} className="border-b last:border-0">
                    <td className="py-2">{appt.patientName ?? '—'}</td>
                    <td className="py-2">{appt.time ?? '—'}</td>
                    <td className="py-2">{appt.reason ?? '—'}</td>
                    <td className="py-2 capitalize">{appt.status ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Recent Lab Orders */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Lab Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {labQuery.isLoading && (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              ))}
            </div>
          )}
          {labQuery.isError && (
            <p className="text-sm text-destructive">Failed to load lab orders.</p>
          )}
          {!labQuery.isLoading && !labQuery.isError && labOrders.length === 0 && (
            <p className="text-sm text-muted-foreground">No recent lab orders.</p>
          )}
          {labOrders.length > 0 && (
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
                {labOrders.map(order => (
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
            <Link to="/doctor/lab" className="text-sm text-primary hover:underline">View all lab orders →</Link>
          </div>
        </CardContent>
      </Card>

      {/* Prescriptions */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Prescriptions</CardTitle>
        </CardHeader>
        <CardContent>
          {rxQuery.isLoading && (
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          )}
          {rxQuery.isError && (
            <p className="text-sm text-destructive">Failed to load prescriptions.</p>
          )}
          {!rxQuery.isLoading && !rxQuery.isError && (
            <p className="text-sm text-muted-foreground">
              {activePrescriptions.length} active prescription{activePrescriptions.length !== 1 ? 's' : ''} on file.
            </p>
          )}
          <div className="mt-3">
            <Link to="/doctor/prescriptions" className="text-sm text-primary hover:underline">Manage prescriptions →</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
