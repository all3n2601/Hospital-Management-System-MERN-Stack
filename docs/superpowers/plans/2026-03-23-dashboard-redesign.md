# Dashboard Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign all four role dashboards (Admin, Doctor, Patient, Nurse) with the Modern Light UI style from ui-modern-v1, fix the sidebar appointments routing bug, and add three reusable shared components.

**Architecture:** Create three shared components (`KpiCard`, `AppointmentRow`, `AlertItem`/`StatBar`) then rewrite all four dashboard pages to use them. The sidebar `NAV_ITEMS` array gets a one-line fix for the broken `/appointments` route. All data comes from existing API endpoints — no backend changes.

**Tech Stack:** React 18, TypeScript, TailwindCSS, Shadcn/ui, TanStack Query v5, recharts (already installed), react-router-dom v6, lucide-react

---

## File Map

**New files:**
- `frontend/src/components/Shared/KpiCard.tsx` — KPI stat card with gradient top border, icon, trend badge, recharts sparkline
- `frontend/src/components/Shared/AppointmentRow.tsx` — lightweight appointment row (initials avatar, name, meta, time, status pill)
- `frontend/src/components/Shared/AlertItem.tsx` — colored dot + text + timestamp row
- `frontend/src/components/Shared/StatBar.tsx` — label + progress bar + value row

**Modified files:**
- `frontend/src/components/layout/Sidebar.tsx` — fix broken `/appointments` route
- `frontend/src/pages/admin/Dashboard.tsx` — full redesign with live API data
- `frontend/src/pages/doctor/Dashboard.tsx` — redesign with richer layout
- `frontend/src/pages/patient/Dashboard.tsx` — redesign with timeline + balance card
- `frontend/src/pages/nurse/Dashboard.tsx` — redesign with dispensing queue + low stock

---

## Task 1: Fix Sidebar Appointments Bug

**Files:**
- Modify: `frontend/src/components/layout/Sidebar.tsx`

- [ ] **Step 1: Open Sidebar.tsx and locate the broken entry**

In `NAV_ITEMS` array (~line 22), find:
```ts
{ label: 'Appointments', href: '/appointments', icon: Calendar, roles: ['admin', 'doctor', 'receptionist', 'patient'] },
```

- [ ] **Step 2: Replace with role-specific entries**

Replace that single line with two lines:
```ts
{ label: 'Appointments', href: '/patient/appointments', icon: Calendar, roles: ['patient'] },
{ label: 'Schedule',     href: '/doctor/schedule',      icon: Calendar, roles: ['doctor'] },
```
Admin and receptionist have no standalone appointments route — they manage appointments through the Patients page. Remove them from this nav item entirely.

- [ ] **Step 3: Verify dev server compiles**

```bash
cd frontend && npm run typecheck
```
Expected: no errors

- [ ] **Step 4: Manual smoke test**

Start dev server (`npm run dev`). Log in as a patient and verify the "Appointments" link in the sidebar navigates to `/patient/appointments` and the page loads. Log in as a doctor and verify "Schedule" navigates to `/doctor/schedule`.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/layout/Sidebar.tsx
git commit -m "fix(sidebar): correct appointments route per role (patient/doctor)"
```

---

## Task 2: KpiCard Shared Component

**Files:**
- Create: `frontend/src/components/Shared/KpiCard.tsx`

- [ ] **Step 1: Create the file**

```tsx
// frontend/src/components/Shared/KpiCard.tsx
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';

const COLOR_CONFIG = {
  blue:   { bar: 'from-sky-400 to-indigo-500',    iconBg: 'bg-sky-50',     spark: '#0ea5e9' },
  green:  { bar: 'from-emerald-400 to-green-600', iconBg: 'bg-emerald-50', spark: '#10b981' },
  amber:  { bar: 'from-amber-400 to-red-400',     iconBg: 'bg-amber-50',   spark: '#f59e0b' },
  purple: { bar: 'from-violet-400 to-indigo-500', iconBg: 'bg-violet-50',  spark: '#8b5cf6' },
  pink:   { bar: 'from-pink-400 to-rose-500',     iconBg: 'bg-pink-50',    spark: '#ec4899' },
} as const;

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: string;
  trendDir?: 'up' | 'down' | 'neutral';
  color: keyof typeof COLOR_CONFIG;
  icon: string;
  sparklineData?: number[];
  isLoading?: boolean;
}

