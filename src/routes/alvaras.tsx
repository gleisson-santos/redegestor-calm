import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { StatusBadge, AlvaraBadge, MaterialBadge, PrioridadeBadge } from "@/components/StatusBadge";
import { obras, urs, AlvaraStatus, URCode } from "@/data/mockData";
import { FileCheck2, AlertOctagon, Clock, ShieldCheck, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/alvaras")({
  head: () => ({
    meta: [
      { title: "Alvarás — RedeGestor" },
      { name: "description", content: "Acompanhamento de alvarás: liberados, pendentes, vencidos e críticos." },
    ],
  }),
  component: AlvarasPage,
});

function AlvarasPage() {
  const [query, setQuery] = useState("");
  const [urFilter, setUrFilter] = useState<URCode | "TODAS">("TODAS");
  const [statusFilter, setStatusFilter] = useState<AlvaraStatus | "TODOS">("TODOS");

  const obrasComAlvara = obras.filter(o => o.alvaraNecessidade === "sim");

  const stats = {
    pendentes: obrasComAlvara.filter(o => o.alvaraStatus === "pendente").length,
    liberados: obrasComAlvara.filter(o => o.alvaraStatus === "liberado").length,
    vencidos:  obrasComAlvara.filter(o => o.alvaraStatus === "vencido").length,
    criticos:  obrasComAlvara.filter(o => o.prioridade <= 2 && (o.alvaraStatus === "pendente" || o.alvaraStatus === "vencido")).length,
  };

  const filtered = useMemo(() => {
    return obrasComAlvara
      .filter(o => {
        const q = query.trim().toLowerCase();
        if (q && !`${o.codigo} ${o.logradouro} ${o.bairro} ${o.alvaraNumero ?? ""}`.toLowerCase().includes(q)) return false;
        if (urFilter !== "TODAS" && o.ur !== urFilter) return false;
        if (statusFilter !== "TODOS" && o.alvaraStatus !== statusFilter) return false;
        return true;
      })
      .sort((a, b) => a.prioridade - b.prioridade);
  }, [query, urFilter, statusFilter, obrasComAlvara]);

  return (
    <AppLayout>
      <div className="px-4 lg:px-8 py-6 max-w-[1400px] mx-auto">
        <header className="pb-5 border-b border-border mb-5">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono mb-1">Conformidade & licenças</div>
          <h1 className="text-2xl font-semibold tracking-tight">Gestão de Alvarás</h1>
          <p className="text-sm text-muted-foreground mt-1">Obras travadas por falta de alvará e prazos de validade.</p>
        </header>

        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          <Kpi icon={Clock} label="Pendentes" value={stats.pendentes.toString()} sub="aguardando emissão" tone="warning" />
          <Kpi icon={AlertOctagon} label="Vencidos" value={stats.vencidos.toString()} sub="precisam renovação" tone="destructive" />
          <Kpi icon={ShieldCheck} label="Liberados" value={stats.liberados.toString()} sub="aptos para execução" tone="accent" />
          <Kpi icon={AlertOctagon} label="Críticos (P1·P2)" value={stats.criticos.toString()} sub="alta prioridade sem alvará" tone={stats.criticos > 0 ? "destructive" : "neutral"} />
        </section>

        {/* Críticos em destaque */}
        {stats.criticos > 0 && (
          <section className="bg-destructive-soft border border-destructive/30 rounded-md mb-5">
            <header className="px-5 py-3 border-b border-destructive/20 flex items-center gap-2">
              <AlertOctagon className="h-4 w-4 text-destructive" />
              <h2 className="text-sm font-semibold text-destructive">Atenção — obras críticas bloqueadas</h2>
            </header>
            <ul className="divide-y divide-destructive/15">
              {obrasComAlvara
                .filter(o => o.prioridade <= 2 && (o.alvaraStatus === "pendente" || o.alvaraStatus === "vencido"))
                .map(o => (
                  <li key={o.id} className="px-5 py-3 flex items-center gap-3 flex-wrap">
                    <PrioridadeBadge prioridade={o.prioridade} />
                    <span className="font-mono text-[12px] text-muted-foreground">{o.codigo}</span>
                    <span className="font-mono text-[12px] font-semibold">{o.ur}</span>
                    <span className="text-[13px] flex-1 min-w-[180px]"><span className="font-medium">{o.logradouro}</span> · <span className="text-muted-foreground">{o.bairro}</span></span>
                    <MaterialBadge tipo={o.material} />
                    <AlvaraBadge status={o.alvaraStatus} />
                    <span className="ml-auto inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-destructive text-destructive-foreground">CRÍTICO</span>
                  </li>
                ))}
            </ul>
          </section>
        )}

        {/* Filtros + tabela */}
        <div className="bg-card border border-border rounded-md shadow-card p-3 mb-3 flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Buscar código, logradouro ou nº alvará…"
              className="w-full h-9 pl-8 pr-3 rounded border border-input bg-surface text-[13px] focus:outline-none focus:ring-2 focus:ring-ring/30"
            />
          </div>
          <Select label="UR" value={urFilter} onChange={v => setUrFilter(v as URCode | "TODAS")}>
            <option value="TODAS">Todas</option>
            {urs.map(u => <option key={u.code} value={u.code}>{u.code}</option>)}
          </Select>
          <Select label="Status" value={statusFilter} onChange={v => setStatusFilter(v as AlvaraStatus | "TODOS")}>
            <option value="TODOS">Todos</option>
            <option value="liberado">Liberado</option>
            <option value="pendente">Pendente</option>
            <option value="vencido">Vencido</option>
          </Select>
        </div>

        <div className="bg-card border border-border rounded-md shadow-card overflow-hidden">
          <header className="px-5 py-3 border-b border-border flex items-center gap-2">
            <FileCheck2 className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">Alvarás por obra</h2>
            <span className="text-[12px] text-muted-foreground ml-1">· {filtered.length} registros</span>
          </header>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead className="bg-muted/50 text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-2.5 font-medium">Pri</th>
                  <th className="text-left px-2 py-2.5 font-medium">Obra</th>
                  <th className="text-left px-2 py-2.5 font-medium">UR</th>
                  <th className="text-left px-2 py-2.5 font-medium">Logradouro</th>
                  <th className="text-left px-2 py-2.5 font-medium">Nº Alvará</th>
                  <th className="text-left px-2 py-2.5 font-medium">Validade</th>
                  <th className="text-left px-2 py-2.5 font-medium">Status alvará</th>
                  <th className="text-left px-4 py-2.5 font-medium">Status obra</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map(o => (
                  <tr key={o.id} className="hover:bg-muted/30">
                    <td className="px-4 py-2.5"><PrioridadeBadge prioridade={o.prioridade} /></td>
                    <td className="px-2 py-2.5 font-mono text-[11px] text-muted-foreground">{o.codigo}</td>
                    <td className="px-2 py-2.5 font-mono text-[12px] font-semibold">{o.ur}</td>
                    <td className="px-2 py-2.5">
                      <div className="font-medium truncate max-w-[240px]">{o.logradouro}</div>
                      <div className="text-[11px] text-muted-foreground">{o.bairro}</div>
                    </td>
                    <td className="px-2 py-2.5 font-mono text-[12px]">{o.alvaraNumero ?? "—"}</td>
                    <td className="px-2 py-2.5 font-mono text-[12px]">{o.alvaraValidade ? new Date(o.alvaraValidade).toLocaleDateString("pt-BR") : "—"}</td>
                    <td className="px-2 py-2.5"><AlvaraBadge status={o.alvaraStatus} /></td>
                    <td className="px-4 py-2.5"><StatusBadge status={o.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && <div className="px-5 py-12 text-center text-sm text-muted-foreground">Nenhum alvará corresponde aos filtros aplicados.</div>}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function Select({ label, value, onChange, children }: { label: string; value: string; onChange: (v: string) => void; children: React.ReactNode }) {
  return (
    <label className="inline-flex items-center gap-2 h-9 px-2 rounded border border-input bg-surface text-[12px]">
      <span className="text-muted-foreground font-mono uppercase tracking-wider text-[10px]">{label}</span>
      <select value={value} onChange={e => onChange(e.target.value)} className="bg-transparent text-[13px] focus:outline-none cursor-pointer pr-1">
        {children}
      </select>
    </label>
  );
}

function Kpi({
  icon: Icon, label, value, sub, tone = "neutral",
}: { icon: typeof FileCheck2; label: string; value: string; sub: string; tone?: "neutral" | "accent" | "warning" | "destructive" }) {
  const iconCls =
    tone === "accent" ? "bg-accent-soft text-accent"
    : tone === "warning" ? "bg-warning-soft text-warning-foreground"
    : tone === "destructive" ? "bg-destructive-soft text-destructive"
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
