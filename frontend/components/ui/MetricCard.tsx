import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  context?: string;
}

export function MetricCard({ title, value, trend, trendValue, context }: MetricCardProps) {
  return (
    <div className="flex flex-col border border-border bg-panel p-6 group transition-all hover:bg-charcoal shadow-[4px_4px_0px_rgba(0,0,0,0.5)] hover:shadow-[6px_6px_0px_rgba(0,0,0,0.6)] hover:-translate-y-1 hover:-translate-x-1">
      <h3 className="text-neutral-500 font-mono text-xs font-bold uppercase tracking-widest mb-4">
        {title}
      </h3>
      
      <div className="flex items-end justify-between mt-auto">
        <span className="text-4xl text-white font-black leading-none tracking-tighter">
          {value}
        </span>
        
        {trend && (
          <div className="flex flex-col items-end gap-1">
            <div 
              className={`flex items-center gap-1 text-sm font-bold ${
                trend === 'up' ? 'text-acid' :
                trend === 'down' ? 'text-danger' :
                'text-neutral-500'
              }`}
            >
              {trend === 'up' && <ArrowUpRight className="w-4 h-4" strokeWidth={3} />}
              {trend === 'down' && <ArrowDownRight className="w-4 h-4" strokeWidth={3} />}
              {trend === 'neutral' && <Minus className="w-4 h-4" strokeWidth={3} />}
              <span>{trendValue}</span>
            </div>
            
            {context && (
              <span className="text-[10px] uppercase font-mono text-slate-500 tracking-wider">
                {context}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