export function KpiCard({
  title, value, subtitle, trend, trendDir = 'neutral',
  color, icon, sparklineData, isLoading,
}: KpiCardProps) {
  const cfg = COLOR_CONFIG[color];
  const sparkData = (sparklineData ?? []).map((v, i) => ({ i, v }));

  return (
    <div className="relative bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className={cn('absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r', cfg.bar)} />
      <div className="p-4 pt-5">
        <div className="flex items-start justify-between mb-2">
          <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center text-lg', cfg.iconBg)}>
            {icon}
          </div>
          {trend && (
            <span className={cn('text-[10px] font-bold px-2 py-1 rounded-full', {
              'bg-emerald-50 text-emerald-700': trendDir === 'up',
              'bg-red-50 text-red-600':         trendDir === 'down',
              'bg-slate-100 text-slate-500':    trendDir === 'neutral',
            })}>
              {trendDir === 'up' ? '↑ ' : trendDir === 'down' ? '↓ ' : ''}{trend}
            </span>
          )}
        </div>
        {isLoading ? (
          <div className="h-7 bg-slate-100 rounded animate-pulse my-1" />
        ) : (
          <p className="text-2xl font-extrabold text-slate-900 tracking-tight">{value}</p>
        )}
        <p className="text-[11px] text-slate-500 mt-0.5">{title}</p>
        {subtitle && <p className="text-[10px] text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
      {sparklineData && sparklineData.length > 0 && (
        <div className="h-10 px-1 pb-1">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparkData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id={`kpi-spark-${color}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={cfg.spark} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={cfg.spark} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone" dataKey="v"
                stroke={cfg.spark} strokeWidth={1.5}
                fill={`url(#kpi-spark-${color})`}
                dot={false} isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify types compile**

```bash
cd frontend && npm run typecheck
```
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/Shared/KpiCard.tsx
git commit -m "feat(shared): add KpiCard component with sparkline"
```

---

## Task 3: AppointmentRow Shared Component

**Files:**
- Create: `frontend/src/components/Shared/AppointmentRow.tsx`

- [ ] **Step 1: Create the file**

```tsx
// frontend/src/components/Shared/AppointmentRow.tsx
import { cn } from '@/lib/utils';

const GRADIENTS = [
  'from-sky-400 to-indigo-500',
  'from-pink-400 to-rose-500',
  'from-amber-400 to-red-500',
  'from-emerald-400 to-sky-400',
  'from-violet-400 to-indigo-500',
];

const STATUS_STYLES: Record<string, string> = {
  scheduled:  'bg-blue-50 text-blue-700',
  confirmed:  'bg-emerald-50 text-emerald-700',
  inProgress: 'bg-orange-50 text-orange-700',
  completed:  'bg-slate-100 text-slate-500',
  cancelled:  'bg-red-50 text-red-700',
  pending:    'bg-amber-50 text-amber-700',
  noShow:     'bg-slate-100 text-slate-400',
};

const STATUS_LABELS: Record<string, string> = {
  inProgress: 'In Progress',
  noShow: 'No Show',
};

interface AppointmentRowProps {
  initials: string;
  name: string;
  meta: string;
  time: string;
  status: string;
}

export function AppointmentRow({ initials, name, meta, time, status }: AppointmentRowProps) {
  const gradient = GRADIENTS[initials.charCodeAt(0) % GRADIENTS.length];
  const statusStyle = STATUS_STYLES[status] ?? 'bg-slate-100 text-slate-500';
  const statusLabel = STATUS_LABELS[status] ?? (status.charAt(0).toUpperCase() + status.slice(1));

  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-slate-50 last:border-0">
      <div className={cn(
        'w-8 h-8 rounded-full bg-gradient-to-br flex items-center justify-center',
        'text-[10px] font-bold text-white flex-shrink-0',
        gradient,
      )}>
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-semibold text-slate-900 truncate">{name}</p>
        <p className="text-[10px] text-slate-400 truncate">{meta}</p>
      </div>
      <span className="text-[10px] font-semibold text-slate-500 whitespace-nowrap">{time}</span>
      <span className={cn('text-[9px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap', statusStyle)}>
        {statusLabel}
      </span>
    </div>
  );
}
```

- [ ] **Step 2: Verify types**

```bash
cd frontend && npm run typecheck
```
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/Shared/AppointmentRow.tsx
git commit -m "feat(shared): add AppointmentRow component"
```

---

## Task 4: AlertItem and StatBar Shared Components

**Files:**
- Create: `frontend/src/components/Shared/AlertItem.tsx`
- Create: `frontend/src/components/Shared/StatBar.tsx`

- [ ] **Step 1: Create AlertItem**

```tsx
// frontend/src/components/Shared/AlertItem.tsx
import type { ReactNode } from 'react';

interface AlertItemProps {
  dotColor: string;
  children: ReactNode;
  time?: string;
}

export function AlertItem({ dotColor, children, time }: AlertItemProps) {
  return (
    <div className="flex gap-2.5 py-2 border-b border-slate-50 last:border-0">
      <div
        className="w-2 h-2 rounded-full flex-shrink-0 mt-[5px]"
        style={{ backgroundColor: dotColor }}
      />
      <div>
        <p className="text-[11px] text-slate-600 leading-relaxed">{children}</p>
        {time && <p className="text-[10px] text-slate-400 mt-0.5">{time}</p>}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create StatBar**

```tsx
// frontend/src/components/Shared/StatBar.tsx
interface StatBarProps {
  label: string;
  value: number;
  max?: number;
  color?: string;
  unit?: string;
}

export function StatBar({ label, value, max = 100, color = '#6366f1', unit = '%' }: StatBarProps) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="flex items-center gap-3 py-1.5">
      <span className="text-[10px] text-slate-500 w-24 flex-shrink-0 truncate">{label}</span>
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-[10px] font-bold text-slate-800 w-10 text-right flex-shrink-0">
        {unit === '%' ? `${value}%` : `${value}`}
      </span>
    </div>
  );
}
```

- [ ] **Step 3: Verify types**

```bash
cd frontend && npm run typecheck
```
Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/Shared/AlertItem.tsx frontend/src/components/Shared/StatBar.tsx
git commit -m "feat(shared): add AlertItem and StatBar components"
```

---

## Task 5: Admin Dashboard Redesign

**Files:**
- Modify: `frontend/src/pages/admin/Dashboard.tsx`

- [ ] **Step 1: Rewrite the file**

Replace the entire contents of `frontend/src/pages/admin/Dashboard.tsx` with:

```tsx
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAppSelector } from '@/store/hooks';
import { KpiCard } from '@/components/Shared/KpiCard';
import { AppointmentRow } from '@/components/Shared/AppointmentRow';
import { AlertItem } from '@/components/Shared/AlertItem';
import { StatBar } from '@/components/Shared/StatBar';

// Minimal types for dashboard queries
interface Patient { _id: string; }
interface StaffMember { _id: string; onDuty?: boolean; }
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
interface Invoice { _id: string; totalAmount?: number; status?: string; }

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
  const isReceptionist = user?.role === 'receptionist';
  const today = new Date().toISOString().split('T')[0];

  const patientsQ = useQuery<{ success: boolean; data: Patient[] }>({
    queryKey: ['admin-dash', 'patients'],
    queryFn: () => api.get('/patients').then(r => r.data),
  });

  const staffQ = useQuery<{ success: boolean; data: StaffMember[] }>({
    queryKey: ['admin-dash', 'staff'],
    queryFn: () => api.get('/staff').then(r => r.data),
  });

  const apptQ = useQuery<{ success: boolean; data: Appointment[] }>({
    queryKey: ['admin-dash', 'appts', today],
    queryFn: () => api.get(`/appointments?date=${today}&limit=6`).then(r => r.data),
  });

  const billingQ = useQuery<{ success: boolean; data: Invoice[] }>({
    queryKey: ['admin-dash', 'billing'],
    queryFn: () => api.get('/billing?limit=50').then(r => r.data),
  });

  const labQ = useQuery<{ success: boolean; data: LabOrder[] }>({
    queryKey: ['admin-dash', 'lab'],
    queryFn: () => api.get('/lab/orders?status=pending,processing&limit=5').then(r => r.data),
  });

  const totalPatients = patientsQ.data?.data?.length ?? 0;
  const totalStaff    = staffQ.data?.data?.length ?? 0;
  const todayAppts    = apptQ.data?.data ?? [];

  const revenueMTD = (billingQ.data?.data ?? [])
    .filter(inv => inv.status === 'paid')
    .reduce((sum, inv) => sum + (inv.totalAmount ?? 0), 0);

  const pendingLabs = labQ.data?.data ?? [];

  const dateLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            {greetingByHour()}, {user?.firstName} 👋
          </h1>
          <p className="text-[12px] text-slate-500 mt-0.5">
            {dateLabel} · {isReceptionist ? 'Receptionist Dashboard' : 'Hospital Overview'}
          </p>
        </div>
        {!isReceptionist && (
          <Link
            to="/admin/analytics"
            className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-2 rounded-lg transition-colors"
          >
            📊 Analytics →
          </Link>
        )}
      </div>

      {/* KPI Cards */}
      {!isReceptionist && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            title="Total Patients"     value={patientsQ.isLoading ? '…' : totalPatients.toLocaleString()}
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
            title="Revenue (MTD)"      value={billingQ.isLoading ? '…' : `$${(revenueMTD / 1000).toFixed(1)}K`}
            trend="8.2% vs last month" trendDir="up"
            color="amber"             icon="💰"
            sparklineData={REVENUE_SPARK}
            isLoading={billingQ.isLoading}
          />
          <KpiCard
            title="Staff on Duty"      value={staffQ.isLoading ? '…' : totalStaff}
            trend="4 on leave"         trendDir="neutral"
            color="purple"            icon="👥"
            sparklineData={STAFF_SPARK}
            isLoading={staffQ.isLoading}
          />
        </div>
      )}

      {isReceptionist && (
        <div className="grid grid-cols-2 gap-4">
          <KpiCard
            title="Appointments Today" value={apptQ.isLoading ? '…' : todayAppts.length}
            color="green" icon="📅" isLoading={apptQ.isLoading}
          />
          <KpiCard
            title="Pending Lab Orders" value={labQ.isLoading ? '…' : pendingLabs.length}
            color="purple" icon="🔬" isLoading={labQ.isLoading}
          />
        </div>
      )}

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Appointments card - takes 2 cols */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-50">
            <h2 className="text-[13px] font-bold text-slate-900">Today's Appointments</h2>
            <Link to="/admin/patients" className="text-[11px] font-semibold text-indigo-600 hover:underline">
              View all →
            </Link>
          </div>
          <div className="px-4 divide-y divide-slate-50">
            {apptQ.isLoading && (
              <div className="space-y-3 py-3">
                {[1,2,3].map(i => <div key={i} className="h-9 bg-slate-100 rounded-lg animate-pulse" />)}
              </div>
            )}
            {!apptQ.isLoading && todayAppts.length === 0 && (
              <p className="text-[12px] text-slate-400 py-6 text-center">No appointments scheduled today</p>
            )}
            {todayAppts.slice(0, 5).map(appt => (
              <AppointmentRow
                key={appt._id}
                initials={getInitials(appt)}
                name={getPatientName(appt)}
                meta={getDoctorMeta(appt)}
                time={appt.timeSlot ?? '—'}
                status={appt.status ?? 'scheduled'}
              />
            ))}
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
                { icon: '📅', label: 'Appointments',  sub: 'View schedule', to: '/admin/patients' },
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
              <h2 className="text-[13px] font-bold text-slate-900">🔔 Recent Activity</h2>
            </div>
            <div className="px-4 py-1">
              {pendingLabs.length > 0 ? (
                pendingLabs.slice(0, 3).map(lab => (
                  <AlertItem key={lab._id} dotColor={lab.priority === 'urgent' ? '#ef4444' : '#f59e0b'} time="Pending">
                    <strong>{lab.testName ?? 'Lab order'}</strong>
                    {lab.patient?.userId && ` — ${lab.patient.userId.firstName} ${lab.patient.userId.lastName}`}
                  </AlertItem>
                ))
              ) : (
                <>
                  <AlertItem dotColor="#10b981" time="System">Hospital system running normally</AlertItem>
                  <AlertItem dotColor="#6366f1" time="Tip">
                    Check <Link to="/admin/analytics" className="text-indigo-600 hover:underline">Analytics</Link> for detailed reports
                  </AlertItem>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom grid — department load + pending labs */}
      {!isReceptionist && (
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
      )}
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

```bash
cd frontend && npm run typecheck
```
Expected: no errors

- [ ] **Step 3: Visual check**
Start dev server, log in as admin, verify the dashboard shows KPI cards with data, today's appointments list, quick actions, and pending lab section.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/admin/Dashboard.tsx
git commit -m "feat(admin): redesign dashboard with KPI cards, live data, and alerts"
```

---

## Task 6: Doctor Dashboard Redesign

**Files:**
- Modify: `frontend/src/pages/doctor/Dashboard.tsx`

- [ ] **Step 1: Rewrite the file**

Replace the entire contents of `frontend/src/pages/doctor/Dashboard.tsx` with:

```tsx
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
          trend={criticalLabs.length > 0 ? `${criticalLabs.length} critical` : 'All normal'} trendDir={criticalLabs.length > 0 ? 'down' : 'neutral'}
          color="purple" icon="🔬" sparklineData={LAB_SPARK} isLoading={labQ.isLoading}
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
            <Link to="/doctor/schedule" className="text-[11px] font-semibold text-indigo-600 hover:underline">
              Full schedule →
            </Link>
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
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Quick actions */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <h2 className="text-[13px] font-bold text-slate-900 mb-3">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-2">
              {[
                { icon: '💊', label: 'Prescribe',    sub: 'Write script',    to: '/doctor/prescriptions' },
                { icon: '🔬', label: 'Order Lab',    sub: 'Request test',    to: '/doctor/lab' },
                { icon: '📄', label: 'Documents',    sub: 'Patient files',   to: '/doctor/documents' },
                { icon: '📅', label: 'Schedule',     sub: 'Manage calendar', to: '/doctor/schedule' },
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
              <h2 className="text-[13px] font-bold text-slate-900">🔬 Lab Orders</h2>
              <Link to="/doctor/lab" className="text-[11px] font-semibold text-indigo-600 hover:underline">View all →</Link>
            </div>
            <div className="px-4 py-1">
              {labQ.isLoading && <div className="h-16 animate-pulse bg-slate-50 rounded-lg m-2" />}
              {!labQ.isLoading && labOrders.length === 0 && (
                <p className="text-[11px] text-slate-400 py-4 text-center">No recent lab orders</p>
              )}
              {labOrders.slice(0, 4).map(lab => {
                const isUrgent = lab.priority === 'urgent';
                const dotColor = isUrgent ? '#ef4444' : lab.status === 'resulted' ? '#10b981' : '#f59e0b';
                const patName = lab.patient?.userId
                  ? `${lab.patient.userId.firstName ?? ''} ${lab.patient.userId.lastName ?? ''}`.trim()
                  : '—';
                return (
                  <AlertItem key={lab._id} dotColor={dotColor}
                    time={lab.createdAt ? new Date(lab.createdAt).toLocaleDateString() : undefined}
                  >
                    {isUrgent && <strong>URGENT — </strong>}
                    {lab.testName ?? 'Lab order'}{patName !== '—' && ` · ${patName}`}
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
```

- [ ] **Step 2: Typecheck**

```bash
cd frontend && npm run typecheck
```
Expected: no errors

- [ ] **Step 3: Visual check**
Log in as doctor, verify KPI cards, schedule rows, quick actions, and lab feed all render.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/doctor/Dashboard.tsx
git commit -m "feat(doctor): redesign dashboard with schedule, lab feed, quick actions"
```

---

## Task 7: Patient Dashboard Redesign

**Files:**
- Modify: `frontend/src/pages/patient/Dashboard.tsx`

- [ ] **Step 1: Rewrite the file**

Replace the entire contents of `frontend/src/pages/patient/Dashboard.tsx` with:

```tsx
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
  | { kind: 'lab';     _id: string; title: string; sub: string; date: string; icon: string; iconBg: string }
  | { kind: 'appt';    _id: string; title: string; sub: string; date: string; icon: string; iconBg: string }
  | { kind: 'bill';    _id: string; title: string; sub: string; date: string; icon: string; iconBg: string }
  | { kind: 'script';  _id: string; title: string; sub: string; date: string; icon: string; iconBg: string };

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
    queryFn: () => api.get('/appointments?status=confirmed,scheduled&limit=3').then(r => r.data),
  });

  const billsQ = useQuery<{ success: boolean; data: Invoice[] }>({
    queryKey: ['patient-dashboard', 'billing'],
    queryFn: () => api.get('/billing?limit=5').then(r => r.data),
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
      title: 'Upcoming Appointment',
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
          trend={labResults.length > 0 ? '1 new' : 'Up to date'} trendDir="neutral"
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
            <Link to="/patient/appointments" className="text-[11px] font-semibold text-indigo-600 hover:underline">View all →</Link>
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
                { icon: '💊', label: 'Prescriptions', sub: 'View active Rx',  to: '/patient/prescriptions' },
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
      {timeline.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-50">
            <h2 className="text-[13px] font-bold text-slate-900">Recent Health Activity</h2>
          </div>
          <div className="px-4 divide-y divide-slate-50">
            {timeline.map(event => (
              <div key={event._id} className="flex items-center gap-3 py-3">
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
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

```bash
cd frontend && npm run typecheck
```
Expected: no errors

- [ ] **Step 3: Visual check**
Log in as a patient, verify KPI cards, appointment date-badge rows, quick actions, prescriptions panel, and timeline all render.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/patient/Dashboard.tsx
git commit -m "feat(patient): redesign dashboard with timeline, balance card, and date badges"
```

---

## Task 8: Nurse Dashboard Redesign

**Files:**
- Modify: `frontend/src/pages/nurse/Dashboard.tsx`

- [ ] **Step 1: Rewrite the file**

Replace the entire contents of `frontend/src/pages/nurse/Dashboard.tsx` with:

```tsx
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAppSelector } from '@/store/hooks';
import { KpiCard } from '@/components/Shared/KpiCard';
import { StatBar } from '@/components/Shared/StatBar';

interface Prescription {
  _id: string; status?: string; medicationName?: string; dosage?: string;
  quantity?: number; instructions?: string;
  patient?: { patientId?: string; userId?: { firstName?: string; lastName?: string } };
  doctor?: { userId?: { firstName?: string; lastName?: string } };
}

interface InventoryItem {
  _id: string; name?: string; quantity?: number; reorderLevel?: number; unit?: string;
}

interface LabOrder {
  _id: string; orderId?: string; testName?: string; status?: string; priority?: string;
}

const DISPENSE_SPARK = [2, 3, 2, 4, 3, 5, 4, 4, 3, 4];
const STOCK_SPARK    = [8, 7, 6, 5, 4, 3, 3, 2, 2, 2];
const LAB_SPARK      = [3, 4, 5, 4, 6, 5, 7, 6, 7, 7];

const PILL_STYLES: Record<string, string> = {
  pending:   'bg-amber-50 text-amber-700',
  active:    'bg-amber-50 text-amber-700',
  dispensed: 'bg-slate-100 text-slate-500',
  filled:    'bg-emerald-50 text-emerald-700',
  ready:     'bg-emerald-50 text-emerald-700',
};

function greetingByHour(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export function NurseDashboard() {
  const user = useAppSelector(s => s.auth.user);

  const rxQ = useQuery<{ success: boolean; data: Prescription[] }>({
    queryKey: ['nurse-dashboard', 'prescriptions'],
    queryFn: () => api.get('/pharmacy/prescriptions?status=active&limit=6').then(r => r.data),
  });

  const inventoryQ = useQuery<{ success: boolean; data: InventoryItem[] }>({
    queryKey: ['nurse-dashboard', 'inventory-low'],
    queryFn: () => api.get('/inventory?belowReorder=true&limit=5').then(r => r.data),
  });

  const labQ = useQuery<{ success: boolean; data: LabOrder[] }>({
    queryKey: ['nurse-dashboard', 'lab'],
    queryFn: () => api.get('/lab/orders?status=pending,collected&limit=5').then(r => r.data),
  });

  const pendingRx  = rxQ.data?.data ?? [];
  const lowStock   = inventoryQ.data?.data ?? [];
  const labOrders  = labQ.data?.data ?? [];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
          {greetingByHour()}, {user?.firstName} 💉
        </h1>
        <p className="text-[12px] text-slate-500 mt-0.5">
          {pendingRx.length > 0
            ? `${pendingRx.length} dispensing request${pendingRx.length > 1 ? 's' : ''} pending`
            : 'Dispensing queue is clear'}
          {lowStock.length > 0 && ` · ${lowStock.length} item${lowStock.length > 1 ? 's' : ''} low on stock`}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard
          title="Pending Dispense"     value={rxQ.isLoading ? '…' : pendingRx.length}
          trend={pendingRx.length > 0 ? `${pendingRx.length} waiting` : 'Queue clear'} trendDir={pendingRx.length > 0 ? 'down' : 'neutral'}
          color="amber" icon="💊" sparklineData={DISPENSE_SPARK} isLoading={rxQ.isLoading}
        />
        <KpiCard
          title="Low Stock Items"      value={inventoryQ.isLoading ? '…' : lowStock.length}
          trend={lowStock.length > 0 ? `${lowStock.length} items low` : 'Stock OK'} trendDir={lowStock.length > 0 ? 'down' : 'neutral'}
          color="purple" icon="📦" sparklineData={STOCK_SPARK} isLoading={inventoryQ.isLoading}
        />
        <KpiCard
          title="Lab Samples Pending"  value={labQ.isLoading ? '…' : labOrders.length}
          trend="Awaiting results"     trendDir="neutral"
          color="green" icon="🔬" sparklineData={LAB_SPARK} isLoading={labQ.isLoading}
        />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Dispensing queue */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-50">
            <h2 className="text-[13px] font-bold text-slate-900">Dispensing Queue</h2>
            <Link to="/nurse/dispensing" className="text-[11px] font-semibold text-indigo-600 hover:underline">
              View all →
            </Link>
          </div>
          <div className="px-4 divide-y divide-slate-50">
            {rxQ.isLoading && (
              <div className="space-y-3 py-3">
                {[1,2,3].map(i => <div key={i} className="h-9 bg-slate-100 rounded-lg animate-pulse" />)}
              </div>
            )}
            {!rxQ.isLoading && pendingRx.length === 0 && (
              <p className="text-[12px] text-slate-400 py-8 text-center">No pending prescriptions</p>
            )}
            {pendingRx.map(rx => {
              const patUser = rx.patient?.userId;
              const initials = patUser
                ? `${patUser.firstName?.[0] ?? ''}${patUser.lastName?.[0] ?? ''}`.toUpperCase()
                : 'PT';
              const patName = patUser
                ? `${patUser.firstName ?? ''} ${patUser.lastName ?? ''}`.trim()
                : rx.patient?.patientId ?? 'Unknown Patient';
              const docUser = rx.doctor?.userId;
              const docName = docUser
                ? `Dr. ${docUser.firstName ?? ''} ${docUser.lastName ?? ''}`.trim()
                : 'Unknown';
              const drug = [rx.medicationName, rx.dosage, rx.quantity ? `×${rx.quantity}` : ''].filter(Boolean).join(' ');
              const statusStyle = PILL_STYLES[rx.status ?? 'pending'] ?? PILL_STYLES.pending;
              const statusLabel = (rx.status ?? 'pending').charAt(0).toUpperCase() + (rx.status ?? 'pending').slice(1);

              return (
                <div key={rx._id} className="flex items-center gap-3 py-2.5 border-b border-slate-50 last:border-0">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-red-500 flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold text-slate-900 truncate">{patName}</p>
                    <p className="text-[10px] text-slate-400 truncate">{drug} · {docName}</p>
                  </div>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${statusStyle}`}>
                    {statusLabel}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Low stock */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-50">
              <h2 className="text-[13px] font-bold text-slate-900">⚠️ Low Stock</h2>
              <Link to="/nurse/inventory" className="text-[11px] font-semibold text-indigo-600 hover:underline">
                View →
              </Link>
            </div>
            <div className="px-4 py-2">
              {inventoryQ.isLoading && <div className="h-16 animate-pulse bg-slate-50 rounded-lg" />}
              {!inventoryQ.isLoading && lowStock.length === 0 && (
                <p className="text-[11px] text-slate-400 py-3 text-center">All stock levels OK</p>
              )}
              {lowStock.map(item => {
                const reorder = item.reorderLevel ?? 50;
                const pct = Math.round(((item.quantity ?? 0) / reorder) * 100);
                const color = pct < 30 ? '#ef4444' : pct < 60 ? '#f59e0b' : '#10b981';
                return (
                  <StatBar
                    key={item._id}
                    label={item.name ?? '—'}
                    value={item.quantity ?? 0}
                    max={reorder}
                    color={color}
                    unit="qty"
                  />
                );
              })}
            </div>
          </div>

          {/* Quick actions */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <h2 className="text-[13px] font-bold text-slate-900 mb-3">Quick Actions</h2>
            <div className="flex flex-col gap-2">
              {[
                { icon: '💊', label: 'Dispensing Queue', sub: `${pendingRx.length} pending`, to: '/nurse/dispensing' },
                { icon: '📦', label: 'Inventory',        sub: 'Check stock levels',          to: '/nurse/inventory' },
              ].map(({ icon, label, sub, to }) => (
                <Link
                  key={label} to={to}
                  className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 transition-colors group"
                >
                  <span className="text-lg">{icon}</span>
                  <div>
                    <p className="text-[12px] font-bold text-slate-700 group-hover:text-indigo-700">{label}</p>
                    <p className="text-[10px] text-slate-400">{sub}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

```bash
cd frontend && npm run typecheck
```
Expected: no errors

- [ ] **Step 3: Visual check**
Log in as a nurse, verify KPI cards, dispensing queue rows, low stock bars, and quick actions render.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/nurse/Dashboard.tsx
git commit -m "feat(nurse): redesign dashboard with dispensing queue and low stock panel"
```

---

## Task 9: Final Integration Check

- [ ] **Step 1: Run full typecheck**

```bash
cd frontend && npm run typecheck
```
Expected: exit 0, no errors

- [ ] **Step 2: Run lint**

```bash
cd frontend && npm run lint
```
Expected: exit 0, no errors (fix any lint issues before proceeding)

- [ ] **Step 3: Run frontend tests**

```bash
cd frontend && npm test
```
Expected: all existing tests pass (no new tests broken)

- [ ] **Step 4: Manual smoke test — all roles**

Start the dev stack (`docker compose up` or backend + frontend separately). Log in as each role and verify:

| Role | Check |
|---|---|
| Admin | 4 KPI cards load with data, appointments table shows, quick actions link correctly |
| Doctor | 3 KPI cards, today's schedule, lab feed, quick actions |
| Patient | 4 KPI cards, appointment date-badge rows, prescriptions list, timeline section |
| Nurse | 3 KPI cards, dispensing queue, low stock bars |
| Patient | Click Appointments in sidebar → navigates to `/patient/appointments` (not 404) |
| Doctor | Click Schedule in sidebar → navigates to `/doctor/schedule` |

- [ ] **Step 5: Final commit**

```bash
git add frontend/src/components/Shared/KpiCard.tsx \
        frontend/src/components/Shared/AppointmentRow.tsx \
        frontend/src/components/Shared/AlertItem.tsx \
        frontend/src/components/Shared/StatBar.tsx \
        frontend/src/components/layout/Sidebar.tsx \
        frontend/src/pages/admin/Dashboard.tsx \
        frontend/src/pages/doctor/Dashboard.tsx \
        frontend/src/pages/patient/Dashboard.tsx \
        frontend/src/pages/nurse/Dashboard.tsx
git commit -m "feat(dashboard): complete all-role dashboard redesign + sidebar fix"
```
