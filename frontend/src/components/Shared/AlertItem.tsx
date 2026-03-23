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
