import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getAllMaterials } from "@/data/mockData";
import { Boxes, Download, FileText, AlertTriangle, CheckCircle2, Search, TrendingDown } from "lucide-react";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/estoque")({
  head: () => ({
    meta: [
      { title: "Estoque & Relatórios — RedeGestor" },
      { name: "description", content: "Gerencie itens, alertas e gere relatórios PDF." },
    ],
  }),
  component: EstoquePage,
});

function EstoquePage() {
  const materiais = useMemo(() => getAllMaterials(), []);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"todos" | "baixo" | "ok">("todos");

  const filtered = materiais.filter(m => {
    const matchQ = !query || m.descricao.toLowerCase().includes(query.toLowerCase()) || m.codigo.toLowerCase().includes(query.toLowerCase());
    const baixo = m.estoqueAtual < m.estoqueMinimo;
    const matchF = filter === "todos" || (filter === "baixo" && baixo) || (filter === "ok" && !baixo);
    return matchQ && matchF;
  });

  const totalItens = materiais.length;
  const baixos = materiais.filter(m => m.estoqueAtual < m.estoqueMinimo).length;
  const okItens = totalItens - baixos;

  const reports = [
    { title: "Cronograma consolidado 2026", desc: "Todos os contratos · materiais e quantidades", icon: FileText },
    { title: "Movimentação de estoque", desc: "Últimos 30 dias · entradas, saídas e saldo", icon: TrendingDown },
    { title: "Alertas e ações sugeridas", desc: "Itens críticos com reposição recomendada", icon: AlertTriangle },
    { title: "Relatório por contrato", desc: "Material previsto vs. utilizado por obra", icon: FileText },
  ];

  return (
    <AppLayout>
      <div className="px-4 lg:px-8 py-8 lg:py-10 max-w-[1400px] mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-display">Estoque & Relatórios</h1>
            <p className="text-muted-foreground mt-1.5">Itens globais e exportações para sua equipe.</p>
          </div>
          <Button className="gap-2 shadow-soft"><Download className="h-4 w-4" /> Exportar tudo</Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-border/60 shadow-soft">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-primary-soft flex items-center justify-center"><Boxes className="h-6 w-6 text-primary" /></div>
              <div><div className="text-2xl font-semibold">{totalItens}</div><div className="text-sm text-muted-foreground">Itens monitorados</div></div>
            </CardContent>
          </Card>
          <Card className="border-border/60 shadow-soft">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-accent-soft flex items-center justify-center"><CheckCircle2 className="h-6 w-6 text-accent" /></div>
              <div><div className="text-2xl font-semibold">{okItens}</div><div className="text-sm text-muted-foreground">Em nível saudável</div></div>
            </CardContent>
          </Card>
          <Card className="border-border/60 shadow-soft">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-warning-soft flex items-center justify-center"><AlertTriangle className="h-6 w-6 text-warning-foreground" /></div>
              <div><div className="text-2xl font-semibold text-warning-foreground">{baixos}</div><div className="text-sm text-muted-foreground">Abaixo do mínimo</div></div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 border-border/60 shadow-soft">
            <CardHeader>
              <CardTitle className="text-lg">Itens em estoque</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Buscar item…"
                    className="w-full h-10 pl-9 pr-3 rounded-lg bg-muted/50 border border-transparent focus:bg-surface focus:border-input focus:outline-none focus:ring-2 focus:ring-ring/30 text-sm calm-transition"
                  />
                </div>
                <div className="flex gap-1 p-1 bg-muted rounded-lg">
                  {(["todos","baixo","ok"] as const).map(f => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={cn(
                        "px-3 h-8 text-sm rounded-md font-medium calm-transition capitalize",
                        filter === f ? "bg-surface text-foreground shadow-soft" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {f === "todos" ? "Todos" : f === "baixo" ? "Baixos" : "OK"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                {filtered.map(m => {
                  const baixo = m.estoqueAtual < m.estoqueMinimo;
                  const pct = Math.min(100, (m.estoqueAtual / Math.max(m.estoqueMinimo * 2, 1)) * 100);
                  return (
                    <div key={m.codigo} className={cn(
                      "p-3.5 rounded-lg border calm-transition",
                      baixo ? "border-warning/30 bg-warning-soft/30" : "border-border bg-surface hover:border-foreground/20"
                    )}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-medium text-sm">{m.descricao}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">{m.codigo} · usado em {m.contratos.length} contrato(s)</div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className={cn("text-lg font-semibold tabular-nums", baixo && "text-warning-foreground")}>
                            {m.estoqueAtual}
                          </div>
                          <div className="text-[10px] text-muted-foreground">/ mín {m.estoqueMinimo} {m.umb}</div>
                        </div>
                      </div>
                      <div className="mt-2.5 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className={cn("h-full rounded-full calm-transition", baixo ? "bg-warning" : "bg-accent")} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
                {filtered.length === 0 && <div className="text-center py-8 text-sm text-muted-foreground">Nenhum item.</div>}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-soft">
            <CardHeader>
              <CardTitle className="text-lg">Relatórios</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Gere PDFs prontos para sua equipe.</p>
            </CardHeader>
            <CardContent className="space-y-2">
              {reports.map(r => (
                <button key={r.title} className="w-full text-left p-3.5 rounded-lg border border-border bg-surface hover:border-primary/40 hover:bg-primary-soft/30 calm-transition group">
                  <div className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-lg bg-primary-soft flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-primary-foreground calm-transition">
                      <r.icon className="h-4 w-4 text-primary group-hover:text-primary-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-sm">{r.title}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{r.desc}</div>
                    </div>
                    <Download className="h-4 w-4 text-muted-foreground group-hover:text-primary calm-transition shrink-0 mt-1" />
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
