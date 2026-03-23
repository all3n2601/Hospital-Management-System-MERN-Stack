import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAppSelector } from '@/store/hooks';
import { KpiCard } from '@/components/Shared/KpiCard';
import { AppointmentRow } from '@/components/Shared/AppointmentRow';
import { AlertItem } from '@/components/Shared/AlertItem';
import { StatBar } from '@/components/Shared/StatBar';
import { cn } from '@/lib/utils';

// Minimal types for dashboard queries
interface Patient { _id: string; }
interface LabOrder {
  _id: string; orderId?: string; testName?: string;
  status?: string; priority?: string; createdAt?: string;
  patient?: { patientId?: string; userId?: { firstName?: string; lastName?: string } };
  doctor?: { userId?: { firstName?: string; lastName?: string } };
}
interface Appointment {
  _id: string; timeSlot?: string; status?: string; type?: string; reason?: string;
  patient?: { patientId?: string; userId?: { firstName?: string; lastName?: string } };
  doctor?: { specialization?: string; userId?: { firstName?: string; lastName?: string } };
}
interface InventoryItem { _id: string; name?: string; }

const DEPT_STATS = [
  { label: 'Cardiology',   value: 82, color: '#6366f1' },
  { label: 'General Med',  value: 67, color: '#10b981' },
  { label: 'Orthopedics',  value: 45, color: '#f59e0b' },
  { label: 'Neurology',    value: 58, color: '#0ea5e9' },
];

const PATIENT_SPARK  = [40, 45, 38, 52, 48, 60, 55, 70, 65, 80];
const APPT_SPARK     = [20, 28, 22, 35, 30, 42, 38, 48, 44, 50];
const REVENUE_SPARK  = [30, 40, 35, 50, 45, 58, 52, 65, 60, 75];
const STAFF_SPARK    = [28, 30, 29, 32, 31, 33, 30, 32, 31, 32];

