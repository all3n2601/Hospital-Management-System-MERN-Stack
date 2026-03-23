import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAppSelector } from '@/store/hooks';
import { KpiCard } from '@/components/Shared/KpiCard';
import { AppointmentRow } from '@/components/Shared/AppointmentRow';
import { AlertItem } from '@/components/Shared/AlertItem';

interface Appointment {
  _id: string; timeSlot?: string; status?: string; type?: string; reason?: string;
  patient?: { patientId?: string; userId?: { firstName?: string; lastName?: string } };
  doctor?: { specialization?: string };
}
interface LabOrder {
  _id: string; orderId?: string; testName?: string;
  priority?: string; status?: string; createdAt?: string;
  patient?: { userId?: { firstName?: string; lastName?: string } };
}
interface Prescription { _id: string; status?: string; }

const APPT_SPARK = [4, 6, 5, 8, 7, 9, 8, 12, 10, 12];
const LAB_SPARK  = [2, 4, 3, 6, 5, 7, 6, 8, 7, 8];
const RX_SPARK   = [1, 2, 2, 3, 4, 3, 4, 5, 5, 5];

function greetingByHour(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function getInitials(appt: Appointment): string {
  const u = appt.patient?.userId;
  return u ? `${u.firstName?.[0] ?? ''}${u.lastName?.[0] ?? ''}`.toUpperCase() : 'PT';
}

function getPatientName(appt: Appointment): string {
  const u = appt.patient?.userId;
  return u ? `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() : 'Unknown Patient';
}

function labDotColor(lab: LabOrder): string {
  if (lab.priority === 'urgent' || lab.status === 'critical') return '#ef4444';
  if (lab.status === 'pending' || lab.status === 'processing') return '#f59e0b';
  return '#22c55e';
}

export function DoctorDashboard() {
  const user = useAppSelector(s => s.auth.user);
  const today = new Date().toISOString().split('T')[0];

  const apptQ = useQuery<{ success: boolean; data: Appointment[] }>({
    queryKey: ['doctor-dashboard', 'appointments', today],
    queryFn: () => api.get(`/appointments?date=${today}`).then(r => r.data),
  });

  const labQ = useQuery<{ success: boolean; data: LabOrder[] }>({
    queryKey: ['doctor-dashboard', 'lab'],
    queryFn: () => api.get('/lab/orders?limit=5').then(r => r.data),
  });

  const rxQ = useQuery<{ success: boolean; data: Prescription[] }>({
    queryKey: ['doctor-dashboard', 'prescriptions'],
    queryFn: () => api.get('/pharmacy/prescriptions?status=active').then(r => r.data),
  });

  const todayAppts = apptQ.data?.data ?? [];
  const labOrders  = labQ.data?.data ?? [];
  const activePrescriptions = rxQ.data?.data ?? [];

  const criticalLabs = labOrders.filter(l => l.priority === 'urgent' || l.status === 'critical');

  const dateLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
          {greetingByHour()}, Dr. {user?.firstName} 👨‍⚕️
        </h1>
        <p className="text-[12px] text-slate-500 mt-0.5">
          {dateLabel} · {todayAppts.length} patients today
          {criticalLabs.length > 0 && ` · ${criticalLabs.length} critical lab result${criticalLabs.length > 1 ? 's' : ''} need review`}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard
          title="Today's Patients"    value={apptQ.isLoading ? '…' : todayAppts.length}
          trend={`${todayAppts.filter(a => a.status === 'confirmed').length} confirmed`} trendDir="up"
          color="green" icon="📅" sparklineData={APPT_SPARK} isLoading={apptQ.isLoading}
        />
        <KpiCard
          title="Pending Lab Orders"  value={labQ.isLoading ? '…' : labOrders.length}
          subtitle={`${labQ.data?.data?.filter((l: LabOrder) => l.priority === 'urgent').length ?? 0} critical`}
          trend={criticalLabs.length > 0 ? `${criticalLabs.length} critical` : 'All normal'} trendDir={criticalLabs.length > 0 ? 'down' : 'neutral'}
          color="purple" icon="🧪" sparklineData={LAB_SPARK} isLoading={labQ.isLoading}
        />
        <KpiCard
          title="Active Prescriptions" value={rxQ.isLoading ? '…' : activePrescriptions.length}
          trend="Active" trendDir="neutral"
          color="amber" icon="💊" sparklineData={RX_SPARK} isLoading={rxQ.isLoading}
        />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Today's schedule */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-50">
            <h2 className="text-[13px] font-bold text-slate-900">Today's Schedule</h2>
          </div>
          <div className="px-4 divide-y divide-slate-50">
            {apptQ.isLoading && (
              <div className="space-y-3 py-3">
                {[1,2,3,4].map(i => <div key={i} className="h-9 bg-slate-100 rounded-lg animate-pulse" />)}
              </div>
            )}
            {!apptQ.isLoading && todayAppts.length === 0 && (
              <p className="text-[12px] text-slate-400 py-8 text-center">No patients scheduled for today</p>
            )}
            {todayAppts.slice(0, 6).map(appt => (
              <AppointmentRow
                key={appt._id}
                initials={getInitials(appt)}
                name={getPatientName(appt)}
                meta={[appt.doctor?.specialization, appt.reason, appt.patient?.patientId].filter(Boolean).join(' · ')}
                time={appt.timeSlot ?? '—'}
                status={appt.status ?? 'scheduled'}
              />
            ))}
          </div>
          {/* Footer */}
          <div className="px-6 py-3 border-t border-slate-100 text-right">
            <Link to="/doctor/schedule" className="text-xs font-medium text-indigo-600 hover:text-indigo-800">
              Full schedule →
            </Link>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Quick actions */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <h2 className="text-[13px] font-bold text-slate-900 mb-3">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-2">
              {[
                { icon: '💊', label: 'Prescribe',         sub: 'New prescription',    to: '/doctor/prescriptions/new' },
                { icon: '🧪', label: 'Order Lab',         sub: 'Request test',        to: '/doctor/lab/new' },
                { icon: '📄', label: 'Issue Certificate', sub: 'Medical certificate', to: '/doctor/documents' },
                { icon: '📝', label: 'Patient Notes',     sub: 'Clinical notes',      to: '/doctor/patients' },
              ].map(({ icon, label, sub, to }) => (
                <Link
                  key={label} to={to}
                  className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 transition-colors group"
                >
                  <span className="text-base">{icon}</span>
                  <div>
                    <p className="text-[11px] font-bold text-slate-700 group-hover:text-indigo-700">{label}</p>
                    <p className="text-[10px] text-slate-400">{sub}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Lab results feed */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-50">
              <h2 className="text-[13px] font-bold text-slate-900">🧪 Lab Results In</h2>
              <Link to="/doctor/lab" className="text-[11px] font-semibold text-indigo-600 hover:underline">View all →</Link>
            </div>
            <div className="px-4 py-1">
              {labQ.isLoading && <div className="h-16 animate-pulse bg-slate-50 rounded-lg m-2" />}
              {!labQ.isLoading && labOrders.length === 0 && (
                <p className="text-[11px] text-slate-400 py-4 text-center">No recent lab results</p>
              )}
              {labOrders.slice(0, 4).map(lab => {
                const dotColor = labDotColor(lab);
                const patName = lab.patient?.userId
                  ? `${lab.patient.userId.firstName ?? ''} ${lab.patient.userId.lastName ?? ''}`.trim()
                  : '—';
                return (
                  <AlertItem key={lab._id} dotColor={dotColor}
                    time={lab.createdAt ? new Date(lab.createdAt).toLocaleDateString() : undefined}
                  >
                    {(lab.priority === 'urgent' || lab.status === 'critical') && <strong>URGENT — </strong>}
                    {lab.testName ?? 'Lab result'}{patName !== '—' && ` · ${patName}`}
                  </AlertItem>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
