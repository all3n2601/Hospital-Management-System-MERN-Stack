import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { StatusBadge } from '@/components/Shared/StatusBadge';
import { DataTable, ColumnDef } from '@/components/Shared/DataTable';
import type { Prescription, PrescriptionStatus, PrescriptionLineItem } from '@/types/pharmacy';
import toast from 'react-hot-toast';

interface PrescriptionsResponse {
  success: boolean;
  data: Prescription[];
}

type StatusFilter = 'all' | PrescriptionStatus;

const STATUS_TABS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'active', label: 'Active' },
  { value: 'dispensed', label: 'Dispensed' },
  { value: 'cancelled', label: 'Cancelled' },
];

interface LineItemInput {
  drugName: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: string;
}

const emptyLineItem = (): LineItemInput => ({
  drugName: '',
  dosage: '',
  frequency: '',
  duration: '',
  quantity: '',
});

export function DoctorPrescriptions() {
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);

  // Create form state
  const [patientId, setPatientId] = useState('');
  const [lineItems, setLineItems] = useState<LineItemInput[]>([emptyLineItem()]);
  const [notes, setNotes] = useState('');

  // Main query
  const { data, isLoading, isError } = useQuery<PrescriptionsResponse>({
    queryKey: ['prescriptions', 'doctor', statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      const res = await api.get(`/pharmacy/prescriptions?${params}`);
      return res.data;
    },
  });

  // Detail query
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

  const addLineItem = () => setLineItems((prev) => [...prev, emptyLineItem()]);
  const removeLineItem = (i: number) => setLineItems((prev) => prev.filter((_, idx) => idx !== i));
  const updateLineItem = (i: number, field: keyof LineItemInput, value: string) =>
    setLineItems((prev) => prev.map((item, idx) => (idx === i ? { ...item, [field]: value } : item)));

  const resetCreateForm = () => {
    setPatientId('');
    setLineItems([emptyLineItem()]);
    setNotes('');
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      const body = {
        patientId: patientId.trim(),
        lineItems: lineItems.map((item) => ({
          drugName: item.drugName.trim(),
          dosage: item.dosage.trim(),
          frequency: item.frequency.trim(),
          duration: item.duration.trim(),
          quantity: item.quantity ? Number(item.quantity) : undefined,
        })) as Partial<PrescriptionLineItem>[],
        notes: notes.trim() || undefined,
      };
      const res = await api.post('/pharmacy/prescriptions', body);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Prescription created');
      setCreateOpen(false);
      resetCreateForm();
      void queryClient.invalidateQueries({ queryKey: ['prescriptions', 'doctor'] });
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
          ?.message ?? 'Failed to create prescription';
      toast.error(msg);
    },
  });

  const activateMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.patch(`/pharmacy/prescriptions/${id}/activate`);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Prescription activated');
      void queryClient.invalidateQueries({ queryKey: ['prescriptions', 'doctor'] });
      void queryClient.invalidateQueries({ queryKey: ['prescription', detailId] });
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
          ?.message ?? 'Failed to activate prescription';
      toast.error(msg);
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.patch(`/pharmacy/prescriptions/${id}/cancel`);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Prescription cancelled');
      void queryClient.invalidateQueries({ queryKey: ['prescriptions', 'doctor'] });
      void queryClient.invalidateQueries({ queryKey: ['prescription', detailId] });
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
          ?.message ?? 'Failed to cancel prescription';
      toast.error(msg);
    },
  });

  const handleCreateSubmit = () => {
    if (!patientId.trim()) {
      toast.error('Patient ID is required');
      return;
    }
    if (lineItems.length === 0) {
      toast.error('At least one line item is required');
      return;
    }
    const invalid = lineItems.some(
      (item) => !item.drugName.trim() || !item.dosage.trim() || !item.frequency.trim() || !item.duration.trim()
    );
    if (invalid) {
      toast.error('All line items must have drug name, dosage, frequency, and duration');
      return;
    }
    createMutation.mutate();
  };

  const columns: ColumnDef<Prescription>[] = [
    {
      header: 'Prescription ID',
      accessorKey: 'prescriptionId',
    },
    {
      header: 'Patient',
      accessorKey: 'patient',
      cell: (row) =>
        `${row.patient?.userId?.firstName ?? ''} ${row.patient?.userId?.lastName ?? ''}`.trim() || '—',
    },
    {
      header: 'Date',
      accessorKey: 'createdAt',
      cell: (row) => new Date(row.createdAt).toLocaleDateString(),
    },
    {
      header: 'Items',
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
      {/* Page heading */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Prescriptions</h1>
          <p className="text-muted-foreground">Manage and track prescriptions</p>
        </div>
        <Button onClick={() => { setCreateOpen(true); resetCreateForm(); }}>
          Create Prescription
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-wrap gap-2">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={[
                  'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                  statusFilter === tab.value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80',
                ].join(' ')}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </CardHeader>
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

      {/* Create Prescription Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl" onClose={() => setCreateOpen(false)}>
          <DialogHeader>
            <DialogTitle>Create Prescription</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="patientId">Patient ID</Label>
              <Input
                id="patientId"
                placeholder="MongoDB _id of the patient record"
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                className="mt-1"
              />
            </div>

            {/* Line Items */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Medications</Label>
                <Button type="button" variant="outline" size="sm" onClick={addLineItem}>
                  Add Medication
                </Button>
              </div>
              <div className="space-y-3">
                {lineItems.map((item, i) => (
                  <div key={i} className="border rounded-md p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">Item {i + 1}</span>
                      {lineItems.length > 1 && (
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => removeLineItem(i)}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Drug Name</Label>
                        <Input
                          placeholder="e.g. Amoxicillin"
                          value={item.drugName}
                          onChange={(e) => updateLineItem(i, 'drugName', e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Dosage</Label>
                        <Input
                          placeholder="e.g. 500mg"
                          value={item.dosage}
                          onChange={(e) => updateLineItem(i, 'dosage', e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Frequency</Label>
                        <Input
                          placeholder="e.g. 3x daily"
                          value={item.frequency}
                          onChange={(e) => updateLineItem(i, 'frequency', e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Duration</Label>
                        <Input
                          placeholder="e.g. 7 days"
                          value={item.duration}
                          onChange={(e) => updateLineItem(i, 'duration', e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Quantity (optional)</Label>
                        <Input
                          type="number"
                          placeholder="e.g. 21"
                          value={item.quantity}
                          onChange={(e) => updateLineItem(i, 'quantity', e.target.value)}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Optional notes"
                className="mt-1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateSubmit} disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                        Patient:{' '}
                        {`${detailPrescription.patient?.userId?.firstName ?? ''} ${detailPrescription.patient?.userId?.lastName ?? ''}`.trim() || '—'}
                      </span>
                    </div>
                  </div>
                  <StatusBadge status={detailPrescription.status} />
                </div>

                {/* Line Items */}
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
                  {detailPrescription.status === 'draft' && (
                    <Button
                      variant="outline"
                      onClick={() => activateMutation.mutate(detailPrescription._id)}
                      disabled={activateMutation.isPending}
                    >
                      {activateMutation.isPending ? 'Activating...' : 'Activate'}
                    </Button>
                  )}
                  {(detailPrescription.status === 'draft' || detailPrescription.status === 'active') && (
                    <Button
                      variant="destructive"
                      onClick={() => cancelMutation.mutate(detailPrescription._id)}
                      disabled={cancelMutation.isPending}
                    >
                      {cancelMutation.isPending ? 'Cancelling...' : 'Cancel'}
                    </Button>
                  )}
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
