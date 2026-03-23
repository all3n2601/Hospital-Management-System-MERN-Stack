import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppSelector } from '@/store/hooks';

interface Appointment {
  _id: string;
  date?: string;
  time?: string;
  doctorName?: string;
  status?: string;
  reason?: string;
}

interface Invoice {
  _id: string;
  invoiceId?: string;
  totalAmount?: number;
  status?: string;
  createdAt?: string;
}

interface Prescription {
  _id: string;
  status?: string;
}

interface LabResult {
  _id: string;
  testName?: string;
  createdAt?: string;
  status?: string;
}

export function PatientDashboard() {
  const user = useAppSelector(s => s.auth.user);

  const apptQuery = useQuery<{ success: boolean; data: Appointment[] }>({
    queryKey: ['patient-dashboard', 'appointments'],
    queryFn: () => api.get('/appointments?status=confirmed&limit=3').then(r => r.data),
  });

  const billsQuery = useQuery<{ success: boolean; data: Invoice[] }>({
    queryKey: ['patient-dashboard', 'billing'],
    queryFn: () => api.get('/billing?limit=3').then(r => r.data),
  });

  const rxQuery = useQuery<{ success: boolean; data: Prescription[] }>({
    queryKey: ['patient-dashboard', 'prescriptions'],
    queryFn: () => api.get('/pharmacy/prescriptions?status=active').then(r => r.data),
  });

  const labQuery = useQuery<{ success: boolean; data: LabResult[] }>({
    queryKey: ['patient-dashboard', 'lab'],
    queryFn: () => api.get('/lab/results?limit=2').then(r => r.data),
  });

  const upcomingAppts = apptQuery.data?.data ?? [];
  const recentBills = billsQuery.data?.data ?? [];
  const activePrescriptions = rxQuery.data?.data ?? [];
  const labResults = labQuery.data?.data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Health Portal</h1>
        <p className="text-muted-foreground">
          Welcome, {user?.firstName} {user?.lastName}
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Upcoming Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            {apptQuery.isLoading ? (
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            ) : (
              <>
                <p className="text-2xl font-bold">{upcomingAppts.length}</p>
                <p className="text-xs text-muted-foreground mt-1">Confirmed</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Prescriptions</CardTitle>
          </CardHeader>
          <CardContent>
            {rxQuery.isLoading ? (
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            ) : (
              <>
                <p className="text-2xl font-bold">{activePrescriptions.length}</p>
                <p className="text-xs text-muted-foreground mt-1">On file</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Recent Bills</CardTitle>
          </CardHeader>
          <CardContent>
            {billsQuery.isLoading ? (
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            ) : (
              <>
                <p className="text-2xl font-bold">{recentBills.length}</p>
                <p className="text-xs text-muted-foreground mt-1">Last 3 invoices</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Lab Results</CardTitle>
          </CardHeader>
          <CardContent>
            {labQuery.isLoading ? (
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            ) : (
              <>
                <p className="text-2xl font-bold">{labResults.length}</p>
                <p className="text-xs text-muted-foreground mt-1">Recent results</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Appointments */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Appointments</CardTitle>
        </CardHeader>
        <CardContent>
          {apptQuery.isLoading && (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              ))}
            </div>
          )}
          {apptQuery.isError && (
            <p className="text-sm text-destructive">Failed to load appointments.</p>
          )}
          {!apptQuery.isLoading && !apptQuery.isError && upcomingAppts.length === 0 && (
            <p className="text-sm text-muted-foreground">No upcoming appointments.</p>
          )}
          {upcomingAppts.length > 0 && (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="pb-2 font-medium text-muted-foreground">Date</th>
                  <th className="pb-2 font-medium text-muted-foreground">Time</th>
                  <th className="pb-2 font-medium text-muted-foreground">Doctor</th>
                  <th className="pb-2 font-medium text-muted-foreground">Reason</th>
                </tr>
              </thead>
              <tbody>
                {upcomingAppts.map(appt => (
                  <tr key={appt._id} className="border-b last:border-0">
                    <td className="py-2">{appt.date ?? '—'}</td>
                    <td className="py-2">{appt.time ?? '—'}</td>
                    <td className="py-2">{appt.doctorName ?? '—'}</td>
                    <td className="py-2">{appt.reason ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <div className="mt-3">
            <Link to="/patient/appointments" className="text-sm text-primary hover:underline">View all appointments →</Link>
          </div>
        </CardContent>
      </Card>

      {/* Recent Bills */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Bills</CardTitle>
        </CardHeader>
        <CardContent>
          {billsQuery.isLoading && (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              ))}
            </div>
          )}
          {billsQuery.isError && (
            <p className="text-sm text-destructive">Failed to load bills.</p>
          )}
          {!billsQuery.isLoading && !billsQuery.isError && recentBills.length === 0 && (
            <p className="text-sm text-muted-foreground">No recent bills.</p>
          )}
          {recentBills.length > 0 && (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="pb-2 font-medium text-muted-foreground">Invoice</th>
                  <th className="pb-2 font-medium text-muted-foreground">Amount</th>
                  <th className="pb-2 font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentBills.map(bill => (
                  <tr key={bill._id} className="border-b last:border-0">
                    <td className="py-2">
                      <Link to={`/patient/billing/${bill._id}`} className="text-primary hover:underline">
                        {bill.invoiceId ?? bill._id.slice(-6)}
                      </Link>
                    </td>
                    <td className="py-2">${(bill.totalAmount ?? 0).toLocaleString()}</td>
                    <td className="py-2 capitalize">{bill.status ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <div className="mt-3">
            <Link to="/patient/billing" className="text-sm text-primary hover:underline">View all bills →</Link>
          </div>
        </CardContent>
      </Card>

      {/* My Prescriptions */}
      <Card>
        <CardHeader>
          <CardTitle>My Prescriptions</CardTitle>
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
              {activePrescriptions.length} active prescription{activePrescriptions.length !== 1 ? 's' : ''}.
            </p>
          )}
          <div className="mt-3">
            <Link to="/patient/prescriptions" className="text-sm text-primary hover:underline">View prescriptions →</Link>
          </div>
        </CardContent>
      </Card>

      {/* My Lab Results */}
      <Card>
        <CardHeader>
          <CardTitle>My Lab Results</CardTitle>
        </CardHeader>
        <CardContent>
          {labQuery.isLoading && (
            <div className="space-y-2">
              {[1, 2].map(i => (
                <div key={i} className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              ))}
            </div>
          )}
          {labQuery.isError && (
            <p className="text-sm text-destructive">Failed to load lab results.</p>
          )}
          {!labQuery.isLoading && !labQuery.isError && labResults.length === 0 && (
            <p className="text-sm text-muted-foreground">No lab results yet.</p>
          )}
          {labResults.length > 0 && (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="pb-2 font-medium text-muted-foreground">Test</th>
                  <th className="pb-2 font-medium text-muted-foreground">Status</th>
                  <th className="pb-2 font-medium text-muted-foreground">Date</th>
                </tr>
              </thead>
              <tbody>
                {labResults.map(result => (
                  <tr key={result._id} className="border-b last:border-0">
                    <td className="py-2">{result.testName ?? '—'}</td>
                    <td className="py-2 capitalize">{result.status ?? '—'}</td>
                    <td className="py-2">
                      {result.createdAt ? new Date(result.createdAt).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <div className="mt-3">
            <Link to="/patient/lab" className="text-sm text-primary hover:underline">View all lab results →</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
