import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { DataTable, ColumnDef } from '@/components/Shared/DataTable';
import { StatusBadge } from '@/components/Shared/StatusBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import toast from 'react-hot-toast';

interface StaffUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isActive: boolean;
}

interface DoctorProfile {
  _id: string;
  doctorId?: string;
  nurseId?: string;
  receptionistId?: string;
  specialization?: string;
  department?: { _id: string; name: string } | null;
  userId: StaffUser;
  isActive: boolean;
}

interface StaffEntry {
  role: string;
  profile: DoctorProfile;
}

interface StaffResponse {
  success: boolean;
  data: StaffEntry[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface DepartmentRecord {
  _id: string;
  name: string;
}

interface CreateStaffForm {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: 'doctor' | 'nurse' | 'receptionist';
  specialization: string;
  departmentId: string;
  qualification: string;
  shift: 'morning' | 'afternoon' | 'night';
}

const columns: ColumnDef<StaffEntry>[] = [
  {
    header: 'Staff ID',
    accessorKey: 'profile',
    cell: (row) =>
      row.profile.doctorId ?? row.profile.nurseId ?? row.profile.receptionistId ?? '—',
  },
  {
    header: 'Name',
    accessorKey: 'profile.userId',
    cell: (row) =>
      `${row.profile.userId?.firstName ?? ''} ${row.profile.userId?.lastName ?? ''}`,
  },
  {
    header: 'Role',
    accessorKey: 'role',
    cell: (row) => (
      <span className="capitalize">{row.role}</span>
    ),
  },
  {
    header: 'Specialization',
    accessorKey: 'profile.specialization',
    cell: (row) => row.profile.specialization ?? '—',
  },
  {
    header: 'Department',
    accessorKey: 'profile.department',
    cell: (row) => row.profile.department?.name ?? '—',
  },
  {
    header: 'Email',
    accessorKey: 'profile.userId.email',
    cell: (row) => row.profile.userId?.email ?? '—',
  },
  {
    header: 'Status',
    accessorKey: 'profile.isActive',
    cell: (row) => (
      <StatusBadge status={row.profile.isActive ? 'active' : 'inactive'} />
    ),
  },
];

const defaultForm: CreateStaffForm = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  role: 'doctor',
  specialization: '',
  departmentId: '',
  qualification: '',
  shift: 'morning',
};

export function AdminStaff() {
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<CreateStaffForm>(defaultForm);
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<StaffResponse>({
    queryKey: ['staff', page],
    queryFn: async () => {
      const res = await api.get(`/staff?page=${page}&limit=20`);
      return res.data;
    },
  });

  const { data: deptData } = useQuery<{ success: boolean; data: DepartmentRecord[] }>({
    queryKey: ['departments'],
    queryFn: async () => {
      const res = await api.get('/departments');
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: Omit<CreateStaffForm, 'qualification'> & { qualification: string[] }) => {
      const res = await api.post('/staff', payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Staff member created successfully');
      setModalOpen(false);
      setForm(defaultForm);
      queryClient.invalidateQueries({ queryKey: ['staff'] });
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
          ?.message ?? 'Failed to create staff member';
      toast.error(msg);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      ...form,
      qualification: form.qualification
        ? form.qualification.split(',').map((q) => q.trim()).filter(Boolean)
        : [],
    });
  };

  const staff = data?.data ?? [];
  const meta = data?.meta;
  const departments = deptData?.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Staff</h1>
          <p className="text-muted-foreground">Manage hospital staff members</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>Add Staff</Button>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Staff List</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={staff}
            columns={columns}
            isLoading={isLoading}
            emptyMessage="No staff members found"
          />

          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Page {meta.page} of {meta.totalPages} — {meta.total} total staff
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

      {/* Add Staff Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent onClose={() => setModalOpen(false)}>
          <DialogHeader>
            <DialogTitle>Add Staff Member</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                minLength={8}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="role">Role</Label>
              <Select
                id="role"
                value={form.role}
                onChange={(e) =>
                  setForm({ ...form, role: e.target.value as CreateStaffForm['role'] })
                }
                required
              >
                <option value="doctor">Doctor</option>
                <option value="nurse">Nurse</option>
                <option value="receptionist">Receptionist</option>
              </Select>
            </div>

            {form.role === 'doctor' && (
              <div className="space-y-1">
                <Label htmlFor="specialization">Specialization</Label>
                <Input
                  id="specialization"
                  value={form.specialization}
                  onChange={(e) => setForm({ ...form, specialization: e.target.value })}
                  required={form.role === 'doctor'}
                />
              </div>
            )}

            {form.role === 'nurse' && (
              <div className="space-y-1">
                <Label htmlFor="shift">Shift</Label>
                <Select
                  id="shift"
                  value={form.shift}
                  onChange={(e) =>
                    setForm({ ...form, shift: e.target.value as CreateStaffForm['shift'] })
                  }
                >
                  <option value="morning">Morning</option>
                  <option value="afternoon">Afternoon</option>
                  <option value="night">Night</option>
                </Select>
              </div>
            )}

            <div className="space-y-1">
              <Label htmlFor="departmentId">Department</Label>
              <Select
                id="departmentId"
                value={form.departmentId}
                onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
                placeholder="Select department (optional)"
              >
                {departments.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.name}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="qualification">Qualifications (comma-separated)</Label>
              <Input
                id="qualification"
                placeholder="e.g. MBBS, MD"
                value={form.qualification}
                onChange={(e) => setForm({ ...form, qualification: e.target.value })}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating...' : 'Create Staff'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
