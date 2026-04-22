import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState, lazy, Suspense } from "react";
import { ChevronDown, ChevronRight, DollarSign, HardHat, FileText, Download, FileSpreadsheet, Eye, X as XIcon } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fetchMedicoes, fetchMedicaoDetalhe, fetchObrasAtivasNoMes, currentMesReferencia, MedicaoMensal, ObraDetalhe } from "@/data/encargos";
import { urs, URCode } from "@/data/mockData";
import { cn } from "@/lib/utils";

// Lazy: recharts e jspdf só baixam quando entrar em /encargos/relatorios.
const RelatoriosCharts = lazy(() => import("./-relatorios-charts"));
const loadPdf = () => import("./-relatorios-pdf");

export const Route = createFileRoute("/encargos/relatorios")({
  head: () => ({
    meta: [
      { title: "Relatórios de Medição — RedeGestor" },
      { name: "description", content: "Dashboard financeiro e drill-down das medições mensais por UR." },
    ],
  }),
  component: RelatoriosPage,
});

const fmtBRL = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtNum = (n: number) => n.toLocaleString("pt-BR", { maximumFractionDigits: 2 });

const PIE_COLORS = ["hsl(var(--accent))", "hsl(var(--primary))", "hsl(var(--warning))", "hsl(var(--success))"];

const statusTone: Record<string, string> = {
  Pendente: "bg-warning-soft text-warning-foreground border-warning/20",
  Medido: "bg-secondary text-secondary-foreground border-border",
  Aprovado: "bg-success-soft text-success border-success/20",
};