function greetingByHour(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function getInitials(a?: Appointment | null): string {
  const u = a?.patient?.userId;
  return u ? `${u.firstName?.[0] ?? ''}${u.lastName?.[0] ?? ''}`.toUpperCase() : 'PT';
}

function getPatientName(a: Appointment): string {
  const u = a.patient?.userId;
  return u ? `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() : 'Unknown Patient';
}

function getDoctorMeta(a: Appointment): string {
  const u = a.doctor?.userId;
  const spec = a.doctor?.specialization ?? '';
  return u ? `${spec} · Dr. ${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() : spec;
}

export function AdminDashboard() {
  const user = useAppSelector(s => s.auth.user);
  const [apptTab, setApptTab] = useState<'today' | 'upcoming'>('today');

  const patientsQ = useQuery<{ success: boolean; data: Patient[] }>({
    queryKey: ['admin-dash', 'patients'],
    queryFn: () => api.get('/patients?limit=1000').then(r => r.data),
  });

  const apptQ = useQuery<{ success: boolean; data: Appointment[] }>({
    queryKey: ['appointments', 'today'],
    queryFn: () => api.get('/appointments?date=today&limit=5').then(r => r.data),
  });

  const upcomingQ = useQuery<{ success: boolean; data: Appointment[] }>({
    queryKey: ['appointments', 'upcoming'],
    queryFn: () => api.get('/appointments?status=scheduled,confirmed&limit=5').then(r => r.data),
  });

  const revenueQ = useQuery<{ revenue: number }>({
    queryKey: ['billing-revenue-mtd'],
    queryFn: () => api.get('/billing/revenue-mtd').then(r => r.data),
  });

  const labQ = useQuery<{ success: boolean; data: LabOrder[] }>({
    queryKey: ['admin-dash', 'lab'],
    queryFn: () => api.get('/lab/orders?status=pending,processing&limit=5').then(r => r.data),
  });

  const lowStockQ = useQuery<{ success: boolean; data: InventoryItem[] }>({
    queryKey: ['inventory-low'],
    queryFn: () => api.get('/inventory?belowReorder=true&limit=1').then(r => r.data),
  });

  const totalPatients = patientsQ.data?.data?.length ?? 0;
  const todayAppts    = apptQ.data?.data ?? [];
  const upcomingAppts = upcomingQ.data?.data ?? [];
  const pendingLabs   = labQ.data?.data ?? [];

  const dateLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const alerts = [
    ...(pendingLabs.filter((l: LabOrder) => l.priority === 'urgent').slice(0, 1).map((l: LabOrder) => ({
      dotColor: '#ef4444', text: `Critical lab result — Patient ${l.patient?.patientId || 'unknown'}`, time: new Date(l.createdAt ?? '').toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})
    }))),
    ...(lowStockQ.data?.data?.slice(0, 1).map((item: InventoryItem) => ({
      dotColor: '#f59e0b', text: `Low stock: ${item.name}`, time: 'Now'
    })) || []),
    { dotColor: '#22c55e', text: 'Invoice paid — INV-0108', time: '2h ago' },
  ].slice(0, 3);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            {greetingByHour()}, {user?.firstName} 👋
          </h1>
          <p className="text-[12px] text-slate-500 mt-0.5">
            {dateLabel} · Hospital Overview
          </p>
        </div>
        <Link
          to="/admin/analytics"
          className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-2 rounded-lg transition-colors"
        >
          📊 Analytics →
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total Patients"     value={patientsQ.isLoading ? '…' : patientsQ.isError ? '—' : totalPatients.toLocaleString()}
          trend="12% this month"     trendDir="up"
          color="blue"              icon="🏥"
          sparklineData={PATIENT_SPARK}
          isLoading={patientsQ.isLoading}
        />
        <KpiCard
          title="Appointments Today" value={apptQ.isLoading ? '…' : todayAppts.length}
          trend={`${todayAppts.filter(a => a.status === 'scheduled').length} pending`} trendDir="neutral"
          color="green"             icon="📅"
          sparklineData={APPT_SPARK}
          isLoading={apptQ.isLoading}
        />
        <KpiCard
          title="Revenue (MTD)"      value={revenueQ.isLoading ? '…' : revenueQ.isError ? '—' : `$${((revenueQ.data?.revenue || 0) / 1000).toFixed(1)}K`}
          trend="8.2% vs last month" trendDir="up"
          color="amber"             icon="💰"
          sparklineData={REVENUE_SPARK}
          isLoading={revenueQ.isLoading}
        />
        <KpiCard
          title="Staff on Duty"      value="32"
          trend="4 on leave"         trendDir="neutral"
          color="purple"            icon="👥"
          sparklineData={STAFF_SPARK}
        />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Appointments card - takes 2 cols */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-50">
            <h2 className="text-[13px] font-bold text-slate-900">Appointments</h2>
            <div className="flex items-center gap-3">
              <div className="flex gap-1 bg-slate-100 rounded-lg p-0.5">
                {(['today','upcoming'] as const).map(tab => (
                  <button key={tab} onClick={() => setApptTab(tab)}
                    className={cn('px-3 py-1 text-xs font-medium rounded-md transition-colors capitalize',
                      apptTab === tab ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700')}>
                    {tab}
                  </button>
                ))}
              </div>
              <Link to="/admin/patients" className="text-[11px] font-semibold text-indigo-600 hover:underline">
                View all →
              </Link>
            </div>
          </div>
          <div className="px-4 divide-y divide-slate-50">
            {apptTab === 'today' && (
              <>
                {apptQ.isLoading && (
                  <div className="space-y-3 py-3">
                    {[1,2,3].map(i => <div key={i} className="h-9 bg-slate-100 rounded-lg animate-pulse" />)}
                  </div>
                )}
                {!apptQ.isLoading && todayAppts.length === 0 && (
                  <p className="text-[12px] text-slate-400 py-6 text-center">No appointments scheduled today</p>
                )}
                {todayAppts.map(appt => (
                  <AppointmentRow
                    key={appt._id}
                    initials={getInitials(appt)}
                    name={getPatientName(appt)}
                    meta={getDoctorMeta(appt)}
                    time={appt.timeSlot ?? '—'}
                    status={appt.status ?? 'scheduled'}
                  />
                ))}
              </>
            )}
            {apptTab === 'upcoming' && (
              <>
                {upcomingQ.isLoading && (
                  <div className="space-y-3 py-3">
                    {[1,2,3].map(i => <div key={i} className="h-9 bg-slate-100 rounded-lg animate-pulse" />)}
                  </div>
                )}
                {!upcomingQ.isLoading && upcomingAppts.length === 0 && (
                  <p className="text-[12px] text-slate-400 py-6 text-center">No upcoming appointments</p>
                )}
                {upcomingAppts.map(appt => (
                  <AppointmentRow
                    key={appt._id}
                    initials={getInitials(appt)}
                    name={getPatientName(appt)}
                    meta={getDoctorMeta(appt)}
                    time={appt.timeSlot ?? '—'}
                    status={appt.status ?? 'scheduled'}
                  />
                ))}
              </>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Quick Actions */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <h2 className="text-[13px] font-bold text-slate-900 mb-3">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-2">
              {[
                { icon: '👤', label: 'New Patient',   sub: 'Register',      to: '/admin/patients' },
                { icon: '📅', label: 'Book Appointment', sub: 'Schedule visit', to: '/admin/appointments' },
                { icon: '💰', label: 'Billing',       sub: 'Manage bills',  to: '/admin/billing' },
                { icon: '👥', label: 'Staff',         sub: 'Manage team',   to: '/admin/staff' },
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

          {/* Live Alerts */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-50">
              <h2 className="text-[13px] font-bold text-slate-900">🔔 Live Alerts</h2>
            </div>
            <div className="px-4 py-1">
              {alerts.map((a) => <AlertItem key={a.text} dotColor={a.dotColor} time={a.time}>{a.text}</AlertItem>)}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom grid — department load + pending labs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[13px] font-bold text-slate-900">Department Load</h2>
            <Link to="/admin/analytics" className="text-[11px] text-indigo-600 hover:underline font-semibold">View report →</Link>
          </div>
          {DEPT_STATS.map(d => (
            <StatBar key={d.label} label={d.label} value={d.value} max={100} color={d.color} />
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-50">
            <h2 className="text-[13px] font-bold text-slate-900">Pending Lab Orders</h2>
            <Link to="/admin/lab" className="text-[11px] text-indigo-600 hover:underline font-semibold">View all →</Link>
          </div>
          <div className="px-4 divide-y divide-slate-50">
            {labQ.isLoading && (
              <div className="space-y-2 py-3">
                {[1,2,3].map(i => <div key={i} className="h-7 bg-slate-100 rounded animate-pulse" />)}
              </div>
            )}
            {labQ.isError && <p className="text-sm text-red-500 px-4 py-2">Failed to load lab orders</p>}
            {!labQ.isLoading && pendingLabs.length === 0 && (
              <p className="text-[12px] text-slate-400 py-6 text-center">No pending lab orders</p>
            )}
            {pendingLabs.map(lab => {
              const patName = lab.patient?.userId
                ? `${lab.patient.userId.firstName ?? ''} ${lab.patient.userId.lastName ?? ''}`.trim()
                : lab.patient?.patientId ?? '—';
              const docName = lab.doctor?.userId
                ? `Dr. ${lab.doctor.userId.firstName ?? ''} ${lab.doctor.userId.lastName ?? ''}`.trim()
                : 'Unknown';
              const createdLabel = lab.createdAt
                ? new Date(lab.createdAt).toLocaleDateString() : '—';
              return (
                <div key={lab._id} className="flex items-center gap-3 py-2.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold text-slate-800 truncate">{lab.testName ?? lab.orderId ?? '—'}</p>
                    <p className="text-[10px] text-slate-400 truncate">{patName} · {docName} · {createdLabel}</p>
                  </div>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${
                    lab.priority === 'urgent' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'
                  }`}>
                    {lab.status ?? 'Pending'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
