import { createFileRoute, Link } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { contracts, ContractStatus, urs, URCode } from "@/data/mockData";
import { Search, FileText, Plus, Filter, Building2 } from "lucide-react";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/contratos/")({
  head: () => ({
    meta: [
      { title: "Contratos — RedeGestor" },
      { name: "description", content: "Lista filtrável de todos os contratos de extensão de rede." },
    ],
  }),
  component: ContratosList,
});

function ContratosList() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<ContractStatus | "todos">("todos");
  const [urFilter, setUrFilter] = useState<URCode | "todas">("todas");

  const filtered = useMemo(() => {
    return contracts.filter(c => {
      const matchQuery = !query || c.numero.includes(query) || c.titulo.toLowerCase().includes(query.toLowerCase()) || c.cliente.toLowerCase().includes(query.toLowerCase());
      const matchStatus = filter === "todos" || c.status === filter;
      const matchUR = urFilter === "todas" || c.ur === urFilter;
      return matchQuery && matchStatus && matchUR;
    });
  }, [query, filter, urFilter]);

  const filters: ({ value: ContractStatus | "todos"; label: string })[] = [
    { value: "todos", label: "Todos" },
    { value: "ativo", label: "Ativos" },
    { value: "atencao", label: "Atenção" },
    { value: "pausado", label: "Pausados" },
    { value: "concluido", label: "Concluídos" },
  ];

  return (
    <AppLayout>
      <div className="px-4 lg:px-8 py-8 lg:py-10 max-w-[1400px] mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-display">Contratos</h1>
            <p className="text-muted-foreground mt-1.5">Gerencie todo o portfólio em um só lugar.</p>
          </div>
          <Button className="gap-2 shadow-soft">
            <Plus className="h-4 w-4" /> Novo contrato
          </Button>
        </div>

        <Card className="border-border/60 shadow-soft p-4 lg:p-5 space-y-4">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Buscar por número, título ou cliente…"
                className="w-full h-11 pl-10 pr-3 rounded-lg bg-muted/50 border border-transparent focus:bg-surface focus:border-input focus:outline-none focus:ring-2 focus:ring-ring/30 text-sm calm-transition"
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="h-4 w-4 text-muted-foreground hidden sm:block" />
              {filters.map(f => (
                <button
                  key={f.value}
                  onClick={() => setFilter(f.value)}
                  className={cn(
                    "px-3 h-9 rounded-lg text-sm calm-transition border",
                    filter === f.value
                      ? "bg-primary text-primary-foreground border-primary shadow-soft"
                      : "bg-surface border-border text-foreground/70 hover:text-foreground hover:border-foreground/20"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* UR pills */}
          <div className="flex items-center gap-2 flex-wrap pt-1">
            <Building2 className="h-4 w-4 text-muted-foreground hidden sm:block" />
            <button
              onClick={() => setUrFilter("todas")}
              className={cn(
                "px-3 h-8 rounded-lg text-xs font-medium calm-transition border",
                urFilter === "todas" ? "bg-foreground text-background border-foreground" : "bg-surface border-border text-muted-foreground hover:text-foreground"
              )}
            >
              Todas as URs
            </button>
            {urs.map(u => (
              <button
                key={u.code}
                onClick={() => setUrFilter(u.code)}
                className={cn(
                  "px-3 h-8 rounded-lg text-xs font-medium calm-transition border inline-flex items-center gap-1.5",
                  urFilter === u.code ? "bg-foreground text-background border-foreground" : "bg-surface border-border text-muted-foreground hover:text-foreground"
                )}
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: u.cor }} />
                {u.code}
              </button>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block overflow-hidden rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  <th className="px-4 py-3">Número</th>
                  <th className="px-4 py-3">UR</th>
                  <th className="px-4 py-3">Contrato</th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Período</th>
                  <th className="px-4 py-3">Progresso</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-surface">
                {filtered.map(c => {
                  const ur = urs.find(u => u.code === c.ur)!;
                  return (
                    <tr key={c.id} className="hover:bg-muted/30 calm-transition">
                      <td className="px-4 py-3.5">
                        <Link to="/contratos/$contractId" params={{ contractId: c.id }} className="font-medium text-primary hover:underline">
                          {c.numero}
                        </Link>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-muted/60 text-xs font-medium">
                          <span className="h-1.5 w-1.5 rounded-full" style={{ background: ur.cor }} />
                          {c.ur}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 max-w-xs">
                        <div className="font-medium text-foreground truncate">{c.titulo}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{c.regiao}</div>
                      </td>
                      <td className="px-4 py-3.5 text-muted-foreground">{c.cliente}</td>
                      <td className="px-4 py-3.5"><StatusBadge status={c.status} /></td>
                      <td className="px-4 py-3.5 text-muted-foreground text-xs">
                        {new Date(c.inicio).toLocaleDateString("pt-BR")} → {new Date(c.fim).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-24 rounded-full bg-muted overflow-hidden">
                            <div className="h-full bg-primary rounded-full" style={{ width: `${c.progresso}%` }} />
                          </div>
                          <span className="text-xs font-medium w-8 text-right tabular-nums">{c.progresso}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {filtered.map(c => (
              <Link
                key={c.id}
                to="/contratos/$contractId"
                params={{ contractId: c.id }}
                className="block p-4 rounded-lg border border-border bg-surface hover:border-primary/40 calm-transition"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-primary">{c.numero}</span>
                  <StatusBadge status={c.status} />
                </div>
                <div className="font-medium text-sm">{c.titulo}</div>
                <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                  <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-primary-soft text-primary">{c.ur}</span>
                  {c.cliente}
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${c.progresso}%` }} />
                  </div>
                  <span className="text-xs font-medium tabular-nums">{c.progresso}%</span>
                </div>
              </Link>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
              Nenhum contrato encontrado. Tente ajustar os filtros.
            </div>
          )}
        </Card>
      </div>
    </AppLayout>
  );
}
