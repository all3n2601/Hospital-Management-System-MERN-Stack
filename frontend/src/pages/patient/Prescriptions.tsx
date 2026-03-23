import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/Shared/StatusBadge';
import { DataTable, ColumnDef } from '@/components/Shared/DataTable';
import type { Prescription } from '@/types/pharmacy';

interface PrescriptionsResponse {
  success: boolean;
  data: Prescription[];
}

export function PatientPrescriptions() {
  const [detailId, setDetailId] = useState<string | null>(null);

  const { data, isLoading, isError } = useQuery<PrescriptionsResponse>({
    queryKey: ['prescriptions', 'patient'],
    queryFn: async () => {
      const res = await api.get('/pharmacy/prescriptions');
      return res.data;
    },
  });

  const { data: detailData, isLoading: detailLoading } = useQuery<{ success: boolean; data: Prescription }>({
    queryKey: ['prescription', detailId],
    queryFn: async () => {
      const res = await api.get(`/pharmacy/prescriptions/${detailId}`);
      return res.data;
    },
    enabled: !!detailId,
  });

  const prescriptions = data?.data ?? [];
  const detailPrescription = detailData?.data ?? null;

  const columns: ColumnDef<Prescription>[] = [
    {
      header: 'Prescription ID',
      accessorKey: 'prescriptionId',
    },
    {
      header: 'Doctor',
      accessorKey: 'doctor',
      cell: (row) =>
        `${row.doctor?.userId?.firstName ?? ''} ${row.doctor?.userId?.lastName ?? ''}`.trim() || '—',
    },
    {
      header: 'Date',
      accessorKey: 'createdAt',
      cell: (row) => new Date(row.createdAt).toLocaleDateString(),
    },
    {
      header: 'Medications',
      accessorKey: 'lineItems',
      cell: (row) => row.lineItems.map((item) => item.drugName).join(', ') || '—',
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: 'Actions',
      accessorKey: '_id',
      cell: (row) => (
        <Button variant="outline" size="sm" onClick={() => setDetailId(row._id)}>
          View
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Prescriptions</h1>
        <p className="text-muted-foreground">View your prescription history</p>
      </div>

      <Card>
        <CardHeader className="pb-2" />
        <CardContent>
          {isError ? (
            <p className="text-center py-8 text-red-600">Failed to load prescriptions. Please try again.</p>
          ) : (
            <DataTable
              data={prescriptions}
              columns={columns}
              isLoading={isLoading}
              emptyMessage="No prescriptions found"
            />
          )}
        </CardContent>
      </Card>

      {/* Detail Panel */}
      {detailId && (
        <Card className="mt-6">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Prescription Detail</h2>
              <Button variant="outline" size="sm" onClick={() => setDetailId(null)}>
                ✕ Close
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {detailLoading ? (
              <div className="space-y-3 animate-pulse py-4">
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
                <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded" />
              </div>
            ) : detailPrescription ? (
              <div className="space-y-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-lg font-semibold">{detailPrescription.prescriptionId}</p>
                    <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted-foreground">
                      <span>Date: {new Date(detailPrescription.createdAt).toLocaleDateString()}</span>
                      <span>
                        Doctor:{' '}
                        {`${detailPrescription.doctor?.userId?.firstName ?? ''} ${detailPrescription.doctor?.userId?.lastName ?? ''}`.trim() || '—'}
                      </span>
                    </div>
                  </div>
                  <StatusBadge status={detailPrescription.status} />
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">Medications</p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left text-muted-foreground">
                          <th className="pb-2 pr-4 font-medium">Drug</th>
                          <th className="pb-2 pr-4 font-medium">Dosage</th>
                          <th className="pb-2 pr-4 font-medium">Frequency</th>
                          <th className="pb-2 pr-4 font-medium">Duration</th>
                          <th className="pb-2 font-medium">Qty</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {detailPrescription.lineItems.map((item, idx) => (
                          <tr key={idx}>
                            <td className="py-2 pr-4">{item.drugName}</td>
                            <td className="py-2 pr-4">{item.dosage}</td>
                            <td className="py-2 pr-4">{item.frequency}</td>
                            <td className="py-2 pr-4">{item.duration}</td>
                            <td className="py-2">{item.quantity ?? '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {detailPrescription.notes && (
                  <div>
                    <p className="text-sm font-medium mb-1">Notes</p>
                    <p className="text-sm text-muted-foreground">{detailPrescription.notes}</p>
                  </div>
                )}

                {detailPrescription.dispensedBy && (
                  <div className="text-xs text-muted-foreground">
                    Dispensed by: {detailPrescription.dispensedBy.firstName} {detailPrescription.dispensedBy.lastName}
                    {detailPrescription.dispensedAt && (
                      <span className="ml-2">on {new Date(detailPrescription.dispensedAt).toLocaleDateString()}</span>
                    )}
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" onClick={() => setDetailId(null)}>
                    Close
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-4">Prescription not found.</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
