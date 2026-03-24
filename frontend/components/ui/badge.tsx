import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "acid" | "danger" | "info" | "warning";
  className?: string;
}

export function Badge({ children, variant = "default", className }: BadgeProps) {
  const variants = {
    default: "bg-neutral-800 text-neutral-300 border-neutral-700",
    acid: "bg-acid/10 text-acid border-acid/20 shadow-[0_0_10px_rgba(204,255,0,0.05)]",
    danger: "bg-danger/10 text-danger border-danger/20",
    info: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    warning: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  };

  return (
    <span className={cn(
      "px-2 py-1 rounded text-[10px] font-mono uppercase border",
      variants[variant],
      className
    )}>
      {children}
    </span>
  );
}
