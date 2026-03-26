'use client';

import { ReactNode } from 'react';
import { ResponsiveContainer } from 'recharts';

interface ChartContainerProps {
  title: string;
  subtitle?: string;
  height?: number;
  children: ReactNode;
  action?: ReactNode;
}

export function ChartContainer({ title, subtitle, height = 300, children, action }: ChartContainerProps) {
  return (
    <div className="flex flex-col border-2 border-slate-700 bg-black overflow-hidden shadow-[4px_4px_0px_#1e293b]">
      <div className="flex items-center justify-between border-b-2 border-slate-700 bg-slate-900/50 px-6 py-4">
        <div>
          <h3 className="text-slate-200 font-bold uppercase tracking-wider text-sm">
            {title}
          </h3>
          {subtitle && (
            <p className="text-slate-500 font-mono text-[10px] mt-1 uppercase tracking-widest">
              {subtitle}
            </p>
          )}
        </div>
        
        {action && (
          <div>{action}</div>
        )}
      </div>
      
      <div className="p-6 pb-2" style={{ height: `${height}px` }}>
        <ResponsiveContainer width="100%" height="100%">
          {children as any}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
