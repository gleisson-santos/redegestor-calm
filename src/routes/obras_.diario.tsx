import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { fetchObras, type Obra } from "@/data/api";
import { fetchDiarioByObra, insertDiario, deleteDiario, type DiarioInsert } from "@/data/diario";
import { urs, type URCode } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  ClipboardList, Cloud, CloudRain, Sun, Users, Ruler, Layers, AlertTriangle,
  Plus, Trash2, BookOpen, Filter, ChevronDown, ChevronUp, CheckCircle2,
} from "lucide-react";

export const Route = createFileRoute("/obras_/diario")({
  head: () => ({
    meta: [
      { title: "Diário de Obra — RedeGestor" },
      { name: "description", content: "Registro técnico diário das obras em execução: atividades, materiais, equipe e ocorrências." },
    ],
  }),
  component: DiarioPage,
});

const ATIVIDADES = [
  "escavacao", "assentamento", "soldagem", "reaterro",
  "teste_estanqueidade", "sinalizacao", "outros",
] as const;
const ATIVIDADE_LABEL: Record<string, string> = {
  escavacao: "Escavação",
  assentamento: "Assentamento",
  soldagem: "Soldagem",
  reaterro: "Reaterro",
  teste_estanqueidade: "Teste de estanqueidade",
  sinalizacao: "Sinalização",
  outros: "Outros",
};
const ATIVIDADE_COR: Record<string, string> = {
  escavacao: "bg-amber-100 text-amber-800 border-amber-200",
  assentamento: "bg-sky-100 text-sky-800 border-sky-200",
  soldagem: "bg-orange-100 text-orange-800 border-orange-200",
  reaterro: "bg-stone-100 text-stone-800 border-stone-200",
  teste_estanqueidade: "bg-emerald-100 text-emerald-800 border-emerald-200",
  sinalizacao: "bg-violet-100 text-violet-800 border-violet-200",
  outros: "bg-slate-100 text-slate-800 border-slate-200",
};

const CLIMAS = [
  { v: "ensolarado", l: "Ensolarado", icon: Sun },
  { v: "nublado", l: "Nublado", icon: Cloud },
  { v: "chuvoso", l: "Chuvoso", icon: CloudRain },
];

function fmtData(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

/** Retorna número da semana ISO + ano. */
function semanaDeReferencia(iso: string) {
  const d = new Date(iso + "T00:00:00");
  const dayNum = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - dayNum + 3);
  const firstThursday = new Date(d.getFullYear(), 0, 4);
  const diff = (d.getTime() - firstThursday.getTime()) / 86400000;
  const week = 1 + Math.round((diff - 3 + ((firstThursday.getDay() + 6) % 7)) / 7);
  return `${d.getFullYear()}-W${String(week).padStart(2, "0")}`;
}

