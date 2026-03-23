import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAppSelector } from '@/store/hooks';
import { KpiCard } from '@/components/Shared/KpiCard';
import { AlertItem } from '@/components/Shared/AlertItem';

interface Appointment {
  _id: string; date?: string; timeSlot?: string; status?: string; reason?: string;
  doctor?: { specialization?: string; userId?: { firstName?: string; lastName?: string } };
}
interface Invoice { _id: string; invoiceId?: string; totalAmount?: number; status?: string; createdAt?: string; }
interface Prescription { _id: string; status?: string; medicationName?: string; dosage?: string; daysSupply?: number; }
interface LabResult { _id: string; testName?: string; status?: string; createdAt?: string; }

type TimelineEvent =
  | { kind: 'lab';    _id: string; title: string; sub: string; date: string; icon: string; iconBg: string }
  | { kind: 'appt';   _id: string; title: string; sub: string; date: string; icon: string; iconBg: string }
  | { kind: 'bill';   _id: string; title: string; sub: string; date: string; icon: string; iconBg: string }
  | { kind: 'script'; _id: string; title: string; sub: string; date: string; icon: string; iconBg: string };

function greetingByHour(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function formatDate(d?: string): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatApptDate(dateStr?: string): { day: string; month: string; bg: string; text: string } {
  if (!dateStr) return { day: '—', month: '—', bg: 'bg-slate-100', text: 'text-slate-500' };
  const d = new Date(dateStr);
  const day   = d.getDate().toString();
  const month = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
  const daysAway = Math.ceil((d.getTime() - Date.now()) / 86400000);
  if (daysAway <= 3)  return { day, month, bg: 'bg-blue-50',    text: 'text-blue-700' };
  if (daysAway <= 14) return { day, month, bg: 'bg-emerald-50', text: 'text-emerald-700' };
  return { day, month, bg: 'bg-slate-100', text: 'text-slate-500' };
}

export function PatientDashboard() {
  const user = useAppSelector(s => s.auth.user);

  const apptQ = useQuery<{ success: boolean; data: Appointment[] }>({
    queryKey: ['patient-dashboard', 'appointments'],
    queryFn: () => api.get('/appointments?status=completed,confirmed,scheduled&limit=5').then(r => r.data),
  });

  const billsQ = useQuery<{ success: boolean; data: Invoice[] }>({
    queryKey: ['patient-dashboard', 'billing'],
    queryFn: () => api.get('/billing?status=unpaid&limit=20').then(r => r.data),
  });

  const rxQ = useQuery<{ success: boolean; data: Prescription[] }>({
    queryKey: ['patient-dashboard', 'prescriptions'],
    queryFn: () => api.get('/pharmacy/prescriptions?status=active').then(r => r.data),
  });

  const labQ = useQuery<{ success: boolean; data: LabResult[] }>({
    queryKey: ['patient-dashboard', 'lab'],
    queryFn: () => api.get('/lab/results?limit=5').then(r => r.data),
  });

  const upcomingAppts   = apptQ.data?.data ?? [];
  const allBills        = billsQ.data?.data ?? [];
  const activePrescriptions = rxQ.data?.data ?? [];
  const labResults      = labQ.data?.data ?? [];

  const unpaidBills     = allBills.filter(b => b.status === 'unpaid' || b.status === 'pending');
  const outstandingAmt  = unpaidBills.reduce((sum, b) => sum + (b.totalAmount ?? 0), 0);

  const labResultsQ = labQ;
  const newLabCount = labResultsQ.data?.data?.filter((l: LabResult) => l.status === 'resulted' || l.status === 'pending').length ?? 0;

  const nextAppt = upcomingAppts[0];
  const nextApptLabel = nextAppt?.date
    ? `Next appointment: ${new Date(nextAppt.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}`
    : 'No upcoming appointments';

  // Build timeline from all fetched data
  const timeline: TimelineEvent[] = [
    ...labResults.slice(0, 2).map(r => ({
      kind: 'lab' as const, _id: r._id,
      title: `Lab Result: ${r.testName ?? 'Test'}`,
      sub: r.status === 'resulted' ? 'Results ready for review' : `Status: ${r.status ?? '—'}`,
      date: formatDate(r.createdAt),
      icon: '🔬', iconBg: 'bg-emerald-50',
    })),
    ...upcomingAppts.map(a => ({
      kind: 'appt' as const, _id: a._id,
      title: a.status === 'completed' ? 'Appointment Completed' : 'Upcoming Appointment',
      sub: a.doctor?.userId
        ? `Dr. ${a.doctor.userId.firstName} ${a.doctor.userId.lastName} · ${a.doctor.specialization ?? ''}`
        : a.reason ?? 'Scheduled visit',
      date: formatDate(a.date),
      icon: '📅', iconBg: 'bg-blue-50',
    })),
    ...allBills.filter(b => b.status === 'paid').slice(0, 1).map(b => ({
      kind: 'bill' as const, _id: b._id,
      title: `Invoice Paid — ${b.invoiceId ?? b._id.slice(-6)}`,
      sub: `$${(b.totalAmount ?? 0).toLocaleString()} · Payment received`,
      date: formatDate(b.createdAt),
      icon: '💰', iconBg: 'bg-amber-50',
    })),
    ...activePrescriptions.slice(0, 1).map(p => ({
      kind: 'script' as const, _id: p._id,
      title: `Prescription Active`,
      sub: [p.medicationName, p.dosage, p.daysSupply ? `${p.daysSupply} days` : ''].filter(Boolean).join(' · ') || 'Active prescription',
      date: 'Active',
      icon: '💊', iconBg: 'bg-violet-50',
    })),
  ].slice(0, 5);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            {greetingByHour()}, {user?.firstName} 👋
          </h1>
          <p className="text-[12px] text-slate-500 mt-0.5">{nextApptLabel}</p>
        </div>
        <Link
          to="/patient/book-appointment"
          className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-2 rounded-lg transition-colors"
        >
          + Book Appointment
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Upcoming Appointments" value={apptQ.isLoading ? '…' : upcomingAppts.length}
          trend={nextAppt?.date ? `Next: ${new Date(nextAppt.date).toLocaleDateString('en-US', { weekday: 'short' })}` : 'None'}
          trendDir="neutral" color="blue" icon="📅" isLoading={apptQ.isLoading}
        />
        <KpiCard
          title="Active Prescriptions" value={rxQ.isLoading ? '…' : activePrescriptions.length}
          trend="Active" trendDir="up" color="green" icon="💊" isLoading={rxQ.isLoading}
        />
        <KpiCard
          title="Lab Results"          value={labQ.isLoading ? '…' : labResults.length}
          trend={newLabCount > 0 ? `${newLabCount} new` : 'Up to date'} trendDir="neutral"
          color="purple" icon="🔬" isLoading={labQ.isLoading}
        />
        <KpiCard
          title="Outstanding Balance"  value={billsQ.isLoading ? '…' : outstandingAmt > 0 ? `$${outstandingAmt.toLocaleString()}` : '$0'}
          trend={unpaidBills.length > 0 ? `${unpaidBills.length} due` : 'All paid'} trendDir={unpaidBills.length > 0 ? 'down' : 'neutral'}
          color="amber" icon="💰" isLoading={billsQ.isLoading}
        />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Appointments */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-50">
            <h2 className="text-[13px] font-bold text-slate-900">My Appointments</h2>
            <Link to="/patient/appointments/new" className="text-xs font-medium text-indigo-600 hover:text-indigo-800">Book new →</Link>
          </div>
          <div className="px-4 divide-y divide-slate-50">
            {apptQ.isLoading && (
              <div className="space-y-3 py-3">
                {[1,2].map(i => <div key={i} className="h-14 bg-slate-100 rounded-lg animate-pulse" />)}
              </div>
            )}
            {!apptQ.isLoading && upcomingAppts.length === 0 && (
              <div className="py-8 text-center">
                <p className="text-[12px] text-slate-400 mb-3">No upcoming appointments</p>
                <Link to="/patient/book-appointment" className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100">
                  Book Appointment
                </Link>
              </div>
            )}
            {upcomingAppts.map(appt => {
              const dateParts = formatApptDate(appt.date);
              const docName = appt.doctor?.userId
                ? `Dr. ${appt.doctor.userId.firstName} ${appt.doctor.userId.lastName}`
                : 'Doctor TBD';
              return (
                <div key={appt._id} className="flex items-center gap-3 py-3 border-b border-slate-50 last:border-0">
                  <div className={`w-10 h-10 ${dateParts.bg} rounded-xl flex flex-col items-center justify-center flex-shrink-0`}>
                    <span className={`text-[14px] font-extrabold ${dateParts.text} leading-none`}>{dateParts.day}</span>
                    <span className={`text-[8px] font-bold ${dateParts.text} opacity-70`}>{dateParts.month}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold text-slate-900 truncate">{docName}</p>
                    <p className="text-[10px] text-slate-400 truncate">
                      {appt.timeSlot ?? '—'} · {appt.doctor?.specialization ?? 'General'}{appt.reason ? ` · ${appt.reason}` : ''}
                    </p>
                  </div>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${
                    appt.status === 'confirmed' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'
                  }`}>
                    {appt.status === 'confirmed' ? 'Confirmed' : 'Scheduled'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Quick actions */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <h2 className="text-[13px] font-bold text-slate-900 mb-3">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-2">
              {[
                { icon: '📅', label: 'Book Appt',   sub: 'Schedule visit',   to: '/patient/book-appointment' },
                { icon: '💊', label: 'Refill Rx',     sub: 'Request refill',  to: '/patient/prescriptions' },
                { icon: '💰', label: 'Pay Bill',     sub: outstandingAmt > 0 ? `$${outstandingAmt} due` : 'All paid', to: '/patient/billing' },
                { icon: '📄', label: 'My Records',   sub: 'Documents',        to: '/patient/documents' },
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

          {/* Active prescriptions */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-50">
              <h2 className="text-[13px] font-bold text-slate-900">Active Prescriptions</h2>
              <Link to="/patient/prescriptions" className="text-[11px] font-semibold text-indigo-600 hover:underline">View all →</Link>
            </div>
            <div className="px-4 py-1">
              {rxQ.isLoading && <div className="h-16 animate-pulse bg-slate-50 rounded-lg m-2" />}
              {!rxQ.isLoading && activePrescriptions.length === 0 && (
                <p className="text-[11px] text-slate-400 py-4 text-center">No active prescriptions</p>
              )}
              {activePrescriptions.slice(0, 3).map(rx => (
                <AlertItem key={rx._id} dotColor="#10b981">
                  <strong>{rx.medicationName ?? 'Medication'}</strong>
                  {rx.dosage && ` — ${rx.dosage}`}
                  {rx.daysSupply && <span className="text-slate-400"> · {rx.daysSupply} days</span>}
                </AlertItem>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Health Activity Timeline */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-50">
          <h3 className="text-[13px] font-bold text-slate-900">Health Activity Timeline</h3>
        </div>
        {timeline.length === 0 ? (
          <p className="text-sm text-slate-400 py-6 text-center">No recent activity</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {timeline.map(event => (
              <div key={event._id} className="flex items-center gap-3 py-3 px-4">
                <div className={`w-8 h-8 ${event.iconBg} rounded-xl flex items-center justify-center text-base flex-shrink-0`}>
                  {event.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-semibold text-slate-900 truncate">{event.title}</p>
                  <p className="text-[10px] text-slate-400 truncate">{event.sub}</p>
                </div>
                <span className="text-[10px] text-slate-400 whitespace-nowrap flex-shrink-0">{event.date}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
