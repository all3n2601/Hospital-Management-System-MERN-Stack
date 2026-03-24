import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import {
  usePatientsSelectQuery,
  useDoctorsSelectQuery,
  useNurseUsersSelectQuery,
  nurseUserSelectLabel,
  nurseStaffUserId,
  patientSelectLabel,
  doctorSelectLabel,
} from '@/hooks/useEntitySelectData';
import { DataTable, ColumnDef } from '@/components/Shared/DataTable';
import { StatusBadge } from '@/components/Shared/StatusBadge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type {
  LabOrder,
  LabResult,
  LabOrderStatus,
  LabOrderPriority,
  ILabTestItem,
} from '@/types/lab';
import toast from 'react-hot-toast';

interface LabOrdersResponse {
  success: boolean;
  data: LabOrder[];
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
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
  { value: 'cancelled', label: 'Cancelled' },
];

interface TestInput {
  name: string;
  code: string;
}

interface ResultInput {
  testCode: string;
  testName: string;
  value: string;
  unit: string;
  referenceRange: string;
  isNormal: boolean | undefined;
}

export function AdminLabManagement() {
  const queryClient = useQueryClient();
  const { id: urlOrderId } = useParams<{ id?: string }>();
  const navigate = useNavigate();

  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const limit = 20;

  const [createOpen, setCreateOpen] = useState(false);
  const [updateStatusOpen, setUpdateStatusOpen] = useState(false);
  const [enterResultsOpen, setEnterResultsOpen] = useState(false);
  const [detailOrderId, setDetailOrderId] = useState<string | null>(null);
  const [targetOrderId, setTargetOrderId] = useState<string | null>(null);

  // Create form state
  const [patientId, setPatientId] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [tests, setTests] = useState<TestInput[]>([{ name: '', code: '' }]);
  const [priority, setPriority] = useState<LabOrderPriority>('routine');
  const [notes, setNotes] = useState('');

  // Update status form state
  const [newStatus, setNewStatus] = useState<LabOrderStatus>('pending');

  // Enter results form state
  const [resultItems, setResultItems] = useState<ResultInput[]>([]);
  const [resultNotes, setResultNotes] = useState('');
  const [technicianId, setTechnicianId] = useState('');

  const { data: patientOptions = [], isLoading: patientsLoading } = usePatientsSelectQuery(createOpen);
  const { data: doctorOptions = [], isLoading: doctorsLoading } = useDoctorsSelectQuery(createOpen);
  const { data: nurseOptions = [], isLoading: nursesLoading } = useNurseUsersSelectQuery(enterResultsOpen);

  useEffect(() => {
    if (urlOrderId) {
      setDetailOrderId(urlOrderId);
    }
  }, [urlOrderId]);

  // Main orders query
  const { data, isLoading, isError } = useQuery<LabOrdersResponse>({
    queryKey: ['lab-orders', 'admin', page, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
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

  // Detail result query
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
  const meta = data?.meta;
  const detailOrder = detailOrderData?.data ?? null;
  const detailResult = detailResultData?.data ?? null;

  const closeDetail = () => {
    setDetailOrderId(null);
    if (urlOrderId) navigate('/admin/lab', { replace: true });
  };

  // Test helpers
  const addTest = () => setTests((prev) => [...prev, { name: '', code: '' }]);
  const removeTest = (i: number) => setTests((prev) => prev.filter((_, idx) => idx !== i));
  const updateTest = (i: number, field: keyof TestInput, value: string) =>
    setTests((prev) => prev.map((t, idx) => (idx === i ? { ...t, [field]: value } : t)));

  const resetCreateForm = () => {
    setPatientId('');
    setDoctorId('');
    setTests([{ name: '', code: '' }]);
    setPriority('routine');
    setNotes('');
  };

  const openUpdateStatus = (orderId: string, currentStatus: LabOrderStatus) => {
    setTargetOrderId(orderId);
    setNewStatus(currentStatus);
    setUpdateStatusOpen(true);
  };

  const openEnterResults = (order: LabOrder) => {
    setTargetOrderId(order._id);
    setResultItems(
      order.tests.map((t: ILabTestItem) => ({
        testCode: t.code,
        testName: t.name,
        value: '',
        unit: '',
        referenceRange: '',
        isNormal: undefined,
      }))
    );
    setResultNotes('');
    setTechnicianId('');
    setEnterResultsOpen(true);
  };

  // Create order mutation
  const createMutation = useMutation({
    mutationFn: async () => {
      const body = {
        patientId: patientId.trim(),
        doctorId: doctorId.trim(),
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
      void queryClient.invalidateQueries({ queryKey: ['lab-orders', 'admin'] });
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
          ?.message ?? 'Failed to create lab order';
      toast.error(msg);
    },
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: LabOrderStatus }) => {
      const res = await api.patch(`/lab/orders/${orderId}/status`, { status });
      return res.data;
    },
    onSuccess: (_data, variables) => {
      toast.success('Status updated');
      setUpdateStatusOpen(false);
      setTargetOrderId(null);
      void queryClient.invalidateQueries({ queryKey: ['lab-order', variables.orderId] });
      void queryClient.invalidateQueries({ queryKey: ['lab-orders', 'admin'] });
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
          ?.message ?? 'Failed to update status';
      toast.error(msg);
    },
  });

  // Enter results mutation
  const enterResultsMutation = useMutation({
    mutationFn: async () => {
      const body = {
        labOrderId: targetOrderId,
        technician: technicianId.trim() || undefined,
        results: resultItems.map((r) => ({
          testCode: r.testCode,
          testName: r.testName,
          value: r.value,
          unit: r.unit || undefined,
          referenceRange: r.referenceRange || undefined,
          isNormal: r.isNormal,
        })),
        notes: resultNotes.trim() || undefined,
      };
      const res = await api.post('/lab/results', body);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Results entered');
      setEnterResultsOpen(false);
      setTargetOrderId(null);
      void queryClient.invalidateQueries({ queryKey: ['lab-result', detailOrderId] });
      void queryClient.invalidateQueries({ queryKey: ['lab-orders', 'admin'] });
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
          ?.message ?? 'Failed to enter results';
      toast.error(msg);
    },
  });

  const handleCreateSubmit = () => {
    if (!patientId.trim()) {
      toast.error('Please select a patient');
      return;
    }
    if (!doctorId.trim()) {
      toast.error('Please select a doctor');
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

  const handleEnterResultsSubmit = () => {
    const invalid = resultItems.some((r) => !r.value.trim());
    if (invalid) {
      toast.error('All test results must have a value');
      return;
    }
    enterResultsMutation.mutate();
  };

  const columns: ColumnDef<LabOrder>[] = [
    { header: 'Order ID', accessorKey: 'orderId' },
    {
      header: 'Patient',
      accessorKey: 'patient',
      cell: (row) =>
        `${row.patient?.userId?.firstName ?? ''} ${row.patient?.userId?.lastName ?? ''}`.trim() || '—',
    },
    {
      header: 'Doctor',
      accessorKey: 'doctor',
      cell: (row) =>
        `${row.doctor?.userId?.firstName ?? ''} ${row.doctor?.userId?.lastName ?? ''}`.trim() || '—',
    },
    {
      header: 'Date',
      accessorKey: 'orderedAt',
      cell: (row) => new Date(row.orderedAt ?? row.createdAt).toLocaleDateString(),
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
        <div className="flex flex-wrap gap-1">
          <Button variant="outline" size="sm" onClick={() => setDetailOrderId(row._id)}>
            View
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => openUpdateStatus(row._id, row.status)}
          >
            Status
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => openEnterResults(row)}
          >
            Results
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Lab Management</h1>
          <p className="text-muted-foreground">Manage lab orders and diagnostic results</p>
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
                onClick={() => {
                  setStatusFilter(tab.value);
                  setPage(1);
                }}
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
            <>
              <DataTable
                data={orders}
                columns={columns}
                isLoading={isLoading}
                emptyMessage="No lab orders found"
              />
              {meta && meta.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Page {meta.page} of {meta.totalPages} — {meta.total} total orders
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
            </>
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
              <Label htmlFor="doctorId">Doctor</Label>
              <Select
                id="doctorId"
                value={doctorId}
                onChange={(e) => setDoctorId(e.target.value)}
                className="mt-1"
                disabled={doctorsLoading}
                placeholder={doctorsLoading ? 'Loading doctors…' : 'Select a doctor'}
              >
                {doctorOptions.map((d) => (
                  <option key={d._id} value={d._id}>
                    {doctorSelectLabel(d)}
                  </option>
                ))}
              </Select>
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

      {/* ── Update Status Dialog ── */}
      <Dialog open={updateStatusOpen} onOpenChange={(open) => { if (!open) { setUpdateStatusOpen(false); setTargetOrderId(null); } }}>
        <DialogContent onClose={() => { setUpdateStatusOpen(false); setTargetOrderId(null); }}>
          <DialogHeader>
            <DialogTitle>Update Order Status</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="newStatus">New Status</Label>
              <Select
                id="newStatus"
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as LabOrderStatus)}
                className="mt-1"
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setUpdateStatusOpen(false); setTargetOrderId(null); }}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (targetOrderId) {
                  updateStatusMutation.mutate({ orderId: targetOrderId, status: newStatus });
                }
              }}
              disabled={updateStatusMutation.isPending}
            >
              {updateStatusMutation.isPending ? 'Updating...' : 'Update'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Enter Results Dialog ── */}
      <Dialog open={enterResultsOpen} onOpenChange={(open) => { if (!open) { setEnterResultsOpen(false); setTargetOrderId(null); } }}>
        <DialogContent className="max-w-3xl" onClose={() => { setEnterResultsOpen(false); setTargetOrderId(null); }}>
          <DialogHeader>
            <DialogTitle>Enter Test Results</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="technicianId">Technician (optional)</Label>
              <select
                id="technicianId"
                className={cn(
                  'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                  'disabled:cursor-not-allowed disabled:opacity-50 mt-1'
                )}
                value={technicianId}
                onChange={(e) => setTechnicianId(e.target.value)}
                disabled={nursesLoading}
              >
                <option value="">— None —</option>
                {nurseOptions.map((n) => {
                  const uid = nurseStaffUserId(n);
                  if (!uid) return null;
                  return (
                    <option key={uid} value={uid}>
                      {nurseUserSelectLabel(n)}
                    </option>
                  );
                })}
              </select>
              <p className="text-xs text-muted-foreground mt-1">
                Usually a lab tech or nurse (linked user account).
              </p>
            </div>

            {resultItems.map((item, i) => (
              <div key={i} className="border rounded-md p-3 space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <span>{item.testName}</span>
                  <span className="text-muted-foreground font-mono text-xs">({item.testCode})</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Value</Label>
                    <Input
                      placeholder="Result value"
                      value={item.value}
                      onChange={(e) =>
                        setResultItems((prev) =>
                          prev.map((r, idx) => (idx === i ? { ...r, value: e.target.value } : r))
                        )
                      }
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Unit (optional)</Label>
                    <Input
                      placeholder="e.g. mg/dL"
                      value={item.unit}
                      onChange={(e) =>
                        setResultItems((prev) =>
                          prev.map((r, idx) => (idx === i ? { ...r, unit: e.target.value } : r))
                        )
                      }
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Reference Range (optional)</Label>
                    <Input
                      placeholder="e.g. 70-100"
                      value={item.referenceRange}
                      onChange={(e) =>
                        setResultItems((prev) =>
                          prev.map((r, idx) =>
                            idx === i ? { ...r, referenceRange: e.target.value } : r
                          )
                        )
                      }
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Normal?</Label>
                    <Select
                      value={item.isNormal === undefined ? '' : item.isNormal ? 'true' : 'false'}
                      onChange={(e) =>
                        setResultItems((prev) =>
                          prev.map((r, idx) =>
                            idx === i
                              ? {
                                  ...r,
                                  isNormal:
                                    e.target.value === ''
                                      ? undefined
                                      : e.target.value === 'true',
                                }
                              : r
                          )
                        )
                      }
                      className="mt-1"
                    >
                      <option value="">Unknown</option>
                      <option value="true">Normal</option>
                      <option value="false">Abnormal</option>
                    </Select>
                  </div>
                </div>
              </div>
            ))}

            <div>
              <Label htmlFor="resultNotes">Notes (optional)</Label>
              <Textarea
                id="resultNotes"
                value={resultNotes}
                onChange={(e) => setResultNotes(e.target.value)}
                rows={2}
                placeholder="Optional notes for this result"
                className="mt-1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setEnterResultsOpen(false); setTargetOrderId(null); }}>
              Cancel
            </Button>
            <Button onClick={handleEnterResultsSubmit} disabled={enterResultsMutation.isPending}>
              {enterResultsMutation.isPending ? 'Saving...' : 'Save Results'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Detail Dialog ── */}
      <Dialog open={!!detailOrderId} onOpenChange={(open) => { if (!open) closeDetail(); }}>
        <DialogContent className="max-w-2xl" onClose={closeDetail}>
          <DialogHeader>
            <DialogTitle>Lab Order Detail</DialogTitle>
          </DialogHeader>

          {detailOrderLoading || detailResultLoading ? (
            <div className="space-y-3 animate-pulse py-4">
              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
              <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          ) : detailOrder ? (
            <div className="space-y-5">
              {/* Header */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-lg font-semibold">{detailOrder.orderId}</p>
                  <p className="text-sm text-muted-foreground">
                    Patient:{' '}
                    {`${detailOrder.patient?.userId?.firstName ?? ''} ${detailOrder.patient?.userId?.lastName ?? ''}`.trim() || '—'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Doctor:{' '}
                    {`${detailOrder.doctor?.userId?.firstName ?? ''} ${detailOrder.doctor?.userId?.lastName ?? ''}`.trim() || '—'}
                  </p>
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
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-4">Order not found.</p>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={closeDetail}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
