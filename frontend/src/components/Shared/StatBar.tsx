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
