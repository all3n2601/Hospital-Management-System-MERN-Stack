import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell,
} from 'recharts';

// ---- types ----
interface AppointmentAnalytics {
  volumeByPeriod: { _id: string; count: number }[];
  byStatus: { _id: string; count: number }[];
  byDoctor: { _id: string; doctorName: string; count: number }[];
}

interface RevenueAnalytics {
  byMonth: { _id: string; revenue: number }[];
  outstanding: number;
  paymentMethods: { _id: string; count: number; total: number }[];
}

interface LabAnalytics {
  byPriority: { _id: string; count: number }[];
  byStatus: { _id: string; count: number }[];
  recentVolume: { _id: string; count: number }[];
}

interface PrescriptionAnalytics {
  byStatus: { _id: string; count: number }[];
  fillRate: number;
  topDrugs: { _id: string; count: number }[];
}

// ---- colors ----
const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6'];

// ---- skeleton ----
function SectionSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
      <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded" />
    </div>
  );
}

// ---- section error ----
function SectionError({ message }: { message: string }) {
  return (
    <p className="text-sm text-destructive py-4">{message}</p>
  );
}

export function AdminAnalytics() {
  const apptQuery = useQuery<{ success: boolean; data: AppointmentAnalytics }>({
    queryKey: ['analytics', 'appointments'],
    queryFn: () => api.get('/analytics/appointments').then(r => r.data),
  });

  const revenueQuery = useQuery<{ success: boolean; data: RevenueAnalytics }>({
    queryKey: ['analytics', 'revenue'],
    queryFn: () => api.get('/analytics/revenue').then(r => r.data),
  });

  const labQuery = useQuery<{ success: boolean; data: LabAnalytics }>({
    queryKey: ['analytics', 'lab'],
    queryFn: () => api.get('/analytics/lab').then(r => r.data),
  });

  const rxQuery = useQuery<{ success: boolean; data: PrescriptionAnalytics }>({
    queryKey: ['analytics', 'prescriptions'],
    queryFn: () => api.get('/analytics/prescriptions').then(r => r.data),
  });

  const appt = apptQuery.data?.data;
  const revenue = revenueQuery.data?.data;
  const lab = labQuery.data?.data;
  const rx = rxQuery.data?.data;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics</h1>
        <p className="text-muted-foreground">Hospital performance overview</p>
      </div>

      {/* ---- Appointments Section ---- */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Appointments</h2>
        {apptQuery.isLoading && <SectionSkeleton />}
        {apptQuery.isError && <SectionError message="Failed to load appointment analytics." />}
        {appt && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">Volume by Period</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={appt.volumeByPeriod}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="_id" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">By Status</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={appt.byStatus} dataKey="count" nameKey="_id" cx="50%" cy="50%" outerRadius={90} label={({ _id }) => _id}>
                      {appt.byStatus.map((_entry, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">Top Doctors by Appointments</CardTitle>
              </CardHeader>
              <CardContent>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left border-b">
                      <th className="pb-2 font-medium text-muted-foreground">Doctor</th>
                      <th className="pb-2 font-medium text-muted-foreground text-right">Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appt.byDoctor.map((row, i) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="py-2">{row.doctorName || row._id}</td>
                        <td className="py-2 text-right font-semibold">{row.count}</td>
                      </tr>
                    ))}
                    {appt.byDoctor.length === 0 && (
                      <tr><td colSpan={2} className="py-4 text-center text-muted-foreground">No data</td></tr>
                    )}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>
        )}
      </section>

      {/* ---- Revenue Section ---- */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Revenue</h2>
        {revenueQuery.isLoading && <SectionSkeleton />}
        {revenueQuery.isError && <SectionError message="Failed to load revenue analytics." />}
        {revenue && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">Revenue by Month</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={revenue.byMonth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="_id" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} />
                    <Line type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Outstanding Balance</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">${revenue.outstanding.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground mt-1">Total unpaid invoices</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Payment Methods</CardTitle>
                </CardHeader>
                <CardContent>
                  <table className="w-full text-sm">
                    <tbody>
                      {revenue.paymentMethods.map((row, i) => (
                        <tr key={i} className="border-b last:border-0">
                          <td className="py-1 capitalize">{row._id}</td>
                          <td className="py-1 text-right text-muted-foreground">{row.count}x</td>
                          <td className="py-1 text-right font-medium">${row.total.toLocaleString()}</td>
                        </tr>
                      ))}
                      {revenue.paymentMethods.length === 0 && (
                        <tr><td colSpan={3} className="py-3 text-center text-muted-foreground">No data</td></tr>
                      )}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </section>

      {/* ---- Lab Section ---- */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Lab</h2>
        {labQuery.isLoading && <SectionSkeleton />}
        {labQuery.isError && <SectionError message="Failed to load lab analytics." />}
        {lab && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">Orders by Priority</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={lab.byPriority}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="_id" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">Orders by Status</CardTitle>
              </CardHeader>
              <CardContent>
                <table className="w-full text-sm">
                  <tbody>
                    {lab.byStatus.map((row, i) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="py-2 capitalize">{row._id}</td>
                        <td className="py-2 text-right font-semibold">{row.count}</td>
                      </tr>
                    ))}
                    {lab.byStatus.length === 0 && (
                      <tr><td colSpan={2} className="py-3 text-center text-muted-foreground">No data</td></tr>
                    )}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">Recent Volume</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={lab.recentVolume}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="_id" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="count" stroke="#22c55e" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        )}
      </section>

      {/* ---- Prescriptions Section ---- */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Prescriptions</h2>
        {rxQuery.isLoading && <SectionSkeleton />}
        {rxQuery.isError && <SectionError message="Failed to load prescription analytics." />}
        {rx && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Fill Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{(rx.fillRate * 100).toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground mt-1">Prescriptions filled</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">By Status</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={rx.byStatus}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="_id" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">Top Drugs</CardTitle>
              </CardHeader>
              <CardContent>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left border-b">
                      <th className="pb-2 font-medium text-muted-foreground">Drug</th>
                      <th className="pb-2 font-medium text-muted-foreground text-right">Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rx.topDrugs.map((row, i) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="py-2">{row._id}</td>
                        <td className="py-2 text-right font-semibold">{row.count}</td>
                      </tr>
                    ))}
                    {rx.topDrugs.length === 0 && (
                      <tr><td colSpan={2} className="py-4 text-center text-muted-foreground">No data</td></tr>
                    )}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>
        )}
      </section>
    </div>
  );
}
