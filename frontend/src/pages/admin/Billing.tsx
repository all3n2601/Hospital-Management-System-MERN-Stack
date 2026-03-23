import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { DataTable, ColumnDef } from '@/components/Shared/DataTable';
import { StatusBadge } from '@/components/Shared/StatusBadge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAppSelector } from '@/store/hooks';
import { fmt } from '@/lib/format';
import type { Invoice } from '@/types/billing';
import toast from 'react-hot-toast';

interface BillingResponse {
  success: boolean;
  data: Invoice[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface InvoiceDetailResponse {
  success: boolean;
  data: Invoice;
}

type StatusFilter = 'all' | 'draft' | 'issued' | 'partial' | 'paid' | 'overdue' | 'void';

const STATUS_TABS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'issued', label: 'Issued' },
  { value: 'partial', label: 'Partial' },
  { value: 'paid', label: 'Paid' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'void', label: 'Void' },
];

interface LineItemInput {
  description: string;
  quantity: number;
  unitPrice: number;
}

export function AdminBilling() {
  const queryClient = useQueryClient();
  const user = useAppSelector((s) => s.auth.user);
  const isAdmin = user?.role === 'admin';
  const { id: urlInvoiceId } = useParams<{ id?: string }>();
  const navigate = useNavigate();

  // Pagination & filter state
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const limit = 20;

  // Dialog state
  const [createOpen, setCreateOpen] = useState(false);
  const [detailInvoiceId, setDetailInvoiceId] = useState<string | null>(null);
  const [payInvoiceId, setPayInvoiceId] = useState<string | null>(null);

  useEffect(() => {
    if (urlInvoiceId) {
      setDetailInvoiceId(urlInvoiceId);
    }
  }, [urlInvoiceId]);

  // Create form state
  const [patientId, setPatientId] = useState('');
  const [lineItems, setLineItems] = useState<LineItemInput[]>([{ description: '', quantity: 1, unitPrice: 0 }]);
  const [taxRate, setTaxRate] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState('');

  // Payment form state
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState<'cash' | 'card' | 'insurance' | 'transfer'>('cash');
  const [payReference, setPayReference] = useState('');

  // Void state
  const [voidReason, setVoidReason] = useState('');
  const [voidInvoiceId, setVoidInvoiceId] = useState<string | null>(null);

  // Main billing list query
  const { data, isLoading, isError } = useQuery<BillingResponse>({
    queryKey: ['billing', 'admin', page, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (statusFilter !== 'all') params.set('status', statusFilter);
      const res = await api.get(`/billing?${params}`);
      return res.data;
    },
  });

  // NOTE: detail key omits 'admin' namespace intentionally — must be invalidated separately
  // from the list query. All mutations call invalidateQueries for both keys.
  const { data: detailData, isLoading: detailLoading, isError: detailError } = useQuery<InvoiceDetailResponse>({
    queryKey: ['billing', detailInvoiceId],
    queryFn: async () => {
      const res = await api.get(`/billing/${detailInvoiceId}`);
      return res.data;
    },
    enabled: !!detailInvoiceId,
  });

  const invoices = data?.data ?? [];
  const meta = data?.meta;
  const detailInv = detailData?.data ?? null;

  // Line item helpers
  const addItem = () =>
    setLineItems((prev) => [...prev, { description: '', quantity: 1, unitPrice: 0 }]);
  const removeItem = (i: number) =>
    setLineItems((prev) => prev.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: string, value: string | number) =>
    setLineItems((prev) =>
      prev.map((item, idx) => (idx === i ? { ...item, [field]: value } : item))
    );

  const resetCreateForm = () => {
    setPatientId('');
    setLineItems([{ description: '', quantity: 1, unitPrice: 0 }]);
    setTaxRate(0);
    setDiscount(0);
    setNotes('');
  };

  const resetPayForm = () => {
    setPayAmount('');
    setPayMethod('cash');
    setPayReference('');
  };

  const closeDetail = () => {
    setDetailInvoiceId(null);
    if (urlInvoiceId) navigate('/admin/billing', { replace: true });
  };

  // Create invoice mutation
  const createMutation = useMutation({
    mutationFn: async () => {
      const body = {
        patient: patientId.trim(),
        lineItems,
        taxRate,
        discount,
        notes: notes.trim() || undefined,
      };
      const res = await api.post('/billing', body);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Invoice created');
      setCreateOpen(false);
      resetCreateForm();
      void queryClient.invalidateQueries({ queryKey: ['billing', 'admin'] });
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
          ?.message ?? 'Failed to create invoice';
      toast.error(msg);
    },
  });

  // Issue invoice mutation
  const issueMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.patch(`/billing/${id}/issue`);
      return res.data;
    },
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({ queryKey: ['billing', id] });
      void queryClient.invalidateQueries({ queryKey: ['billing', 'admin'] });
      toast.success('Invoice issued');
      closeDetail();
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
          ?.message ?? 'Failed to issue invoice';
      toast.error(msg);
    },
  });

  // Record payment mutation
  const payMutation = useMutation({
    mutationFn: async ({ id, amount, method, reference }: { id: string; amount: number; method: typeof payMethod; reference?: string }) => {
      const body = { amount, method, reference };
      const res = await api.post(`/billing/${id}/payments`, body);
      return res.data;
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['billing', variables.id] });
      void queryClient.invalidateQueries({ queryKey: ['billing', 'admin'] });
      toast.success('Payment recorded');
      setPayInvoiceId(null);
      resetPayForm();
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
          ?.message ?? 'Failed to record payment';
      toast.error(msg);
    },
  });

  // Void invoice mutation
  const voidMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const res = await api.patch(`/billing/${id}/void`, { voidReason: reason });
      return res.data;
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['billing', variables.id] });
      void queryClient.invalidateQueries({ queryKey: ['billing', 'admin'] });
      toast.success('Invoice voided');
      setVoidInvoiceId(null);
      setVoidReason('');
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
          ?.message ?? 'Failed to void invoice';
      toast.error(msg);
    },
  });

  const columns: ColumnDef<Invoice>[] = [
    {
      header: 'Invoice ID',
      accessorKey: 'invoiceId',
    },
    {
      header: 'Patient',
      accessorKey: 'patient',
      cell: (row) =>
        `${row.patient?.userId?.firstName ?? ''} ${row.patient?.userId?.lastName ?? ''}`.trim() ||
        '—',
    },
    {
      header: 'Date',
      accessorKey: 'issuedDate',
      cell: (row) =>
        new Date(row.issuedDate ?? row.createdAt).toLocaleDateString(),
    },
    {
      header: 'Total',
      accessorKey: 'total',
      cell: (row) => fmt(row.total),
    },
    {
      header: 'Paid',
      accessorKey: 'amountPaid',
      cell: (row) => fmt(row.amountPaid),
    },
    {
      header: 'Balance',
      accessorKey: 'balance',
      cell: (row) => (
        <span className={row.balance > 0 ? 'text-red-600 font-medium' : undefined}>
          {fmt(row.balance)}
        </span>
      ),
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
          <Button variant="outline" size="sm" onClick={() => setDetailInvoiceId(row._id)}>
            View
          </Button>
          {isAdmin && row.status === 'draft' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => issueMutation.mutate(row._id)}
              disabled={issueMutation.isPending}
            >
              Issue
            </Button>
          )}
          {/* Pay: intentionally available to both admin and receptionist */}
          {row.status !== 'paid' && row.status !== 'void' && row.status !== 'draft' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setPayInvoiceId(row._id);
                resetPayForm();
              }}
            >
              Pay
            </Button>
          )}
          {isAdmin && row.status !== 'paid' && row.status !== 'void' && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                setVoidInvoiceId(row._id);
                setVoidReason('');
              }}
            >
              Void
            </Button>
          )}
        </div>
      ),
    },
  ];

  const handleCreateSubmit = () => {
    if (!patientId.trim()) {
      toast.error('Patient ID is required');
      return;
    }
    if (lineItems.length === 0) {
      toast.error('At least one line item is required');
      return;
    }
    const invalid = lineItems.some((item) => !item.description.trim());
    if (invalid) {
      toast.error('All line items must have a description');
      return;
    }
    createMutation.mutate();
  };

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Billing</h1>
          <p className="text-muted-foreground">Manage invoices and payments</p>
        </div>
        <Button onClick={() => { setCreateOpen(true); resetCreateForm(); }}>
          Create Invoice
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-4">
          {/* Status filter tabs */}
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
            <p className="text-center py-8 text-red-600">Failed to load invoices. Please try again.</p>
          ) : (
            <>
              <DataTable
                data={invoices}
                columns={columns}
                isLoading={isLoading}
                emptyMessage="No invoices found"
              />
              {meta && meta.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Page {meta.page} of {meta.totalPages} — {meta.total} total invoices
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

      {/* ── Create Invoice Dialog ── */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl" onClose={() => setCreateOpen(false)}>
          <DialogHeader>
            <DialogTitle>Create Invoice</DialogTitle>
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
                <Label>Line Items</Label>
                <Button type="button" variant="outline" size="sm" onClick={addItem}>
                  Add Item
                </Button>
              </div>
              <div className="space-y-2">
                {lineItems.map((item, i) => (
                  <div key={i} className="flex gap-2 items-start">
                    <Input
                      placeholder="Description"
                      value={item.description}
                      onChange={(e) => updateItem(i, 'description', e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      placeholder="Qty"
                      value={item.quantity}
                      min={1}
                      onChange={(e) => updateItem(i, 'quantity', parseInt(e.target.value) || 1)}
                      className="w-20"
                    />
                    <Input
                      type="number"
                      placeholder="Unit Price"
                      value={item.unitPrice}
                      min={0}
                      step={0.01}
                      onChange={(e) => updateItem(i, 'unitPrice', parseFloat(e.target.value) || 0)}
                      className="w-28"
                    />
                    {lineItems.length > 1 && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => removeItem(i)}
                      >
                        ✕
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="taxRate">Tax Rate %</Label>
                <Input
                  id="taxRate"
                  type="number"
                  min={0}
                  max={100}
                  value={taxRate}
                  onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="discount">Discount $</Label>
                <Input
                  id="discount"
                  type="number"
                  min={0}
                  step={0.01}
                  value={discount}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Optional notes for this invoice"
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

      {/* ── Record Payment Dialog ── */}
      <Dialog open={!!payInvoiceId} onOpenChange={(open) => { if (!open) setPayInvoiceId(null); }}>
        <DialogContent onClose={() => setPayInvoiceId(null)}>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="payAmount">Amount</Label>
              <Input
                id="payAmount"
                type="number"
                min={0.01}
                step={0.01}
                placeholder="0.00"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="payMethod">Payment Method</Label>
              <Select
                id="payMethod"
                value={payMethod}
                onChange={(e) => setPayMethod(e.target.value as typeof payMethod)}
                className="mt-1"
              >
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="insurance">Insurance</option>
                <option value="transfer">Transfer</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="payReference">Reference (optional)</Label>
              <Input
                id="payReference"
                placeholder="Transaction reference..."
                value={payReference}
                onChange={(e) => setPayReference(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPayInvoiceId(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                const parsedAmount = parseFloat(payAmount);
                if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
                  toast.error('Amount must be a positive number');
                  return;
                }
                if (payInvoiceId) {
                  payMutation.mutate({
                    id: payInvoiceId,
                    amount: parsedAmount,
                    method: payMethod,
                    reference: payReference.trim() || undefined,
                  });
                }
              }}
              disabled={payMutation.isPending || !payAmount || parseFloat(payAmount) <= 0}
            >
              {payMutation.isPending ? 'Recording...' : 'Record Payment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Void Invoice Dialog ── */}
      <Dialog open={!!voidInvoiceId} onOpenChange={(open) => { if (!open) setVoidInvoiceId(null); }}>
        <DialogContent onClose={() => setVoidInvoiceId(null)}>
          <DialogHeader>
            <DialogTitle>Void Invoice</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This action cannot be undone. Please provide a reason for voiding this invoice.
            </p>
            <div>
              <Label htmlFor="voidReason">Void Reason</Label>
              <Input
                id="voidReason"
                placeholder="Reason for voiding..."
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setVoidInvoiceId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (!voidReason.trim()) {
                  toast.error('Please provide a reason for voiding this invoice');
                  return;
                }
                if (voidInvoiceId) voidMutation.mutate({ id: voidInvoiceId, reason: voidReason.trim() });
              }}
              disabled={voidMutation.isPending}
            >
              {voidMutation.isPending ? 'Voiding...' : 'Void Invoice'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Invoice Detail Dialog ── */}
      <Dialog open={!!detailInvoiceId} onOpenChange={(open) => { if (!open) closeDetail(); }}>
        <DialogContent className="max-w-2xl" onClose={closeDetail}>
          <DialogHeader>
            <DialogTitle>Invoice Detail</DialogTitle>
          </DialogHeader>

          {detailError ? (
            <p className="text-sm text-red-600 py-4">Failed to load invoice details. Please try again.</p>
          ) : detailLoading ? (
            <div className="space-y-3 animate-pulse py-4">
              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
              <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          ) : detailInv ? (
            <div className="space-y-5">
              {/* Header info */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-lg font-semibold">{detailInv.invoiceId}</p>
                  <p className="text-sm text-muted-foreground">
                    Patient:{' '}
                    {`${detailInv.patient?.userId?.firstName ?? ''} ${detailInv.patient?.userId?.lastName ?? ''}`.trim() ||
                      '—'}
                  </p>
                  <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted-foreground">
                    {detailInv.issuedDate && (
                      <span>Issued: {new Date(detailInv.issuedDate).toLocaleDateString()}</span>
                    )}
                    {detailInv.dueDate && (
                      <span>Due: {new Date(detailInv.dueDate).toLocaleDateString()}</span>
                    )}
                    {!detailInv.issuedDate && (
                      <span>Created: {new Date(detailInv.createdAt).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
                <StatusBadge status={detailInv.status} />
              </div>

              {/* Line items */}
              <div>
                <p className="text-sm font-medium mb-2">Line Items</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="pb-2 pr-4 font-medium">Description</th>
                        <th className="pb-2 pr-4 font-medium text-right">Qty</th>
                        <th className="pb-2 pr-4 font-medium text-right">Unit Price</th>
                        <th className="pb-2 font-medium text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {detailInv.lineItems.map((item, idx) => (
                        <tr key={idx}>
                          <td className="py-2 pr-4">{item.description}</td>
                          <td className="py-2 pr-4 text-right">{item.quantity}</td>
                          <td className="py-2 pr-4 text-right">{fmt(item.unitPrice)}</td>
                          <td className="py-2 text-right font-medium">{fmt(item.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Financial summary */}
              <div>
                <p className="text-sm font-medium mb-2">Summary</p>
                <dl className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Subtotal</dt>
                    <dd>{fmt(detailInv.subtotal)}</dd>
                  </div>
                  {detailInv.tax > 0 && (
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Tax ({detailInv.taxRate.toFixed(1)}%)</dt>
                      <dd>{fmt(detailInv.tax)}</dd>
                    </div>
                  )}
                  {detailInv.discount > 0 && (
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Discount</dt>
                      <dd className="text-green-600">-{fmt(detailInv.discount)}</dd>
                    </div>
                  )}
                  <div className="flex justify-between border-t pt-1.5 font-semibold">
                    <dt>Total</dt>
                    <dd>{fmt(detailInv.total)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Amount Paid</dt>
                    <dd className="text-green-600">{fmt(detailInv.amountPaid)}</dd>
                  </div>
                  <div className="flex justify-between border-t pt-1.5 font-semibold">
                    <dt>Balance Due</dt>
                    <dd className={detailInv.balance > 0 ? 'text-red-600' : 'text-green-600'}>
                      {fmt(detailInv.balance)}
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Insurance */}
              {detailInv.insurance && (
                <div>
                  <p className="text-sm font-medium mb-2">Insurance</p>
                  <dl className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Provider</dt>
                      <dd>{detailInv.insurance.provider}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Policy Number</dt>
                      <dd>{detailInv.insurance.policyNumber}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Coverage Amount</dt>
                      <dd>{fmt(detailInv.insurance.coverageAmount)}</dd>
                    </div>
                  </dl>
                </div>
              )}

              {/* Payments */}
              {detailInv.payments.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Payment History</p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left text-muted-foreground">
                          <th className="pb-2 pr-4 font-medium">Date</th>
                          <th className="pb-2 pr-4 font-medium">Method</th>
                          <th className="pb-2 pr-4 font-medium">Reference</th>
                          <th className="pb-2 font-medium text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {detailInv.payments.map((pmt, idx) => (
                          <tr key={pmt._id ?? idx}>
                            <td className="py-2 pr-4">
                              {new Date(pmt.paidAt).toLocaleDateString()}
                            </td>
                            <td className="py-2 pr-4 capitalize">{pmt.method}</td>
                            <td className="py-2 pr-4 text-muted-foreground">
                              {pmt.reference ?? '—'}
                            </td>
                            <td className="py-2 text-right font-medium">{fmt(pmt.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Notes */}
              {detailInv.notes && (
                <div>
                  <p className="text-sm font-medium mb-1">Notes</p>
                  <p className="text-sm text-muted-foreground">{detailInv.notes}</p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-4">Invoice not found.</p>
          )}

          <DialogFooter>
            {isAdmin && detailInv && detailInv.status === 'draft' && (
              <Button
                variant="outline"
                onClick={() => issueMutation.mutate(detailInv._id)}
                disabled={issueMutation.isPending}
              >
                {issueMutation.isPending ? 'Issuing...' : 'Issue'}
              </Button>
            )}
            {isAdmin && detailInv && detailInv.status !== 'paid' && detailInv.status !== 'void' && (
              <Button
                variant="destructive"
                onClick={() => {
                  setVoidInvoiceId(detailInv._id);
                  setVoidReason('');
                  closeDetail();
                }}
              >
                Void
              </Button>
            )}
            <Button variant="outline" onClick={closeDetail}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
