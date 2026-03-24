import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAppSelector } from '@/store/hooks';
import { DataTable, ColumnDef } from '@/components/Shared/DataTable';
import { StatusBadge } from '@/components/Shared/StatusBadge';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import toast from 'react-hot-toast';

interface PatientUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
}

interface PatientRecord {
  _id: string;
  patientId: string;
  bloodGroup?: string;
  userId: PatientUser;
  createdAt: string;
}

interface PatientsResponse {
  success: boolean;
  data: PatientRecord[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'] as const;

const columns: ColumnDef<PatientRecord>[] = [
  {
    header: 'Patient ID',
    accessorKey: 'patientId',
  },
  {
    header: 'Name',
    accessorKey: 'userId',
    cell: (row) => `${row.userId?.firstName ?? ''} ${row.userId?.lastName ?? ''}`,
  },
  {
    header: 'Blood Group',
    accessorKey: 'bloodGroup',
    cell: (row) => row.bloodGroup ?? '—',
  },
  {
    header: 'Email',
    accessorKey: 'userId.email',
    cell: (row) => row.userId?.email ?? '—',
  },
  {
    header: 'Status',
    accessorKey: 'userId.isActive',
    cell: (row) => (
      <StatusBadge status={row.userId?.isActive ? 'active' : 'inactive'} />
    ),
  },
  {
    header: 'Registered',
    accessorKey: 'createdAt',
    cell: (row) => new Date(row.createdAt).toLocaleDateString(),
  },
];

export function AdminPatients() {
  const queryClient = useQueryClient();
  const user = useAppSelector((s) => s.auth.user);
  const canRegisterPatient = user?.role === 'admin' || user?.role === 'receptionist';

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const limit = 20;

  const [createOpen, setCreateOpen] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other' | ''>('');
  const [bloodGroup, setBloodGroup] = useState<string>('');

  const resetCreateForm = () => {
    setFirstName('');
    setLastName('');
    setEmail('');
    setPassword('');
    setPhone('');
    setDob('');
    setGender('');
    setBloodGroup('');
  };

  const { data, isLoading } = useQuery<PatientsResponse>({
    queryKey: ['patients', page, search],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        ...(search ? { search } : {}),
      });
      const res = await api.get(`/patients?${params}`);
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const body: Record<string, unknown> = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        password: password,
        ...(phone.trim() ? { phone: phone.trim() } : {}),
        ...(dob ? { dob } : {}),
        ...(gender ? { gender } : {}),
        ...(bloodGroup ? { bloodGroup } : {}),
      };
      const res = await api.post('/patients', body);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Patient registered');
      setCreateOpen(false);
      resetCreateForm();
      void queryClient.invalidateQueries({ queryKey: ['patients'] });
      void queryClient.invalidateQueries({ queryKey: ['entity-select', 'patients'] });
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
          ?.message ?? 'Failed to create patient';
      toast.error(msg);
    },
  });

  const handleCreateSubmit = () => {
    if (!firstName.trim() || !lastName.trim()) {
      toast.error('First and last name are required');
      return;
    }
    if (!email.trim()) {
      toast.error('Email is required');
      return;
    }
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    createMutation.mutate();
  };

  const patients = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Patients</h1>
          <p className="text-muted-foreground">Manage and view all patient records</p>
        </div>
        {canRegisterPatient && (
          <Button
            onClick={() => {
              resetCreateForm();
              setCreateOpen(true);
            }}
          >
            Register patient
          </Button>
        )}
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <CardTitle className="text-base">Patient List</CardTitle>
            <Input
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full sm:w-64"
            />
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            data={patients}
            columns={columns}
            isLoading={isLoading}
            emptyMessage="No patients found"
          />

          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Page {meta.page} of {meta.totalPages} — {meta.total} total patients
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= (meta.totalPages ?? 1)}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" onClose={() => setCreateOpen(false)}>
          <DialogHeader>
            <DialogTitle>Register new patient</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="fn">First name</Label>
                <Input
                  id="fn"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="mt-1"
                  autoComplete="given-name"
                />
              </div>
              <div>
                <Label htmlFor="ln">Last name</Label>
                <Input
                  id="ln"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="mt-1"
                  autoComplete="family-name"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="em">Email</Label>
              <Input
                id="em"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1"
                autoComplete="email"
              />
            </div>
            <div>
              <Label htmlFor="pw">Temporary password</Label>
              <Input
                id="pw"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1"
                autoComplete="new-password"
              />
              <p className="text-xs text-muted-foreground mt-1">Minimum 8 characters. Patient can change after login.</p>
            </div>
            <div>
              <Label htmlFor="ph">Phone (optional)</Label>
              <Input
                id="ph"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="dob">Date of birth (optional)</Label>
              <Input id="dob" type="date" value={dob} onChange={(e) => setDob(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="gen">Gender (optional)</Label>
              <Select id="gen" value={gender} onChange={(e) => setGender(e.target.value as typeof gender)} className="mt-1">
                <option value="">—</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="bg">Blood group (optional)</Label>
              <Select id="bg" value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)} className="mt-1">
                <option value="">—</option>
                {BLOOD_GROUPS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateSubmit} disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Saving…' : 'Create patient'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
