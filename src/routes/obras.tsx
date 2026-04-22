import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { Pager } from "@/components/Pager";
import {
  StatusBadge, MaterialBadge, AlvaraBadge, PrioridadeBadge, FinalidadeBadge,
} from "@/components/StatusBadge";
import { fetchObras, deleteObra, upsertObra, patchObra, marcarServicoExecutado, type Obra, type ObraInsert } from "@/data/api";
import { urs, URCode, MaterialTipo, statusObraLabels, type StatusObra } from "@/data/mockData";
import { Download, Search, Filter, Plus, Pencil, Trash2, MessageSquare, Check, X as XIcon, CalendarDays, CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState, useRef, useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";

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
  const qc = useQueryClient();
  const { data: obras = [], isLoading } = useQuery({ queryKey: ["obras"], queryFn: fetchObras });

  const [query, setQuery] = useState("");
  const [urFilter, setUrFilter] = useState<URCode | "TODAS">("TODAS");
  const [matFilter, setMatFilter] = useState<MaterialTipo | "TODOS">("TODOS");
  const [statusFilter, setStatusFilter] = useState<StatusObra | "TODOS">("TODOS");
  const [monthFilter, setMonthFilter] = useState<string | null>(null); // "YYYY-MM"
  const [sort, setSort] = useState<SortKey>("prioridade");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;
  const [editing, setEditing] = useState<Obra | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Obra | null>(null);

  const delMut = useMutation({
    mutationFn: (id: string) => deleteObra(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["obras"] }); toast.success("Obra excluída."); setDeleting(null); },
    onError: (e: Error) => toast.error(e.message),
  });

  const execMut = useMutation({
    mutationFn: (id: string) => marcarServicoExecutado(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["obras"] }); toast.success("Obra marcada como executada."); },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = useMemo(() => {
    let r: Obra[] = obras.filter(o => {
      const q = query.trim().toLowerCase();
      if (q && !`${o.codigo} ${o.logradouro} ${o.bairro}`.toLowerCase().includes(q)) return false;
      if (urFilter !== "TODAS" && o.ur !== urFilter) return false;
      if (matFilter !== "TODOS" && o.material !== matFilter) return false;
      if (statusFilter !== "TODOS" && o.status !== statusFilter) return false;
      if (monthFilter) {
        const d = o.dataTermino ?? o.dataInicio;
        if (!d || !d.startsWith(monthFilter)) return false;
      }
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
  }, [obras, query, urFilter, matFilter, statusFilter, monthFilter, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = useMemo(
    () => filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [filtered, currentPage],
  );

  // Reset para página 1 quando filtros mudam
  useEffect(() => { setPage(1); }, [query, urFilter, matFilter, sort]);

  const exportCSV = () => {
    const headers = ["Prioridade", "UR", "Bairro", "Logradouro", "Finalidade", "DN", "Extensão (m)", "Material", "Alvará Necessário", "Alvará Liberado"];
    const rows = filtered.map(o => [o.prioridade, o.ur, o.bairro, o.logradouro, o.finalidade, o.dn, o.extensaoM, o.material, o.alvaraNecessario ? "Sim" : "Não", o.alvaraLiberado === null ? "N/A" : o.alvaraLiberado ? "Sim" : "Não"]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `obras_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  return (
    <AppLayout>
      <div className="px-4 lg:px-8 py-6">
        <header className="pb-5 border-b border-border mb-5 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono mb-1">Frentes de serviço</div>
            <h1 className="text-2xl font-semibold tracking-tight">Base de Obras</h1>
            <p className="text-sm text-muted-foreground mt-1">{filtered.length} de {obras.length} registros · ordenado por {labelSort(sort)}.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={exportCSV} variant="outline" size="sm" className="gap-2"><Download className="h-4 w-4" /> Exportar CSV</Button>
            <Dialog open={creating} onOpenChange={setCreating}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2"><Plus className="h-4 w-4" /> Nova obra</Button>
              </DialogTrigger>
              <ObraDialogContent obra={null} onClose={() => setCreating(false)} />
            </Dialog>
          </div>
        </header>

        <div className="bg-card border border-border rounded-md shadow-card p-3 mb-4 flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Buscar logradouro, bairro ou código…"
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
                  <th className="text-left px-2 py-2.5 font-medium">UR</th>
                  <th className="text-left px-2 py-2.5 font-medium">Logradouro</th>
                  <th className="text-left px-2 py-2.5 font-medium">Finalidade</th>
                  <th className="text-left px-2 py-2.5 font-medium">Mat.</th>
                  <th className="text-right px-2 py-2.5 font-medium">DN</th>
                  <th className="text-right px-2 py-2.5 font-medium">Extensão</th>
                  <th className="text-left px-2 py-2.5 font-medium">Período</th>
                  <th className="text-left px-2 py-2.5 font-medium">Status</th>
                  <th className="text-left px-2 py-2.5 font-medium">Alvará</th>
                  <th className="text-center px-2 py-2.5 font-medium">Obs</th>
                  <th className="text-right px-3 py-2.5 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paged.map(o => (
                  <tr key={o.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-3 py-2.5"><PrioridadeBadge prioridade={o.prioridade} /></td>
                    <td className="px-2 py-2.5 font-mono text-[12px] font-semibold">{o.ur}</td>
                    <td className="px-2 py-2.5">
                      <div className="font-medium truncate max-w-[280px]">{o.logradouro}</div>
                      <div className="text-[11px] text-muted-foreground">{o.bairro}</div>
                    </td>
                    <td className="px-2 py-2.5"><FinalidadeBadge finalidade={o.finalidade} /></td>
                    <td className="px-2 py-2.5"><MaterialBadge tipo={o.material} /></td>
                    <td className="px-2 py-2.5 text-right tabular font-mono">{o.dn || "—"}</td>
                    <td className="px-2 py-2.5 text-right"><InlineExtensao obra={o} /></td>
                    <td className="px-2 py-2.5"><PeriodoCell obra={o} /></td>
                    <td className="px-2 py-2.5"><StatusBadge status={o.status} /></td>
                    <td className="px-2 py-2.5"><AlvaraBadge status={o.alvaraStatus} /></td>
                    <td className="px-2 py-2.5 text-center"><ObsCell obra={o} /></td>
                    <td className="px-3 py-2.5 text-right whitespace-nowrap">
                      {o.status !== "concluida" && (
                        <button
                          onClick={() => execMut.mutate(o.id)}
                          disabled={execMut.isPending}
                          className="inline-flex items-center justify-center h-7 w-7 rounded hover:bg-success-soft text-muted-foreground hover:text-success disabled:opacity-50"
                          title="Marcar serviço como executado (define término = hoje)"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button onClick={() => setEditing(o)} className="inline-flex items-center justify-center h-7 w-7 rounded hover:bg-muted text-muted-foreground hover:text-foreground" title="Editar">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => setDeleting(o)} className="inline-flex items-center justify-center h-7 w-7 rounded hover:bg-destructive-soft text-muted-foreground hover:text-destructive" title="Excluir">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && !isLoading && (
              <div className="px-5 py-12 text-center text-sm text-muted-foreground inline-flex items-center justify-center gap-2 w-full">
                <Filter className="h-4 w-4" /> Nenhuma obra corresponde aos filtros aplicados.
              </div>
            )}
            {isLoading && <div className="px-5 py-12 text-center text-sm text-muted-foreground">Carregando obras…</div>}
          </div>
          {filtered.length > 0 && (
            <Pager page={currentPage} totalPages={totalPages} total={filtered.length} pageSize={PAGE_SIZE} onChange={setPage} />
          )}
        </div>
      </div>

      {/* Edit dialog */}
      <Dialog open={!!editing} onOpenChange={(open) => { if (!open) setEditing(null); }}>
        {editing && <ObraDialogContent obra={editing} onClose={() => setEditing(null)} />}
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleting} onOpenChange={(open) => { if (!open) setDeleting(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir obra?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A obra <span className="font-medium">{deleting?.logradouro}</span> ({deleting?.bairro}) será removida permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleting && delMut.mutate(deleting.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}

function ObraDialogContent({ obra, onClose }: { obra: Obra | null; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState<ObraInsert & { data_inicio?: string | null; data_termino?: string | null; observacoes?: string | null }>(() => ({
    prioridade: obra?.prioridade ?? 99,
    ur: obra?.ur ?? "UMF",
    bairro: obra?.bairro ?? "",
    logradouro: obra?.logradouro ?? "",
    finalidade: obra?.finalidade ?? "extensao",
    dn: obra?.dn || null,
    extensao: obra?.extensaoM ?? 0,
    material: obra?.material ?? "DEFOFO",
    alvara_necessario: obra?.alvaraNecessario ?? false,
    alvara_liberado: obra?.alvaraLiberado ?? null,
    status: obra?.rawStatus ?? "pendente",
    data_inicio: obra?.dataInicio ?? null,
    data_termino: obra?.dataTermino ?? null,
    observacoes: obra?.observacoes ?? null,
  }));

  const mut = useMutation({
    mutationFn: () => upsertObra({ ...form, id: obra?.id }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["obras"] });
      toast.success(obra ? "Obra atualizada." : "Obra criada.");
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>{obra ? "Editar obra" : "Nova obra"}</DialogTitle>
      </DialogHeader>
      <form onSubmit={(e) => { e.preventDefault(); mut.mutate(); }} className="grid grid-cols-2 gap-3 py-2">
        <Field label="Prioridade">
          <Input type="number" min={1} max={99} value={form.prioridade} onChange={e => setForm(f => ({ ...f, prioridade: Number(e.target.value) }))} />
        </Field>
        <Field label="UR">
          <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.ur} onChange={e => setForm(f => ({ ...f, ur: e.target.value }))}>
            {urs.map(u => <option key={u.code} value={u.code}>{u.code}</option>)}
          </select>
        </Field>
        <Field label="Bairro" full>
          <Input required value={form.bairro} onChange={e => setForm(f => ({ ...f, bairro: e.target.value }))} />
        </Field>
        <Field label="Logradouro" full>
          <Input required value={form.logradouro} onChange={e => setForm(f => ({ ...f, logradouro: e.target.value }))} />
        </Field>
        <Field label="Finalidade">
          <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.finalidade ?? "extensao"} onChange={e => setForm(f => ({ ...f, finalidade: e.target.value }))}>
            <option value="extensao">Extensão</option>
            <option value="substituicao">Substituição</option>
            <option value="extensao_substituicao">Extensão / Substituição</option>
          </select>
        </Field>
        <Field label="Material">
          <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.material} onChange={e => setForm(f => ({ ...f, material: e.target.value }))}>
            <option value="DEFOFO">DEFOFO</option>
            <option value="PEAD">PEAD</option>
            <option value="FOFO">FOFO</option>
            <option value="OUTRO">Outro</option>
          </select>
        </Field>
        <Field label="DN (mm)">
          <Input type="number" value={form.dn ?? ""} onChange={e => setForm(f => ({ ...f, dn: e.target.value ? Number(e.target.value) : null }))} />
        </Field>
        <Field label="Extensão (m)">
          <Input type="number" step="0.01" value={form.extensao} onChange={e => setForm(f => ({ ...f, extensao: Number(e.target.value) }))} />
        </Field>
        <Field label="Alvará necessário?">
          <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.alvara_necessario ? "sim" : "nao"} onChange={e => setForm(f => ({ ...f, alvara_necessario: e.target.value === "sim", alvara_liberado: e.target.value === "sim" ? f.alvara_liberado : null }))}>
            <option value="nao">Não</option>
            <option value="sim">Sim</option>
          </select>
        </Field>
        <Field label="Alvará liberado?">
          <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" disabled={!form.alvara_necessario}
            value={form.alvara_liberado === null ? "" : form.alvara_liberado ? "sim" : "nao"}
            onChange={e => setForm(f => ({ ...f, alvara_liberado: e.target.value === "" ? null : e.target.value === "sim" }))}>
            <option value="">N/A</option>
            <option value="sim">Sim</option>
            <option value="nao">Não</option>
          </select>
        </Field>
        <Field label="Início previsto">
          <Input type="date" value={form.data_inicio ?? ""} onChange={e => setForm(f => ({ ...f, data_inicio: e.target.value || null }))} />
        </Field>
        <Field label="Término previsto">
          <Input type="date" value={form.data_termino ?? ""} onChange={e => setForm(f => ({ ...f, data_termino: e.target.value || null }))} />
        </Field>
        <Field label="Observações do gestor" full>
          <Textarea rows={3} placeholder="Anotações legais, restrições, contatos com órgãos…"
            value={form.observacoes ?? ""} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value || null }))} />
        </Field>
        <DialogFooter className="col-span-2 mt-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" disabled={mut.isPending}>{mut.isPending ? "Salvando…" : obra ? "Salvar alterações" : "Criar obra"}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

/* ---------- Edição inline da extensão ---------- */
function InlineExtensao({ obra }: { obra: Obra }) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState<string>(String(obra.extensaoM));
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { if (editing) inputRef.current?.select(); }, [editing]);

  const mut = useMutation({
    mutationFn: (n: number) => patchObra(obra.id, { extensao: n }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["obras"] }); toast.success("Extensão atualizada."); setEditing(false); },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!editing) {
    return (
      <button onClick={() => { setVal(String(obra.extensaoM)); setEditing(true); }}
        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-muted tabular font-mono font-semibold text-right group">
        <span>{obra.extensaoM.toLocaleString("pt-BR")} m</span>
        <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-60" />
      </button>
    );
  }
  return (
    <span className="inline-flex items-center gap-1">
      <input ref={inputRef} type="number" step="0.01" value={val} onChange={e => setVal(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") mut.mutate(Number(val)); if (e.key === "Escape") setEditing(false); }}
        className="w-20 h-7 px-1.5 text-right tabular font-mono text-[12px] rounded border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring/30" />
      <button onClick={() => mut.mutate(Number(val))} className="h-6 w-6 inline-flex items-center justify-center rounded bg-success-soft text-success hover:bg-success/20" title="Salvar"><Check className="h-3 w-3" /></button>
      <button onClick={() => setEditing(false)} className="h-6 w-6 inline-flex items-center justify-center rounded hover:bg-muted text-muted-foreground" title="Cancelar"><XIcon className="h-3 w-3" /></button>
    </span>
  );
}

/* ---------- Período (datas) ---------- */
function PeriodoCell({ obra }: { obra: Obra }) {
  const fmt = (d: string | null) => d ? new Date(d + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" }) : null;
  const ini = fmt(obra.dataInicio);
  const fim = fmt(obra.dataTermino);
  if (!ini && !fim) return <span className="text-[11px] text-muted-foreground inline-flex items-center gap-1"><CalendarDays className="h-3 w-3" />—</span>;
  return (
    <div className="text-[11px] font-mono leading-tight">
      <div className="text-foreground">{ini ?? "—"}</div>
      <div className="text-muted-foreground">→ {fim ?? "—"}</div>
    </div>
  );
}

/* ---------- Observação rápida (popover) ---------- */
function ObsCell({ obra }: { obra: Obra }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(obra.observacoes ?? "");
  useEffect(() => { setText(obra.observacoes ?? ""); }, [obra.observacoes]);
  const mut = useMutation({
    mutationFn: () => patchObra(obra.id, { observacoes: text || null }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["obras"] }); toast.success("Observação salva."); setOpen(false); },
    onError: (e: Error) => toast.error(e.message),
  });
  const has = !!obra.observacoes && obra.observacoes.trim().length > 0;
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className={cn("inline-flex items-center justify-center h-7 w-7 rounded transition-colors",
          has ? "bg-info-soft text-info hover:bg-info/20" : "text-muted-foreground hover:bg-muted")}
          title={has ? obra.observacoes! : "Adicionar observação"}>
          <MessageSquare className="h-3.5 w-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-3" align="end">
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono mb-2">Observações do gestor</div>
        <Textarea rows={4} placeholder="Anotações legais, contatos, pendências…" value={text} onChange={e => setText(e.target.value)} />
        <div className="flex justify-end gap-2 mt-2">
          <Button size="sm" variant="ghost" onClick={() => { setText(obra.observacoes ?? ""); setOpen(false); }}>Cancelar</Button>
          <Button size="sm" onClick={() => mut.mutate()} disabled={mut.isPending}>{mut.isPending ? "Salvando…" : "Salvar"}</Button>
        </div>
      </PopoverContent>
    </Popover>
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

function Select({ label, value, onChange, children }: { label: string; value: string; onChange: (v: string) => void; children: React.ReactNode }) {
  return (
    <label className="inline-flex items-center gap-2 h-9 px-2 rounded border border-input bg-surface text-[12px]">
      <span className="text-muted-foreground font-mono uppercase tracking-wider text-[10px]">{label}</span>
      <select value={value} onChange={e => onChange(e.target.value)} className="bg-transparent text-[13px] focus:outline-none cursor-pointer pr-1">
        {children}
      </select>
    </label>
  );
}

function labelSort(s: SortKey): string {
  return ({ prioridade: "prioridade", extensaoM: "extensão", dn: "diâmetro", ur: "UR" } as const)[s];
}
