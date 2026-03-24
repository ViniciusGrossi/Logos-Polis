import ReportBuilderClient from "@/components/ReportBuilderClient";

export default function RelatoriosPage() {
  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-8">
      <div className="space-y-1">
        <p className="font-mono text-xs text-acid uppercase tracking-[0.3em] print:hidden">Gerador de Relatórios</p>
        <h1 className="text-5xl font-serif text-white leading-tight print:hidden">Live Report Builder</h1>
      </div>
      
      <ReportBuilderClient />
    </div>
  );
}
