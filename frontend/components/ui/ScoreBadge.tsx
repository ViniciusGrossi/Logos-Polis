interface ScoreBadgeProps {
  type: 'apoiador' | 'neutro' | 'critico';
  score?: number;
  className?: string;
}

const BADGE_STYLES = {
  apoiador: 'bg-acid/10 text-acid border-acid/50',
  neutro: 'bg-concrete/10 text-concrete border-concrete/50',
  critico: 'bg-danger/10 text-danger border-danger/50',
};

export function ScoreBadge({ type, score, className }: ScoreBadgeProps) {
  return (
    <div className={`inline-flex items-center gap-2 px-2 py-1 border text-[10px] font-bold uppercase tracking-wider ${BADGE_STYLES[type]} ${className || ''}`}>
      <span className="relative flex h-2 w-2">
        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
          type === 'apoiador' ? 'bg-acid' :
          type === 'neutro' ? 'bg-concrete' : 'bg-danger'
        }`}></span>
        <span className={`relative inline-flex rounded-full h-2 w-2 ${
          type === 'apoiador' ? 'bg-acid' :
          type === 'neutro' ? 'bg-concrete' : 'bg-danger'
        }`}></span>
      </span>
      <span>{type}</span>
      {score !== undefined && (
        <span className="ml-1 pl-2 border-l-2 border-current opacity-80 font-mono">
          {score}
        </span>
      )}
    </div>
  );
}
