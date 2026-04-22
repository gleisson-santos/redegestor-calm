import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { fetchCaderno, upsertCaderno, deleteCaderno, type CadernoEncargo, type CadernoEncargoInsert } from "@/data/encargos";
import { BookOpen, Plus, Pencil, Trash2, Search, Download, DollarSign } from "lucide-react";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/encargos")({
  head: () => ({
    meta: [
      { title: "Caderno de Encargos — RedeGestor" },
      { name: "description", content: "Tabela de preços unitários dos serviços de engenharia." },
    ],
  }),
  component: CadernoPage,
});

const fmtBRL = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function CadernoPage() {
  const qc = useQueryClient();
  const { data: itens = [], isLoading } = useQuery({ queryKey: ["caderno"], queryFn: fetchCaderno });
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<CadernoEncargo | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<CadernoEncargo | null>(null);

  const delMut = useMutation({
    mutationFn: (id: string) => deleteCaderno(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["caderno"] }); toast.success("Item excluído."); setDeleting(null); },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return itens;
    return itens.filter(i => `${i.codigo} ${i.descricao}`.toLowerCase().includes(q));
  }, [itens, query]);

  const totalItens = itens.length;
  const precoMedio = itens.length ? itens.reduce((s, i) => s + Number(i.preco_unitario), 0) / itens.length : 0;
  const precoMax = itens.reduce((m, i) => Math.max(m, Number(i.preco_unitario)), 0);

  const exportCSV = () => {
    const headers = ["Código", "Descrição", "Unidade", "Preço Unitário (R$)"];
    const rows = filtered.map(i => [i.codigo, i.descricao, i.unidade, Number(i.preco_unitario).toFixed(2)]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `caderno_encargos_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  return (
    <AppLayout>
      <div className="px-4 lg:px-8 py-6">
        <header className="pb-5 border-b border-border mb-5 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono mb-1">Financeiro · Engenharia</div>
            <h1 className="text-2xl font-semibold tracking-tight">Caderno de Encargos</h1>
            <p className="text-sm text-muted-foreground mt-1">Tabela mestre de preços unitários para medições e contratos.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={exportCSV} variant="outline" size="sm" className="gap-2"><Download className="h-4 w-4" /> Exportar CSV</Button>
            <Dialog open={creating} onOpenChange={setCreating}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2"><Plus className="h-4 w-4" /> Novo item</Button>
              </DialogTrigger>
              <CadernoDialogContent item={null} onClose={() => setCreating(false)} />
            </Dialog>
          </div>
        </header>

        <section className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
          <Kpi icon={BookOpen} label="Itens cadastrados" value={totalItens.toString()} sub="serviços no catálogo" />
          <Kpi icon={DollarSign} label="Preço médio" value={fmtBRL(precoMedio)} sub="média por item" tone="accent" />
          <Kpi icon={DollarSign} label="Maior preço" value={fmtBRL(precoMax)} sub="serviço mais caro" />
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
            <h2 className="text-sm font-semibold">Tabela de Preços</h2>
            <p className="text-[12px] text-muted-foreground mt-0.5">{filtered.length} itens listados</p>
          </header>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead className="bg-muted/50 text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-2.5 font-medium w-[120px]">Código</th>
                  <th className="text-left px-2 py-2.5 font-medium">Descrição</th>
                  <th className="text-left px-2 py-2.5 font-medium w-[100px]">Unidade</th>
                  <th className="text-right px-2 py-2.5 font-medium w-[160px]">Preço unitário</th>
                  <th className="text-right px-4 py-2.5 font-medium w-[100px]">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map(i => (
                  <tr key={i.id} className="hover:bg-muted/30">
                    <td className="px-4 py-2.5 font-mono text-[12px] font-semibold">{i.codigo}</td>
                    <td className="px-2 py-2.5">{i.descricao}</td>
                    <td className="px-2 py-2.5 font-mono text-[12px]">{i.unidade}</td>
                    <td className="px-2 py-2.5 text-right tabular font-mono font-semibold">{fmtBRL(Number(i.preco_unitario))}</td>
                    <td className="px-4 py-2.5 text-right whitespace-nowrap">
                      <button onClick={() => setEditing(i)} className="inline-flex items-center justify-center h-7 w-7 rounded hover:bg-muted text-muted-foreground hover:text-foreground"><Pencil className="h-3.5 w-3.5" /></button>
                      <button onClick={() => setDeleting(i)} className="inline-flex items-center justify-center h-7 w-7 rounded hover:bg-destructive-soft text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && !isLoading && <div className="px-5 py-12 text-center text-sm text-muted-foreground">Nenhum item encontrado.</div>}
          </div>
        </section>
      </div>

      <Dialog open={!!editing} onOpenChange={(open) => { if (!open) setEditing(null); }}>
        {editing && <CadernoDialogContent item={editing} onClose={() => setEditing(null)} />}
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={(open) => { if (!open) setDeleting(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir item?</AlertDialogTitle>
            <AlertDialogDescription>O item <span className="font-mono">{deleting?.codigo}</span> ({deleting?.descricao}) será removido. Lançamentos vinculados serão bloqueados.</AlertDialogDescription>
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

function CadernoDialogContent({ item, onClose }: { item: CadernoEncargo | null; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState<CadernoEncargoInsert>(() => ({
    codigo: item?.codigo ?? "",
    descricao: item?.descricao ?? "",
    unidade: item?.unidade ?? "m",
    preco_unitario: item ? Number(item.preco_unitario) : 0,
  }));

  const mut = useMutation({
    mutationFn: () => upsertCaderno({ ...form, id: item?.id }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["caderno"] }); toast.success(item ? "Item atualizado." : "Item criado."); onClose(); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <DialogContent className="max-w-xl">
      <DialogHeader><DialogTitle>{item ? "Editar item do caderno" : "Novo item do caderno"}</DialogTitle></DialogHeader>
      <form onSubmit={(e) => { e.preventDefault(); mut.mutate(); }} className="grid grid-cols-2 gap-3 py-2">
        <Field label="Código"><Input required value={form.codigo} onChange={e => setForm(f => ({ ...f, codigo: e.target.value }))} /></Field>
        <Field label="Unidade">
          <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.unidade} onChange={e => setForm(f => ({ ...f, unidade: e.target.value }))}>
            <option value="m">m</option><option value="m²">m²</option><option value="m³">m³</option><option value="un">un</option><option value="kg">kg</option><option value="h">h</option>
          </select>
        </Field>
        <Field label="Descrição" full><Input required value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} /></Field>
        <Field label="Preço unitário (R$)" full><Input required type="number" step="0.01" min="0" value={form.preco_unitario} onChange={e => setForm(f => ({ ...f, preco_unitario: Number(e.target.value) }))} /></Field>
        <DialogFooter className="col-span-2 mt-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" disabled={mut.isPending}>{mut.isPending ? "Salvando…" : item ? "Salvar" : "Criar"}</Button>
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

function Kpi({ icon: Icon, label, value, sub, tone = "neutral" }: { icon: typeof BookOpen; label: string; value: string; sub: string; tone?: "neutral" | "accent" }) {
  const iconCls = tone === "accent" ? "bg-accent-soft text-accent" : "bg-secondary text-secondary-foreground";
  return (
    <div className="bg-card border border-border rounded-md p-4 shadow-card">
      <div className={cn("h-9 w-9 rounded flex items-center justify-center mb-3", iconCls)}><Icon className="h-[18px] w-[18px]" /></div>
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono">{label}</div>
      <div className="text-2xl font-semibold tabular tracking-tight mt-0.5">{value}</div>
      <div className="text-[11px] text-muted-foreground mt-1">{sub}</div>
    </div>
  );
}
