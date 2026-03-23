import { useEffect, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import toast from 'react-hot-toast';

interface HospitalSettings {
  hospitalName: string;
  address: string;
  logoUrl: string;
  defaultTaxRate: number;
  workingHoursStart: string;
  workingHoursEnd: string;
  timezone: string;
}

interface SettingsResponse {
  success: boolean;
  data: HospitalSettings;
}

export function AdminSettings() {
  const { data, isLoading, isError } = useQuery<SettingsResponse>({
    queryKey: ['settings'],
    queryFn: () => api.get('/settings').then(r => r.data),
  });

  const [form, setForm] = useState<HospitalSettings>({
    hospitalName: '',
    address: '',
    logoUrl: '',
    defaultTaxRate: 0,
    workingHoursStart: '08:00',
    workingHoursEnd: '17:00',
    timezone: 'UTC',
  });

  useEffect(() => {
    if (data?.data) {
      setForm(data.data);
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: (payload: HospitalSettings) => api.patch('/settings', payload).then(r => r.data),
    onSuccess: () => toast.success('Settings saved'),
    onError: () => toast.error('Failed to save settings'),
  });

  function handleChange(field: keyof HospitalSettings, value: string | number) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    saveMutation.mutate(form);
  }

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
        <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
    );
  }

  if (isError) {
    return <p className="text-sm text-destructive">Failed to load settings.</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-muted-foreground">Hospital configuration</p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Hospital Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="hospitalName">Hospital Name</Label>
              <Input
                id="hospitalName"
                value={form.hospitalName}
                onChange={e => handleChange('hospitalName', e.target.value)}
                placeholder="City General Hospital"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={form.address}
                onChange={e => handleChange('address', e.target.value)}
                placeholder="123 Main Street, City, State"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="logoUrl">Logo URL</Label>
              <Input
                id="logoUrl"
                value={form.logoUrl}
                onChange={e => handleChange('logoUrl', e.target.value)}
                placeholder="https://example.com/logo.png"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="defaultTaxRate">Default Tax Rate (%)</Label>
              <Input
                id="defaultTaxRate"
                type="number"
                min={0}
                max={100}
                step={0.01}
                value={form.defaultTaxRate}
                onChange={e => handleChange('defaultTaxRate', parseFloat(e.target.value) || 0)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="workingHoursStart">Working Hours Start</Label>
                <Input
                  id="workingHoursStart"
                  type="time"
                  value={form.workingHoursStart}
                  onChange={e => handleChange('workingHoursStart', e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="workingHoursEnd">Working Hours End</Label>
                <Input
                  id="workingHoursEnd"
                  type="time"
                  value={form.workingHoursEnd}
                  onChange={e => handleChange('workingHoursEnd', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="timezone">Timezone</Label>
              <Input
                id="timezone"
                value={form.timezone}
                onChange={e => handleChange('timezone', e.target.value)}
                placeholder="UTC"
              />
            </div>

            <div className="pt-2">
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? 'Saving…' : 'Save Settings'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
