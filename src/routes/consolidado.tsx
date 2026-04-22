import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import {
  fetchConsolidado, upsertConsolidado, deleteConsolidado,
  type ConsolidadoRow, type ConsolidadoInsert,
} from "@/data/api";
import { Download, Plus, Pencil, Trash2, Search, Layers } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Pager } from "@/components/Pager";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/consolidado")({
  head: () => ({
    meta: [
      { title: "Consolidado — RedeGestor" },
      { name: "description", content: "Consolidação geral de materiais por UR (UMB · UML · UMF)." },
    ],
  }),
  component: ConsolidadoPage,
});

function ConsolidadoPage() {
  const qc = useQueryClient();
  const { data: rows = [], isLoading } = useQuery({ queryKey: ["consolidado"], queryFn: fetchConsolidado });
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<ConsolidadoRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<ConsolidadoRow | null>(null);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  const delMut = useMutation({
    mutationFn: (id: string) => deleteConsolidado(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["consolidado"] }); toast.success("Item excluído."); setDeleting(null); },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter(r => !q || `${r.codigo} ${r.descricao}`.toLowerCase().includes(q));
  }, [rows, query]);

  useEffect(() => { setPage(1); }, [query]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = useMemo(
    () => filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [filtered, currentPage],
  );

  const totals = useMemo(() => filtered.reduce(
    (acc, r) => ({
      umb: acc.umb + Number(r.umb),
      uml: acc.uml + Number(r.uml),
      umf: acc.umf + Number(r.umf),
      total: acc.total + Number(r.umb) + Number(r.uml) + Number(r.umf),
    }),
    { umb: 0, uml: 0, umf: 0, total: 0 },
  ), [filtered]);

  const exportCSV = () => {
    const headers = ["Código", "Descrição", "UMB", "UML", "UMF", "Total"];
    const csvRows = filtered.map(r => [r.codigo, r.descricao, r.umb, r.uml, r.umf, Number(r.umb) + Number(r.uml) + Number(r.umf)]);
    const csv = [headers, ...csvRows].map(rr => rr.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `consolidado_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  return (
    <AppLayout>
      <div className="px-4 lg:px-8 py-6">
        <header className="pb-5 border-b border-border mb-5 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono mb-1">Consolidação geral</div>
            <h1 className="text-2xl font-semibold tracking-tight">Consolidado por UR</h1>
            <p className="text-sm text-muted-foreground mt-1">{filtered.length} itens · totais por Unidade Regional.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={exportCSV} variant="outline" size="sm" className="gap-2"><Download className="h-4 w-4" /> Exportar CSV</Button>
            <Dialog open={creating} onOpenChange={setCreating}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2"><Plus className="h-4 w-4" /> Novo item</Button>
              </DialogTrigger>
              <ConsolidadoDialogContent row={null} onClose={() => setCreating(false)} />
            </Dialog>
          </div>
        </header>

        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          <Kpi label="UMB" value={Math.round(totals.umb).toLocaleString("pt-BR")} sub="total UMB" />
          <Kpi label="UML" value={Math.round(totals.uml).toLocaleString("pt-BR")} sub="total UML" />
          <Kpi label="UMF" value={Math.round(totals.umf).toLocaleString("pt-BR")} sub="total UMF" />
          <Kpi label="Geral" value={Math.round(totals.total).toLocaleString("pt-BR")} sub="soma das URs" tone="accent" />
        </section>

        <div className="bg-card border border-border rounded-md shadow-card p-3 mb-3 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar código ou descrição…"
              className="w-full h-9 pl-8 pr-3 rounded border border-input bg-surface text-[13px] focus:outline-none focus:ring-2 focus:ring-ring/30" />
          </div>
        </div>

        <section className="bg-card border border-border rounded-md shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead className="bg-muted/50 text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-2.5 font-medium">Código</th>
                  <th className="text-left px-2 py-2.5 font-medium">Descrição</th>
                  <th className="text-right px-2 py-2.5 font-medium">UMB</th>
                  <th className="text-right px-2 py-2.5 font-medium">UML</th>
                  <th className="text-right px-2 py-2.5 font-medium">UMF</th>
                  <th className="text-right px-2 py-2.5 font-medium">Total</th>
                  <th className="text-right px-4 py-2.5 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map(r => {
                  const total = Number(r.umb) + Number(r.uml) + Number(r.umf);
                  return (
                    <tr key={r.id} className="hover:bg-muted/30">
                      <td className="px-4 py-2.5 font-mono text-[12px] font-semibold">{r.codigo}</td>
                      <td className="px-2 py-2.5 truncate max-w-[380px]">{r.descricao}</td>
                      <td className="px-2 py-2.5 text-right tabular font-mono">{Math.round(Number(r.umb)).toLocaleString("pt-BR")}</td>
                      <td className="px-2 py-2.5 text-right tabular font-mono">{Math.round(Number(r.uml)).toLocaleString("pt-BR")}</td>
                      <td className="px-2 py-2.5 text-right tabular font-mono">{Math.round(Number(r.umf)).toLocaleString("pt-BR")}</td>
                      <td className="px-2 py-2.5 text-right tabular font-mono font-semibold">{Math.round(total).toLocaleString("pt-BR")}</td>
                      <td className="px-4 py-2.5 text-right whitespace-nowrap">
                        <button onClick={() => setEditing(r)} className="inline-flex items-center justify-center h-7 w-7 rounded hover:bg-muted text-muted-foreground hover:text-foreground" title="Editar"><Pencil className="h-3.5 w-3.5" /></button>
                        <button onClick={() => setDeleting(r)} className="inline-flex items-center justify-center h-7 w-7 rounded hover:bg-destructive-soft text-muted-foreground hover:text-destructive" title="Excluir"><Trash2 className="h-3.5 w-3.5" /></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length === 0 && !isLoading && (
              <div className="px-5 py-12 text-center text-sm text-muted-foreground inline-flex items-center justify-center gap-2 w-full">
                <Layers className="h-4 w-4" /> Nenhum item no consolidado.
              </div>
            )}
            {isLoading && <div className="px-5 py-12 text-center text-sm text-muted-foreground">Carregando consolidado…</div>}
          </div>
        </section>
      </div>

      <Dialog open={!!editing} onOpenChange={(open) => { if (!open) setEditing(null); }}>
        {editing && <ConsolidadoDialogContent row={editing} onClose={() => setEditing(null)} />}
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={(open) => { if (!open) setDeleting(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir item do consolidado?</AlertDialogTitle>
            <AlertDialogDescription>O item <span className="font-mono">{deleting?.codigo}</span> ({deleting?.descricao}) será removido permanentemente.</AlertDialogDescription>
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

function ConsolidadoDialogContent({ row, onClose }: { row: ConsolidadoRow | null; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState<ConsolidadoInsert>(() => ({
    codigo: row?.codigo ?? "",
    descricao: row?.descricao ?? "",
    umb: row?.umb ?? 0,
    uml: row?.uml ?? 0,
    umf: row?.umf ?? 0,
  }));

  const mut = useMutation({
    mutationFn: () => upsertConsolidado({ ...form, id: row?.id }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["consolidado"] }); toast.success(row ? "Item atualizado." : "Item criado."); onClose(); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <DialogContent className="max-w-2xl">
      <DialogHeader><DialogTitle>{row ? "Editar item do consolidado" : "Novo item"}</DialogTitle></DialogHeader>
      <form onSubmit={(e) => { e.preventDefault(); mut.mutate(); }} className="grid grid-cols-2 gap-3 py-2">
        <Field label="Código"><Input required value={form.codigo} onChange={e => setForm(f => ({ ...f, codigo: e.target.value }))} /></Field>
        <Field label="Descrição" full><Input required value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} /></Field>
        <Field label="UMB"><Input type="number" step="0.01" value={form.umb ?? 0} onChange={e => setForm(f => ({ ...f, umb: Number(e.target.value) }))} /></Field>
        <Field label="UML"><Input type="number" step="0.01" value={form.uml ?? 0} onChange={e => setForm(f => ({ ...f, uml: Number(e.target.value) }))} /></Field>
        <Field label="UMF" full><Input type="number" step="0.01" value={form.umf ?? 0} onChange={e => setForm(f => ({ ...f, umf: Number(e.target.value) }))} /></Field>
        <DialogFooter className="col-span-2 mt-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" disabled={mut.isPending}>{mut.isPending ? "Salvando…" : row ? "Salvar" : "Criar"}</Button>
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

function Kpi({ label, value, sub, tone = "neutral" }: { label: string; value: string; sub: string; tone?: "neutral" | "accent" }) {
  const cls = tone === "accent" ? "bg-accent-soft text-accent" : "bg-secondary text-secondary-foreground";
  return (
    <div className="bg-card border border-border rounded-md p-4 shadow-card">
      <div className={cn("h-9 w-9 rounded flex items-center justify-center mb-3 font-mono font-semibold text-[12px]", cls)}>{label.slice(0, 3)}</div>
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono">{label}</div>
      <div className="text-2xl font-semibold tabular tracking-tight mt-0.5">{value}</div>
      <div className="text-[11px] text-muted-foreground mt-1">{sub}</div>
    </div>
  );
}
