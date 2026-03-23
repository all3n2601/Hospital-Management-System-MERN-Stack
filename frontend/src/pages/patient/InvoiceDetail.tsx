import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/Shared/StatusBadge';

interface ILineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface IPayment {
  _id?: string;
  amount: number;
  method: 'cash' | 'card' | 'insurance' | 'transfer';
  paidAt: string;
  reference?: string;
}

interface IInsurance {
  provider: string;
  policyNumber: string;
  coverageAmount: number;
}

interface Invoice {
  _id: string;
  invoiceId: string;
  patient: { _id: string; userId: { firstName: string; lastName: string } };
  appointment?: string;
  lineItems: ILineItem[];
  subtotal: number;
  taxRate: number;
  tax: number;
  discount: number;
  total: number;
  amountPaid: number;
  balance: number;
  status: 'draft' | 'issued' | 'paid' | 'partial' | 'overdue' | 'void';
  insurance?: IInsurance;
  payments: IPayment[];
  issuedDate?: string;
  dueDate?: string;
  paidDate?: string;
  notes?: string;
  createdAt: string;
}

interface InvoiceDetailResponse {
  success: boolean;
  data: Invoice;
}

const fmt = (n: number) => `$${n.toFixed(2)}`;

function LoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
      <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded" />
      <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded" />
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="text-center py-16 space-y-3">
      <p className="text-lg font-medium text-gray-900 dark:text-white">{message}</p>
      <Link
        to="/patient/billing"
        className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to My Bills
      </Link>
    </div>
  );
}

export function PatientInvoiceDetail() {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading, isError } = useQuery<InvoiceDetailResponse>({
    queryKey: ['billing', id],
    queryFn: async () => {
      const res = await api.get(`/billing/${id}`);
      return res.data;
    },
    enabled: !!id,
  });

  if (isLoading) return <LoadingSkeleton />;
  if (isError || !data?.data) return <ErrorState message="Invoice not found or you don't have access." />;

  const inv = data.data;

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Back button */}
      <Link
        to="/patient/billing"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to My Bills
      </Link>

      {/* Invoice header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-xl">{inv.invoiceId}</CardTitle>
              <div className="mt-1 flex flex-wrap gap-4 text-sm text-muted-foreground">
                {inv.issuedDate && (
                  <span>Issued: {new Date(inv.issuedDate).toLocaleDateString()}</span>
                )}
                {inv.dueDate && (
                  <span>Due: {new Date(inv.dueDate).toLocaleDateString()}</span>
                )}
                {!inv.issuedDate && (
                  <span>Created: {new Date(inv.createdAt).toLocaleDateString()}</span>
                )}
              </div>
            </div>
            <StatusBadge status={inv.status} />
          </div>
        </CardHeader>
      </Card>

      {/* Line items */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Line Items</CardTitle>
        </CardHeader>
        <CardContent>
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
                {inv.lineItems.map((item, idx) => (
                  <tr key={idx} className="py-2">
                    <td className="py-2 pr-4">{item.description}</td>
                    <td className="py-2 pr-4 text-right">{item.quantity}</td>
                    <td className="py-2 pr-4 text-right">{fmt(item.unitPrice)}</td>
                    <td className="py-2 text-right font-medium">{fmt(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd>{fmt(inv.subtotal)}</dd>
            </div>
            {inv.tax > 0 && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Tax ({(inv.taxRate * 100).toFixed(1)}%)</dt>
                <dd>{fmt(inv.tax)}</dd>
              </div>
            )}
            {inv.discount > 0 && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Discount</dt>
                <dd className="text-green-600">-{fmt(inv.discount)}</dd>
              </div>
            )}
            <div className="flex justify-between border-t pt-2 font-semibold">
              <dt>Total</dt>
              <dd>{fmt(inv.total)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Amount Paid</dt>
              <dd className="text-green-600">{fmt(inv.amountPaid)}</dd>
            </div>
            <div className="flex justify-between border-t pt-2 font-semibold">
              <dt>Balance Due</dt>
              <dd className={inv.balance > 0 ? 'text-red-600' : 'text-green-600'}>{fmt(inv.balance)}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* Insurance info */}
      {inv.insurance && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Insurance</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Provider</dt>
                <dd>{inv.insurance.provider}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Policy Number</dt>
                <dd>{inv.insurance.policyNumber}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Coverage Amount</dt>
                <dd>{fmt(inv.insurance.coverageAmount)}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      )}

      {/* Payment history */}
      {inv.payments.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Payment History</CardTitle>
          </CardHeader>
          <CardContent>
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
                  {inv.payments.map((pmt, idx) => (
                    <tr key={pmt._id ?? idx}>
                      <td className="py-2 pr-4">{new Date(pmt.paidAt).toLocaleDateString()}</td>
                      <td className="py-2 pr-4 capitalize">{pmt.method}</td>
                      <td className="py-2 pr-4 text-muted-foreground">{pmt.reference ?? '—'}</td>
                      <td className="py-2 text-right font-medium">{fmt(pmt.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      {inv.notes && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{inv.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
