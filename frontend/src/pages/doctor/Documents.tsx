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
import type { Document, DocumentStatus, DocumentType } from '@/types/documents';
import toast from 'react-hot-toast';

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

const DOCUMENT_TYPES: { value: DocumentType; label: string }[] = [
  { value: 'medical_certificate', label: 'Medical Certificate' },
  { value: 'discharge_summary', label: 'Discharge Summary' },
  { value: 'referral', label: 'Referral' },
  { value: 'lab_report', label: 'Lab Report' },
];

export function DoctorDocuments() {
  const queryClient = useQueryClient();
  const authUser = useAppSelector((s) => s.auth.user);
  const { data: myDoctorProfileId, isLoading: myDoctorProfileLoading } = useMyDoctorProfileId(
    authUser?._id,
    authUser?.role
  );

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);

  // Create form state
  const [patientId, setPatientId] = useState('');
  const [docType, setDocType] = useState<DocumentType>('medical_certificate');
  const [notes, setNotes] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [treatment, setTreatment] = useState('');

  const { data: patientOptions = [], isLoading: patientsLoading } = usePatientsSelectQuery(createOpen);

  const { data, isLoading, isError } = useQuery<DocumentsResponse>({
    queryKey: ['documents', 'doctor', statusFilter],
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

  const resetCreateForm = () => {
    setPatientId('');
    setDocType('medical_certificate');
    setNotes('');
    setDiagnosis('');
    setTreatment('');
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      const templateData: Record<string, string> = {};
      if (diagnosis.trim()) templateData.diagnosis = diagnosis.trim();
      if (treatment.trim()) templateData.treatment = treatment.trim();

      const body = {
        patientId: patientId.trim(),
        issuedBy: myDoctorProfileId ?? '',
        type: docType,
        notes: notes.trim() || undefined,
        templateData: Object.keys(templateData).length > 0 ? templateData : undefined,
      };
      const res = await api.post('/documents', body);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Document created');
      setCreateOpen(false);
      resetCreateForm();
      void queryClient.invalidateQueries({ queryKey: ['documents', 'doctor'] });
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
          ?.message ?? 'Failed to create document';
      toast.error(msg);
    },
  });

  const issueMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post(`/documents/${id}/issue`);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Document issued');
      void queryClient.invalidateQueries({ queryKey: ['documents', 'doctor'] });
      void queryClient.invalidateQueries({ queryKey: ['document', detailId] });
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
          ?.message ?? 'Failed to issue document';
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
    createMutation.mutate();
  };

  const columns: ColumnDef<Document>[] = [
    {
      header: 'Document ID',
      accessorKey: 'documentId',
    },
    {
      header: 'Type',
      accessorKey: 'type',
      cell: (row) => DOCUMENT_TYPES.find((t) => t.value === row.type)?.label ?? row.type,
    },
    {
      header: 'Patient',
      accessorKey: 'patientId',
      cell: (row) =>
        `${row.patientId?.userId?.firstName ?? ''} ${row.patientId?.userId?.lastName ?? ''}`.trim() || '—',
    },
    {
      header: 'Created',
      accessorKey: 'createdAt',
      cell: (row) => new Date(row.createdAt).toLocaleDateString(),
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
          {row.status === 'draft' && (
            <Button
              size="sm"
              onClick={() => issueMutation.mutate(row._id)}
              disabled={issueMutation.isPending}
            >
              Issue
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Documents</h1>
          <p className="text-muted-foreground">Create and manage patient documents</p>
        </div>
        <Button onClick={() => { setCreateOpen(true); resetCreateForm(); }}>
          Create Document
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

      {/* Create Document Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg" onClose={() => setCreateOpen(false)}>
          <DialogHeader>
            <DialogTitle>Create Document</DialogTitle>
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
              <Label>Issuing doctor</Label>
              <p className="mt-1 text-sm text-muted-foreground">
                {myDoctorProfileLoading
                  ? 'Loading your profile…'
                  : myDoctorProfileId
                    ? `You (${authUser?.firstName ?? ''} ${authUser?.lastName ?? ''})`.trim() || 'Signed-in doctor'
                    : 'Could not resolve your doctor profile'}
              </p>
            </div>

            <div>
              <Label htmlFor="docType">Document Type</Label>
              <select
                id="docType"
                value={docType}
                onChange={(e) => setDocType(e.target.value as DocumentType)}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                {DOCUMENT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="diagnosis">Diagnosis</Label>
              <Input
                id="diagnosis"
                placeholder="e.g. Hypertension"
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="treatment">Treatment</Label>
              <Input
                id="treatment"
                placeholder="e.g. Prescribed medication and rest"
                value={treatment}
                onChange={(e) => setTreatment(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Additional notes"
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
                        Type: {DOCUMENT_TYPES.find((t) => t.value === detailDocument.type)?.label ?? detailDocument.type}
                      </span>
                      <span>Created: {new Date(detailDocument.createdAt).toLocaleDateString()}</span>
                      <span>
                        Patient:{' '}
                        {`${detailDocument.patientId?.userId?.firstName ?? ''} ${detailDocument.patientId?.userId?.lastName ?? ''}`.trim() || '—'}
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
                    <p className="text-sm font-medium mb-2">Template Data</p>
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

                {detailDocument.pdfUrl && (
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

                <div className="flex gap-2 pt-2">
                  {detailDocument.status === 'draft' && (
                    <Button
                      onClick={() => issueMutation.mutate(detailDocument._id)}
                      disabled={issueMutation.isPending}
                    >
                      {issueMutation.isPending ? 'Issuing...' : 'Issue Document'}
                    </Button>
                  )}
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
