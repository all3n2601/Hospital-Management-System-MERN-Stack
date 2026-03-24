import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAppSelector } from '@/store/hooks';
import { usePatientsSelectQuery, useMyDoctorProfileId, patientSelectLabel } from '@/hooks/useEntitySelectData';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { StatusBadge } from '@/components/Shared/StatusBadge';
import { DataTable, ColumnDef } from '@/components/Shared/DataTable';
import type { LabOrder, LabResult, LabOrderStatus, LabOrderPriority, ILabTestItem } from '@/types/lab';
import toast from 'react-hot-toast';

interface LabOrdersResponse {
  success: boolean;
  data: LabOrder[];
}

interface LabResultResponse {
  success: boolean;
  data: LabResult | null;
}

type StatusFilter = 'all' | LabOrderStatus;

const STATUS_TABS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
];

interface TestInput {
  name: string;
  code: string;
}

export function DoctorLabOrders() {
  const queryClient = useQueryClient();
  const authUser = useAppSelector((s) => s.auth.user);
  const { data: myDoctorProfileId, isLoading: myDoctorProfileLoading } = useMyDoctorProfileId(
    authUser?._id,
    authUser?.role
  );

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [detailOrderId, setDetailOrderId] = useState<string | null>(null);

  // Create form state
  const [patientId, setPatientId] = useState('');
  const [tests, setTests] = useState<TestInput[]>([{ name: '', code: '' }]);
  const [priority, setPriority] = useState<LabOrderPriority>('routine');
  const [notes, setNotes] = useState('');

  const { data: patientOptions = [], isLoading: patientsLoading } = usePatientsSelectQuery(createOpen);

  // Main orders query
  const { data, isLoading, isError } = useQuery<LabOrdersResponse>({
    queryKey: ['lab-orders', 'doctor', statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      const res = await api.get(`/lab/orders?${params}`);
      return res.data;
    },
  });

  // Detail order query
  const {
    data: detailOrderData,
    isLoading: detailOrderLoading,
  } = useQuery<{ success: boolean; data: LabOrder }>({
    queryKey: ['lab-order', detailOrderId],
    queryFn: async () => {
      const res = await api.get(`/lab/orders/${detailOrderId}`);
      return res.data;
    },
    enabled: !!detailOrderId,
  });

  // Result for detail
  const {
    data: detailResultData,
    isLoading: detailResultLoading,
  } = useQuery<LabResultResponse>({
    queryKey: ['lab-result', detailOrderId],
    queryFn: async () => {
      try {
        const res = await api.get(`/lab/results/${detailOrderId}`);
        return res.data;
      } catch {
        return { success: false, data: null };
      }
    },
    enabled: !!detailOrderId,
  });

  const orders = data?.data ?? [];
  const detailOrder = detailOrderData?.data ?? null;
  const detailResult = detailResultData?.data ?? null;

  // Test helpers
  const addTest = () => setTests((prev) => [...prev, { name: '', code: '' }]);
  const removeTest = (i: number) => setTests((prev) => prev.filter((_, idx) => idx !== i));
  const updateTest = (i: number, field: keyof TestInput, value: string) =>
    setTests((prev) => prev.map((t, idx) => (idx === i ? { ...t, [field]: value } : t)));

  const resetCreateForm = () => {
    setPatientId('');
    setTests([{ name: '', code: '' }]);
    setPriority('routine');
    setNotes('');
  };

  // Create order mutation
  const createMutation = useMutation({
    mutationFn: async () => {
      const body = {
        patientId: patientId.trim(),
        doctorId: myDoctorProfileId ?? '',
        tests: tests.map((t) => ({ name: t.name.trim(), code: t.code.trim() })),
        priority,
        notes: notes.trim() || undefined,
      };
      const res = await api.post('/lab/orders', body);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Lab order created');
      setCreateOpen(false);
      resetCreateForm();
      void queryClient.invalidateQueries({ queryKey: ['lab-orders', 'doctor'] });
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
          ?.message ?? 'Failed to create lab order';
      toast.error(msg);
    },
  });

  // Verify result mutation
  const verifyMutation = useMutation({
    mutationFn: async (resultId: string) => {
      const res = await api.patch(`/lab/results/${resultId}/verify`);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Result verified');
      void queryClient.invalidateQueries({ queryKey: ['lab-result', detailOrderId] });
      void queryClient.invalidateQueries({ queryKey: ['lab-orders', 'doctor'] });
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
          ?.message ?? 'Failed to verify result';
      toast.error(msg);
    },
  });

  const handleCreateSubmit = () => {
    if (!patientId.trim()) {
      toast.error('Please select a patient');
      return;
    }
    if (!myDoctorProfileId) {
      toast.error('Could not load your doctor profile. Try signing in again.');
      return;
    }
    if (tests.length === 0) {
      toast.error('At least one test is required');
      return;
    }
    const invalid = tests.some((t) => !t.name.trim() || !t.code.trim());
    if (invalid) {
      toast.error('All tests must have a name and code');
      return;
    }
    createMutation.mutate();
  };

  const columns: ColumnDef<LabOrder>[] = [
    {
      header: 'Order ID',
      accessorKey: 'orderId',
    },
    {
      header: 'Patient',
      accessorKey: 'patient',
      cell: (row) =>
        `${row.patient?.userId?.firstName ?? ''} ${row.patient?.userId?.lastName ?? ''}`.trim() || '—',
    },
    {
      header: 'Date',
      accessorKey: 'orderedAt',
      cell: (row) => new Date(row.orderedAt ?? row.createdAt).toLocaleDateString(),
    },
    {
      header: 'Tests',
      accessorKey: 'tests',
      cell: (row) => row.tests.map((t: ILabTestItem) => t.name).join(', ') || '—',
    },
    {
      header: 'Priority',
      accessorKey: 'priority',
      cell: (row) => <StatusBadge status={row.priority} />,
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
        <Button variant="outline" size="sm" onClick={() => setDetailOrderId(row._id)}>
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Lab Orders</h1>
          <p className="text-muted-foreground">Manage and track lab orders</p>
        </div>
        <Button onClick={() => { setCreateOpen(true); resetCreateForm(); }}>
          Create Order
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
            <p className="text-center py-8 text-red-600">Failed to load lab orders. Please try again.</p>
          ) : (
            <DataTable
              data={orders}
              columns={columns}
              isLoading={isLoading}
              emptyMessage="No lab orders found"
            />
          )}
        </CardContent>
      </Card>

      {/* ── Create Order Dialog ── */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl" onClose={() => setCreateOpen(false)}>
          <DialogHeader>
            <DialogTitle>Create Lab Order</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="patientId">Patient</Label>
              <Select
                id="patientId"
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                className="mt-1"
                disabled={patientsLoading}
                placeholder={patientsLoading ? 'Loading patients…' : 'Select a patient'}
              >
                {patientOptions.map((p) => (
                  <option key={p._id} value={p._id}>
                    {patientSelectLabel(p)}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <Label>Ordering doctor</Label>
              <p className="mt-1 text-sm text-muted-foreground">
                {myDoctorProfileLoading
                  ? 'Loading your profile…'
                  : myDoctorProfileId
                    ? `You (${authUser?.firstName ?? ''} ${authUser?.lastName ?? ''})`.trim() || 'Signed-in doctor'
                    : 'Could not resolve your doctor profile'}
              </p>
            </div>

            {/* Tests */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Tests</Label>
                <Button type="button" variant="outline" size="sm" onClick={addTest}>
                  Add Test
                </Button>
              </div>
              <div className="space-y-2">
                {tests.map((test, i) => (
                  <div key={i} className="flex gap-2 items-start">
                    <Input
                      placeholder="Test name"
                      value={test.name}
                      onChange={(e) => updateTest(i, 'name', e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      placeholder="Code"
                      value={test.code}
                      onChange={(e) => updateTest(i, 'code', e.target.value)}
                      className="w-32"
                    />
                    {tests.length > 1 && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => removeTest(i)}
                      >
                        ✕
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select
                id="priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as LabOrderPriority)}
                className="mt-1"
              >
                <option value="routine">Routine</option>
                <option value="urgent">Urgent</option>
                <option value="stat">STAT</option>
              </Select>
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Optional notes for this order"
                className="mt-1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateSubmit}
              disabled={createMutation.isPending || myDoctorProfileLoading || !myDoctorProfileId}
            >
              {createMutation.isPending ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Detail Panel (inline) ── */}
      {detailOrderId && (
        <Card className="mt-6">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Lab Order Detail</h2>
              <Button variant="outline" size="sm" onClick={() => setDetailOrderId(null)}>
                ✕ Close
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {detailOrderLoading || detailResultLoading ? (
              <div className="space-y-3 animate-pulse py-4">
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
                <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded" />
              </div>
            ) : detailOrder ? (
              <div className="space-y-5">
                {/* Order header */}
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-lg font-semibold">{detailOrder.orderId}</p>
                    <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted-foreground">
                      <span>Date: {new Date(detailOrder.orderedAt ?? detailOrder.createdAt).toLocaleDateString()}</span>
                      <span className="capitalize">Priority: {detailOrder.priority}</span>
                    </div>
                  </div>
                  <StatusBadge status={detailOrder.status} />
                </div>

                {/* Tests */}
                <div>
                  <p className="text-sm font-medium mb-2">Tests</p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left text-muted-foreground">
                          <th className="pb-2 pr-4 font-medium">Name</th>
                          <th className="pb-2 pr-4 font-medium">Code</th>
                          <th className="pb-2 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {detailOrder.tests.map((test, idx) => (
                          <tr key={idx}>
                            <td className="py-2 pr-4">{test.name}</td>
                            <td className="py-2 pr-4 font-mono text-muted-foreground">{test.code}</td>
                            <td className="py-2">
                              <StatusBadge status={test.status} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Result */}
                {detailResult ? (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium">Results</p>
                      <StatusBadge status={detailResult.status} />
                    </div>
                    {detailResult.results.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b text-left text-muted-foreground">
                              <th className="pb-2 pr-4 font-medium">Test</th>
                              <th className="pb-2 pr-4 font-medium">Value</th>
                              <th className="pb-2 pr-4 font-medium">Reference</th>
                              <th className="pb-2 font-medium">Normal</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {detailResult.results.map((r, idx) => (
                              <tr key={idx}>
                                <td className="py-2 pr-4">{r.testName}</td>
                                <td className="py-2 pr-4">
                                  {r.value}
                                  {r.unit && <span className="ml-1 text-muted-foreground">{r.unit}</span>}
                                </td>
                                <td className="py-2 pr-4 text-muted-foreground">{r.referenceRange ?? '—'}</td>
                                <td className="py-2">
                                  {r.isNormal === undefined ? (
                                    <span className="text-muted-foreground">—</span>
                                  ) : r.isNormal ? (
                                    <span className="text-green-600 font-medium">Normal</span>
                                  ) : (
                                    <span className="text-red-600 font-medium">Abnormal</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No result values recorded yet.</p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">Results not available yet.</p>
                )}

                {detailOrder.notes && (
                  <div>
                    <p className="text-sm font-medium mb-1">Notes</p>
                    <p className="text-sm text-muted-foreground">{detailOrder.notes}</p>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  {detailResult && detailResult.status === 'preliminary' && (
                    <Button
                      variant="outline"
                      onClick={() => verifyMutation.mutate(detailResult._id)}
                      disabled={verifyMutation.isPending}
                    >
                      {verifyMutation.isPending ? 'Verifying...' : 'Verify Result'}
                    </Button>
                  )}
                  <Button variant="outline" onClick={() => setDetailOrderId(null)}>
                    Close
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-4">Order not found.</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
