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
  const gradient = GRADIENTS[(initials.charCodeAt(0) || 0) % GRADIENTS.length];
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
