import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const KPI_CARDS = [
  { title: 'Total Patients', value: '1,284', change: '+12% this month' },
  { title: 'Appointments Today', value: '48', change: '6 pending' },
  { title: 'Revenue (MTD)', value: '$84,320', change: '+8.2% vs last month' },
  { title: 'Staff on Duty', value: '32', change: '4 on leave' },
];

export function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
        <p className="text-muted-foreground">Hospital overview and key metrics</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {KPI_CARDS.map((card) => (
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
          <p className="text-muted-foreground text-sm">Activity feed will be implemented in a later phase.</p>
        </CardContent>
      </Card>
    </div>
  );
}
