import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '@/lib/api';
import { useAppSelector } from '@/store/hooks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AppointmentCard, AppointmentRecord } from '@/components/Shared/AppointmentCard';
import toast from 'react-hot-toast';

interface AppointmentsResponse {
  success: boolean;
  data: AppointmentRecord[];
}

interface PatientProfileResponse {
  success: boolean;
  data: {
    _id: string;
    patientId: string;
  };
}

type Tab = 'upcoming' | 'past';

export function PatientAppointments() {
  const user = useAppSelector((s) => s.auth.user);
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>('upcoming');

  // Fetch patient profile to get patient._id
  const { data: patientProfileData } = useQuery<PatientProfileResponse>({
    queryKey: ['patient', 'me', user?._id],
    queryFn: async () => {
      const res = await api.get('/patients/me');
      return res.data;
    },
    enabled: !!user?._id,
  });

  const patientId = patientProfileData?.data?._id;

  // Fetch appointments
  const { data: upcomingData, isLoading: upcomingLoading } = useQuery<AppointmentsResponse>({
    queryKey: ['appointments', 'patient', 'upcoming', patientId],
    queryFn: async () => {
      const params = new URLSearchParams({ patientId: patientId! });
      params.set('status', 'scheduled,confirmed');
      const res = await api.get(`/appointments?${params}`);
      return res.data;
    },
    enabled: !!patientId,
  });

  const { data: pastData, isLoading: pastLoading } = useQuery<AppointmentsResponse>({
    queryKey: ['appointments', 'patient', 'past', patientId],
    queryFn: async () => {
      const params = new URLSearchParams({ patientId: patientId! });
      params.set('status', 'completed,cancelled,noShow');
      const res = await api.get(`/appointments?${params}`);
      return res.data;
    },
    enabled: !!patientId && activeTab === 'past',
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/appointments/${id}`, {
        data: { cancelReason: 'Cancelled by patient' },
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Appointment cancelled');
      void queryClient.invalidateQueries({ queryKey: ['appointments', 'patient'] });
    },
    onError: () => {
      toast.error('Failed to cancel appointment');
    },
  });

  const upcomingAppointments = (upcomingData?.data ?? [])
    .slice()
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const pastAppointments = pastData?.data ?? [];
  const isLoading = upcomingLoading || (activeTab === 'past' && pastLoading);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Appointments</h1>
          <p className="text-muted-foreground">View and manage your appointments</p>
        </div>
        <Link
          to="/patient/book-appointment"
          className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
        >
          Book Appointment
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'upcoming'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setActiveTab('upcoming')}
        >
          Upcoming ({upcomingAppointments.length})
        </button>
        <button
          className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'past'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setActiveTab('past')}
        >
          Past
        </button>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            {activeTab === 'upcoming' ? 'Upcoming Appointments' : 'Past Appointments'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && <p className="text-sm text-muted-foreground">Loading appointments...</p>}

          {!isLoading && activeTab === 'upcoming' && upcomingAppointments.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No upcoming appointments</p>
              <Link
                to="/patient/book-appointment"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
              >
                Book an Appointment
              </Link>
            </div>
          )}

          {!isLoading && activeTab === 'past' && pastAppointments.length === 0 && (
            <p className="text-sm text-muted-foreground">No past appointments found.</p>
          )}

          <div className="space-y-3">
            {activeTab === 'upcoming' &&
              upcomingAppointments.map((appt) => (
                <AppointmentCard
                  key={appt._id}
                  appointment={appt}
                  viewAs="patient"
                  onCancel={(id) => cancelMutation.mutate(id)}
                />
              ))}

            {activeTab === 'past' &&
              pastAppointments.map((appt) => (
                <AppointmentCard key={appt._id} appointment={appt} viewAs="patient" />
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
