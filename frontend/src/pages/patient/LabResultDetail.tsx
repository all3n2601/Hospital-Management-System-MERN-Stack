import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/Shared/StatusBadge';
import type { LabOrder, LabResult } from '@/types/lab';

interface LabOrderResponse {
  success: boolean;
  data: LabOrder;
}

interface LabResultResponse {
  success: boolean;
  data: LabResult | null;
}

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
        to="/patient/lab"
        className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Lab Results
      </Link>
    </div>
  );
}

export function PatientLabResultDetail() {
  const { id } = useParams<{ id: string }>();

  const {
    data: orderData,
    isLoading: orderLoading,
    isError: orderError,
  } = useQuery<LabOrderResponse>({
    queryKey: ['lab-order', id],
    queryFn: async () => {
      const res = await api.get(`/lab/orders/${id}`);
      return res.data;
    },
    enabled: !!id,
  });

  const {
    data: resultData,
    isLoading: resultLoading,
  } = useQuery<LabResultResponse>({
    queryKey: ['lab-result', id],
    queryFn: async () => {
      try {
        const res = await api.get(`/lab/results/${id}`);
        return res.data;
      } catch {
        return { success: false, data: null };
      }
    },
    enabled: !!id,
  });

  if (orderLoading || resultLoading) return <LoadingSkeleton />;
  if (orderError || !orderData?.data)
    return <ErrorState message="Lab order not found or you don't have access." />;

  const order = orderData.data;
  const result = resultData?.data ?? null;

  const orderedDate = new Date(order.orderedAt ?? order.createdAt).toLocaleDateString();

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Back button */}
      <Link
        to="/patient/lab"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Lab Results
      </Link>

      {/* Order header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-xl">{order.orderId}</CardTitle>
              <div className="mt-1 flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span>Date: {orderedDate}</span>
                <span className="capitalize">Priority: {order.priority}</span>
                {order.doctor?.userId && (
                  <span>
                    Doctor: Dr. {order.doctor.userId.firstName} {order.doctor.userId.lastName}
                  </span>
                )}
              </div>
            </div>
            <StatusBadge status={order.status} />
          </div>
        </CardHeader>
      </Card>

      {/* Tests table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Ordered Tests</CardTitle>
        </CardHeader>
        <CardContent>
          {order.tests.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tests listed.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 pr-4 font-medium">Test Name</th>
                    <th className="pb-2 pr-4 font-medium">Code</th>
                    <th className="pb-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {order.tests.map((test, idx) => (
                    <tr key={idx} className="hover:bg-muted/50 transition-colors">
                      <td className="py-2 pr-4 font-medium">{test.name}</td>
                      <td className="py-2 pr-4 text-muted-foreground font-mono">{test.code}</td>
                      <td className="py-2">
                        <StatusBadge status={test.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results section */}
      {result ? (
        <>
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Test Results</CardTitle>
                <StatusBadge status={result.status} />
              </div>
            </CardHeader>
            <CardContent>
              {result.results.length === 0 ? (
                <p className="text-sm text-muted-foreground">No result values recorded yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="pb-2 pr-4 font-medium">Test</th>
                        <th className="pb-2 pr-4 font-medium">Value</th>
                        <th className="pb-2 pr-4 font-medium">Reference Range</th>
                        <th className="pb-2 font-medium">Normal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {result.results.map((r, idx) => (
                        <tr key={idx} className="hover:bg-muted/50 transition-colors">
                          <td className="py-2 pr-4 font-medium">{r.testName}</td>
                          <td className="py-2 pr-4">
                            {r.value}
                            {r.unit && (
                              <span className="ml-1 text-muted-foreground">{r.unit}</span>
                            )}
                          </td>
                          <td className="py-2 pr-4 text-muted-foreground">
                            {r.referenceRange ?? '—'}
                          </td>
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
              )}
            </CardContent>
          </Card>

          {/* Technician info */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Report Info</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-2 text-sm">
                {result.technician && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Technician</dt>
                    <dd>
                      {result.technician.firstName ?? ''} {result.technician.lastName ?? ''}
                      {!result.technician.firstName && !result.technician.lastName && '—'}
                    </dd>
                  </div>
                )}
                {result.collectedAt && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Collected At</dt>
                    <dd>{new Date(result.collectedAt).toLocaleString()}</dd>
                  </div>
                )}
                {result.resultedAt && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Resulted At</dt>
                    <dd>{new Date(result.resultedAt).toLocaleString()}</dd>
                  </div>
                )}
                {result.status === 'final' && result.verifiedAt && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Verified At</dt>
                    <dd>{new Date(result.verifiedAt).toLocaleString()}</dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>

          {result.notes && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{result.notes}</p>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-muted-foreground">Results not available yet.</p>
          </CardContent>
        </Card>
      )}

      {/* Order notes */}
      {order.notes && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Order Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{order.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
