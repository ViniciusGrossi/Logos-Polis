'use client';

import { useAppStore } from '@/store/useAppStore';
import { useBairros } from '@/features/bairros/useBairros';

export function GlobalFilter() {
  const { globalRegionFilter, setGlobalRegionFilter } = useAppStore();
  const { data: bairros } = useBairros();

  return (
    <div className="flex items-center gap-2 bg-slate-900 border-2 border-slate-700 p-1 rounded-none shadow-[4px_4px_0px_#1e293b] transition-transform hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#1e293b]">
      <div className="px-3 text-xs font-mono font-bold text-slate-400 uppercase tracking-wider border-r-2 border-slate-700">
        Filtro Global
      </div>
      
      <select 
        value={globalRegionFilter || 'all'}
        onChange={(e) => setGlobalRegionFilter(e.target.value === 'all' ? null : e.target.value)}
        className="bg-transparent border-none text-sm font-bold text-white focus:ring-0 focus:outline-none px-4 py-2 uppercase tracking-wide cursor-pointer appearance-none min-w-[180px]"
      >
        <option value="all" className="bg-slate-900 text-white">Toda a Cidade</option>
        {bairros?.map((b) => (
          <option key={b} value={b} className="bg-slate-900 text-white">
            {b}
          </option>
        ))}
      </select>
    </div>
  );
}
