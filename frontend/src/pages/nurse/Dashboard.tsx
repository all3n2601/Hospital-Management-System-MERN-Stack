import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAppSelector } from '@/store/hooks';
import { KpiCard } from '@/components/Shared/KpiCard';
import { StatBar } from '@/components/Shared/StatBar';

interface Prescription {
  _id: string; status?: string; medicationName?: string; dosage?: string;
  quantity?: number; instructions?: string; patientId?: string;
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

  const dispensingQ = useQuery<{ success: boolean; data: Prescription[] }>({
    queryKey: ['pharmacy-dispensing'],
    queryFn: () => api.get('/pharmacy/dispensing?status=pending,ready&limit=5').then(r => r.data),
  });

  const inventoryQ = useQuery<{ success: boolean; data: InventoryItem[] }>({
    queryKey: ['nurse-dashboard', 'inventory-low'],
    queryFn: () => api.get('/inventory?belowReorder=true&limit=5').then(r => r.data),
  });

  const labQ = useQuery<{ success: boolean; data: LabOrder[] }>({
    queryKey: ['nurse-dashboard', 'lab'],
    queryFn: () => api.get('/lab/orders?status=pending,collected&limit=5').then(r => r.data),
  });

  const pendingRx: Prescription[]  = dispensingQ.data?.data ?? [];
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
          title="Pending Dispense"     value={dispensingQ.isLoading ? '…' : dispensingQ.isError ? '—' : pendingRx.length}
          trend={pendingRx.length > 0 ? `${pendingRx.length} waiting` : 'Queue clear'} trendDir={pendingRx.length > 0 ? 'down' : 'neutral'}
          color="amber" icon="💊" sparklineData={DISPENSE_SPARK} isLoading={dispensingQ.isLoading}
        />
        <KpiCard
          title="Low Stock Items"      value={inventoryQ.isLoading ? '…' : inventoryQ.isError ? '—' : lowStock.length}
          trend={lowStock.length > 0 ? `${lowStock.length} items low` : 'Stock OK'} trendDir={lowStock.length > 0 ? 'down' : 'neutral'}
          color="purple" icon="📦" sparklineData={STOCK_SPARK} isLoading={inventoryQ.isLoading}
        />
        <KpiCard
          title="Lab Samples Collected Today"  value={labQ.isLoading ? '…' : labQ.isError ? '—' : labOrders.length}
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
            {dispensingQ.isLoading && (
              <div className="space-y-3 py-3">
                {[1,2,3].map(i => <div key={i} className="h-9 bg-slate-100 rounded-lg animate-pulse" />)}
              </div>
            )}
            {dispensingQ.isError && <p className="text-sm text-red-500 px-4 py-2">Failed to load dispensing queue</p>}
            {!dispensingQ.isLoading && pendingRx.length === 0 && (
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
                    <div className="text-xs text-slate-400">{rx.patient?.patientId || rx.patientId || ''}</div>
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
              {inventoryQ.isError && <p className="text-sm text-red-500 px-4 py-2">Failed to load inventory</p>}
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
                    valueLabel={`${item.quantity ?? 0} / ${reorder}`}
                  />
                );
              })}
            </div>
          </div>

          {/* Quick actions */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <h2 className="text-[13px] font-bold text-slate-900 mb-3">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: '💊', label: 'Dispense',    sub: 'Process script',  href: '/nurse/dispensing' },
                { icon: '📦', label: 'Stock Check', sub: 'Inventory view',  href: '/nurse/inventory' },
              ].map(({ icon, label, sub, href }) => (
                <Link
                  key={label} to={href}
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
