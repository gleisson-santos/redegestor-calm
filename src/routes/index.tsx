import { createFileRoute, Link } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FileText, Boxes, AlertTriangle, MapPin, TrendingUp, ArrowUpRight,
  CheckCircle2, Calendar, Activity,
} from "lucide-react";
import { contracts, locations, getAllMaterials, formatMes, mesesPorAno } from "@/data/mockData";
import { useMemo } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — RedeGestor" },
      { name: "description", content: "Visão calma e organizada dos seus contratos de extensão de rede." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const ativos = contracts.filter(c => c.status === "ativo").length;
  const atencao = contracts.filter(c => c.status === "atencao").length;
  const totalLocais = locations.filter(l => l.status !== "concluido").length;

  const materiais = useMemo(() => getAllMaterials(), []);
  const baixoEstoque = materiais.filter(m => m.estoqueAtual < m.estoqueMinimo);

  // Próximos 6 meses de demanda agregada
  const proxMeses = mesesPorAno["2026"].slice(3, 9);
  const demandaPorMes = proxMeses.map(m => {
    const total = contracts.reduce((sum, c) =>
      sum + c.materiais.reduce((s, mat) => s + (mat.cronograma[m] ?? 0), 0), 0);
    return { mes: m, total };
  });
  const maxDemanda = Math.max(...demandaPorMes.map(d => d.total), 1);

  return (
    <AppLayout>
      <div className="px-4 lg:px-8 py-8 lg:py-10 max-w-[1400px] mx-auto space-y-8">
        {/* Hero */}
        <section className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div>
            <div className="text-sm text-muted-foreground mb-1.5 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-accent animate-gentle-pulse" />
              Bem-vinda de volta, Marina
            </div>
            <h1 className="text-display text-foreground">Tudo sob controle hoje.</h1>
            <p className="text-muted-foreground mt-2 max-w-xl">
              Você tem <span className="text-foreground font-medium">{ativos} contratos ativos</span> e{" "}
              <span className="text-warning-foreground font-medium">{baixoEstoque.length} alertas de estoque</span> para revisar.
            </p>
          </div>
          <div className="flex gap-2">
            <Link to="/contratos"><Button variant="outline">Ver cronograma</Button></Link>
            <Link to="/contratos"><Button className="gap-2 shadow-soft">Novo contrato <ArrowUpRight className="h-4 w-4" /></Button></Link>
          </div>
        </section>

        {/* KPI cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard icon={FileText} label="Contratos ativos" value={ativos} hint={`${contracts.length} no total`} tone="primary" />
          <KpiCard icon={Boxes} label="Itens monitorados" value={materiais.length} hint="globais" tone="info" />
          <KpiCard icon={AlertTriangle} label="Estoque baixo" value={baixoEstoque.length} hint="ações sugeridas" tone="warning" />
          <KpiCard icon={MapPin} label="Locais ativos" value={totalLocais} hint="serviços em andamento" tone="accent" />
        </section>

        {/* Main grid */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Demanda agregada */}
          <Card className="lg:col-span-2 border-border/60 shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Demanda de materiais</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">Próximos 6 meses · todos os contratos</p>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-accent-foreground bg-accent-soft px-2.5 py-1 rounded-full">
                <TrendingUp className="h-3.5 w-3.5" /> previsto
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-3 h-44 pt-4">
                {demandaPorMes.map(d => (
                  <div key={d.mes} className="flex-1 flex flex-col items-center gap-2 group">
                    <div className="text-[11px] text-muted-foreground opacity-0 group-hover:opacity-100 calm-transition">
                      {d.total}
                    </div>
                    <div
                      className="w-full rounded-t-md bg-gradient-to-t from-primary/70 to-primary/40 group-hover:from-primary group-hover:to-primary/60 calm-transition"
                      style={{ height: `${(d.total / maxDemanda) * 100}%`, minHeight: 8 }}
                    />
                    <div className="text-[11px] text-muted-foreground">{formatMes(d.mes)}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Alertas estoque */}
          <Card className="border-border/60 shadow-soft">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-warning-foreground" />
                Atenção ao estoque
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Adicione antes que afete cronogramas.</p>
            </CardHeader>
            <CardContent className="space-y-3">
              {baixoEstoque.slice(0, 4).map(m => (
                <div key={m.codigo} className="flex items-start justify-between gap-3 p-3 rounded-lg bg-warning-soft/50 border border-warning/20">
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{m.descricao}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{m.codigo} · mínimo {m.estoqueMinimo} {m.umb}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-semibold text-warning-foreground">{m.estoqueAtual}</div>
                    <div className="text-[10px] text-muted-foreground">{m.umb}</div>
                  </div>
                </div>
              ))}
              {baixoEstoque.length === 0 && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-accent" /> Nenhum alerta — bom trabalho.
                </div>
              )}
              <Link to="/estoque" className="text-sm text-primary font-medium inline-flex items-center gap-1 hover:gap-2 calm-transition">
                Ver todo o estoque <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </CardContent>
          </Card>
        </section>

        {/* Contratos recentes + Locais */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 border-border/60 shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Contratos em destaque</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">Atualizações recentes do seu portfólio.</p>
              </div>
              <Link to="/contratos" className="text-sm text-primary font-medium">Ver todos</Link>
            </CardHeader>
            <CardContent className="space-y-2">
              {contracts.slice(0, 4).map(c => (
                <Link
                  key={c.id}
                  to="/contratos/$contractId"
                  params={{ contractId: c.id }}
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 calm-transition group"
                >
                  <div className="h-10 w-10 rounded-lg bg-primary-soft flex items-center justify-center shrink-0">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{c.numero}</span>
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
                      <span className="text-xs font-medium w-8 text-right">{c.progresso}%</span>
                    </div>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 calm-transition" />
                </Link>
              ))}
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-soft">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                Locais ativos
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Serviços em campo agora.</p>
            </CardHeader>
            <CardContent className="space-y-3">
              {locations.filter(l => l.status === "em_andamento").slice(0, 4).map(l => (
                <div key={l.id} className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-lg bg-accent-soft flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin className="h-4 w-4 text-accent" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{l.nome}</div>
                    <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                      <Calendar className="h-3 w-3" /> {new Date(l.data).toLocaleDateString("pt-BR")} · {l.cidade}
                    </div>
                  </div>
                </div>
              ))}
              <Link to="/locais" className="text-sm text-primary font-medium inline-flex items-center gap-1 hover:gap-2 calm-transition pt-1">
                Abrir mapa <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </CardContent>
          </Card>
        </section>
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
    <Card className="border-border/60 shadow-soft hover:shadow-card calm-transition">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className={`h-10 w-10 rounded-xl ${tones[tone]} flex items-center justify-center`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-4">
          <div className="text-3xl font-semibold tracking-tight">{value}</div>
          <div className="text-sm text-muted-foreground mt-1">{label}</div>
          <div className="text-xs text-muted-foreground/70 mt-0.5">{hint}</div>
        </div>
      </CardContent>
    </Card>
  );
}
