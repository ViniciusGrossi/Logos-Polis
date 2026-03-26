import { ReactNode } from 'react';

interface PageLayoutProps {
  title: string;
  subtitle?: string;
  headerContent?: ReactNode;
  children: ReactNode;
}

export function PageLayout({ title, subtitle, headerContent, children }: PageLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen w-full bg-obsidian text-neutral-300 selection:bg-acid selection:text-black">
      {/* 
        Header brutalista: 
        Border inferior dura e zero padding supérfluo.
      */}
      <header className="flex flex-col gap-4 items-start sm:flex-row sm:items-end justify-between px-8 py-8 border-b border-border bg-panel sticky top-0 z-40">
        <div className="flex flex-col gap-1">
          <h1 className="font-serif text-4xl sm:text-5xl font-black tracking-tighter uppercase text-white">
            {title}
          </h1>
          {subtitle && (
            <p className="text-slate-400 font-mono text-sm tracking-widest uppercase">
              {subtitle}
            </p>
          )}
        </div>
        
        {headerContent && (
          <div className="flex items-center">
            {headerContent}
          </div>
        )}
      </header>

      <main className="flex-1 p-8 grid grid-cols-1 gap-8 auto-rows-min max-w-[2000px] w-full mx-auto">
        {children}
      </main>
    </div>
  );
}
