import { createFileRoute, Link } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FileText, Boxes, AlertTriangle, MapPin, ArrowUpRight,
  CheckCircle2, Calendar, Building2, Sparkles,
} from "lucide-react";
import { contracts, locations, getAllMaterials, formatMes, mesesPorAno, urs, urStats, URCode } from "@/data/mockData";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — RedeGestor" },
      { name: "description", content: "Painel sereno de contratos por UR, materiais e cronogramas." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const [urFilter, setUrFilter] = useState<URCode | "todas">("todas");
  const filteredContracts = urFilter === "todas" ? contracts : contracts.filter(c => c.ur === urFilter);

  const ativos = filteredContracts.filter(c => c.status === "ativo").length;
  const totalLocais = (urFilter === "todas" ? locations : locations.filter(l => l.ur === urFilter))
    .filter(l => l.status !== "concluido").length;
  const materiais = useMemo(() => getAllMaterials(), []);
  const baixoEstoque = materiais.filter(m => m.estoqueAtual < m.estoqueMinimo);

  // Demand next 6 months from May 2026
  const proxMeses = mesesPorAno["2026"].slice(0, 6);
  const demandaPorMes = proxMeses.map(m => ({
    mes: m,
    total: filteredContracts.reduce((s, c) =>
      s + c.materiais.reduce((ss, mat) => ss + (mat.cronograma[m] ?? 0), 0), 0),
  }));
  const maxD = Math.max(...demandaPorMes.map(d => d.total), 1);

  return (
    <AppLayout>
      <div className="px-4 lg:px-8 py-8 lg:py-10 max-w-[1400px] mx-auto space-y-8">
        {/* Hero */}
        <section className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
          <div className="space-y-2.5">
            <div className="text-sm text-muted-foreground inline-flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Bem-vinda de volta, Marina
            </div>
            <h1 className="text-display text-foreground">Tudo sob controle hoje.</h1>
            <p className="text-muted-foreground max-w-xl">
              <span className="text-foreground font-medium">{ativos} contratos ativos</span> e{" "}
              <span className="text-foreground font-medium">{baixoEstoque.length} alertas</span> de estoque para revisar.
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Link to="/urs"><Button variant="outline" className="gap-2"><Building2 className="h-4 w-4" /> Explorar por UR</Button></Link>
            <Link to="/contratos"><Button className="gap-2 shadow-soft">Novo cronograma <ArrowUpRight className="h-4 w-4" /></Button></Link>
          </div>
        </section>

        {/* UR filter pills */}
        <section className="flex items-center gap-2 flex-wrap p-1.5 rounded-2xl bg-surface border border-border/60 w-fit shadow-soft">
          <button
            onClick={() => setUrFilter("todas")}
            className={cn(
              "px-4 h-9 rounded-xl text-sm font-medium calm-transition",
              urFilter === "todas" ? "bg-primary text-primary-foreground shadow-soft" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Todas as URs
          </button>
          {urs.map(u => (
            <button
              key={u.code}
              onClick={() => setUrFilter(u.code)}
              className={cn(
                "px-3 h-9 rounded-xl text-sm font-medium calm-transition inline-flex items-center gap-1.5",
                urFilter === u.code ? "bg-primary text-primary-foreground shadow-soft" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: u.cor }} />
              {u.code}
            </button>
          ))}
        </section>

        {/* KPI cards */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard icon={FileText} label="Contratos ativos" value={ativos} hint={`${filteredContracts.length} no total`} tone="primary" />
          <KpiCard icon={Building2} label="URs operando" value={urs.length} hint="cobertura completa" tone="accent" />
          <KpiCard icon={AlertTriangle} label="Estoque baixo" value={baixoEstoque.length} hint="ações sugeridas" tone="warning" />
          <KpiCard icon={MapPin} label="Locais ativos" value={totalLocais} hint="serviços em campo" tone="info" />
        </section>

        {/* UR overview + stock alerts */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 border-border/60 shadow-card">
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <CardTitle className="text-lg">Total de projetos por UR</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">Distribuição da carteira atual.</p>
              </div>
              <Link to="/urs" className="text-sm text-primary font-medium inline-flex items-center gap-1 hover:gap-1.5 calm-transition">
                Ver detalhes <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {urs.map(u => {
                  const s = urStats(u.code);
                  const max = Math.max(...urs.map(uu => urStats(uu.code).contratos), 1);
                  return (
                    <Link
                      key={u.code}
                      to="/urs"
                      className="block group"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2.5">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ background: u.cor }} />
                          <span className="text-sm font-medium">{u.code} — {u.nome}</span>
                        </div>
                        <span className="text-xs text-muted-foreground tabular-nums">
                          <span className="text-foreground font-semibold">{s.contratos}</span> contrato(s) · {s.totalMateriais} itens
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full calm-transition group-hover:opacity-90"
                          style={{ width: `${(s.contratos / max) * 100}%`, background: u.cor }}
                        />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-warning-foreground" />
                Atenção ao estoque
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Adicione antes que afete cronogramas.</p>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {baixoEstoque.slice(0, 4).map(m => (
                <div key={m.codigo} className="flex items-start justify-between gap-3 p-3 rounded-xl bg-warning-soft/40 border border-warning/20">
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{m.descricao}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{m.codigo} · mín {m.estoqueMinimo} {m.umb}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-semibold text-warning-foreground tabular-nums">{m.estoqueAtual}</div>
                    <div className="text-[10px] text-muted-foreground">{m.umb}</div>
                  </div>
                </div>
              ))}
              {baixoEstoque.length === 0 && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                  <CheckCircle2 className="h-4 w-4 text-accent" /> Nenhum alerta — bom trabalho.
                </div>
              )}
              <Link to="/estoque" className="text-sm text-primary font-medium inline-flex items-center gap-1 hover:gap-1.5 calm-transition pt-1">
                Ver todo o estoque <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </CardContent>
          </Card>
        </section>

        {/* Demand chart + locations */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 border-border/60 shadow-card">
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <CardTitle className="text-lg">Demanda de materiais</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Próximos 6 meses · {urFilter === "todas" ? "todas as URs" : urFilter}
                </p>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-3 h-44 pt-4">
                {demandaPorMes.map(d => (
                  <div key={d.mes} className="flex-1 flex flex-col items-center gap-2 group">
                    <div className="text-[11px] text-muted-foreground opacity-0 group-hover:opacity-100 calm-transition tabular-nums">
                      {d.total}
                    </div>
                    <div
                      className="w-full rounded-t-md gradient-primary group-hover:opacity-90 calm-transition"
                      style={{ height: `${(d.total / maxD) * 100}%`, minHeight: 8, opacity: 0.85 }}
                    />
                    <div className="text-[11px] text-muted-foreground">{formatMes(d.mes)}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                Locais em campo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {locations.filter(l => l.status === "em_andamento").slice(0, 4).map(l => (
                <div key={l.id} className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-xl bg-accent-soft flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin className="h-4 w-4 text-accent" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">{l.nome}</div>
                    <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5 flex-wrap">
                      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-primary-soft text-primary">{l.ur}</span>
                      <Calendar className="h-3 w-3" /> {new Date(l.data).toLocaleDateString("pt-BR")}
                    </div>
                  </div>
                </div>
              ))}
              <Link to="/locais" className="text-sm text-primary font-medium inline-flex items-center gap-1 hover:gap-1.5 calm-transition pt-1">
                Abrir mapa <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </CardContent>
          </Card>
        </section>

        {/* Recent contracts */}
        <Card className="border-border/60 shadow-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Contratos em destaque</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Atualizações recentes do portfólio.</p>
            </div>
            <Link to="/contratos" className="text-sm text-primary font-medium">Ver todos</Link>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {filteredContracts.slice(0, 4).map(c => (
              <Link
                key={c.id}
                to="/contratos/$contractId"
                params={{ contractId: c.id }}
                className="flex items-center gap-4 p-3 rounded-xl hover:bg-muted/40 calm-transition group"
              >
                <div className="h-10 w-10 rounded-xl bg-primary-soft flex items-center justify-center shrink-0">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">{c.numero}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-primary-soft text-primary">{c.ur}</span>
                    <StatusBadge status={c.status} />
                  </div>
                  <div className="text-sm text-muted-foreground truncate mt-0.5">{c.titulo}</div>
                </div>
                <div className="hidden sm:block text-right shrink-0">
                  <div className="text-xs text-muted-foreground mb-1">Progresso</div>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-24 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-primary rounded-full calm-transition" style={{ width: `${c.progresso}%` }} />
                    </div>
                    <span className="text-xs font-medium w-8 text-right tabular-nums">{c.progresso}%</span>
                  </div>
                </div>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 calm-transition" />
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

function KpiCard({
  icon: Icon, label, value, hint, tone,
}: {
  icon: typeof FileText; label: string; value: number | string; hint: string;
  tone: "primary" | "accent" | "warning" | "info";
}) {
  const tones = {
    primary: "bg-primary-soft text-primary",
    accent: "bg-accent-soft text-accent",
    warning: "bg-warning-soft text-warning-foreground",
    info: "bg-info-soft text-info",
  };
  return (
    <Card className="border-border/60 shadow-soft hover:shadow-card hover:-translate-y-0.5 calm-transition">
      <CardContent className="p-5">
        <div className={cn("h-11 w-11 rounded-xl flex items-center justify-center", tones[tone])}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="mt-4">
          <div className="text-3xl font-semibold tracking-tight tabular-nums">{value}</div>
          <div className="text-sm text-muted-foreground mt-1">{label}</div>
          <div className="text-xs text-muted-foreground/70 mt-0.5">{hint}</div>
        </div>
      </CardContent>
    </Card>
  );
}
