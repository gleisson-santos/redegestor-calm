import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { fetchObras, type Obra } from "@/data/api";
import { urs, type URCode } from "@/data/mockData";
import { MapPin, Flame, TrendingUp, AlertCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/mapa")({
  head: () => ({
    meta: [
      { title: "Mapa de Calor — RedeGestor" },
      { name: "description", content: "Mapa de calor de obras por bairro × UR: concentração, pendências e extensão." },
    ],
  }),
  component: MapaPage,
});

type Metrica = "obras_ativas" | "alvaras_pendentes" | "extensao";

const METRICA_LABEL: Record<Metrica, string> = {
  obras_ativas: "Obras ativas",
  alvaras_pendentes: "Alvarás pendentes",
  extensao: "Extensão (m)",
};

function MapaPage() {
  const obrasQ = useQuery({ queryKey: ["obras"], queryFn: fetchObras });
  const obras = obrasQ.data ?? [];
  const [metrica, setMetrica] = useState<Metrica>("obras_ativas");
  const [drill, setDrill] = useState<{ bairro: string; ur: URCode } | null>(null);

  // Agregação bairro × UR
  type Cell = { obras_ativas: number; alvaras_pendentes: number; extensao: number; total: number };
  const grid = useMemo(() => {
    const map = new Map<string, Map<URCode, Cell>>();
    for (const o of obras) {
      if (!o.bairro) continue;
      const inner = map.get(o.bairro) ?? new Map<URCode, Cell>();
      const cell = inner.get(o.ur) ?? { obras_ativas: 0, alvaras_pendentes: 0, extensao: 0, total: 0 };
      cell.total += 1;
      if (o.status === "em_execucao" || o.status === "liberada") cell.obras_ativas += 1;
      if (o.alvaraNecessario && !o.alvaraLiberado) cell.alvaras_pendentes += 1;
      cell.extensao += o.extensaoM;
      inner.set(o.ur, cell);
      map.set(o.bairro, inner);
    }
    return map;
  }, [obras]);

  // Top 30 bairros por volume total
  const bairrosOrdenados = useMemo(() => {
    return Array.from(grid.entries())
      .map(([b, inner]) => {
        let total = 0;
        for (const c of inner.values()) total += c.total;
        return { bairro: b, total };
      })
      .sort((a, b) => b.total - a.total)
      .slice(0, 30);
  }, [grid]);

  const codigos: URCode[] = ["UMB", "UML", "UMF"];

  // Máximo da métrica selecionada para escala de cor
  const maxValor = useMemo(() => {
    let max = 0;
    for (const inner of grid.values()) {
      for (const c of inner.values()) {
        const v = c[metrica];
        if (v > max) max = v;
      }
    }
    return max;
  }, [grid, metrica]);

  function intensidade(v: number): number {
    if (maxValor === 0) return 0;
    return Math.min(1, v / maxValor);
  }

  function corCelula(v: number): string {
    const i = intensidade(v);
    if (i === 0) return "transparent";
    // Heatmap: amarelo → laranja → vermelho
    const alpha = 0.15 + i * 0.75;
    return `oklch(0.65 ${0.10 + i * 0.10} ${50 - i * 35} / ${alpha})`;
  }

  // Top 5 bairros mais saturados (mais obras ativas simultâneas)
  const saturados = useMemo(() => {
    return Array.from(grid.entries())
      .map(([b, inner]) => {
        let ativas = 0;
        for (const c of inner.values()) ativas += c.obras_ativas;
        return { bairro: b, ativas };
      })
      .filter(x => x.ativas > 0)
      .sort((a, b) => b.ativas - a.ativas)
      .slice(0, 5);
  }, [grid]);

  // Top 5 negligenciados (prioridade alta sem obras ativas há +90 dias)
  const negligenciados = useMemo(() => {
    const limite = Date.now() - 90 * 86400000;
    const map = new Map<string, { bairro: string; pri: number; ult: number | null }>();
    for (const o of obras) {
      if (!o.bairro) continue;
      if (o.prioridade > 5) continue;
      const cur = map.get(o.bairro) ?? { bairro: o.bairro, pri: o.prioridade, ult: null };
      cur.pri = Math.min(cur.pri, o.prioridade);
      const dt = o.dataTermino ?? o.dataInicio;
      if (dt) {
        const t = new Date(dt + "T00:00:00").getTime();
        cur.ult = cur.ult === null ? t : Math.max(cur.ult, t);
      }
      map.set(o.bairro, cur);
    }
    return Array.from(map.values())
      .filter(x => x.ult === null || x.ult < limite)
      .sort((a, b) => a.pri - b.pri)
      .slice(0, 5);
  }, [obras]);

  // Distribuição percentual por UR
  const distUR = useMemo(() => {
    const tot = obras.length || 1;
    return codigos.map(code => {
      const n = obras.filter(o => o.ur === code).length;
      return { ur: code, n, pct: (n / tot) * 100 };
    });
  }, [obras]);

  // Drill-down: obras do bairro/UR clicados
  const drillObras: Obra[] = useMemo(() => {
    if (!drill) return [];
    return obras.filter(o => o.bairro === drill.bairro && o.ur === drill.ur);
  }, [obras, drill]);

  return (
    <AppLayout>
      <div className="px-4 lg:px-8 py-6">
        <header className="pb-5 border-b border-border mb-5">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono mb-1">
            Inteligência geográfica
          </div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <MapPin className="h-6 w-6 text-accent" />
            Mapa de Calor
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Concentração de obras por bairro × Unidade Regional. Identifique regiões saturadas ou negligenciadas.
          </p>
        </header>

        {/* Toggle métrica */}
        <div className="mb-5 flex items-center gap-2 flex-wrap">
          <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono">Métrica:</span>
          {(Object.keys(METRICA_LABEL) as Metrica[]).map(m => (
            <button
              key={m}
              onClick={() => setMetrica(m)}
              className={cn(
                "px-3 h-8 rounded text-[12px] font-medium transition-colors border",
                metrica === m
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-surface text-muted-foreground border-border hover:border-border-strong hover:text-foreground",
              )}
            >
              {METRICA_LABEL[m]}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-4">
          {/* Heatmap */}
          <section className="bg-card border border-border rounded-md shadow-card overflow-hidden">
            <header className="px-5 py-3.5 border-b border-border flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-foreground">Bairro × UR</h2>
                <p className="text-[12px] text-muted-foreground mt-0.5">
                  Top 30 bairros · clique numa célula para detalhar.
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <span>baixo</span>
                <div className="flex h-3 w-32 rounded overflow-hidden border border-border">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className="flex-1" style={{ background: corCelula((i + 1) * (maxValor / 10)) }} />
                  ))}
                </div>
                <span>alto</span>
              </div>
            </header>

            <div className="overflow-x-auto max-h-[70vh] overflow-y-auto">
              <table className="w-full text-[12.5px]">
                <thead className="sticky top-0 bg-muted/80 backdrop-blur text-[10.5px] uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="text-left px-4 py-2.5 font-medium">Bairro</th>
                    {codigos.map(c => (
                      <th key={c} className="px-2 py-2.5 font-medium text-center w-24">{c}</th>
                    ))}
                    <th className="px-3 py-2.5 font-medium text-right w-16">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {bairrosOrdenados.map(({ bairro }) => {
                    const inner = grid.get(bairro)!;
                    let totalLinha = 0;
                    return (
                      <tr key={bairro} className="hover:bg-muted/30">
                        <td className="px-4 py-2 font-medium text-foreground truncate max-w-[280px]">{bairro}</td>
                        {codigos.map(c => {
                          const cel = inner.get(c);
                          const v = cel ? cel[metrica] : 0;
                          totalLinha += v;
                          return (
                            <td key={c} className="px-1 py-1 text-center">
                              <button
                                disabled={!cel || cel.total === 0}
                                onClick={() => setDrill({ bairro, ur: c })}
                                className={cn(
                                  "w-full h-9 rounded font-mono tabular text-[12.5px] font-semibold transition-all",
                                  cel && cel.total > 0
                                    ? "hover:scale-[1.05] hover:ring-2 hover:ring-accent/40 cursor-pointer text-foreground"
                                    : "text-muted-foreground/30 cursor-default",
                                )}
                                style={{ background: corCelula(v) }}
                                title={cel ? `${bairro} · ${c} · ${METRICA_LABEL[metrica]}: ${Math.round(v).toLocaleString("pt-BR")}` : "—"}
                              >
                                {cel && cel.total > 0
                                  ? (metrica === "extensao" ? Math.round(v).toLocaleString("pt-BR") : v)
                                  : "—"}
                              </button>
                            </td>
                          );
                        })}
                        <td className="px-3 py-2 text-right font-mono tabular text-muted-foreground">
                          {metrica === "extensao" ? Math.round(totalLinha).toLocaleString("pt-BR") : totalLinha}
                        </td>
                      </tr>
                    );
                  })}
                  {bairrosOrdenados.length === 0 && (
                    <tr><td colSpan={5} className="text-center py-12 text-sm text-muted-foreground">Sem dados.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Cards laterais */}
          <aside className="space-y-4">
            <section className="bg-card border border-border rounded-md shadow-card">
              <header className="px-4 py-3 border-b border-border flex items-center gap-2">
                <Flame className="h-4 w-4 text-destructive" />
                <h3 className="text-sm font-semibold text-foreground">Bairros mais saturados</h3>
              </header>
              <div className="p-3 space-y-1.5">
                {saturados.length === 0 && (
                  <div className="text-[12px] text-muted-foreground text-center py-3">Nenhuma obra ativa.</div>
                )}
                {saturados.map((s, i) => (
                  <div key={s.bairro} className="flex items-center justify-between text-[12.5px] px-2 py-1.5 rounded hover:bg-muted/40">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono text-muted-foreground text-[11px] w-4">#{i + 1}</span>
                      <span className="truncate">{s.bairro}</span>
                    </div>
                    <span className="font-mono font-semibold text-destructive tabular">{s.ativas}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-card border border-border rounded-md shadow-card">
              <header className="px-4 py-3 border-b border-border flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-warning-foreground" />
                <h3 className="text-sm font-semibold text-foreground">Bairros negligenciados</h3>
              </header>
              <div className="p-3 space-y-1.5">
                {negligenciados.length === 0 && (
                  <div className="text-[12px] text-muted-foreground text-center py-3">Sem pendências críticas.</div>
                )}
                {negligenciados.map(n => (
                  <div key={n.bairro} className="flex items-center justify-between text-[12.5px] px-2 py-1.5 rounded hover:bg-muted/40">
                    <span className="truncate">{n.bairro}</span>
                    <span className="font-mono font-semibold text-warning-foreground tabular">P{n.pri}</span>
                  </div>
                ))}
              </div>
              <div className="px-4 pb-3 text-[10px] text-muted-foreground">
                Prioridade ≤ 5 sem movimentação há +90 dias.
              </div>
            </section>

            <section className="bg-card border border-border rounded-md shadow-card">
              <header className="px-4 py-3 border-b border-border flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-accent" />
                <h3 className="text-sm font-semibold text-foreground">Distribuição por UR</h3>
              </header>
              <div className="p-3 space-y-2">
                {distUR.map(d => (
                  <div key={d.ur}>
                    <div className="flex items-center justify-between text-[12px] mb-1">
                      <span className="font-mono font-semibold">{d.ur}</span>
                      <span className="font-mono tabular text-muted-foreground">{d.n} ({d.pct.toFixed(1)}%)</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-accent transition-all" style={{ width: `${d.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </div>

        {/* Drill-down drawer */}
        {drill && (
          <div className="fixed inset-0 z-40 flex justify-end">
            <div className="absolute inset-0 bg-foreground/40" onClick={() => setDrill(null)} />
            <div className="relative w-full max-w-md bg-card border-l border-border shadow-elevated flex flex-col">
              <header className="px-5 py-4 border-b border-border flex items-start justify-between">
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono">Drill-down</div>
                  <h3 className="text-base font-semibold">{drill.bairro}</h3>
                  <p className="text-[12px] text-muted-foreground">UR {drill.ur} · {drillObras.length} obra(s)</p>
                </div>
                <button onClick={() => setDrill(null)} className="p-1 rounded hover:bg-muted">
                  <X className="h-4 w-4" />
                </button>
              </header>
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {drillObras.map(o => (
                  <div key={o.id} className="border border-border rounded p-3 bg-surface">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-[12px] font-mono font-semibold text-foreground">{o.codigo}</div>
                        <div className="text-[12.5px] truncate">{o.logradouro}</div>
                      </div>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted">P{o.prioridade}</span>
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-1.5 font-mono flex flex-wrap gap-x-3 gap-y-0.5">
                      <span>{o.material}{o.dn ? ` DN${o.dn}` : ""}</span>
                      <span>{Math.round(o.extensaoM)} m</span>
                      <span>{o.status}</span>
                    </div>
                  </div>
                ))}
                {drillObras.length === 0 && (
                  <div className="text-center text-sm text-muted-foreground py-12">Nenhuma obra encontrada.</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
