import { ReactNode } from 'react';

export interface ColumnDef<T> {
  header: string;
  accessorKey: keyof T | string;
  cell?: (item: T) => ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

interface DataGridProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  onRowClick?: (item: T) => void;
  isLoading?: boolean;
  emptyMessage?: string;
}

export function DataGrid<T extends { id: string | number }>({ 
  data, 
  columns, 
  onRowClick, 
  isLoading, 
  emptyMessage = "Nenhum dado encontrado." 
}: DataGridProps<T>) {
  
  if (isLoading) {
    return (
      <div className="w-full border-2 border-slate-700 bg-black flex flex-col animate-pulse">
        <div className="h-12 border-b-2 border-slate-800 bg-slate-900 w-full" />
        {[...Array(5)].map((_, i) => (
          <div key={`skeleton-${i}`} className="h-16 w-full border-b border-slate-800 opacity-20" />
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="w-full border-2 border-slate-700 bg-black flex items-center justify-center p-12 text-slate-500 font-mono text-sm uppercase tracking-widest">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto border-2 border-slate-700 bg-black shadow-[4px_4px_0px_#1e293b]">
      <table className="w-full text-left border-collapse">
        <thead className="bg-slate-900 text-slate-400 font-mono text-[10px] uppercase tracking-widest border-b-2 border-slate-700">
          <tr>
            {columns.map((col, index) => (
              <th 
                key={String(col.accessorKey)} 
                className={`p-4 font-bold border-r border-slate-800 last:border-r-0 whitespace-nowrap ${
                  col.align === 'center' ? 'text-center' : 
                  col.align === 'right' ? 'text-right' : 'text-left'
                }`}
                style={{ width: col.width }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="text-slate-200 text-sm">
          {data.map((item) => (
            <tr 
              key={item.id} 
              onClick={() => onRowClick && onRowClick(item)}
              className={`border-b border-slate-800/50 last:border-b-0 hover:bg-slate-900/80 transition-colors ${
                onRowClick ? 'cursor-pointer' : ''
              }`}
            >
              {columns.map((col) => (
                <td 
                  key={`${item.id}-${String(col.accessorKey)}`} 
                  className={`p-4 border-r border-slate-800/30 last:border-r-0 ${
                    col.align === 'center' ? 'text-center' : 
                    col.align === 'right' ? 'text-right' : 'text-left'
                  }`}
                >
                  {col.cell ? col.cell(item) : String(item[col.accessorKey as keyof T] || '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
