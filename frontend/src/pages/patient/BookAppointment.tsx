import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { useAppSelector } from '@/store/hooks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import toast from 'react-hot-toast';

interface DoctorProfile {
  _id: string;
  doctorId: string;
  specialization: string;
  consultationFee: number;
  userId: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface DoctorsResponse {
  success: boolean;
  data: DoctorProfile[];
}

interface SlotsResponse {
  success: boolean;
  data: string[];
}

interface PatientProfileResponse {
  success: boolean;
  data: {
    _id: string;
    patientId: string;
  };
}

function formatDateForInput(d: Date): string {
  return d.toISOString().split('T')[0];
}

const tomorrowDate = (() => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return formatDateForInput(d);
})();

export function BookAppointment() {
  const user = useAppSelector((s) => s.auth.user);
  const navigate = useNavigate();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedSpecialization, setSelectedSpecialization] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [selectedDate, setSelectedDate] = useState(tomorrowDate);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [appointmentType, setAppointmentType] = useState<'consultation' | 'follow-up' | 'procedure'>('consultation');
  const [reason, setReason] = useState('');

  // Fetch patient profile to get patient._id
  const { data: patientProfileData } = useQuery<PatientProfileResponse>({
    queryKey: ['patient', 'me', user?._id],
    queryFn: async () => {
      const res = await api.get('/patients/me');
      return res.data;
    },
    enabled: !!user?._id,
  });

  // Fetch all active doctors
  const { data: doctorsData, isLoading: doctorsLoading } = useQuery<DoctorsResponse>({
    queryKey: ['doctors', 'active'],
    queryFn: async () => {
      const res = await api.get('/doctors?isActive=true&limit=100');
      return res.data;
    },
  });

  const doctors = doctorsData?.data ?? [];
  const specializations = [...new Set(doctors.map((d) => d.specialization))].sort();

  const filteredDoctors = selectedSpecialization
    ? doctors.filter((d) => d.specialization === selectedSpecialization)
    : doctors;

  // Fetch available slots for the selected doctor + date
  const { data: slotsData, isLoading: slotsLoading } = useQuery<SlotsResponse>({
    queryKey: ['slots', selectedDoctorId, selectedDate],
    queryFn: async () => {
      const params = new URLSearchParams({ doctorId: selectedDoctorId, date: selectedDate });
      const res = await api.get(`/appointments/slots?${params}`);
      return res.data;
    },
    enabled: !!selectedDoctorId && !!selectedDate && step === 2,
  });

  const slots = slotsData?.data ?? [];

  const bookMutation = useMutation({
    mutationFn: async () => {
      const patientId = patientProfileData?.data?._id;
      if (!patientId) throw new Error('Patient profile not loaded');
      const res = await api.post('/appointments', {
        doctorId: selectedDoctorId,
        patientId,
        date: selectedDate,
        timeSlot: selectedSlot,
        type: appointmentType,
        reason: reason || undefined,
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Appointment booked successfully!');
      void navigate('/patient/appointments');
    },
    onError: (err: unknown) => {
      const message =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ??
        'Failed to book appointment';
      toast.error(message);
    },
  });

  const selectedDoctor = doctors.find((d) => d._id === selectedDoctorId);

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Book an Appointment</h1>
        <p className="text-muted-foreground">Schedule a visit with one of our doctors</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 text-sm">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`flex items-center gap-1 ${
              s === step ? 'text-primary font-semibold' : s < step ? 'text-green-600' : 'text-muted-foreground'
            }`}
          >
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs border ${
                s === step
                  ? 'border-primary bg-primary text-primary-foreground'
                  : s < step
                    ? 'border-green-600 bg-green-600 text-white'
                    : 'border-muted-foreground'
              }`}
            >
              {s}
            </span>
            {s === 1 && 'Select Doctor'}
            {s === 2 && 'Choose Slot'}
            {s === 3 && 'Confirm'}
            {s < 3 && <span className="mx-1 text-muted-foreground">›</span>}
          </div>
        ))}
      </div>

      {/* Step 1: Select doctor */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 1: Select a Doctor</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Filter by Specialization</Label>
              <select
                className="mt-1 w-full border rounded-md p-2 bg-background text-foreground text-sm"
                value={selectedSpecialization}
                onChange={(e) => {
                  setSelectedSpecialization(e.target.value);
                  setSelectedDoctorId('');
                }}
              >
                <option value="">All Specializations</option>
                {specializations.map((spec) => (
                  <option key={spec} value={spec}>
                    {spec}
                  </option>
                ))}
              </select>
            </div>

            {doctorsLoading && <p className="text-sm text-muted-foreground">Loading doctors...</p>}

            <div className="space-y-2">
              {filteredDoctors.map((doc) => (
                <div
                  key={doc._id}
                  className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                    selectedDoctorId === doc._id
                      ? 'border-primary bg-primary/5'
                      : 'hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedDoctorId(doc._id)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">
                        Dr. {doc.userId?.firstName} {doc.userId?.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground">{doc.specialization}</p>
                    </div>
                    <p className="text-sm font-medium">${doc.consultationFee}</p>
                  </div>
                </div>
              ))}
              {!doctorsLoading && filteredDoctors.length === 0 && (
                <p className="text-sm text-muted-foreground">No doctors found.</p>
              )}
            </div>

            <Button
              className="w-full"
              disabled={!selectedDoctorId}
              onClick={() => setStep(2)}
            >
              Next: Choose Slot
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Choose slot */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 2: Choose a Time Slot</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Date</Label>
              <Input
                type="date"
                value={selectedDate}
                min={tomorrowDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setSelectedSlot('');
                }}
                className="mt-1"
              />
            </div>

            {slotsLoading && <p className="text-sm text-muted-foreground">Loading available slots...</p>}

            {!slotsLoading && slots.length === 0 && (
              <p className="text-sm text-muted-foreground">No available slots for this date.</p>
            )}

            {slots.length > 0 && (
              <div>
                <Label>Available Slots</Label>
                <div className="mt-2 grid grid-cols-4 gap-2">
                  {slots.map((slot) => (
                    <button
                      key={slot}
                      className={`border rounded p-2 text-sm font-medium transition-colors ${
                        selectedSlot === slot
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'hover:border-primary/50'
                      }`}
                      onClick={() => setSelectedSlot(slot)}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                Back
              </Button>
              <Button
                disabled={!selectedSlot}
                onClick={() => setStep(3)}
                className="flex-1"
              >
                Next: Confirm
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Confirm */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 3: Confirm Booking</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-secondary/30 p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Doctor</span>
                <span className="font-medium">
                  Dr. {selectedDoctor?.userId?.firstName} {selectedDoctor?.userId?.lastName}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Specialization</span>
                <span className="font-medium">{selectedDoctor?.specialization}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Date</span>
                <span className="font-medium">
                  {new Date(selectedDate + 'T12:00:00Z').toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Time</span>
                <span className="font-medium">{selectedSlot}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Fee</span>
                <span className="font-medium">${selectedDoctor?.consultationFee}</span>
              </div>
            </div>

            <div>
              <Label>Appointment Type</Label>
              <select
                className="mt-1 w-full border rounded-md p-2 bg-background text-foreground text-sm"
                value={appointmentType}
                onChange={(e) => setAppointmentType(e.target.value as typeof appointmentType)}
              >
                <option value="consultation">Consultation</option>
                <option value="follow-up">Follow-up</option>
                <option value="procedure">Procedure</option>
              </select>
            </div>

            <div>
              <Label>Reason for Visit (optional)</Label>
              <Input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Describe your symptoms or reason..."
                className="mt-1"
              />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                Back
              </Button>
              <Button
                onClick={() => bookMutation.mutate()}
                disabled={bookMutation.isPending}
                className="flex-1"
              >
                {bookMutation.isPending ? 'Booking...' : 'Confirm Booking'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