function RelatoriosPage() {
  const { data: medicoes = [], isLoading } = useQuery({ queryKey: ["medicoes"], queryFn: fetchMedicoes });

  const [urFilter, setUrFilter] = useState<URCode | "TODAS">("TODAS");
  const [mesFilter, setMesFilter] = useState<string>(currentMesReferencia());
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [sortKey, setSortKey] = useState<keyof MedicaoMensal>("mes_referencia");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [drill, setDrill] = useState<MedicaoMensal | null>(null);

  const { data: obrasAtivas = 0 } = useQuery({
    queryKey: ["obras-ativas", mesFilter, urFilter],
    queryFn: () => fetchObrasAtivasNoMes(mesFilter, urFilter === "TODAS" ? undefined : urFilter),
    enabled: !!mesFilter,
  });

  // ---------- Filtragem + ordenação + paginação ----------
  const filtered = useMemo(() => {
    const list = medicoes.filter(m => {
      if (urFilter !== "TODAS" && m.ur !== urFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!m.ur.toLowerCase().includes(q) && !m.mes_referencia.includes(q) && !m.status.toLowerCase().includes(q)) return false;
      }
      return true;
    });
    list.sort((a, b) => {
      const av = a[sortKey] as string | number;
      const bv = b[sortKey] as string | number;
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return list;
  }, [medicoes, urFilter, search, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  // ---------- KPIs ----------
  const valorTotalMes = useMemo(
    () => medicoes
      .filter(m => m.mes_referencia === mesFilter && (urFilter === "TODAS" || m.ur === urFilter))
      .reduce((s, m) => s + Number(m.valor_total), 0),
    [medicoes, mesFilter, urFilter]
  );

  // ---------- Gráficos ----------
  // Evolução últimos 12 meses
  const evolucao = useMemo(() => {
    const months: { mes: string; label: string }[] = [];
    const base = mesFilter ? new Date(mesFilter + "-01") : new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(base.getFullYear(), base.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      months.push({ mes: key, label: d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }) });
    }
    return months.map(m => {
      const valor = medicoes
        .filter(med => med.mes_referencia === m.mes && (urFilter === "TODAS" || med.ur === urFilter))
        .reduce((s, med) => s + Number(med.valor_total), 0);
      return { ...m, valor };
    });
  }, [medicoes, mesFilter, urFilter]);

  // Comparativo de medições mensais por UR (últimos 12 meses, barras agrupadas)
  const comparativoUR = useMemo(() => {
    const months: { mes: string; label: string }[] = [];
    const base = mesFilter ? new Date(mesFilter + "-01") : new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(base.getFullYear(), base.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      months.push({ mes: key, label: d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }) });
    }
    const urCodes = urFilter === "TODAS" ? urs.map(u => u.code) : [urFilter];
    return months.map(m => {
      const row: Record<string, string | number> = { mes: m.mes, label: m.label };
      urCodes.forEach(code => {
        row[code] = medicoes
          .filter(med => med.mes_referencia === m.mes && med.ur === code)
          .reduce((s, med) => s + Number(med.valor_total), 0);
      });
      return row;
    });
  }, [medicoes, mesFilter, urFilter]);

  const UR_COLORS: Record<string, string> = {
    UMB: "hsl(var(--accent))",
    UML: "hsl(var(--primary))",
    UMF: "hsl(var(--warning))",
  };
  const urCodesAtivas = urFilter === "TODAS" ? urs.map(u => u.code) : [urFilter];

  // Distribuição por UR no mês
  const distribUR = useMemo(() => {
    return urs.map(u => ({
      ur: u.code,
      valor: medicoes
        .filter(m => m.mes_referencia === mesFilter && m.ur === u.code)
        .reduce((s, m) => s + Number(m.valor_total), 0),
    })).filter(d => d.valor > 0);
  }, [medicoes, mesFilter]);

  // ---------- Sort handler ----------
  const toggleSort = (k: keyof MedicaoMensal) => {
    if (sortKey === k) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(k); setSortDir("desc"); }
  };

  // ---------- Export ----------
  const exportCSV = () => {
    const headers = ["UR", "Mês Referência", "Valor Total (R$)", "Status"];
    const rows = filtered.map(m => [m.ur, m.mes_referencia, Number(m.valor_total).toFixed(2), m.status]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `relatorio_medicoes_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    const dt = new Date().toLocaleString("pt-BR");
    doc.setFontSize(16);
    doc.text("Relatório de Medição Mensal", 14, 18);
    doc.setFontSize(10);
    doc.text(`UR: ${urFilter}   |   Mês: ${mesFilter || "—"}`, 14, 26);
    doc.text(`Gerado em ${dt}`, 14, 32);

    autoTable(doc, {
      startY: 38,
      head: [["UR", "Mês Referência", "Valor Total", "Status"]],
      body: filtered.map(m => [m.ur, m.mes_referencia, fmtBRL(Number(m.valor_total)), m.status]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [37, 99, 235] },
      didDrawPage: (data) => {
        const pageCount = doc.getNumberOfPages();
        doc.setFontSize(8);
        doc.text(`${dt}   —   Página ${data.pageNumber} de ${pageCount}`,
          doc.internal.pageSize.getWidth() / 2, doc.internal.pageSize.getHeight() - 8, { align: "center" });
      },
    });
    doc.save(`relatorio_medicoes_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <AppLayout>
      <div className="px-4 lg:px-8 py-6">
        <header className="pb-5 border-b border-border mb-5 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono mb-1">Caderno de Encargos</div>
            <h1 className="text-2xl font-semibold tracking-tight">Relatórios de Medição</h1>
            <p className="text-sm text-muted-foreground mt-1">Dashboard financeiro com drill-down por obra e serviço.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={exportCSV} variant="outline" size="sm" className="gap-2"><FileSpreadsheet className="h-4 w-4" /> CSV</Button>
            <Button onClick={exportPDF} size="sm" className="gap-2"><Download className="h-4 w-4" /> PDF</Button>
          </div>
        </header>

        {/* Filtros */}
        <div className="bg-card border border-border rounded-md shadow-card p-3 mb-5 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono mr-1">UR:</span>
            {(["TODAS", ...urs.map(u => u.code)] as const).map(c => (
              <button key={c} onClick={() => { setUrFilter(c as URCode | "TODAS"); setPage(1); }}
                className={cn("px-3 h-7 rounded text-[12px] font-medium font-mono border transition-colors",
                  urFilter === c ? "bg-primary text-primary-foreground border-primary" : "bg-surface text-muted-foreground border-border hover:text-foreground")}>
                {c === "TODAS" ? "Todas" : c}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <Label className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono">Mês/Ano:</Label>
            <Input type="month" value={mesFilter} onChange={e => setMesFilter(e.target.value)} className="h-8 w-[160px]" />
          </div>
        </div>

        {/* KPIs */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
          <Kpi icon={DollarSign} label="Valor total medido no mês" value={fmtBRL(valorTotalMes)} sub={`${urFilter === "TODAS" ? "Todas as URs" : urFilter} · ${mesFilter || "—"}`} tone="accent" />
          <Kpi icon={HardHat} label="Obras ativas no mês" value={String(obrasAtivas)} sub="com lançamentos no período" />
        </section>

        {/* Comparativo por UR */}
        <section className="mb-5">
          <ChartCard
            title="Comparativo de Medições Mensais por Unidade Regional"
            subtitle={urFilter === "TODAS" ? "UMB · UML · UMF — últimos 12 meses" : `${urFilter} — últimos 12 meses`}
          >
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={comparativoUR} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(v: number, name: string) => [fmtBRL(v), `UR ${name}`]}
                  labelFormatter={(label) => `Mês: ${label}`}
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 6, fontSize: 12 }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                {urCodesAtivas.map(code => (
                  <Bar
                    key={code}
                    dataKey={code}
                    fill={UR_COLORS[code] ?? "hsl(var(--primary))"}
                    radius={[3, 3, 0, 0]}
                    cursor="pointer"
                    onClick={(data) => {
                      if (data && typeof data.mes === "string") {
                        setUrFilter(code as URCode);
                        setMesFilter(data.mes);
                        setPage(1);
                      }
                    }}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </section>

        {/* Gráficos */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
          <ChartCard title="Evolução dos últimos 12 meses" subtitle={urFilter === "TODAS" ? "Todas as URs" : `Filtrado por ${urFilter}`}>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={evolucao} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => fmtBRL(v)} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 6, fontSize: 12 }} />
                <Line type="monotone" dataKey="valor" stroke="hsl(var(--accent))" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Distribuição por UR" subtitle={`No mês ${mesFilter || "—"}`}>
            {distribUR.length === 0 ? (
              <div className="h-[260px] flex items-center justify-center text-sm text-muted-foreground">Sem dados no mês selecionado.</div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={distribUR} dataKey="valor" nameKey="ur" cx="50%" cy="50%" outerRadius={90} label={(e) => e.ur}>
                    {distribUR.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => fmtBRL(v)} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 6, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </section>

        {/* Tabela */}
        <section className="bg-card border border-border rounded-md shadow-card">
          <header className="px-5 py-3.5 border-b border-border flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h2 className="text-sm font-semibold flex items-center gap-2"><FileText className="h-4 w-4" /> Medições</h2>
              <p className="text-[12px] text-muted-foreground mt-0.5">{filtered.length} registros</p>
            </div>
            <Input placeholder="Buscar UR, mês ou status…" value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }} className="h-8 w-[260px]" />
          </header>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead className="bg-muted/50 text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <Th onClick={() => toggleSort("ur")} active={sortKey === "ur"} dir={sortDir}>UR</Th>
                  <Th onClick={() => toggleSort("mes_referencia")} active={sortKey === "mes_referencia"} dir={sortDir}>Mês Referência</Th>
                  <Th onClick={() => toggleSort("valor_total")} active={sortKey === "valor_total"} dir={sortDir} align="right">Valor Total Medido</Th>
                  <Th onClick={() => toggleSort("status")} active={sortKey === "status"} dir={sortDir}>Status</Th>
                  <th className="text-right px-4 py-2.5 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginated.map(m => (
                  <tr key={m.id} className="hover:bg-muted/30">
                    <td className="px-4 py-2.5 font-mono text-[12px] font-semibold">{m.ur}</td>
                    <td className="px-2 py-2.5 font-mono text-[12px]">{m.mes_referencia}</td>
                    <td className="px-2 py-2.5 text-right tabular font-mono font-semibold">{fmtBRL(Number(m.valor_total))}</td>
                    <td className="px-2 py-2.5">
                      <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border", statusTone[m.status] ?? "bg-muted")}>
                        {m.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <Button size="sm" variant="outline" onClick={() => setDrill(m)} className="gap-1.5 h-7"><Eye className="h-3.5 w-3.5" /> Ver detalhes</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && !isLoading && (
              <div className="px-5 py-12 text-center text-sm text-muted-foreground">Nenhuma medição encontrada com os filtros atuais.</div>
            )}
          </div>
          {totalPages > 1 && (
            <div className="px-5 py-3 border-t border-border flex items-center justify-between text-[12px]">
              <span className="text-muted-foreground">Página {page} de {totalPages}</span>
              <div className="flex gap-1">
                <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Anterior</Button>
                <Button size="sm" variant="outline" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Próxima</Button>
              </div>
            </div>
          )}
        </section>

        {drill && <DrillModal medicao={drill} onClose={() => setDrill(null)} />}
      </div>
    </AppLayout>
  );
}

function Th({ children, onClick, active, dir, align }: { children: React.ReactNode; onClick: () => void; active: boolean; dir: "asc" | "desc"; align?: "right" }) {
  return (
    <th className={cn("px-2 py-2.5 font-medium cursor-pointer select-none hover:text-foreground", align === "right" ? "text-right" : "text-left")} onClick={onClick}>
      <span className="inline-flex items-center gap-1">{children}{active && <span className="text-[9px]">{dir === "asc" ? "▲" : "▼"}</span>}</span>
    </th>
  );
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-md shadow-card p-4">
      <div className="mb-3">
        <h3 className="text-sm font-semibold">{title}</h3>
        <p className="text-[11px] text-muted-foreground">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

function Kpi({ icon: Icon, label, value, sub, tone = "neutral" }: { icon: typeof DollarSign; label: string; value: string; sub: string; tone?: "neutral" | "accent" }) {
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

/* ----------------- Drill-down modal ----------------- */

function DrillModal({ medicao, onClose }: { medicao: MedicaoMensal; onClose: () => void }) {
  const { data: obras = [], isLoading } = useQuery({
    queryKey: ["medicao-detalhe", medicao.ur, medicao.mes_referencia],
    queryFn: () => fetchMedicaoDetalhe(medicao.ur, medicao.mes_referencia),
  });
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggle = (id: string) => setExpanded(s => {
    const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n;
  });

  const exportPDF = () => {
    const doc = new jsPDF();
    const dt = new Date().toLocaleString("pt-BR");
    doc.setFontSize(16);
    doc.text("Detalhe da Medição", 14, 18);
    doc.setFontSize(10);
    doc.text(`UR: ${medicao.ur}   |   Mês: ${medicao.mes_referencia}   |   Total: ${fmtBRL(Number(medicao.valor_total))}`, 14, 26);
    doc.text(`Status: ${medicao.status}   |   Gerado em ${dt}`, 14, 32);

    autoTable(doc, {
      startY: 38,
      head: [["Logradouro", "Bairro", "Valor da Obra"]],
      body: obras.map((o: ObraDetalhe) => [o.logradouro, o.bairro, fmtBRL(o.valor_total)]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [37, 99, 235] },
      didDrawPage: (data) => {
        const pageCount = doc.getNumberOfPages();
        doc.setFontSize(8);
        doc.text(`${dt}   —   Página ${data.pageNumber} de ${pageCount}`,
          doc.internal.pageSize.getWidth() / 2, doc.internal.pageSize.getHeight() - 8, { align: "center" });
      },
    });
    doc.save(`detalhe_${medicao.ur}_${medicao.mes_referencia}.pdf`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-foreground/40 p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-card border border-border rounded-md shadow-elevated w-full max-w-5xl my-8" onClick={e => e.stopPropagation()}>
        <header className="px-5 py-4 border-b border-border flex items-start justify-between gap-3">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono">Detalhe da Medição</div>
            <h2 className="text-lg font-semibold mt-0.5">{medicao.ur} · {medicao.mes_referencia}</h2>
            <div className="flex gap-4 mt-2 text-[12px]">
              <span><span className="text-muted-foreground">Valor total:</span> <span className="font-mono font-semibold">{fmtBRL(Number(medicao.valor_total))}</span></span>
              <span><span className="text-muted-foreground">Status:</span> <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ml-1", statusTone[medicao.status] ?? "bg-muted")}>{medicao.status}</span></span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={exportPDF} className="gap-1.5"><Download className="h-3.5 w-3.5" /> PDF</Button>
            <Button size="icon" variant="ghost" onClick={onClose}><XIcon className="h-4 w-4" /></Button>
          </div>
        </header>
        <div className="p-5">
          <h3 className="text-sm font-semibold mb-2">Obras contribuintes ({obras.length})</h3>
          {isLoading && <div className="text-sm text-muted-foreground py-6">Carregando…</div>}
          {!isLoading && obras.length === 0 && <div className="text-sm text-muted-foreground py-6">Sem lançamentos para esta UR/mês.</div>}
          <div className="border border-border rounded-md overflow-hidden">
            {obras.map(o => {
              const isOpen = expanded.has(o.obra_id);
              return (
                <div key={o.obra_id} className="border-b border-border last:border-b-0">
                  <button onClick={() => toggle(o.obra_id)} className="w-full grid grid-cols-[24px_1fr_1fr_140px] items-center px-3 py-2.5 hover:bg-muted/40 text-left text-[13px]">
                    {isOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                    <span className="font-medium">{o.logradouro}</span>
                    <span className="text-muted-foreground">{o.bairro}</span>
                    <span className="text-right font-mono font-semibold">{fmtBRL(o.valor_total)}</span>
                  </button>
                  {isOpen && (
                    <div className="bg-muted/20 px-4 py-3">
                      <table className="w-full text-[12px]">
                        <thead className="text-[10px] uppercase tracking-wider text-muted-foreground">
                          <tr>
                            <th className="text-left py-1.5">Cód.</th>
                            <th className="text-left py-1.5">Descrição</th>
                            <th className="text-right py-1.5">Qtd.</th>
                            <th className="text-left py-1.5 pl-2">Un.</th>
                            <th className="text-right py-1.5">Preço Un.</th>
                            <th className="text-right py-1.5">Valor</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                          {o.itens.map((it, i) => (
                            <tr key={i}>
                              <td className="py-1.5 font-mono text-[11px]">{it.codigo}</td>
                              <td className="py-1.5">{it.descricao}</td>
                              <td className="py-1.5 text-right font-mono">{fmtNum(it.quantidade)}</td>
                              <td className="py-1.5 pl-2 text-muted-foreground">{it.unidade}</td>
                              <td className="py-1.5 text-right font-mono">{fmtBRL(it.preco_unitario)}</td>
                              <td className="py-1.5 text-right font-mono font-semibold">{fmtBRL(it.valor_total)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
