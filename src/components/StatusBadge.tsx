import { cn } from "@/lib/utils";
import { ContractStatus, statusLabels } from "@/data/mockData";

const styles: Record<ContractStatus, string> = {
  ativo: "bg-accent-soft text-accent-foreground border-accent/20",
  pausado: "bg-muted text-muted-foreground border-border",
  concluido: "bg-info-soft text-foreground/70 border-info/20",
  atencao: "bg-warning-soft text-warning-foreground border-warning/30",
};

const dots: Record<ContractStatus, string> = {
  ativo: "bg-accent",
  pausado: "bg-muted-foreground/50",
  concluido: "bg-info",
  atencao: "bg-warning",
};

export function StatusBadge({ status, className }: { status: ContractStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border calm-transition",
        styles[status],
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", dots[status], status === "ativo" && "animate-gentle-pulse")} />
      {statusLabels[status]}
    </span>
  );
}