function DiarioPage() {
  const qc = useQueryClient();
  const obrasQ = useQuery({ queryKey: ["obras"], queryFn: fetchObras });

  const [urFilter, setUrFilter] = useState<URCode | "TODAS">("TODAS");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const obrasAtivas = useMemo(() => {
    const all = obrasQ.data ?? [];
    return all.filter(o => o.status === "em_execucao" || o.status === "liberada" || o.status === "planejada");
  }, [obrasQ.data]);

  const visiveis = useMemo(() => {
    return urFilter === "TODAS"
      ? obrasAtivas
      : obrasAtivas.filter(o => o.ur === urFilter);
  }, [obrasAtivas, urFilter]);

  const selecionada = useMemo(
    () => (obrasQ.data ?? []).find(o => o.id === selectedId) ?? visiveis[0] ?? null,
    [obrasQ.data, visiveis, selectedId],
  );

  const diarioQ = useQuery({
    queryKey: ["diario", selecionada?.id],
    queryFn: () => fetchDiarioByObra(selecionada!.id),
    enabled: !!selecionada,
  });

  const lancamentos = diarioQ.data ?? [];
  const metragemTotal = lancamentos.reduce((s, l) => s + Number(l.metragem_executada || 0), 0);
  const pctExec = selecionada && selecionada.extensaoM > 0
    ? Math.min(100, (metragemTotal / selecionada.extensaoM) * 100)
    : 0;

  // Agrupa por semana
  const grupos = useMemo(() => {
    const map = new Map<string, typeof lancamentos>();
    for (const l of lancamentos) {
      const k = semanaDeReferencia(l.data_lancamento);
      const arr = map.get(k) ?? [];
      arr.push(l);
      map.set(k, arr);
    }
    return Array.from(map.entries());
  }, [lancamentos]);

  // Detecta dias sem lançamento
  function diasSemLancamento(obra: Obra): number | null {
    // Sem query individual por obra — usa apenas seleção atual; para sidebar, uma heurística simples:
    if (obra.id === selecionada?.id && lancamentos.length > 0) {
      const ultimo = lancamentos[0];
      const dias = Math.floor((Date.now() - new Date(ultimo.data_lancamento + "T00:00:00").getTime()) / 86400000);
      return dias;
    }
    return null;
  }

  return (
    <AppLayout>
      <div className="px-4 lg:px-8 py-6">
        <header className="pb-5 border-b border-border mb-5 flex items-end justify-between gap-3 flex-wrap">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono mb-1">
              Base de Obras · Diário
            </div>
            <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-accent" />
              Diário de Obra
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Registro técnico diário lançado pelo fiscal ou administrativo da obra.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select
              value={urFilter}
              onChange={e => setUrFilter(e.target.value as URCode | "TODAS")}
              className="h-9 rounded border border-input bg-surface text-[13px] px-2"
            >
              <option value="TODAS">Todas as URs</option>
              {urs.map(u => <option key={u.code} value={u.code}>{u.code}</option>)}
            </select>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_340px] gap-4">
          {/* COLUNA 1: lista de obras */}
          <aside className="bg-card border border-border rounded-md shadow-card overflow-hidden flex flex-col max-h-[78vh]">
            <header className="px-4 py-3 border-b border-border">
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono">Obras ativas</div>
              <div className="text-sm font-semibold text-foreground">{visiveis.length} obra(s)</div>
            </header>
            <div className="overflow-y-auto flex-1 p-2 space-y-1">
              {visiveis.length === 0 && (
                <div className="text-center text-[13px] text-muted-foreground py-8">
                  Nenhuma obra em execução nesta UR.
                </div>
              )}
              {visiveis.map(o => {
                const ativa = selecionada?.id === o.id;
                const dias = diasSemLancamento(o);
                const stale = dias !== null && dias > 3;
                return (
                  <button
                    key={o.id}
                    onClick={() => setSelectedId(o.id)}
                    className={cn(
                      "w-full text-left px-3 py-2.5 rounded border transition-colors",
                      ativa
                        ? "bg-accent-soft border-accent/40"
                        : "bg-surface border-border hover:border-border-strong",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="text-[12px] font-mono font-semibold text-foreground">{o.codigo}</div>
                        <div className="text-[12px] truncate text-foreground">{o.logradouro}</div>
                        <div className="text-[11px] text-muted-foreground truncate">{o.bairro} · {o.ur}</div>
                      </div>
                      {stale && (
                        <span className="shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-warning-soft text-warning-foreground border border-warning/30">
                          <AlertTriangle className="h-2.5 w-2.5" />
                          {dias}d
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

          {/* COLUNA 2: timeline */}
          <section className="bg-card border border-border rounded-md shadow-card overflow-hidden flex flex-col max-h-[78vh]">
            {selecionada ? (
              <>
                <header className="px-5 py-4 border-b border-border">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono">
                        {selecionada.codigo} · {selecionada.ur}
                      </div>
                      <h2 className="text-base font-semibold text-foreground">{selecionada.logradouro}</h2>
                      <p className="text-[12px] text-muted-foreground">{selecionada.bairro}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono">Progresso</div>
                      <div className="text-lg font-semibold tabular text-foreground">{pctExec.toFixed(1)}%</div>
                      <div className="text-[10px] text-muted-foreground font-mono">
                        {Math.round(metragemTotal)} / {Math.round(selecionada.extensaoM)} m
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn("h-full transition-all", pctExec >= 100 ? "bg-success" : "bg-accent")}
                      style={{ width: `${pctExec}%` }}
                    />
                  </div>
                  {pctExec >= 100 && selecionada.status !== "concluida" && (
                    <div className="mt-2 inline-flex items-center gap-1.5 text-[11px] text-success font-medium">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Metragem atingida — sugerimos marcar a obra como concluída.
                    </div>
                  )}
                </header>

                <div className="flex-1 overflow-y-auto px-5 py-4">
                  {diarioQ.isLoading && (
                    <div className="text-center text-sm text-muted-foreground py-12">Carregando diário…</div>
                  )}
                  {!diarioQ.isLoading && lancamentos.length === 0 && (
                    <div className="text-center py-16 border border-dashed border-border rounded-md">
                      <ClipboardList className="h-8 w-8 mx-auto mb-2 text-muted-foreground/60" />
                      <div className="text-sm text-muted-foreground">
                        Nenhum lançamento ainda. Use o formulário ao lado para começar.
                      </div>
                    </div>
                  )}

                  {grupos.map(([sem, items]) => {
                    const totalSem = items.reduce((s, l) => s + Number(l.metragem_executada || 0), 0);
                    return (
                      <div key={sem} className="mb-6">
                        <div className="flex items-center justify-between mb-2 pb-1 border-b border-border">
                          <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono">
                            Semana {sem.split("-W")[1]} · {sem.split("-")[0]}
                          </span>
                          <span className="text-[11px] font-mono tabular text-muted-foreground">
                            {items.length} lançamento(s) · {Math.round(totalSem).toLocaleString("pt-BR")} m
                          </span>
                        </div>
                        <div className="space-y-2.5">
                          {items.map(l => (
                            <DiarioCard
                              key={l.id}
                              lancamento={l}
                              onDelete={async () => {
                                if (!confirm("Excluir este lançamento?")) return;
                                try {
                                  await deleteDiario(l.id);
                                  qc.invalidateQueries({ queryKey: ["diario", selecionada.id] });
                                  toast.success("Lançamento removido.");
                                } catch (e) {
                                  toast.error((e as Error).message);
                                }
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground p-8">
                Selecione uma obra à esquerda para ver o diário.
              </div>
            )}
          </section>

          {/* COLUNA 3: novo lançamento */}
          <aside className="lg:max-h-[78vh] lg:overflow-y-auto">
            {selecionada ? (
              <NovoLancamentoForm obra={selecionada} />
            ) : (
              <div className="bg-card border border-dashed border-border rounded-md p-6 text-center text-[13px] text-muted-foreground">
                Selecione uma obra para lançar.
              </div>
            )}
          </aside>
        </div>
      </div>
    </AppLayout>
  );
}

/* -------------------- Card de lançamento -------------------- */

function DiarioCard({ lancamento, onDelete }: { lancamento: import("@/data/diario").DiarioLancamento; onDelete: () => void }) {
  const ClimaIcon = lancamento.clima === "chuvoso" ? CloudRain
                  : lancamento.clima === "nublado" ? Cloud : Sun;
  return (
    <div className="border border-border rounded-md p-3 bg-surface hover:border-border-strong transition-colors">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[12px] font-mono font-semibold text-foreground">
            {fmtData(lancamento.data_lancamento)}
          </span>
          <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-[10.5px] font-medium border", ATIVIDADE_COR[lancamento.atividade] ?? ATIVIDADE_COR.outros)}>
            {ATIVIDADE_LABEL[lancamento.atividade] ?? lancamento.atividade}
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
            <ClimaIcon className="h-3 w-3" />
            {lancamento.clima}
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
            <Users className="h-3 w-3" />
            {lancamento.equipe_tamanho}
          </span>
        </div>
        <button
          onClick={onDelete}
          className="text-muted-foreground hover:text-destructive p-1 rounded"
          title="Excluir lançamento"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-2 text-[11px]">
        <div className="bg-muted/40 rounded px-2 py-1">
          <div className="text-muted-foreground uppercase tracking-wider text-[9.5px] font-mono">Material</div>
          <div className="font-mono font-semibold text-foreground">
            {lancamento.material_tipo}{lancamento.material_dn ? ` · DN${lancamento.material_dn}` : ""}
          </div>
        </div>
        <div className="bg-muted/40 rounded px-2 py-1">
          <div className="text-muted-foreground uppercase tracking-wider text-[9.5px] font-mono">Metragem</div>
          <div className="font-mono font-semibold text-foreground inline-flex items-center gap-1">
            <Ruler className="h-3 w-3 text-accent" />
            {Number(lancamento.metragem_executada).toLocaleString("pt-BR")} m
          </div>
        </div>
        <div className="bg-muted/40 rounded px-2 py-1">
          <div className="text-muted-foreground uppercase tracking-wider text-[9.5px] font-mono">Profundidade</div>
          <div className="font-mono font-semibold text-foreground inline-flex items-center gap-1">
            <Layers className="h-3 w-3 text-muted-foreground" />
            {Number(lancamento.profundidade_media).toFixed(2)} m
          </div>
        </div>
      </div>

      {lancamento.descricao && (
        <p className="text-[12.5px] text-foreground leading-snug mb-1">{lancamento.descricao}</p>
      )}
      {lancamento.ocorrencias && (
        <div className="mt-2 flex items-start gap-1.5 text-[11.5px] text-warning-foreground bg-warning-soft border border-warning/30 rounded px-2 py-1.5">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <span>{lancamento.ocorrencias}</span>
        </div>
      )}
      <div className="mt-2 text-[10px] text-muted-foreground font-mono">
        Por {lancamento.autor || "—"}
      </div>
    </div>
  );
}

/* -------------------- Formulário -------------------- */

function NovoLancamentoForm({ obra }: { obra: Obra }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(true);
  const [form, setForm] = useState<DiarioInsert>(() => ({
    obra_id: obra.id,
    data_lancamento: new Date().toISOString().slice(0, 10),
    autor: "",
    clima: "ensolarado",
    equipe_tamanho: 4,
    atividade: "assentamento",
    material_tipo: obra.material,
    material_dn: obra.dn || null,
    metragem_executada: 0,
    profundidade_media: 1.2,
    descricao: "",
    ocorrencias: "",
  }));

  // Sincroniza obra selecionada
  useMemo(() => {
    setForm(f => ({
      ...f,
      obra_id: obra.id,
      material_tipo: obra.material,
      material_dn: obra.dn || null,
    }));
  }, [obra.id, obra.material, obra.dn]);

  const mut = useMutation({
    mutationFn: () => insertDiario({
      ...form,
      ocorrencias: form.ocorrencias || null,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["diario", obra.id] });
      qc.invalidateQueries({ queryKey: ["diario"] });
      toast.success("Lançamento registrado.");
      setForm(f => ({ ...f, descricao: "", ocorrencias: "", metragem_executada: 0 }));
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="bg-card border border-border rounded-md shadow-card">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 border-b border-border"
      >
        <div className="flex items-center gap-2">
          <Plus className="h-4 w-4 text-accent" />
          <span className="text-sm font-semibold text-foreground">Novo lançamento</span>
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>

      {open && (
        <form
          onSubmit={(e) => { e.preventDefault(); mut.mutate(); }}
          className="p-4 space-y-3"
        >
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-[11px]">Data</Label>
              <Input
                type="date"
                value={form.data_lancamento}
                onChange={e => setForm(f => ({ ...f, data_lancamento: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label className="text-[11px]">Equipe</Label>
              <Input
                type="number" min={0}
                value={form.equipe_tamanho}
                onChange={e => setForm(f => ({ ...f, equipe_tamanho: Number(e.target.value) }))}
              />
            </div>
          </div>

          <div>
            <Label className="text-[11px]">Autor / fiscal</Label>
            <Input
              value={form.autor}
              onChange={e => setForm(f => ({ ...f, autor: e.target.value }))}
              placeholder="Nome do responsável"
            />
          </div>

          <div>
            <Label className="text-[11px]">Clima</Label>
            <div className="grid grid-cols-3 gap-1.5 mt-1">
              {CLIMAS.map(c => (
                <button
                  type="button"
                  key={c.v}
                  onClick={() => setForm(f => ({ ...f, clima: c.v }))}
                  className={cn(
                    "flex flex-col items-center gap-0.5 px-2 py-1.5 rounded border text-[11px]",
                    form.clima === c.v
                      ? "bg-accent-soft border-accent/40 text-accent"
                      : "bg-surface border-border text-muted-foreground hover:border-border-strong",
                  )}
                >
                  <c.icon className="h-3.5 w-3.5" />
                  {c.l}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-[11px]">Atividade</Label>
            <select
              className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
              value={form.atividade}
              onChange={e => setForm(f => ({ ...f, atividade: e.target.value }))}
            >
              {ATIVIDADES.map(a => (
                <option key={a} value={a}>{ATIVIDADE_LABEL[a]}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-[11px]">Material</Label>
              <select
                className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                value={form.material_tipo}
                onChange={e => setForm(f => ({ ...f, material_tipo: e.target.value }))}
              >
                <option value="DEFOFO">DEFOFO</option>
                <option value="PEAD">PEAD</option>
                <option value="FOFO">FOFO</option>
                <option value="OUTRO">OUTRO</option>
              </select>
            </div>
            <div>
              <Label className="text-[11px]">DN (mm)</Label>
              <Input
                type="number"
                value={form.material_dn ?? ""}
                onChange={e => setForm(f => ({ ...f, material_dn: e.target.value ? Number(e.target.value) : null }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-[11px]">Metragem (m)</Label>
              <Input
                type="number" step="0.01" min={0}
                value={form.metragem_executada}
                onChange={e => setForm(f => ({ ...f, metragem_executada: Number(e.target.value) }))}
                required
              />
            </div>
            <div>
              <Label className="text-[11px]">Profundidade (m)</Label>
              <Input
                type="number" step="0.01" min={0}
                value={form.profundidade_media}
                onChange={e => setForm(f => ({ ...f, profundidade_media: Number(e.target.value) }))}
              />
            </div>
          </div>

          <div>
            <Label className="text-[11px]">Descrição técnica</Label>
            <Textarea
              rows={2}
              value={form.descricao}
              onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
              placeholder="Detalhes do que foi executado…"
            />
          </div>

          <div>
            <Label className="text-[11px]">Ocorrências (opcional)</Label>
            <Textarea
              rows={2}
              value={form.ocorrencias ?? ""}
              onChange={e => setForm(f => ({ ...f, ocorrencias: e.target.value }))}
              placeholder="Imprevistos, paralisações, retrabalhos…"
            />
          </div>

          <Button type="submit" disabled={mut.isPending} className="w-full gap-2">
            <Plus className="h-4 w-4" />
            {mut.isPending ? "Salvando…" : "Salvar lançamento"}
          </Button>
        </form>
      )}
    </div>
  );
}
