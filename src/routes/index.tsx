import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { AlvaraBadge, MaterialBadge, PrioridadeBadge } from "@/components/StatusBadge";
import { HardHat, Ruler, FileCheck2, Activity, AlertTriangle, ArrowRight, CheckCircle2, PlayCircle } from "lucide-react";
import {
  fetchObras, fetchMateriais,
  totalExtensao, extensaoPorMaterial, topPrioridadesPorUR, urStats,
  obrasEmExecucao,
} from "@/data/api";
import { urs, URCode } from "@/data/mockData";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
  PieChart, Pie, Cell,
} from "recharts";

/** Formata uma data ISO (YYYY-MM-DD) sem aplicar timezone (evita "voltar 1 dia"). */
function fmtISODate(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
}

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — RedeGestor" },
      { name: "description", content: "Painel gerencial de obras de extensão e substituição de redes por Unidade Regional." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const [urFilter, setUrFilter] = useState<URCode | "TODAS">("TODAS");
  const obrasQ = useQuery({ queryKey: ["obras"], queryFn: fetchObras });
  const matQ = useQuery({ queryKey: ["materiais"], queryFn: fetchMateriais });

  const obras = obrasQ.data ?? [];
  const materiais = matQ.data ?? [];

  const filtered = useMemo(
    () => urFilter === "TODAS" ? obras : obras.filter(o => o.ur === urFilter),
    [obras, urFilter],
  );

  const totalObras = filtered.length;
  const extensao = totalExtensao(filtered);
  const emExecucao = filtered.filter(o => o.status === "em_execucao").length;
  const concluidas = filtered.filter(o => o.status === "concluida").length;
  const extensaoConcluida = filtered.filter(o => o.status === "concluida").reduce((s, o) => s + o.extensaoM, 0);
  const pctConcluidas = totalObras > 0 ? (concluidas / totalObras) * 100 : 0;
  const pctExtensaoConcluida = extensao > 0 ? (extensaoConcluida / extensao) * 100 : 0;
  const alvarasPendentes = filtered.filter(o => o.alvaraNecessario && !o.alvaraLiberado).length;

  const porMaterial = extensaoPorMaterial(filtered);
  const extPorTipo = useMemo(() => {
    const tipos: ("DEFOFO" | "FOFO" | "PEAD")[] = ["DEFOFO", "FOFO", "PEAD"];
    return tipos.map(t => ({
      tipo: t,
      metros: filtered.filter(o => o.material === t).reduce((s, o) => s + o.extensaoM, 0),
    }));
  }, [filtered]);
  const topObras = useMemo(() => topPrioridadesPorUR(obras, 3, urFilter), [obras, urFilter]);
  const emExecucaoList = useMemo(() => obrasEmExecucao(obras, urFilter), [obras, urFilter]);


  // Dados para gráficos (extensão x material x alvará)
  const chartMaterialAlvara = useMemo(() => {
    const tipos: ("DEFOFO" | "PEAD" | "FOFO" | "OUTRO")[] = ["DEFOFO", "PEAD", "FOFO", "OUTRO"];
    return tipos.map(tipo => {
      const sub = filtered.filter(o => o.material === tipo);
      const liberado = sub.filter(o => o.alvaraStatus === "liberado" || o.alvaraStatus === "nao_aplicavel").reduce((s, o) => s + o.extensaoM, 0);
      const pendente = sub.filter(o => o.alvaraStatus === "pendente" || o.alvaraStatus === "vencido").reduce((s, o) => s + o.extensaoM, 0);
      return { material: tipo, Liberado: Math.round(liberado), Pendente: Math.round(pendente) };
    }).filter(d => d.Liberado + d.Pendente > 0);
  }, [filtered]);

  const chartStatus = useMemo(() => {
    const buckets: Record<string, { name: string; value: number; color: string }> = {
      concluida: { name: "Concluída", value: 0, color: "oklch(0.55 0.14 155)" },
      em_execucao: { name: "Em execução", value: 0, color: "oklch(0.62 0.16 200)" },
      aguardando_alvara: { name: "Aguard. alvará", value: 0, color: "oklch(0.70 0.15 75)" },
      liberada: { name: "Liberada", value: 0, color: "oklch(0.60 0.10 240)" },
      planejada: { name: "Planejada", value: 0, color: "oklch(0.70 0.02 250)" },
      suspensa: { name: "Suspensa", value: 0, color: "oklch(0.55 0.20 25)" },
    };
    filtered.forEach(o => { if (buckets[o.status]) buckets[o.status].value += 1; });
    return Object.values(buckets).filter(b => b.value > 0);
  }, [filtered]);

  // Aquisições críticas: materiais cuja necessidade > estoque, filtrado por UR
  const aquisicoes = useMemo(() => {
    const list = urFilter === "TODAS" ? materiais : materiais.filter(m => m.ur === urFilter);
    return list
      .map(m => ({
        ...m,
        saldo: Number(m.quantidade_estoque) - Number(m.quantidade_necessaria),
      }))
      .filter(m => m.saldo < 0)
      .sort((a, b) => a.saldo - b.saldo)
      .slice(0, 12);
  }, [materiais, urFilter]);

  const isLoading = obrasQ.isLoading || matQ.isLoading;

  return (
    <AppLayout>
      <div className="px-4 lg:px-8 py-6">
        <header className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-6 pb-5 border-b border-border">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono mb-1">Painel gerencial</div>
            <h1 className="text-2xl font-semibold text-foreground tracking-tight">Consolidação de Frentes de Serviço</h1>
            <p className="text-sm text-muted-foreground mt-1">Controle operacional de obras, materiais técnicos e alvarás por Unidade Regional.</p>
          </div>
          <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
            <span className="font-mono">{isLoading ? "Carregando…" : `Atualizado · ${new Date().toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}`}</span>
          </div>
        </header>

        <section className="flex items-center gap-1.5 flex-wrap mb-6">
          <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono mr-2">Filtrar por UR:</span>
          <FilterPill active={urFilter === "TODAS"} onClick={() => setUrFilter("TODAS")}>Todas</FilterPill>
          {urs.map(u => (
            <FilterPill key={u.code} active={urFilter === u.code} onClick={() => setUrFilter(u.code)}>{u.code}</FilterPill>
          ))}
        </section>

        <section className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
          <Kpi icon={HardHat} label="Total de Obras" value={totalObras.toString()} sub={urFilter === "TODAS" ? "todas as URs" : urFilter} />
          <ExtensaoCard total={extensao} porTipo={extPorTipo} />
          <Kpi icon={FileCheck2} label="Alvarás Pendentes" value={alvarasPendentes.toString()} sub="bloqueios a resolver" tone={alvarasPendentes > 0 ? "warning" : "neutral"} />
          <Kpi icon={Activity} label="Em Execução" value={emExecucao.toString()} sub="obras ativas em campo" tone="accent" />
          <ObrasRealizadasCard concluidas={concluidas} totalObras={totalObras} extensaoConcluida={extensaoConcluida} extensaoTotal={extensao} pctObras={pctConcluidas} pctExt={pctExtensaoConcluida} />
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <section className="lg:col-span-2 bg-card border border-border rounded-md shadow-card">
            <header className="px-5 py-3.5 border-b border-border flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-foreground">Top Prioridades por UR — não iniciadas</h2>
                <p className="text-[12px] text-muted-foreground mt-0.5">3 obras de cada Unidade Regional, com menor ordem de prioridade.</p>
              </div>
              <Link to="/obras" className="text-[12px] text-accent font-medium inline-flex items-center gap-1 hover:underline">
                Ver todas <ArrowRight className="h-3 w-3" />
              </Link>
            </header>
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead className="bg-muted/50 text-[11px] uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="text-left px-4 py-2 font-medium">Pri</th>
                    <th className="text-left px-2 py-2 font-medium">UR</th>
                    <th className="text-left px-2 py-2 font-medium">Logradouro</th>
                    <th className="text-left px-2 py-2 font-medium">Material</th>
                    <th className="text-right px-2 py-2 font-medium">DN</th>
                    <th className="text-right px-2 py-2 font-medium">Extensão</th>
                    <th className="text-left px-4 py-2 font-medium">Alvará</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {topObras.map(o => (
                    <tr key={o.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-2.5"><PrioridadeBadge prioridade={o.prioridade} /></td>
                      <td className="px-2 py-2.5 font-mono text-[12px] text-muted-foreground">{o.ur}</td>
                      <td className="px-2 py-2.5">
                        <div className="font-medium text-foreground truncate max-w-[260px]">{o.logradouro}</div>
                        <div className="text-[11px] text-muted-foreground">{o.bairro}</div>
                      </td>
                      <td className="px-2 py-2.5"><MaterialBadge tipo={o.material} /></td>
                      <td className="px-2 py-2.5 text-right tabular font-mono text-[12px]">{o.dn || "—"}</td>
                      <td className="px-2 py-2.5 text-right tabular font-mono">{o.extensaoM.toLocaleString("pt-BR")} m</td>
                      <td className="px-4 py-2.5"><AlvaraBadge status={o.alvaraStatus} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {topObras.length === 0 && !isLoading && <div className="px-5 py-8 text-center text-sm text-muted-foreground">Nenhuma obra prioritária pendente.</div>}
            </div>
          </section>

          <section className="bg-card border border-accent/30 rounded-md shadow-card">
            <header className="px-5 py-3.5 border-b border-border flex items-center gap-2">
              <PlayCircle className="h-4 w-4 text-accent" />
              <div>
                <h2 className="text-sm font-semibold text-foreground">Obras em Execução</h2>
                <p className="text-[11px] text-muted-foreground">{emExecucaoList.length} obra(s) ativa(s) em campo.</p>
              </div>
            </header>
            <div className="p-3 space-y-1.5 max-h-[420px] overflow-y-auto">
              {emExecucaoList.length === 0 && !isLoading && (
                <div className="px-3 py-8 text-center text-[13px] text-muted-foreground">Nenhuma obra em execução no momento.</div>
              )}
              {emExecucaoList.map(o => (
                <div key={o.id} className="px-3 py-2.5 rounded border border-border hover:border-border-strong transition-colors">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-foreground text-[13px] truncate">{o.logradouro}</div>
                      <div className="text-[11px] text-muted-foreground truncate">{o.bairro} · <span className="font-mono">{o.ur}</span></div>
                    </div>
                    <PrioridadeBadge prioridade={o.prioridade} />
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-1.5 font-mono">
                    {o.dataInicio && <>Início: {fmtISODate(o.dataInicio)}</>}
                    {o.dataTermino && <> → {fmtISODate(o.dataTermino)}</>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
          <section className="lg:col-span-2 bg-card border border-border rounded-md shadow-card">
            <header className="px-5 py-3.5 border-b border-border">
              <h2 className="text-sm font-semibold text-foreground">Extensão por Material × Status do Alvará</h2>
              <p className="text-[12px] text-muted-foreground mt-0.5">Metros lineares planejados, agrupados por material.</p>
            </header>
            <div className="p-3 h-[280px]">
              {chartMaterialAlvara.length === 0 ? (
                <div className="h-full flex items-center justify-center text-[12px] text-muted-foreground">Sem dados.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartMaterialAlvara} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="material" tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} axisLine={{ stroke: "var(--border)" }} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(1)}k`} />
                    <Tooltip
                      contentStyle={{ background: "var(--background)", border: "1px solid var(--border)", borderRadius: 6, fontSize: 12 }}
                      formatter={(v: number) => `${v.toLocaleString("pt-BR")} m`}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} iconType="square" />
                    <Bar dataKey="Liberado" stackId="a" fill="oklch(0.62 0.16 200)" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="Pendente" stackId="a" fill="oklch(0.70 0.15 75)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </section>

          <section className="bg-card border border-border rounded-md shadow-card">
            <header className="px-5 py-3.5 border-b border-border">
              <h2 className="text-sm font-semibold text-foreground">Status Operacional</h2>
              <p className="text-[12px] text-muted-foreground mt-0.5">Distribuição por situação atual.</p>
            </header>
            <div className="p-3 h-[280px]">
              {chartStatus.length === 0 ? (
                <div className="h-full flex items-center justify-center text-[12px] text-muted-foreground">Sem dados.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={chartStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={75} paddingAngle={2}>
                      {chartStatus.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: "var(--background)", border: "1px solid var(--border)", borderRadius: 6, fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 10 }} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </section>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
          <section className="lg:col-span-2 bg-card border border-border rounded-md shadow-card">
            <header className="px-5 py-3.5 border-b border-border flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-foreground">Carteira por Unidade Regional</h2>
                <p className="text-[12px] text-muted-foreground mt-0.5">Distribuição operacional UMB · UML · UMF.</p>
              </div>
              <Link to="/urs" className="text-[12px] text-accent font-medium inline-flex items-center gap-1 hover:underline">
                Detalhar <ArrowRight className="h-3 w-3" />
              </Link>
            </header>
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead className="bg-muted/50 text-[11px] uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="text-left px-4 py-2 font-medium">UR</th>
                    <th className="text-left px-2 py-2 font-medium">Responsável</th>
                    <th className="text-right px-2 py-2 font-medium">Obras</th>
                    <th className="text-right px-2 py-2 font-medium">Extensão</th>
                    <th className="text-right px-2 py-2 font-medium">Aguard. alvará</th>
                    <th className="text-right px-2 py-2 font-medium">Em execução</th>
                    <th className="text-right px-2 py-2 font-medium">Concluídas</th>
                    <th className="text-right px-4 py-2 font-medium">% Execução</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {urs.map(u => {
                    const s = urStats(obras, u.code);
                    const pct = s.obras > 0 ? Math.round((s.concluidas / s.obras) * 100) : 0;
                    const toneBar = pct >= 50 ? "bg-success" : pct >= 20 ? "bg-warning" : "bg-destructive";
                    return (
                      <tr key={u.code} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full" style={{ background: u.cor }} />
                            <span className="font-mono font-semibold">{u.code}</span>
                          </div>
                          <div className="text-[11px] text-muted-foreground">{u.cidade}</div>
                        </td>
                        <td className="px-2 py-2.5 text-muted-foreground">Antonio Fernando</td>
                        <td className="px-2 py-2.5 text-right tabular font-mono">{s.obras}</td>
                        <td className="px-2 py-2.5 text-right tabular font-mono font-semibold">{Math.round(s.extensaoM).toLocaleString("pt-BR")} m</td>
                        <td className="px-2 py-2.5 text-right tabular font-mono">
                          {s.aguardandoAlvara > 0 ? (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-mono bg-warning-soft text-warning-foreground border border-warning/20">{s.aguardandoAlvara}</span>
                          ) : (<span className="text-muted-foreground">—</span>)}
                        </td>
                        <td className="px-2 py-2.5 text-right tabular font-mono">
                          {s.emExecucao > 0 ? (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-mono bg-accent-soft text-accent border border-accent/20">{s.emExecucao}</span>
                          ) : (<span className="text-muted-foreground">—</span>)}
                        </td>
                        <td className="px-2 py-2.5 text-right tabular font-mono">{s.concluidas}</td>
                        <td className="px-4 py-2.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                              <div className={cn("h-full transition-all", toneBar)} style={{ width: `${pct}%` }} />
                            </div>
                            <span className="font-mono text-[12px] tabular w-9 text-right">{pct}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <section className="bg-card border border-border rounded-md shadow-card">
            <header className="px-5 py-3.5 border-b border-border flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning-foreground" />
              <h2 className="text-sm font-semibold text-foreground">Necessidade de aquisição</h2>
            </header>
            <div className="p-3 space-y-1.5 max-h-[320px] overflow-y-auto">
              {aquisicoes.length === 0 && !isLoading && (
                <div className="px-3 py-6 text-center text-[13px] text-muted-foreground">Estoque suficiente para o cronograma.</div>
              )}
              {aquisicoes.map(n => (
                <div key={n.id} className="px-3 py-2.5 rounded border border-border hover:border-border-strong transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-[12px] font-mono font-semibold text-foreground">{n.codigo}</div>
                      <div className="text-[11px] text-muted-foreground truncate">{n.descricao}</div>
                    </div>
                    <span className="font-mono text-[12px] tabular font-semibold text-destructive shrink-0">{Math.round(n.saldo).toLocaleString("pt-BR")} {n.unidade}</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-1 font-mono">
                    {n.ur} · Necessário {Math.round(Number(n.quantidade_necessaria))} · estoque {Math.round(Number(n.quantidade_estoque))}
                  </div>
                </div>
              ))}
            </div>
            <div className="px-5 py-3 border-t border-border">
              <Link to="/materiais" className="text-[12px] text-accent font-medium inline-flex items-center gap-1 hover:underline">
                Abrir gestão de materiais <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </section>
        </div>
      </div>
    </AppLayout>
  );
}

function FilterPill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={cn("px-3 h-7 rounded text-[12px] font-medium font-mono transition-colors border",
      active ? "bg-primary text-primary-foreground border-primary"
      : "bg-surface text-muted-foreground border-border hover:border-border-strong hover:text-foreground")}>
      {children}
    </button>
  );
}

function Kpi({ icon: Icon, label, value, sub, tone = "neutral" }: { icon: typeof HardHat; label: string; value: string; sub: string; tone?: "neutral" | "accent" | "warning" }) {
  const iconCls = tone === "accent" ? "bg-accent-soft text-accent"
    : tone === "warning" ? "bg-warning-soft text-warning-foreground"
    : "bg-secondary text-secondary-foreground";
  return (
    <div className="bg-card border border-border rounded-md p-4 shadow-card">
      <div className="flex items-start justify-between mb-3">
        <div className={cn("h-9 w-9 rounded flex items-center justify-center", iconCls)}>
          <Icon className="h-[18px] w-[18px]" />
        </div>
      </div>
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono">{label}</div>
      <div className="text-2xl font-semibold tabular tracking-tight text-foreground mt-0.5">{value}</div>
      <div className="text-[11px] text-muted-foreground mt-1">{sub}</div>
    </div>
  );
}

function ObrasRealizadasCard({ concluidas, totalObras, extensaoConcluida, pctObras, pctExt }: {
  concluidas: number; totalObras: number; extensaoConcluida: number; extensaoTotal: number; pctObras: number; pctExt: number;
}) {
  return (
    <div className="bg-card border border-success/30 rounded-md p-4 shadow-card relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-success-soft/40 to-transparent pointer-events-none" />
      <div className="relative">
        <div className="flex items-start justify-between mb-3">
          <div className="h-9 w-9 rounded flex items-center justify-center bg-success-soft text-success">
            <CheckCircle2 className="h-[18px] w-[18px]" />
          </div>
          <span className="text-[11px] font-mono font-semibold text-success tabular">{pctObras.toFixed(1)}%</span>
        </div>
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono">Obras Realizadas</div>
        <div className="text-2xl font-semibold tabular tracking-tight text-foreground mt-0.5">{concluidas}<span className="text-muted-foreground text-base font-normal"> / {totalObras}</span></div>
        <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
          <div className="h-full bg-success transition-all" style={{ width: `${Math.min(100, pctObras)}%` }} />
        </div>
        <div className="text-[11px] text-muted-foreground mt-2 font-mono">
          {Math.round(extensaoConcluida).toLocaleString("pt-BR")} m executados · {pctExt.toFixed(1)}% da extensão
        </div>
      </div>
    </div>
  );
}

function ExtensaoCard({ total, porTipo }: { total: number; porTipo: { tipo: "DEFOFO" | "FOFO" | "PEAD"; metros: number }[] }) {
  const tipoColor: Record<string, string> = {
    DEFOFO: "oklch(0.62 0.16 200)",
    FOFO: "oklch(0.55 0.14 155)",
    PEAD: "oklch(0.70 0.15 75)",
  };
  return (
    <div className="bg-card border border-border rounded-md p-4 shadow-card">
      <div className="flex items-start justify-between mb-3">
        <div className="h-9 w-9 rounded flex items-center justify-center bg-secondary text-secondary-foreground">
          <Ruler className="h-[18px] w-[18px]" />
        </div>
      </div>
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono">Extensão Total</div>
      <div className="text-2xl font-semibold tabular tracking-tight text-foreground mt-0.5">
        {Math.round(total).toLocaleString("pt-BR")} <span className="text-base font-normal text-muted-foreground">m</span>
      </div>
      <div className="mt-2.5 space-y-1.5">
        {porTipo.map(t => {
          const pct = total > 0 ? (t.metros / total) * 100 : 0;
          return (
            <div key={t.tipo}>
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="font-semibold text-foreground">{t.tipo}</span>
                <span className="tabular text-muted-foreground">
                  {Math.round(t.metros).toLocaleString("pt-BR")} m
                  <span className="ml-1 text-[10px]">({pct.toFixed(1)}%)</span>
                </span>
              </div>
              <div className="mt-0.5 h-1 rounded-full bg-muted overflow-hidden">
                <div className="h-full transition-all" style={{ width: `${Math.min(100, pct)}%`, background: tipoColor[t.tipo] }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
