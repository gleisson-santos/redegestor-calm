import { cn } from "@/lib/utils";
import {
  StatusObra,
  AlvaraStatus,
  Finalidade,
  statusObraLabels,
  statusObraTone,
  alvaraStatusLabels,
  alvaraTone,
  finalidadeLabels,
} from "@/data/mockData";

const dotByStatus: Record<StatusObra, string> = {
  planejada: "bg-muted-foreground/50",
  aguardando_alvara: "bg-warning",
  liberada: "bg-info",
  em_execucao: "bg-accent",
  concluida: "bg-primary",
  suspensa: "bg-destructive",
};

export function StatusBadge({ status, className }: { status: StatusObra; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium border",
        statusObraTone[status],
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", dotByStatus[status])} />
      {statusObraLabels[status]}
    </span>
  );
}

export function AlvaraBadge({ status, className }: { status: AlvaraStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium border",
        alvaraTone[status],
        className,
      )}
    >
      {alvaraStatusLabels[status]}
    </span>
  );
}

export function FinalidadeBadge({ finalidade }: { finalidade: Finalidade }) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border",
        finalidade === "substituicao"
          ? "bg-accent-soft text-accent border-accent/20"
          : "bg-info-soft text-info border-info/20",
      )}
    >
      {finalidadeLabels[finalidade]}
    </span>
  );
}

export function PrioridadeBadge({ prioridade }: { prioridade: number }) {
  const tone =
    prioridade <= 2
      ? "bg-destructive-soft text-destructive border-destructive/30"
      : prioridade <= 5
      ? "bg-warning-soft text-warning-foreground border-warning/30"
      : "bg-muted text-muted-foreground border-border";
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center min-w-[24px] h-[22px] px-1.5 rounded text-[11px] font-mono font-semibold border tabular",
        tone,
      )}
      title={`Ordem de prioridade ${prioridade}`}
    >
      P{prioridade}
    </span>
  );
}

export function MaterialBadge({ tipo }: { tipo: "DEFOFO" | "PEAD" | "FOFO" }) {
  const cls =
    tipo === "DEFOFO"
      ? "bg-primary-soft text-primary border-primary/20"
      : tipo === "PEAD"
      ? "bg-info-soft text-info border-info/20"
      : "bg-secondary text-secondary-foreground border-border-strong";
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-semibold border", cls)}>
      {tipo}
    </span>
  );
}
