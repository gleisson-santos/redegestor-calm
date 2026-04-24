import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { Pager } from "@/components/Pager";
import { MaterialBadge } from "@/components/StatusBadge";
import { fetchMateriais, deleteMaterial, upsertMaterial, type MaterialRow, type MaterialInsert } from "@/data/api";
import { urs, URCode } from "@/data/mockData";
import { Download, Package, AlertTriangle, CheckCircle2, Plus, Pencil, Trash2, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/materiais")({
  head: () => ({
    meta: [
      { title: "Gestão de Materiais — RedeGestor" },
      { name: "description", content: "Catálogo técnico, estoque e necessidade de aquisição por UR." },
    ],
  }),
  component: MateriaisPage,
});

function MateriaisPage() {
  const qc = useQueryClient();
  const { data: materiais = [], isLoading } = useQuery({ queryKey: ["materiais"], queryFn: fetchMateriais });
  const [urFilter, setUrFilter] = useState<URCode | "TODAS">("TODAS");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;
  const [editing, setEditing] = useState<MaterialRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<MaterialRow | null>(null);

  const delMut = useMutation({
    mutationFn: (id: string) => deleteMaterial(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["materiais"] }); toast.success("Material excluído."); setDeleting(null); },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = useMemo(() => {
    return materiais.filter(m => {
      if (urFilter !== "TODAS" && m.ur !== urFilter) return false;
      const q = query.trim().toLowerCase();
      if (q && !`${m.codigo} ${m.descricao}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [materiais, urFilter, query]);

  const enriched = filtered.map(m => ({ ...m, saldo: Number(m.quantidade_estoque) - Number(m.quantidade_necessaria) }));
  const itensCriticos = enriched.filter(i => i.saldo < 0).length;
  const itensOk = enriched.filter(i => i.saldo >= 0 && Number(i.quantidade_necessaria) > 0).length;
  const totalEstoque = enriched.reduce((s, m) => s + Number(m.quantidade_estoque), 0);
  const totalNecessario = enriched.reduce((s, m) => s + Number(m.quantidade_necessaria), 0);

  const totalPages = Math.max(1, Math.ceil(enriched.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedEnriched = enriched.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [query, urFilter]);

  const pCols = ["p1","p2","p3","p4","p5","p6","p7","p8","p9","p10"] as const;

  const exportCSV = () => {
    const headers = ["Código", "Descrição", "UR", "DN", "Tipo", "Unidade", "P1","P2","P3","P4","P5","P6","P7","P8","P9","P10", "Total", "Estoque", "Saldo"];
    const rows = enriched.map(m => {
      const mm = m as unknown as Record<string, number | string | null>;
      return [m.codigo, m.descricao, m.ur, m.dn ?? "", m.tipo, m.unidade,
        ...pCols.map(p => Number(mm[p] ?? 0)),
        m.quantidade_necessaria, m.quantidade_estoque, m.saldo];
    });
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `materiais_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  return (
    <AppLayout>
      <div className="px-4 lg:px-8 py-6">
        <header className="pb-5 border-b border-border mb-5 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono mb-1">Suprimentos · Engenharia</div>
            <h1 className="text-2xl font-semibold tracking-tight">Gestão de Materiais</h1>
            <p className="text-sm text-muted-foreground mt-1">Catálogo, disponibilidade e consolidado de necessidade.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={exportCSV} variant="outline" size="sm" className="gap-2"><Download className="h-4 w-4" /> Exportar CSV</Button>
            <Dialog open={creating} onOpenChange={setCreating}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2"><Plus className="h-4 w-4" /> Novo material</Button>
              </DialogTrigger>
              <MaterialDialogContent material={null} onClose={() => setCreating(false)} />
            </Dialog>
          </div>
        </header>

        <div className="flex items-center gap-1.5 flex-wrap mb-5">
          <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono mr-2">UR:</span>
          {(["TODAS", ...urs.map(u => u.code)] as const).map(c => (
            <button key={c} onClick={() => setUrFilter(c as URCode | "TODAS")}
              className={cn("px-3 h-7 rounded text-[12px] font-medium font-mono border transition-colors",
                urFilter === c ? "bg-primary text-primary-foreground border-primary" : "bg-surface text-muted-foreground border-border hover:text-foreground hover:border-border-strong")}>
              {c === "TODAS" ? "Todas as URs" : c}
            </button>
          ))}
        </div>

        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          <Kpi icon={Package} label="Itens em catálogo" value={filtered.length.toString()} sub="materiais filtrados" />
          <Kpi icon={Package} label="Estoque total" value={Math.round(totalEstoque).toLocaleString("pt-BR")} sub="quantidade disponível" />
          <Kpi icon={AlertTriangle} label="Aquisições necessárias" value={itensCriticos.toString()} sub="itens com saldo negativo" tone={itensCriticos > 0 ? "warning" : "neutral"} />
          <Kpi icon={CheckCircle2} label="Cobertos" value={itensOk.toString()} sub="itens dentro do plano" tone="accent" />
        </section>

        <div className="bg-card border border-border rounded-md shadow-card p-3 mb-3 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar por código ou descrição…"
              className="w-full h-9 pl-8 pr-3 rounded border border-input bg-surface text-[13px] focus:outline-none focus:ring-2 focus:ring-ring/30" />
          </div>
        </div>

        <section className="bg-card border border-border rounded-md shadow-card mb-4">
          <header className="px-5 py-3.5 border-b border-border">
            <h2 className="text-sm font-semibold">Materiais — necessidade vs. estoque</h2>
            <p className="text-[12px] text-muted-foreground mt-0.5">Necessidade total: <span className="font-mono font-semibold">{Math.round(totalNecessario).toLocaleString("pt-BR")}</span></p>
          </header>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead className="bg-muted/50 text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th rowSpan={2} className="text-left px-4 py-2.5 font-medium align-bottom">Código</th>
                  <th rowSpan={2} className="text-left px-2 py-2.5 font-medium align-bottom">Descrição</th>
                  <th rowSpan={2} className="text-left px-2 py-2.5 font-medium align-bottom">UR</th>
                  <th rowSpan={2} className="text-left px-2 py-2.5 font-medium align-bottom">Tipo</th>
                  <th rowSpan={2} className="text-right px-2 py-2.5 font-medium align-bottom">DN</th>
                  <th colSpan={10} className="text-center px-2 py-1.5 font-medium border-l border-border">Materiais para execução</th>
                  <th rowSpan={2} className="text-right px-2 py-2.5 font-medium align-bottom border-l border-border">Total</th>
                  <th rowSpan={2} className="text-right px-2 py-2.5 font-medium align-bottom">Estoque</th>
                  <th rowSpan={2} className="text-right px-2 py-2.5 font-medium align-bottom">Saldo</th>
                  <th rowSpan={2} className="text-left px-2 py-2.5 font-medium align-bottom">Status</th>
                  <th rowSpan={2} className="text-right px-4 py-2.5 font-medium align-bottom">Ações</th>
                </tr>
                <tr>
                  {pCols.map((p, i) => (
                    <th key={p} className={cn("text-center px-1 py-1.5 font-medium font-mono min-w-[44px]", i === 0 && "border-l border-border")}>
                      P{i + 1}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pagedEnriched.map(m => {
                  const mm = m as unknown as Record<string, number | null>;
                  return (
                  <tr key={m.id} className="hover:bg-muted/30">
                    <td className="px-4 py-2.5 font-mono text-[12px] font-semibold">{m.codigo}</td>
                    <td className="px-2 py-2.5 truncate max-w-[280px]">{m.descricao}</td>
                    <td className="px-2 py-2.5 font-mono text-[12px]">{m.ur}</td>
                    <td className="px-2 py-2.5"><MaterialBadge tipo={m.tipo} /></td>
                    <td className="px-2 py-2.5 text-right tabular font-mono">{m.dn || "—"}</td>
                    {pCols.map((p, i) => {
                      const v = Number(mm[p] ?? 0);
                      return (
                        <td key={p} className={cn("px-1 py-2.5 text-center tabular font-mono text-[12px]", i === 0 && "border-l border-border", v === 0 && "text-muted-foreground/40")}>
                          {v === 0 ? "—" : Math.round(v).toLocaleString("pt-BR")}
                        </td>
                      );
                    })}
                    <td className="px-2 py-2.5 text-right tabular font-mono font-semibold border-l border-border">{Math.round(Number(m.quantidade_necessaria)).toLocaleString("pt-BR")}</td>
                    <td className="px-2 py-2.5 text-right tabular font-mono">{Math.round(Number(m.quantidade_estoque)).toLocaleString("pt-BR")}</td>
                    <td className={cn("px-2 py-2.5 text-right tabular font-mono font-semibold", m.saldo < 0 ? "text-destructive" : "text-success")}>
                      {m.saldo > 0 ? "+" : ""}{Math.round(m.saldo).toLocaleString("pt-BR")}
                    </td>
                    <td className="px-2 py-2.5">
                      {Number(m.quantidade_necessaria) === 0 ? (
                        <span className="text-[11px] text-muted-foreground">— sem demanda</span>
                      ) : m.saldo < 0 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-destructive-soft text-destructive border border-destructive/20">
                          <AlertTriangle className="h-3 w-3" /> Adquirir
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-success-soft text-success border border-success/20">
                          <CheckCircle2 className="h-3 w-3" /> OK
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right whitespace-nowrap">
                      <button onClick={() => setEditing(m)} className="inline-flex items-center justify-center h-7 w-7 rounded hover:bg-muted text-muted-foreground hover:text-foreground"><Pencil className="h-3.5 w-3.5" /></button>
                      <button onClick={() => setDeleting(m)} className="inline-flex items-center justify-center h-7 w-7 rounded hover:bg-destructive-soft text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length === 0 && !isLoading && <div className="px-5 py-12 text-center text-sm text-muted-foreground">Nenhum material encontrado.</div>}
          </div>
          {filtered.length > 0 && (
            <Pager page={currentPage} totalPages={totalPages} total={filtered.length} pageSize={PAGE_SIZE} onChange={setPage} />
          )}
        </section>
      </div>

      <Dialog open={!!editing} onOpenChange={(open) => { if (!open) setEditing(null); }}>
        {editing && <MaterialDialogContent material={editing} onClose={() => setEditing(null)} />}
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={(open) => { if (!open) setDeleting(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir material?</AlertDialogTitle>
            <AlertDialogDescription>O material <span className="font-mono">{deleting?.codigo}</span> ({deleting?.descricao}) será removido permanentemente.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleting && delMut.mutate(deleting.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}

function MaterialDialogContent({ material, onClose }: { material: MaterialRow | null; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState<MaterialInsert>(() => ({
    codigo: material?.codigo ?? "",
    descricao: material?.descricao ?? "",
    ur: material?.ur ?? "UMF",
    dn: material?.dn ?? null,
    tipo: material?.tipo ?? "DEFOFO",
    unidade: material?.unidade ?? "m",
    quantidade_necessaria: material?.quantidade_necessaria ?? 0,
    quantidade_estoque: material?.quantidade_estoque ?? 0,
  }));

  const mut = useMutation({
    mutationFn: () => upsertMaterial({ ...form, id: material?.id }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["materiais"] }); toast.success(material ? "Material atualizado." : "Material criado."); onClose(); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <DialogContent className="max-w-2xl">
      <DialogHeader><DialogTitle>{material ? "Editar material" : "Novo material"}</DialogTitle></DialogHeader>
      <form onSubmit={(e) => { e.preventDefault(); mut.mutate(); }} className="grid grid-cols-2 gap-3 py-2">
        <Field label="Código"><Input required value={form.codigo} onChange={e => setForm(f => ({ ...f, codigo: e.target.value }))} /></Field>
        <Field label="UR">
          <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.ur} onChange={e => setForm(f => ({ ...f, ur: e.target.value }))}>
            {urs.map(u => <option key={u.code} value={u.code}>{u.code}</option>)}
          </select>
        </Field>
        <Field label="Descrição" full><Input required value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} /></Field>
        <Field label="Tipo">
          <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}>
            <option value="DEFOFO">DEFOFO</option><option value="PEAD">PEAD</option><option value="FOFO">FOFO</option><option value="OUTRO">OUTRO</option>
          </select>
        </Field>
        <Field label="Unidade">
          <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.unidade ?? "m"} onChange={e => setForm(f => ({ ...f, unidade: e.target.value }))}>
            <option value="m">m</option><option value="un">un</option><option value="kg">kg</option>
          </select>
        </Field>
        <Field label="DN (mm)"><Input type="number" value={form.dn ?? ""} onChange={e => setForm(f => ({ ...f, dn: e.target.value ? Number(e.target.value) : null }))} /></Field>
        <Field label="Quantidade necessária"><Input type="number" step="0.01" value={form.quantidade_necessaria ?? 0} onChange={e => setForm(f => ({ ...f, quantidade_necessaria: Number(e.target.value) }))} /></Field>
        <Field label="Quantidade em estoque"><Input type="number" step="0.01" value={form.quantidade_estoque ?? 0} onChange={e => setForm(f => ({ ...f, quantidade_estoque: Number(e.target.value) }))} /></Field>
        <DialogFooter className="col-span-2 mt-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" disabled={mut.isPending}>{mut.isPending ? "Salvando…" : material ? "Salvar" : "Criar"}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

function Field({ label, full, children }: { label: string; full?: boolean; children: React.ReactNode }) {
  return (
    <div className={cn("flex flex-col gap-1.5", full && "col-span-2")}>
      <Label className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono">{label}</Label>
      {children}
    </div>
  );
}

function Kpi({ icon: Icon, label, value, sub, tone = "neutral" }: { icon: typeof Package; label: string; value: string; sub: string; tone?: "neutral" | "accent" | "warning" }) {
  const iconCls = tone === "accent" ? "bg-accent-soft text-accent" : tone === "warning" ? "bg-warning-soft text-warning-foreground" : "bg-secondary text-secondary-foreground";
  return (
    <div className="bg-card border border-border rounded-md p-4 shadow-card">
      <div className={cn("h-9 w-9 rounded flex items-center justify-center mb-3", iconCls)}><Icon className="h-[18px] w-[18px]" /></div>
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono">{label}</div>
      <div className="text-2xl font-semibold tabular tracking-tight mt-0.5">{value}</div>
      <div className="text-[11px] text-muted-foreground mt-1">{sub}</div>
    </div>
  );
}
