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
