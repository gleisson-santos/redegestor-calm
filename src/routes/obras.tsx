import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import {
  StatusBadge, MaterialBadge, AlvaraBadge, PrioridadeBadge, FinalidadeBadge,
} from "@/components/StatusBadge";
import {
  obras, urs, URCode, MaterialTipo, StatusObra, Obra, statusObraLabels,
} from "@/data/mockData";
import { Download, Search, Filter } from "lucide-react";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/obras")({
  head: () => ({
    meta: [
      { title: "Base de Obras — RedeGestor" },
      { name: "description", content: "Cadastro técnico de obras: logradouro, DN, extensão, material, prioridade e alvará." },
    ],
  }),
  component: ObrasPage,
});

type SortKey = "prioridade" | "extensaoM" | "ur" | "dn";

function ObrasPage() {
  const [query, setQuery] = useState("");
  const [urFilter, setUrFilter] = useState<URCode | "TODAS">("TODAS");
  const [matFilter, setMatFilter] = useState<MaterialTipo | "TODOS">("TODOS");
  const [statusFilter, setStatusFilter] = useState<StatusObra | "TODOS">("TODOS");
  const [sort, setSort] = useState<SortKey>("prioridade");

  const filtered = useMemo(() => {
    let r: Obra[] = obras.filter(o => {
      const q = query.trim().toLowerCase();
      if (q && !`${o.codigo} ${o.logradouro} ${o.bairro}`.toLowerCase().includes(q)) return false;
      if (urFilter !== "TODAS" && o.ur !== urFilter) return false;
      if (matFilter !== "TODOS" && o.material !== matFilter) return false;
      if (statusFilter !== "TODOS" && o.status !== statusFilter) return false;
      return true;
    });
    r = [...r].sort((a, b) => {
      if (sort === "prioridade") return a.prioridade - b.prioridade;
      if (sort === "extensaoM") return b.extensaoM - a.extensaoM;
      if (sort === "ur") return a.ur.localeCompare(b.ur);
      if (sort === "dn") return b.dn - a.dn;
      return 0;
    });
    return r;
  }, [query, urFilter, matFilter, statusFilter, sort]);

  const exportCSV = () => {
    const headers = ["Código", "UR", "Bairro", "Logradouro", "Finalidade", "DN", "Extensão (m)", "Material", "Prioridade", "Status", "Alvará", "Responsável", "Início", "Conclusão"];
    const rows = filtered.map(o => [
      o.codigo, o.ur, o.bairro, o.logradouro, o.finalidade, o.dn, o.extensaoM, o.material,
      o.prioridade, statusObraLabels[o.status], o.alvaraStatus, o.responsavel, o.inicioPrevisto, o.conclusaoPrevista,
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `obras_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  return (
    <AppLayout>
      <div className="px-4 lg:px-8 py-6 max-w-[1400px] mx-auto">
        <header className="pb-5 border-b border-border mb-5 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono mb-1">Frentes de serviço</div>
            <h1 className="text-2xl font-semibold tracking-tight">Base de Obras</h1>
            <p className="text-sm text-muted-foreground mt-1">{filtered.length} de {obras.length} registros · ordenado por {labelSort(sort)}.</p>
          </div>
          <Button onClick={exportCSV} variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" /> Exportar CSV
          </Button>
        </header>

        {/* Filtros */}
        <div className="bg-card border border-border rounded-md shadow-card p-3 mb-4 flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Buscar código, logradouro ou bairro…"
              className="w-full h-9 pl-8 pr-3 rounded border border-input bg-surface text-[13px] focus:outline-none focus:ring-2 focus:ring-ring/30"
            />
          </div>
          <Select label="UR" value={urFilter} onChange={v => setUrFilter(v as URCode | "TODAS")}>
            <option value="TODAS">Todas</option>
            {urs.map(u => <option key={u.code} value={u.code}>{u.code}</option>)}
          </Select>
          <Select label="Material" value={matFilter} onChange={v => setMatFilter(v as MaterialTipo | "TODOS")}>
            <option value="TODOS">Todos</option>
            <option value="DEFOFO">DEFOFO</option>
            <option value="PEAD">PEAD</option>
            <option value="FOFO">FOFO</option>
          </Select>
          <Select label="Status" value={statusFilter} onChange={v => setStatusFilter(v as StatusObra | "TODOS")}>
            <option value="TODOS">Todos</option>
            {(Object.keys(statusObraLabels) as StatusObra[]).map(s => (
              <option key={s} value={s}>{statusObraLabels[s]}</option>
            ))}
          </Select>
          <Select label="Ordenar" value={sort} onChange={v => setSort(v as SortKey)}>
            <option value="prioridade">Prioridade</option>
            <option value="extensaoM">Extensão</option>
            <option value="dn">Diâmetro</option>
            <option value="ur">UR</option>
          </Select>
        </div>

        <div className="bg-card border border-border rounded-md shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead className="bg-muted/50 text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="text-left px-3 py-2.5 font-medium">Pri</th>
                  <th className="text-left px-2 py-2.5 font-medium">Código</th>
                  <th className="text-left px-2 py-2.5 font-medium">UR</th>
                  <th className="text-left px-2 py-2.5 font-medium">Logradouro</th>
                  <th className="text-left px-2 py-2.5 font-medium">Finalidade</th>
                  <th className="text-left px-2 py-2.5 font-medium">Mat.</th>
                  <th className="text-right px-2 py-2.5 font-medium">DN</th>
                  <th className="text-right px-2 py-2.5 font-medium">Extensão</th>
                  <th className="text-left px-2 py-2.5 font-medium">Status</th>
                  <th className="text-left px-2 py-2.5 font-medium">Alvará</th>
                  <th className="text-left px-3 py-2.5 font-medium">Responsável</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map(o => (
                  <tr key={o.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-3 py-2.5"><PrioridadeBadge prioridade={o.prioridade} /></td>
                    <td className="px-2 py-2.5 font-mono text-[11px] text-muted-foreground">{o.codigo}</td>
                    <td className="px-2 py-2.5 font-mono text-[12px] font-semibold">{o.ur}</td>
                    <td className="px-2 py-2.5">
                      <div className="font-medium truncate max-w-[260px]">{o.logradouro}</div>
                      <div className="text-[11px] text-muted-foreground">{o.bairro}</div>
                    </td>
                    <td className="px-2 py-2.5"><FinalidadeBadge finalidade={o.finalidade} /></td>
                    <td className="px-2 py-2.5"><MaterialBadge tipo={o.material} /></td>
                    <td className="px-2 py-2.5 text-right tabular font-mono">{o.dn}</td>
                    <td className="px-2 py-2.5 text-right tabular font-mono font-semibold">{o.extensaoM.toLocaleString("pt-BR")} m</td>
                    <td className="px-2 py-2.5"><StatusBadge status={o.status} /></td>
                    <td className="px-2 py-2.5"><AlvaraBadge status={o.alvaraStatus} /></td>
                    <td className="px-3 py-2.5 text-muted-foreground text-[12px] truncate max-w-[140px]">{o.responsavel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="px-5 py-12 text-center text-sm text-muted-foreground inline-flex items-center justify-center gap-2 w-full">
                <Filter className="h-4 w-4" /> Nenhuma obra corresponde aos filtros aplicados.
              </div>
            )}
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
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="bg-transparent text-[13px] focus:outline-none cursor-pointer pr-1"
      >
        {children}
      </select>
    </label>
  );
}

function labelSort(s: SortKey): string {
  return ({ prioridade: "prioridade", extensaoM: "extensão", dn: "diâmetro", ur: "UR" } as const)[s];
}
