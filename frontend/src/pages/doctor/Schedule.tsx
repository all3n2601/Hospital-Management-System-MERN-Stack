import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAppSelector } from '@/store/hooks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { AppointmentCard, AppointmentRecord } from '@/components/Shared/AppointmentCard';

interface AppointmentsResponse {
  success: boolean;
  data: AppointmentRecord[];
}

interface DoctorProfileBundle {
  user: { _id: string };
  profile: { _id: string } | null;
}

interface DoctorProfileResponse {
  success: boolean;
  data: DoctorProfileBundle;
}

function formatDateForInput(d: Date): string {
  return d.toISOString().split('T')[0];
}

export function DoctorSchedule() {
  const user = useAppSelector((s) => s.auth.user);
  const queryClient = useQueryClient();

  const [selectedDate, setSelectedDate] = useState<string>(formatDateForInput(new Date()));

  // Fetch the doctor's own profile to get doctor._id
  const { data: profileData } = useQuery<DoctorProfileResponse>({
    queryKey: ['doctor', 'me', user?._id],
    queryFn: async () => {
      const res = await api.get(`/doctors/${user?._id}`);
      return res.data;
    },
    enabled: !!user?._id,
  });

  const doctorId = profileData?.data?.profile?._id;

  const { data, isLoading } = useQuery<AppointmentsResponse>({
    queryKey: ['appointments', 'doctor', selectedDate, doctorId],
    queryFn: async () => {
      const params = new URLSearchParams({ date: selectedDate });
      if (doctorId) params.set('doctorId', doctorId);
      const res = await api.get(`/appointments?${params}`);
      return res.data;
    },
    enabled: !!doctorId,
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await api.patch(`/appointments/${id}/status`, { status });
      return res.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['appointments', 'doctor', selectedDate, doctorId] });
    },
  });

  const appointments = data?.data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Schedule</h1>
        <p className="text-muted-foreground">View and manage your appointments</p>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <CardTitle className="text-base">Appointments</CardTitle>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full sm:w-48"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <p className="text-sm text-muted-foreground">Loading appointments...</p>
          )}
          {!isLoading && appointments.length === 0 && (
            <p className="text-sm text-muted-foreground">No appointments for this date.</p>
          )}
          <div className="space-y-3">
            {appointments.map((appt) => (
              <AppointmentCard
                key={appt._id}
                appointment={appt}
                viewAs="doctor"
                onConfirm={(id) => updateStatus.mutate({ id, status: 'confirmed' })}
                onStart={(id) => updateStatus.mutate({ id, status: 'inProgress' })}
                onComplete={(id) => updateStatus.mutate({ id, status: 'completed' })}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
