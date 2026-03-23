import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppSelector } from '@/store/hooks';

export function PatientDashboard() {
  const user = useAppSelector(s => s.auth.user);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Health Portal</h1>
        <p className="text-muted-foreground">
          Welcome, {user?.firstName} {user?.lastName}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Upcoming Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">2</p>
            <p className="text-xs text-muted-foreground mt-1">Next: Tomorrow 10:00 AM</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Prescriptions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">3</p>
            <p className="text-xs text-muted-foreground mt-1">1 requires renewal</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Bills</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">$240</p>
            <p className="text-xs text-muted-foreground mt-1">Due in 14 days</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Visit History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">Visit history will be implemented in a later phase.</p>
        </CardContent>
      </Card>
    </div>
  );
}
