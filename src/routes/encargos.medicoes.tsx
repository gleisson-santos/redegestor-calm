import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { fetchMedicoes, gerarMedicoesMensais, updateMedicaoStatus } from "@/data/encargos";
import { urs, URCode } from "@/data/mockData";
import { Calculator, RefreshCw, Download, DollarSign, CheckCircle2, Clock, FileCheck2 } from "lucide-react";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export const Route = createFileRoute("/encargos/medicoes")({
  head: () => ({
    meta: [
      { title: "Medições Mensais — RedeGestor" },
      { name: "description", content: "Consolidação financeira mensal por Unidade Regional." },
    ],
  }),
  component: MedicoesPage,
});

const fmtBRL = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const STATUSES = ["Pendente", "Medido", "Aprovado"] as const;

const statusTone: Record<string, string> = {
  Pendente: "bg-warning-soft text-warning-foreground border-warning/20",
  Medido: "bg-secondary text-secondary-foreground border-border",
  Aprovado: "bg-success-soft text-success border-success/20",
};

function MedicoesPage() {
  const qc = useQueryClient();
  const { data: medicoes = [], isLoading } = useQuery({ queryKey: ["medicoes"], queryFn: fetchMedicoes });

  const [urFilter, setUrFilter] = useState<URCode | "TODAS">("TODAS");
  const [mesFilter, setMesFilter] = useState<string>("");

  const gerarMut = useMutation({
    mutationFn: () => gerarMedicoesMensais(),
    onSuccess: (n) => {
      qc.invalidateQueries({ queryKey: ["medicoes"] });
      toast.success(n > 0 ? `${n} medições geradas/atualizadas.` : "Nenhum lançamento para medir.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => updateMedicaoStatus(id, status),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["medicoes"] }); toast.success("Status atualizado."); },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = useMemo(() => {
    return medicoes.filter(m => {
      if (urFilter !== "TODAS" && m.ur !== urFilter) return false;
      if (mesFilter && m.mes_referencia !== mesFilter) return false;
      return true;
    });
  }, [medicoes, urFilter, mesFilter]);

  const totalGeral = filtered.reduce((s, m) => s + Number(m.valor_total), 0);
  const totalAprovado = filtered.filter(m => m.status === "Aprovado").reduce((s, m) => s + Number(m.valor_total), 0);
  const totalPendente = filtered.filter(m => m.status === "Pendente").reduce((s, m) => s + Number(m.valor_total), 0);

  const exportCSV = () => {
    const headers = ["UR", "Mês Referência", "Valor Total (R$)", "Status"];
    const rows = filtered.map(m => [m.ur, m.mes_referencia, Number(m.valor_total).toFixed(2), m.status]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `medicoes_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  return (
    <AppLayout>
      <div className="px-4 lg:px-8 py-6">
        <header className="pb-5 border-b border-border mb-5 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono mb-1">Caderno de Encargos</div>
            <h1 className="text-2xl font-semibold tracking-tight">Medições Mensais</h1>
            <p className="text-sm text-muted-foreground mt-1">Consolidação financeira por UR e mês de referência.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={exportCSV} variant="outline" size="sm" className="gap-2"><Download className="h-4 w-4" /> Exportar CSV</Button>
            <Button onClick={() => gerarMut.mutate()} disabled={gerarMut.isPending} size="sm" className="gap-2">
              <RefreshCw className={cn("h-4 w-4", gerarMut.isPending && "animate-spin")} />
              {gerarMut.isPending ? "Gerando…" : "Gerar Medição Mensal"}
            </Button>
          </div>
        </header>

        <section className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
          <Kpi icon={DollarSign} label="Total geral" value={fmtBRL(totalGeral)} sub="todas as medições filtradas" tone="accent" />
          <Kpi icon={Clock} label="Pendente" value={fmtBRL(totalPendente)} sub="aguardando análise" tone="warning" />
          <Kpi icon={CheckCircle2} label="Aprovado" value={fmtBRL(totalAprovado)} sub="liberado para faturamento" />
        </section>

        <div className="bg-card border border-border rounded-md shadow-card p-3 mb-3 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono mr-1">UR:</span>
            {(["TODAS", ...urs.map(u => u.code)] as const).map(c => (
              <button key={c} onClick={() => setUrFilter(c as URCode | "TODAS")}
                className={cn("px-3 h-7 rounded text-[12px] font-medium font-mono border transition-colors",
                  urFilter === c ? "bg-primary text-primary-foreground border-primary" : "bg-surface text-muted-foreground border-border hover:text-foreground")}>
                {c === "TODAS" ? "Todas" : c}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <Label className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono">Mês:</Label>
            <Input type="month" value={mesFilter} onChange={e => setMesFilter(e.target.value)} className="h-8 w-[160px]" />
            {mesFilter && <Button variant="ghost" size="sm" onClick={() => setMesFilter("")}>Limpar</Button>}
          </div>
        </div>

        <section className="bg-card border border-border rounded-md shadow-card">
          <header className="px-5 py-3.5 border-b border-border">
            <h2 className="text-sm font-semibold flex items-center gap-2"><Calculator className="h-4 w-4" /> Medições</h2>
            <p className="text-[12px] text-muted-foreground mt-0.5">{filtered.length} registros</p>
          </header>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead className="bg-muted/50 text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-2.5 font-medium">UR</th>
                  <th className="text-left px-2 py-2.5 font-medium">Mês de referência</th>
                  <th className="text-right px-2 py-2.5 font-medium">Valor total</th>
                  <th className="text-left px-2 py-2.5 font-medium">Status</th>
                  <th className="text-right px-4 py-2.5 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map(m => (
                  <tr key={m.id} className="hover:bg-muted/30">
                    <td className="px-4 py-2.5 font-mono text-[12px] font-semibold">{m.ur}</td>
                    <td className="px-2 py-2.5 font-mono text-[12px]">{m.mes_referencia}</td>
                    <td className="px-2 py-2.5 text-right tabular font-mono font-semibold">{fmtBRL(Number(m.valor_total))}</td>
                    <td className="px-2 py-2.5">
                      <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border", statusTone[m.status] ?? "bg-muted")}>
                        <FileCheck2 className="h-3 w-3" /> {m.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <select
                        value={m.status}
                        onChange={(e) => statusMut.mutate({ id: m.id, status: e.target.value })}
                        className="h-7 rounded border border-input bg-surface px-2 text-[12px]"
                      >
                        {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && !isLoading && (
              <div className="px-5 py-12 text-center text-sm text-muted-foreground">
                Nenhuma medição encontrada. Lance serviços e clique em "Gerar Medição Mensal".
              </div>
            )}
          </div>
        </section>
      </div>
    </AppLayout>
  );
}

function Kpi({ icon: Icon, label, value, sub, tone = "neutral" }: { icon: typeof Calculator; label: string; value: string; sub: string; tone?: "neutral" | "accent" | "warning" }) {
  const iconCls = tone === "accent" ? "bg-accent-soft text-accent" : tone === "warning" ? "bg-warning-soft text-warning-foreground" : "bg-secondary text-secondary-foreground";
  return (
    <div className="bg-card border border-border rounded-md p-4 shadow-card">
      <div className={cn("h-9 w-9 rounded flex items-center justify-center mb-3", iconCls)}><Icon className="h-[18px] w-[18px]" /></div>
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono">{label}</div>
      <div className="text-2xl font-semibold tabular tracking-tight mt-0.5">{value}</div>
      <div className="text-[11px] text-muted-foreground mt-1">{sub}</div>
    </div>
  );
}
