import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/Shared/StatusBadge';
import { DataTable, ColumnDef } from '@/components/Shared/DataTable';
import type { Document, DocumentStatus, DocumentType } from '@/types/documents';

interface DocumentsResponse {
  success: boolean;
  data: Document[];
}

type StatusFilter = 'all' | DocumentStatus;

const STATUS_TABS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'issued', label: 'Issued' },
  { value: 'void', label: 'Void' },
];

const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  medical_certificate: 'Medical Certificate',
  discharge_summary: 'Discharge Summary',
  referral: 'Referral',
  lab_report: 'Lab Report',
};

export function PatientDocuments() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [detailId, setDetailId] = useState<string | null>(null);

  const { data, isLoading, isError } = useQuery<DocumentsResponse>({
    queryKey: ['documents', 'patient', statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      const res = await api.get(`/documents?${params}`);
      return res.data;
    },
  });

  const { data: detailData, isLoading: detailLoading } = useQuery<{ success: boolean; data: Document }>({
    queryKey: ['document', detailId],
    queryFn: async () => {
      const res = await api.get(`/documents/${detailId}`);
      return res.data;
    },
    enabled: !!detailId,
  });

  const documents = data?.data ?? [];
  const detailDocument = detailData?.data ?? null;

  const columns: ColumnDef<Document>[] = [
    {
      header: 'Document ID',
      accessorKey: 'documentId',
    },
    {
      header: 'Type',
      accessorKey: 'type',
      cell: (row) => DOCUMENT_TYPE_LABELS[row.type] ?? row.type,
    },
    {
      header: 'Issued By',
      accessorKey: 'issuedBy',
      cell: (row) =>
        `${row.issuedBy?.userId?.firstName ?? ''} ${row.issuedBy?.userId?.lastName ?? ''}`.trim() || '—',
    },
    {
      header: 'Issued At',
      accessorKey: 'issuedAt',
      cell: (row) => (row.issuedAt ? new Date(row.issuedAt).toLocaleDateString() : '—'),
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
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setDetailId(row._id)}>
            View
          </Button>
          {row.status === 'issued' && row.pdfUrl && (
            <a
              href={row.pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              Download PDF
            </a>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Documents</h1>
        <p className="text-muted-foreground">View your issued medical documents</p>
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
            <p className="text-center py-8 text-red-600">Failed to load documents. Please try again.</p>
          ) : (
            <DataTable
              data={documents}
              columns={columns}
              isLoading={isLoading}
              emptyMessage="No documents found"
            />
          )}
        </CardContent>
      </Card>

      {/* Detail Panel */}
      {detailId && (
        <Card className="mt-6">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Document Detail</h2>
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
            ) : detailDocument ? (
              <div className="space-y-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-lg font-semibold">{detailDocument.documentId}</p>
                    <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted-foreground">
                      <span>
                        Type: {DOCUMENT_TYPE_LABELS[detailDocument.type] ?? detailDocument.type}
                      </span>
                      <span>Created: {new Date(detailDocument.createdAt).toLocaleDateString()}</span>
                      <span>
                        Doctor:{' '}
                        {`${detailDocument.issuedBy?.userId?.firstName ?? ''} ${detailDocument.issuedBy?.userId?.lastName ?? ''}`.trim() || '—'}
                      </span>
                    </div>
                  </div>
                  <StatusBadge status={detailDocument.status} />
                </div>

                {detailDocument.issuedAt && (
                  <p className="text-xs text-muted-foreground">
                    Issued at: {new Date(detailDocument.issuedAt).toLocaleString()}
                  </p>
                )}

                {detailDocument.templateData && Object.keys(detailDocument.templateData).length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Details</p>
                    <dl className="space-y-1 text-sm">
                      {Object.entries(detailDocument.templateData).map(([key, value]) => (
                        <div key={key} className="flex gap-2">
                          <dt className="font-medium capitalize">{key}:</dt>
                          <dd className="text-muted-foreground">{String(value)}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                )}

                {detailDocument.content && (
                  <div>
                    <p className="text-sm font-medium mb-1">Content</p>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{detailDocument.content}</p>
                  </div>
                )}

                {detailDocument.notes && (
                  <div>
                    <p className="text-sm font-medium mb-1">Notes</p>
                    <p className="text-sm text-muted-foreground">{detailDocument.notes}</p>
                  </div>
                )}

                {detailDocument.status === 'issued' && detailDocument.pdfUrl && (
                  <div>
                    <p className="text-sm font-medium mb-1">PDF</p>
                    <a
                      href={detailDocument.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-primary underline hover:no-underline"
                    >
                      Download PDF
                    </a>
                  </div>
                )}

                {detailDocument.voidReason && (
                  <div>
                    <p className="text-sm font-medium mb-1 text-red-600">Void Reason</p>
                    <p className="text-sm text-muted-foreground">{detailDocument.voidReason}</p>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" onClick={() => setDetailId(null)}>
                    Close
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-4">Document not found.</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
