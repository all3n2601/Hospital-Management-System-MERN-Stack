import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppSelector } from '@/store/hooks';

const ADMIN_KPI_CARDS = [
  { title: 'Total Patients', value: '1,284', change: '+12% this month' },
  { title: 'Appointments Today', value: '48', change: '6 pending' },
  { title: 'Revenue (MTD)', value: '$84,320', change: '+8.2% vs last month' },
  { title: 'Staff on Duty', value: '32', change: '4 on leave' },
];

const RECEPTIONIST_QUICK_LINKS = [
  { label: 'Patients', to: '/admin/patients' },
  { label: 'Billing', to: '/admin/billing' },
  { label: 'Lab', to: '/admin/lab' },
  { label: 'Pharmacy', to: '/admin/pharmacy' },
];

export function AdminDashboard() {
  const user = useAppSelector(s => s.auth.user);
  const isReceptionist = user?.role === 'receptionist';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {isReceptionist ? 'Receptionist Dashboard' : 'Admin Dashboard'}
        </h1>
        <p className="text-muted-foreground">
          {isReceptionist
            ? `Welcome, ${user?.firstName} ${user?.lastName}`
            : 'Hospital overview and key metrics'}
        </p>
      </div>

      {isReceptionist ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Appointments Today</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">—</p>
                <p className="text-xs text-muted-foreground mt-1">Check scheduling system</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Pending Bills</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">—</p>
                <p className="text-xs text-muted-foreground mt-1">Open invoices</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Quick Links</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {RECEPTIONIST_QUICK_LINKS.map(link => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className="text-sm text-primary hover:underline"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {ADMIN_KPI_CARDS.map((card) => (
              <Card key={card.title}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{card.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{card.change}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                View detailed analytics in the{' '}
                <Link to="/admin/analytics" className="text-primary hover:underline">Analytics</Link> section.
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
