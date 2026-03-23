import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { DataTable, ColumnDef } from '@/components/Shared/DataTable';
import { StatusBadge } from '@/components/Shared/StatusBadge';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

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
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const limit = 20;

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

  const patients = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Patients</h1>
        <p className="text-muted-foreground">Manage and view all patient records</p>
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
    </div>
  );
}
