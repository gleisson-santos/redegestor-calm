import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { fetchObras } from "@/data/api";
import {
  fetchCaderno,
  fetchExecucoes,
  insertExecucao,
  deleteExecucao,
  currentMesReferencia,
  type ExecucaoServicoInsert,
} from "@/data/encargos";
import { ClipboardList, Plus, Trash2, Search, DollarSign } from "lucide-react";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/encargos/lancamentos")({
  head: () => ({
    meta: [
      { title: "Lançamento de Serviços — RedeGestor" },
      { name: "description", content: "Registro de serviços executados por obra para medição." },
    ],
  }),
  component: LancamentosPage,
});

const fmtBRL = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function LancamentosPage() {
  const qc = useQueryClient();
  const { data: obras = [] } = useQuery({ queryKey: ["obras"], queryFn: fetchObras });
  const { data: itens = [] } = useQuery({ queryKey: ["caderno"], queryFn: fetchCaderno });
  const { data: execs = [] } = useQuery({ queryKey: ["execucoes"], queryFn: fetchExecucoes });

  const [obraId, setObraId] = useState<string>("");
  const [obraSearch, setObraSearch] = useState("");
  const [itemId, setItemId] = useState<string>("");
  const [quantidade, setQuantidade] = useState<number>(0);
  const [dataExec, setDataExec] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [mesRef, setMesRef] = useState<string>(currentMesReferencia());

  const obraSelecionada = obras.find(o => o.id === obraId);
  const itemSelecionado = itens.find(i => i.id === itemId);

  const obraOptions = useMemo(() => {
    const q = obraSearch.trim().toLowerCase();
    return obras
      .filter(o => !q || `${o.bairro} ${o.logradouro} ${o.ur} ${o.codigo}`.toLowerCase().includes(q))
      .slice(0, 50);
  }, [obras, obraSearch]);

  const insertMut = useMutation({
    mutationFn: (v: ExecucaoServicoInsert) => insertExecucao(v),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["execucoes"] });
      toast.success("Serviço lançado.");
      setItemId(""); setQuantidade(0);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const delMut = useMutation({
    mutationFn: (id: string) => deleteExecucao(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["execucoes"] }); toast.success("Lançamento removido."); },
    onError: (e: Error) => toast.error(e.message),
  });

  const lancamentosObra = useMemo(() => {
    if (!obraId) return [];
    return execs.filter(e => e.obra_id === obraId);
  }, [execs, obraId]);

  const itensMap = useMemo(() => new Map(itens.map(i => [i.id, i])), [itens]);
  const totalObra = lancamentosObra.reduce((s, e) => {
    const it = itensMap.get(e.item_encargo_id);
    return s + Number(e.quantidade) * Number(it?.preco_unitario ?? 0);
  }, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!obraId) return toast.error("Selecione uma obra.");
    if (!itemId) return toast.error("Selecione um item do caderno.");
    if (quantidade <= 0) return toast.error("Informe uma quantidade válida.");
    insertMut.mutate({
      obra_id: obraId,
      item_encargo_id: itemId,
      quantidade,
      data_execucao: dataExec,
      mes_referencia: mesRef,
    });
  };

  return (
    <AppLayout>
      <div className="px-4 lg:px-8 py-6 max-w-[1400px] mx-auto">
        <header className="pb-5 border-b border-border mb-5">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono mb-1">Caderno de Encargos</div>
          <h1 className="text-2xl font-semibold tracking-tight">Lançamento de Serviços</h1>
          <p className="text-sm text-muted-foreground mt-1">Registre os serviços executados em cada obra para compor a medição mensal.</p>
        </header>

        {/* Seletor de obra */}
        <section className="bg-card border border-border rounded-md shadow-card p-4 mb-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            <div className="lg:col-span-2">
              <Label className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono">Buscar obra</Label>
              <div className="relative mt-1.5">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input value={obraSearch} onChange={e => setObraSearch(e.target.value)} placeholder="Bairro, logradouro, UR…"
                  className="w-full h-10 pl-8 pr-3 rounded border border-input bg-surface text-[13px] focus:outline-none focus:ring-2 focus:ring-ring/30" />
              </div>
            </div>
            <div>
              <Label className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono">Obra selecionada</Label>
              <select value={obraId} onChange={e => setObraId(e.target.value)}
                className="mt-1.5 h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                <option value="">— escolha —</option>
                {obraOptions.map(o => (
                  <option key={o.id} value={o.id}>{o.ur} · {o.bairro} — {o.logradouro}</option>
                ))}
              </select>
            </div>
          </div>
          {obraSelecionada && (
            <div className="mt-3 pt-3 border-t border-border grid grid-cols-2 lg:grid-cols-4 gap-3 text-[12px]">
              <Info label="UR" value={obraSelecionada.ur} mono />
              <Info label="Bairro" value={obraSelecionada.bairro} />
              <Info label="Logradouro" value={obraSelecionada.logradouro} />
              <Info label="Material / DN" value={`${obraSelecionada.material} / ${obraSelecionada.dn || "—"}`} mono />
            </div>
          )}
        </section>

        {/* Form de lançamento */}
        {obraId && (
          <section className="bg-card border border-border rounded-md shadow-card p-4 mb-4">
            <h2 className="text-sm font-semibold mb-3 flex items-center gap-2"><Plus className="h-4 w-4 text-accent" /> Novo lançamento</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-end">
              <div className="lg:col-span-5">
                <Label className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono">Item do caderno</Label>
                <select required value={itemId} onChange={e => setItemId(e.target.value)}
                  className="mt-1.5 h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                  <option value="">— escolha um serviço —</option>
                  {itens.map(i => (
                    <option key={i.id} value={i.id}>{i.codigo} · {i.descricao} ({i.unidade})</option>
                  ))}
                </select>
              </div>
              <div className="lg:col-span-2">
                <Label className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono">Quantidade {itemSelecionado && `(${itemSelecionado.unidade})`}</Label>
                <Input type="number" step="0.01" min="0" value={quantidade} onChange={e => setQuantidade(Number(e.target.value))} />
              </div>
              <div className="lg:col-span-2">
                <Label className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono">Data execução</Label>
                <Input type="date" value={dataExec} onChange={e => setDataExec(e.target.value)} />
              </div>
              <div className="lg:col-span-2">
                <Label className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono">Mês referência</Label>
                <Input type="month" value={mesRef} onChange={e => setMesRef(e.target.value)} />
              </div>
              <div className="lg:col-span-1">
                <Button type="submit" disabled={insertMut.isPending} className="w-full h-10">
                  {insertMut.isPending ? "…" : "Lançar"}
                </Button>
              </div>
            </form>
            {itemSelecionado && quantidade > 0 && (
              <div className="mt-3 pt-3 border-t border-border text-[12px] text-muted-foreground flex items-center gap-2">
                <DollarSign className="h-3.5 w-3.5 text-accent" />
                Subtotal previsto: <span className="font-mono font-semibold text-foreground">{fmtBRL(quantidade * Number(itemSelecionado.preco_unitario))}</span>
                <span className="text-[11px]">({quantidade} × {fmtBRL(Number(itemSelecionado.preco_unitario))})</span>
              </div>
            )}
          </section>
        )}

        {/* Tabela de lançamentos da obra */}
        {obraId && (
          <section className="bg-card border border-border rounded-md shadow-card">
            <header className="px-5 py-3.5 border-b border-border flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold flex items-center gap-2"><ClipboardList className="h-4 w-4" /> Serviços lançados nesta obra</h2>
                <p className="text-[12px] text-muted-foreground mt-0.5">{lancamentosObra.length} lançamentos</p>
              </div>
              <div className="text-right">
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono">Total acumulado</div>
                <div className="text-lg font-semibold font-mono tabular text-accent">{fmtBRL(totalObra)}</div>
              </div>
            </header>
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead className="bg-muted/50 text-[11px] uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="text-left px-4 py-2.5 font-medium">Item</th>
                    <th className="text-left px-2 py-2.5 font-medium">Descrição</th>
                    <th className="text-right px-2 py-2.5 font-medium">Quantidade</th>
                    <th className="text-right px-2 py-2.5 font-medium">Preço Unit.</th>
                    <th className="text-right px-2 py-2.5 font-medium">Subtotal</th>
                    <th className="text-left px-2 py-2.5 font-medium">Data</th>
                    <th className="text-left px-2 py-2.5 font-medium">Mês ref.</th>
                    <th className="text-right px-4 py-2.5 font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {lancamentosObra.map(e => {
                    const it = itensMap.get(e.item_encargo_id);
                    const sub = Number(e.quantidade) * Number(it?.preco_unitario ?? 0);
                    return (
                      <tr key={e.id} className="hover:bg-muted/30">
                        <td className="px-4 py-2.5 font-mono text-[12px] font-semibold">{it?.codigo ?? "—"}</td>
                        <td className="px-2 py-2.5 truncate max-w-[280px]">{it?.descricao ?? "(item removido)"}</td>
                        <td className="px-2 py-2.5 text-right tabular font-mono">{Number(e.quantidade).toLocaleString("pt-BR")} {it?.unidade}</td>
                        <td className="px-2 py-2.5 text-right tabular font-mono text-muted-foreground">{fmtBRL(Number(it?.preco_unitario ?? 0))}</td>
                        <td className="px-2 py-2.5 text-right tabular font-mono font-semibold text-accent">{fmtBRL(sub)}</td>
                        <td className="px-2 py-2.5 font-mono text-[12px]">{e.data_execucao}</td>
                        <td className="px-2 py-2.5 font-mono text-[12px]">{e.mes_referencia}</td>
                        <td className="px-4 py-2.5 text-right">
                          <button onClick={() => delMut.mutate(e.id)} className="inline-flex items-center justify-center h-7 w-7 rounded hover:bg-destructive-soft text-muted-foreground hover:text-destructive">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {lancamentosObra.length === 0 && (
                <div className="px-5 py-12 text-center text-sm text-muted-foreground">Nenhum serviço lançado para esta obra.</div>
              )}
            </div>
          </section>
        )}

        {!obraId && (
          <div className="bg-card border border-dashed border-border rounded-md p-12 text-center text-sm text-muted-foreground">
            Selecione uma obra acima para começar a lançar serviços.
          </div>
        )}
      </div>
    </AppLayout>
  );
}

function Info({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">{label}</div>
      <div className={cn("text-[13px] font-medium mt-0.5", mono && "font-mono")}>{value}</div>
    </div>
  );
}
