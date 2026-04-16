import { createFileRoute, Link } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { urs, urStats, contractsByUR, mesesPorAno, formatMes, URCode } from "@/data/mockData";
import { Building2, FileText, Boxes, MapPin, AlertTriangle, ArrowUpRight, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/urs")({
  head: () => ({
    meta: [
      { title: "Unidades Regionais — RedeGestor" },
      { name: "description", content: "Gestão consolidada por UR: contratos, materiais e cronogramas." },
      { property: "og:title", content: "Unidades Regionais — RedeGestor" },
      { property: "og:description", content: "Visão completa por Unidade Regional." },
    ],
  }),
  component: URsPage,
});

function URsPage() {
  const [selected, setSelected] = useState<URCode>("UR1");
  const ur = urs.find(u => u.code === selected)!;
  const stats = urStats(selected);
  const cs = contractsByUR(selected);

  const meses2026 = mesesPorAno["2026"];
  const demanda = useMemo(() =>
    meses2026.map(m => ({
      mes: m,
      total: cs.reduce((s, c) => s + c.materiais.reduce((ss, mat) => ss + (mat.cronograma[m] ?? 0), 0), 0),
    })), [selected]);
  const maxD = Math.max(...demanda.map(d => d.total), 1);

  return (
    <AppLayout>
      <div className="px-4 lg:px-8 py-8 lg:py-10 max-w-[1400px] mx-auto space-y-8">
        <header className="space-y-2">
          <div className="text-sm text-muted-foreground inline-flex items-center gap-2">
            <Building2 className="h-3.5 w-3.5" /> Gestão por unidade regional
          </div>
          <h1 className="text-display">Unidades Regionais</h1>
          <p className="text-muted-foreground max-w-2xl">
            Visão consolidada por UR — contratos, materiais e cronogramas alinhados às guias do seu Sheets.
          </p>
        </header>

        {/* UR cards grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {urs.map(u => {
            const s = urStats(u.code);
            const isSel = selected === u.code;
            return (
              <button
                key={u.code}
                onClick={() => setSelected(u.code)}
                className={cn(
                  "text-left p-5 rounded-2xl border bg-card calm-transition group relative overflow-hidden",
                  isSel
                    ? "border-primary/50 shadow-elevated ring-2 ring-primary/15"
                    : "border-border/60 shadow-soft hover:shadow-card hover:-translate-y-0.5"
                )}
              >
                <div
                  className="absolute top-0 left-0 right-0 h-1 calm-transition"
                  style={{ background: u.cor, opacity: isSel ? 1 : 0.5 }}
                />
                <div className="flex items-start justify-between">
                  <div
                    className="h-11 w-11 rounded-xl flex items-center justify-center text-primary-foreground shadow-soft"
                    style={{ background: u.cor }}
                  >
                    <Building2 className="h-5 w-5" />
                  </div>
                  <span className="text-[11px] font-mono text-muted-foreground tracking-wider">{u.code}</span>
                </div>
                <div className="mt-4">
                  <div className="font-semibold text-foreground tracking-tight leading-tight">{u.nome}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{u.cidade}</div>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 pt-4 border-t border-border/60">
                  <Stat n={s.contratos} l="Contratos" />
                  <Stat n={s.totalMateriais} l="Itens" />
                  <Stat n={s.locais} l="Locais" />
                </div>
              </button>
            );
          })}
        </section>

        {/* Selected UR detail */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 border-border/60 shadow-soft">
            <CardHeader className="flex flex-row items-start justify-between gap-3">
              <div>
                <div className="text-xs font-mono text-muted-foreground tracking-wider mb-1">{ur.code}</div>
                <CardTitle className="text-xl">{ur.nome}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">{ur.cidade} · gerente {ur.gerente}</p>
              </div>
              <div className="inline-flex items-center gap-1.5 text-sm bg-accent-soft text-accent px-2.5 py-1 rounded-full">
                <TrendingUp className="h-3.5 w-3.5" /> 2026
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                <MiniKpi icon={FileText} value={stats.contratos} label="Contratos" />
                <MiniKpi icon={Boxes} value={stats.totalMateriais} label="Itens" />
                <MiniKpi icon={MapPin} value={stats.locais} label="Locais" />
                <MiniKpi icon={AlertTriangle} value={stats.baixo} label="Alertas" tone="warning" />
              </div>

              <div>
                <div className="flex items-center justify-between text-sm mb-3">
                  <span className="font-medium">Demanda mensal de materiais</span>
                  <span className="text-xs text-muted-foreground">unidades · 2026</span>
                </div>
                <div className="flex items-end gap-1.5 h-40">
                  {demanda.map(d => (
                    <div key={d.mes} className="flex-1 flex flex-col items-center gap-1.5 group">
                      <div className="text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 calm-transition tabular-nums">{d.total}</div>
                      <div
                        className="w-full rounded-t-md calm-transition"
                        style={{
                          height: `${(d.total / maxD) * 100}%`,
                          minHeight: 6,
                          background: `linear-gradient(to top, ${ur.cor} 0%, color-mix(in oklab, ${ur.cor} 50%, white) 100%)`,
                          opacity: 0.85,
                        }}
                      />
                      <div className="text-[10px] text-muted-foreground rotate-0">{formatMes(d.mes).split("/")[0]}</div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-soft">
            <CardHeader>
              <CardTitle className="text-base">Contratos da {selected}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">{cs.length} no total</p>
            </CardHeader>
            <CardContent className="space-y-2">
              {cs.length === 0 && (
                <div className="text-sm text-muted-foreground text-center py-6">Nenhum contrato.</div>
              )}
              {cs.map(c => (
                <Link
                  key={c.id}
                  to="/contratos/$contractId"
                  params={{ contractId: c.id }}
                  className="block p-3.5 rounded-xl border border-border/60 bg-surface hover:border-primary/40 hover:bg-primary-soft/30 calm-transition group"
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-medium text-sm text-primary">{c.numero}</span>
                    <StatusBadge status={c.status} />
                  </div>
                  <div className="text-sm text-foreground/90 truncate">{c.titulo}</div>
                  <div className="flex items-center gap-2 mt-2.5">
                    <div className="h-1 flex-1 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${c.progresso}%` }} />
                    </div>
                    <span className="text-[11px] font-medium tabular-nums w-8 text-right">{c.progresso}%</span>
                    <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary calm-transition" />
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        </section>
      </div>
    </AppLayout>
  );
}

function Stat({ n, l }: { n: number; l: string }) {
  return (
    <div>
      <div className="text-base font-semibold tabular-nums">{n}</div>
      <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{l}</div>
    </div>
  );
}

function MiniKpi({
  icon: Icon, value, label, tone = "primary",
}: { icon: typeof FileText; value: number; label: string; tone?: "primary" | "warning" }) {
  const cls = tone === "warning" ? "bg-warning-soft text-warning-foreground" : "bg-primary-soft text-primary";
  return (
    <div className="p-3 rounded-xl border border-border/60 bg-surface">
      <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center mb-2", cls)}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="text-xl font-semibold tabular-nums">{value}</div>
      <div className="text-[11px] text-muted-foreground">{label}</div>
    </div>
  );
}
