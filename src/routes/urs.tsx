import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { StatusBadge, MaterialBadge, AlvaraBadge, PrioridadeBadge } from "@/components/StatusBadge";
import { fetchObras, urStats, obrasByUR, extensaoPorMaterial } from "@/data/api";
import { urs, URCode } from "@/data/mockData";
import { Building2, HardHat, Ruler, MapPin, ArrowRight } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/urs")({
  head: () => ({
    meta: [
      { title: "Unidades Regionais — RedeGestor" },
      { name: "description", content: "Visão consolidada por UR (UMB · UML · UMF): obras, extensão e alvarás." },
    ],
  }),
  component: URsPage,
});

function URsPage() {
  const { data: obras = [] } = useQuery({ queryKey: ["obras"], queryFn: fetchObras });
  const [selected, setSelected] = useState<URCode>("UMB");
  const ur = urs.find(u => u.code === selected)!;
  const stats = urStats(obras, selected);
  const subset = obrasByUR(obras, selected).sort((a, b) => a.prioridade - b.prioridade);
  const porMaterial = extensaoPorMaterial(subset);

  return (
    <AppLayout>
      <div className="px-4 lg:px-8 py-6">
        <header className="pb-5 border-b border-border mb-6">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono mb-1">Operação por região</div>
          <h1 className="text-2xl font-semibold tracking-tight">Unidades Regionais</h1>
          <p className="text-sm text-muted-foreground mt-1">UMB · UML · UMF — comparação operacional e detalhamento por unidade.</p>
        </header>

        <section className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          {urs.map(u => {
            const s = urStats(obras, u.code);
            const isSel = selected === u.code;
            return (
              <button key={u.code} onClick={() => setSelected(u.code)}
                className={cn("text-left p-4 bg-card border rounded-md transition-all shadow-card",
                  isSel ? "border-accent ring-2 ring-accent/20" : "border-border hover:border-border-strong")}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: u.cor }} />
                    <span className="font-mono font-semibold text-base">{u.code}</span>
                  </div>
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="text-[13px] font-medium text-foreground leading-tight">{u.nome}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">{u.cidade}</div>
                <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-border">
                  <Stat n={s.obras} l="Obras" />
                  <Stat n={Math.round(s.extensaoM).toLocaleString("pt-BR")} l="Metros" mono />
                  <Stat n={s.bairros} l="Bairros" />
                </div>
              </button>
            );
          })}
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <section className="lg:col-span-1 bg-card border border-border rounded-md shadow-card">
            <header className="px-5 py-4 border-b border-border">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[12px] text-muted-foreground tracking-wider">{ur.code}</span>
                <span className="h-2 w-2 rounded-full" style={{ background: ur.cor }} />
              </div>
              <h2 className="text-base font-semibold text-foreground mt-1">{ur.nome}</h2>
              <p className="text-[12px] text-muted-foreground mt-1">{ur.cidade}</p>
              <p className="text-[12px] text-foreground mt-2">Gerente: <span className="font-medium">{ur.gerente}</span></p>
            </header>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <MiniKpi icon={HardHat} value={stats.obras.toString()} label="Obras" />
                <MiniKpi icon={Ruler} value={`${Math.round(stats.extensaoM).toLocaleString("pt-BR")} m`} label="Extensão" />
                <MiniKpi icon={Building2} value={stats.aguardandoAlvara.toString()} label="Aguard. alvará" tone="warning" />
                <MiniKpi icon={MapPin} value={stats.bairros.toString()} label="Bairros" />
              </div>
              <div className="pt-2 border-t border-border">
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono mb-2.5">Por material</div>
                {(["DEFOFO", "PEAD", "FOFO"] as const).map(t => (
                  <div key={t} className="flex items-center justify-between mb-1.5">
                    <MaterialBadge tipo={t} />
                    <span className="font-mono tabular text-[12px]">{Math.round(porMaterial[t]).toLocaleString("pt-BR")} m</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="lg:col-span-2 bg-card border border-border rounded-md shadow-card">
            <header className="px-5 py-3.5 border-b border-border flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-foreground">Obras da {selected}</h2>
                <p className="text-[12px] text-muted-foreground mt-0.5">{subset.length} registros · ordenados por prioridade.</p>
              </div>
              <Link to="/obras" className="text-[12px] text-accent font-medium inline-flex items-center gap-1 hover:underline">
                Base completa <ArrowRight className="h-3 w-3" />
              </Link>
            </header>
            <div className="overflow-x-auto max-h-[600px]">
              <table className="w-full text-[13px]">
                <thead className="bg-muted/50 text-[11px] uppercase tracking-wider text-muted-foreground sticky top-0">
                  <tr>
                    <th className="text-left px-4 py-2 font-medium">Pri</th>
                    <th className="text-left px-2 py-2 font-medium">Logradouro</th>
                    <th className="text-left px-2 py-2 font-medium">Mat.</th>
                    <th className="text-right px-2 py-2 font-medium">DN</th>
                    <th className="text-right px-2 py-2 font-medium">Ext.</th>
                    <th className="text-left px-2 py-2 font-medium">Status</th>
                    <th className="text-left px-4 py-2 font-medium">Alvará</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {subset.map(o => (
                    <tr key={o.id} className="hover:bg-muted/30">
                      <td className="px-4 py-2"><PrioridadeBadge prioridade={o.prioridade} /></td>
                      <td className="px-2 py-2">
                        <div className="font-medium truncate max-w-[260px]">{o.logradouro}</div>
                        <div className="text-[11px] text-muted-foreground">{o.bairro}</div>
                      </td>
                      <td className="px-2 py-2"><MaterialBadge tipo={o.material} /></td>
                      <td className="px-2 py-2 text-right tabular font-mono text-[12px]">{o.dn || "—"}</td>
                      <td className="px-2 py-2 text-right tabular font-mono">{o.extensaoM} m</td>
                      <td className="px-2 py-2"><StatusBadge status={o.status} /></td>
                      <td className="px-4 py-2"><AlvaraBadge status={o.alvaraStatus} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {subset.length === 0 && <div className="px-5 py-8 text-center text-sm text-muted-foreground">Nenhuma obra registrada.</div>}
            </div>
          </section>
        </div>
      </div>
    </AppLayout>
  );
}

function Stat({ n, l, mono, tone = "neutral" }: { n: number | string; l: string; mono?: boolean; tone?: "neutral" | "warning" }) {
  return (
    <div>
      <div className={cn("text-[14px] font-semibold tabular", mono && "font-mono", tone === "warning" && Number(n) > 0 && "text-warning-foreground")}>{n}</div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{l}</div>
    </div>
  );
}

function MiniKpi({ icon: Icon, value, label, tone = "neutral" }: { icon: typeof HardHat; value: string; label: string; tone?: "neutral" | "accent" | "warning" }) {
  const cls = tone === "accent" ? "bg-accent-soft text-accent" : tone === "warning" ? "bg-warning-soft text-warning-foreground" : "bg-secondary text-secondary-foreground";
  return (
    <div className="p-3 border border-border rounded">
      <div className={cn("h-7 w-7 rounded flex items-center justify-center mb-2", cls)}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="text-base font-semibold tabular font-mono">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">{label}</div>
    </div>
  );
}
