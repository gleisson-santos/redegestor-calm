import { useQuery } from "@tanstack/react-query";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { fetchHistoricoByObra, descreverEvento, tempoRelativo } from "@/data/historico";
import { fetchDiarioByObra } from "@/data/diario";
import type { Obra } from "@/data/api";
import { History, ClipboardCheck, FileText, AlertCircle, CalendarDays, FileCheck2, ArrowUpDown, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  obra: Obra | null;
  onClose: () => void;
}

const iconForCampo: Record<string, typeof History> = {
  status: ArrowUpDown,
  data_inicio: CalendarDays,
  data_termino: CalendarDays,
  alvara_liberado: FileCheck2,
  prioridade: AlertCircle,
  observacoes: MessageSquare,
};

export function HistoricoDrawer({ obra, onClose }: Props) {
  const open = !!obra;

  const histQ = useQuery({
    queryKey: ["historico", obra?.id],
    queryFn: () => fetchHistoricoByObra(obra!.id),
    enabled: open,
  });

  const diarioQ = useQuery({
    queryKey: ["diario", obra?.id],
    queryFn: () => fetchDiarioByObra(obra!.id),
    enabled: open,
  });

  // Mescla eventos + lançamentos do diário em uma timeline única
  type TLItem = {
    ts: string;
    icon: typeof History;
    titulo: string;
    detalhe: string;
    tone: "neutral" | "accent" | "success" | "warning";
  };
  const items: TLItem[] = [];

  for (const ev of (histQ.data ?? [])) {
    items.push({
      ts: ev.created_at,
      icon: iconForCampo[ev.campo_alterado] ?? History,
      titulo: descreverEvento(ev),
      detalhe: `Sistema · ${new Date(ev.created_at).toLocaleString("pt-BR")}`,
      tone: ev.campo_alterado === "status" ? "accent"
          : ev.campo_alterado === "alvara_liberado" ? "success"
          : "neutral",
    });
  }
  for (const l of (diarioQ.data ?? [])) {
    items.push({
      ts: l.created_at,
      icon: ClipboardCheck,
      titulo: `Diário · ${l.atividade} (${Number(l.metragem_executada).toLocaleString("pt-BR")} m)`,
      detalhe: `${l.autor || "Fiscal"} · ${new Date(l.data_lancamento + "T00:00:00").toLocaleDateString("pt-BR")} · ${l.material_tipo}${l.material_dn ? ` DN${l.material_dn}` : ""}`,
      tone: "success",
    });
  }
  items.sort((a, b) => b.ts.localeCompare(a.ts));

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <History className="h-4 w-4 text-accent" />
            Histórico da obra
          </SheetTitle>
          <SheetDescription>
            {obra ? <><span className="font-medium text-foreground">{obra.codigo}</span> · {obra.logradouro}, {obra.bairro}</> : null}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6">
          {(histQ.isLoading || diarioQ.isLoading) && (
            <div className="text-center text-sm text-muted-foreground py-8">Carregando…</div>
          )}

          {!histQ.isLoading && !diarioQ.isLoading && items.length === 0 && (
            <div className="text-center text-sm text-muted-foreground py-12 border border-dashed border-border rounded-md">
              <FileText className="h-6 w-6 mx-auto mb-2 text-muted-foreground/60" />
              Nenhum evento registrado ainda.
            </div>
          )}

          <ol className="relative border-l border-border pl-5 space-y-4">
            {items.map((it, i) => {
              const ringTone =
                it.tone === "accent" ? "bg-accent text-white" :
                it.tone === "success" ? "bg-success text-white" :
                it.tone === "warning" ? "bg-warning-soft text-warning-foreground" :
                "bg-muted text-muted-foreground";
              return (
                <li key={i} className="relative">
                  <span className={cn("absolute -left-[30px] flex h-5 w-5 items-center justify-center rounded-full ring-4 ring-background", ringTone)}>
                    <it.icon className="h-3 w-3" />
                  </span>
                  <div className="text-[13px] font-medium text-foreground">{it.titulo}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5 font-mono">{it.detalhe}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">{tempoRelativo(it.ts)}</div>
                </li>
              );
            })}
          </ol>
        </div>
      </SheetContent>
    </Sheet>
  );
}
