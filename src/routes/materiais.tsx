import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { MaterialBadge } from "@/components/StatusBadge";
import {
  materiais, urs, obras, necessidadeTubos, necessidadeConexoes, obrasByUR, URCode,
} from "@/data/mockData";
import { Download, Package, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/materiais")({
  head: () => ({
    meta: [
      { title: "Gestão de Materiais — RedeGestor" },
      { name: "description", content: "Catálogo técnico, estoque e necessidade de aquisição por UR." },
    ],
  }),
  component: MateriaisPage,
});

function MateriaisPage() {
  const [urFilter, setUrFilter] = useState<URCode | "TODAS">("TODAS");
  const list = useMemo(() => urFilter === "TODAS" ? obras : obrasByUR(urFilter), [urFilter]);

  const tubos = useMemo(() => necessidadeTubos(list), [list]);
  const conexoes = useMemo(() => necessidadeConexoes(list), [list]);

  const totalEstoqueTubos = tubos.reduce((s, t) => s + t.estoque, 0);
  const totalNecessario = tubos.reduce((s, t) => s + t.necessario, 0);
  const itensCriticos = [...tubos, ...conexoes].filter(i => i.saldo < 0).length;
  const itensOk = [...tubos, ...conexoes].filter(i => i.saldo >= 0 && i.necessario > 0).length;

  const exportCSV = () => {
    const headers = ["Tipo", "Código", "Descrição", "DN", "Necessário", "Estoque", "Saldo"];
    const rows = [
      ...tubos.map(t => ["Tubo", t.codigo, t.descricao, t.dn, t.necessario, t.estoque, t.saldo]),
      ...conexoes.map(c => ["Conexão", c.codigo, c.descricao, c.dn, c.necessario, c.estoque, c.saldo]),
    ];
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `consolidado_materiais_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  return (
    <AppLayout>
      <div className="px-4 lg:px-8 py-6 max-w-[1400px] mx-auto">
        <header className="pb-5 border-b border-border mb-5 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono mb-1">Suprimentos · Engenharia</div>
            <h1 className="text-2xl font-semibold tracking-tight">Gestão de Materiais</h1>
            <p className="text-sm text-muted-foreground mt-1">Catálogo, disponibilidade e consolidado de necessidade.</p>
          </div>
          <Button onClick={exportCSV} variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" /> Exportar consolidado
          </Button>
        </header>

        {/* UR filter */}
        <div className="flex items-center gap-1.5 flex-wrap mb-5">
          <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono mr-2">Cronograma:</span>
          {(["TODAS", ...urs.map(u => u.code)] as const).map(c => (
            <button
              key={c}
              onClick={() => setUrFilter(c as URCode | "TODAS")}
              className={cn(
                "px-3 h-7 rounded text-[12px] font-medium font-mono border transition-colors",
                urFilter === c ? "bg-primary text-primary-foreground border-primary" : "bg-surface text-muted-foreground border-border hover:text-foreground hover:border-border-strong",
              )}
            >
              {c === "TODAS" ? "Todas as URs" : c}
            </button>
          ))}
        </div>

        {/* KPIs */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          <Kpi icon={Package} label="Itens em catálogo" value={materiais.length.toString()} sub={`${tubos.length} tubos · ${conexoes.length} conexões`} />
          <Kpi icon={Package} label="Estoque (tubos)" value={`${totalEstoqueTubos.toLocaleString("pt-BR")} m`} sub="metros disponíveis" />
          <Kpi icon={AlertTriangle} label="Aquisições necessárias" value={itensCriticos.toString()} sub="itens com saldo negativo" tone={itensCriticos > 0 ? "warning" : "neutral"} />
          <Kpi icon={CheckCircle2} label="Cobertos" value={itensOk.toString()} sub="itens dentro do plano" tone="accent" />
        </section>

        {/* Tubos */}
        <section className="bg-card border border-border rounded-md shadow-card mb-4">
          <header className="px-5 py-3.5 border-b border-border">
            <h2 className="text-sm font-semibold">Tubos — necessidade vs. estoque</h2>
            <p className="text-[12px] text-muted-foreground mt-0.5">
              Consumo total estimado: <span className="font-mono font-semibold">{totalNecessario.toLocaleString("pt-BR")} m</span>
            </p>
          </header>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead className="bg-muted/50 text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-2.5 font-medium">Código</th>
                  <th className="text-left px-2 py-2.5 font-medium">Descrição</th>
                  <th className="text-left px-2 py-2.5 font-medium">Tipo</th>
                  <th className="text-right px-2 py-2.5 font-medium">DN</th>
                  <th className="text-right px-2 py-2.5 font-medium">Necessário</th>
                  <th className="text-right px-2 py-2.5 font-medium">Estoque</th>
                  <th className="text-right px-2 py-2.5 font-medium">Saldo</th>
                  <th className="text-left px-4 py-2.5 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {tubos.map(t => (
                  <tr key={t.codigo} className="hover:bg-muted/30">
                    <td className="px-4 py-2.5 font-mono text-[12px] font-semibold">{t.codigo}</td>
                    <td className="px-2 py-2.5">{t.descricao}</td>
                    <td className="px-2 py-2.5"><MaterialBadge tipo={t.tipo} /></td>
                    <td className="px-2 py-2.5 text-right tabular font-mono">{t.dn}</td>
                    <td className="px-2 py-2.5 text-right tabular font-mono">{t.necessario.toLocaleString("pt-BR")} m</td>
                    <td className="px-2 py-2.5 text-right tabular font-mono">{t.estoque.toLocaleString("pt-BR")} m</td>
                    <td className={cn("px-2 py-2.5 text-right tabular font-mono font-semibold", t.saldo < 0 ? "text-destructive" : "text-success")}>
                      {t.saldo > 0 ? "+" : ""}{t.saldo.toLocaleString("pt-BR")} m
                    </td>
                    <td className="px-4 py-2.5">
                      {t.necessario === 0 ? (
                        <span className="text-[11px] text-muted-foreground">— sem demanda</span>
                      ) : t.saldo < 0 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-destructive-soft text-destructive border border-destructive/20">
                          <AlertTriangle className="h-3 w-3" /> Adquirir
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-success-soft text-success border border-success/20">
                          <CheckCircle2 className="h-3 w-3" /> OK
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Conexões */}
        <section className="bg-card border border-border rounded-md shadow-card">
          <header className="px-5 py-3.5 border-b border-border">
            <h2 className="text-sm font-semibold">Conexões e registros — estimativa por DN</h2>
            <p className="text-[12px] text-muted-foreground mt-0.5">Quantidades estimadas com base na extensão das obras ativas.</p>
          </header>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead className="bg-muted/50 text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-2.5 font-medium">Código</th>
                  <th className="text-left px-2 py-2.5 font-medium">Descrição</th>
                  <th className="text-right px-2 py-2.5 font-medium">DN</th>
                  <th className="text-right px-2 py-2.5 font-medium">Necessário</th>
                  <th className="text-right px-2 py-2.5 font-medium">Estoque</th>
                  <th className="text-right px-4 py-2.5 font-medium">Saldo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {conexoes.map(c => (
                  <tr key={c.codigo} className="hover:bg-muted/30">
                    <td className="px-4 py-2.5 font-mono text-[12px] font-semibold">{c.codigo}</td>
                    <td className="px-2 py-2.5">{c.descricao}</td>
                    <td className="px-2 py-2.5 text-right tabular font-mono">{c.dn}</td>
                    <td className="px-2 py-2.5 text-right tabular font-mono">{c.necessario} un</td>
                    <td className="px-2 py-2.5 text-right tabular font-mono">{c.estoque} un</td>
                    <td className={cn("px-4 py-2.5 text-right tabular font-mono font-semibold", c.saldo < 0 ? "text-destructive" : "text-success")}>
                      {c.saldo > 0 ? "+" : ""}{c.saldo} un
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AppLayout>
  );
}

function Kpi({
  icon: Icon, label, value, sub, tone = "neutral",
}: { icon: typeof Package; label: string; value: string; sub: string; tone?: "neutral" | "accent" | "warning" }) {
  const iconCls =
    tone === "accent" ? "bg-accent-soft text-accent"
    : tone === "warning" ? "bg-warning-soft text-warning-foreground"
    : "bg-secondary text-secondary-foreground";
  return (
    <div className="bg-card border border-border rounded-md p-4 shadow-card">
      <div className={cn("h-9 w-9 rounded flex items-center justify-center mb-3", iconCls)}>
        <Icon className="h-[18px] w-[18px]" />
      </div>
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono">{label}</div>
      <div className="text-2xl font-semibold tabular tracking-tight mt-0.5">{value}</div>
      <div className="text-[11px] text-muted-foreground mt-1">{sub}</div>
    </div>
  );
}
