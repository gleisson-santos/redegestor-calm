import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Contract, getContract, mesesPorAno, formatMes, Material } from "@/data/mockData";
import { ArrowLeft, Calendar, MapPin, User, Building2, Download, Edit3 } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/contratos/$contractId")({
  loader: ({ params }): { contract: Contract } => {
    const contract = getContract(params.contractId);
    if (!contract) throw notFound();
    return { contract };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.contract.numero} — RedeGestor` },
      { name: "description", content: loaderData?.contract.titulo },
    ],
  }),
  notFoundComponent: () => (
    <AppLayout>
      <div className="p-12 text-center">
        <h1 className="text-2xl font-semibold">Contrato não encontrado</h1>
        <Link to="/contratos" className="text-primary mt-4 inline-block">Voltar para a lista</Link>
      </div>
    </AppLayout>
  ),
  component: ContractDetail,
});

const anos = ["2026", "2027", "2028"] as const;

function ContractDetail() {
  const { contract } = Route.useLoaderData() as { contract: Contract };
  const [ano, setAno] = useState<typeof anos[number]>("2026");
  const meses = mesesPorAno[ano];

  const totalPorMaterial = (m: Material) => meses.reduce((s, mm) => s + (m.cronograma[mm] ?? 0), 0);

  const categorias = ["tubo", "conexao", "registro", "acessorio"] as const;
  const labelsCat = { tubo: "Tubos", conexao: "Conexões", registro: "Registros", acessorio: "Acessórios" };

  return (
    <AppLayout>
      <div className="px-4 lg:px-8 py-8 lg:py-10 max-w-[1400px] mx-auto space-y-6">
        <div>
          <Link to="/contratos" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground calm-transition">
            <ArrowLeft className="h-4 w-4" /> Contratos
          </Link>
        </div>

        {/* Header */}
        <Card className="border-border/60 shadow-soft overflow-hidden">
          <div className="p-6 lg:p-8">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
              <div className="space-y-3 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-3xl font-bold tracking-tight">{contract.numero}</span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary-soft text-primary text-xs font-semibold font-mono">
                    {contract.ur}
                  </span>
                  <StatusBadge status={contract.status} />
                </div>
                <h1 className="text-xl text-foreground/80 font-medium">{contract.titulo}</h1>
                <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground pt-2">
                  <div className="inline-flex items-center gap-1.5"><Building2 className="h-4 w-4" /> {contract.cliente}</div>
                  <div className="inline-flex items-center gap-1.5"><User className="h-4 w-4" /> {contract.responsavel}</div>
                  <div className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4" /> {contract.regiao}</div>
                  <div className="inline-flex items-center gap-1.5"><Calendar className="h-4 w-4" />
                    {new Date(contract.inicio).toLocaleDateString("pt-BR")} → {new Date(contract.fim).toLocaleDateString("pt-BR")}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="gap-2"><Download className="h-4 w-4" /> Exportar PDF</Button>
                <Button className="gap-2 shadow-soft"><Edit3 className="h-4 w-4" /> Editar</Button>
              </div>
            </div>

            <div className="mt-6">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-muted-foreground">Progresso geral</span>
                <span className="font-semibold">{contract.progresso}%</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-gradient-to-r from-primary to-accent rounded-full calm-transition" style={{ width: `${contract.progresso}%` }} />
              </div>
            </div>
          </div>
        </Card>

        {/* Cronograma */}
        <Card className="border-border/60 shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-3">
            <div>
              <CardTitle className="text-lg">Cronograma de materiais</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Quantidades planejadas por mês · clique para editar.</p>
            </div>
            <div className="flex gap-1 p-1 bg-muted rounded-lg">
              {anos.map(a => (
                <button
                  key={a}
                  onClick={() => setAno(a)}
                  className={cn(
                    "px-3 h-8 text-sm rounded-md calm-transition font-medium",
                    ano === a ? "bg-surface text-foreground shadow-soft" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {a}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            {contract.materiais.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">
                Sem materiais cadastrados neste contrato.
              </div>
            ) : (
              <div className="space-y-6">
                {categorias.map(cat => {
                  const itens = contract.materiais.filter(m => m.categoria === cat);
                  if (itens.length === 0) return null;
                  return (
                    <div key={cat}>
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 px-1">
                        {labelsCat[cat]}
                      </h3>
                      <div className="overflow-x-auto rounded-lg border border-border">
                        <table className="w-full text-sm min-w-[800px]">
                          <thead className="bg-muted/40">
                            <tr className="text-xs font-medium text-muted-foreground">
                              <th className="text-left px-3 py-2.5 sticky left-0 bg-muted/40 min-w-[260px]">Material</th>
                              <th className="text-center px-2 py-2.5 w-14">UMB</th>
                              {meses.map(m => (
                                <th key={m} className="text-center px-2 py-2.5 w-14">{formatMes(m).slice(0,3)}</th>
                              ))}
                              <th className="text-center px-3 py-2.5 w-20 bg-primary-soft text-primary">Total</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border bg-surface">
                            {itens.map(m => {
                              const total = totalPorMaterial(m);
                              const baixo = m.estoqueAtual < m.estoqueMinimo;
                              return (
                                <tr key={m.codigo} className="hover:bg-muted/20 calm-transition">
                                  <td className="px-3 py-2.5 sticky left-0 bg-surface">
                                    <div className="font-medium text-foreground/90">{m.descricao}</div>
                                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                                      <span>{m.codigo}</span>
                                      {baixo && <span className="text-warning-foreground">· estoque baixo</span>}
                                    </div>
                                  </td>
                                  <td className="text-center text-xs text-muted-foreground">{m.umb}</td>
                                  {meses.map(mm => {
                                    const v = m.cronograma[mm] ?? 0;
                                    return (
                                      <td key={mm} className="text-center px-1 py-2.5">
                                        <div className={cn(
                                          "inline-block px-1.5 py-0.5 rounded text-xs tabular-nums",
                                          v === 0 ? "text-muted-foreground/40" : "text-foreground hover:bg-primary-soft cursor-text"
                                        )}>
                                          {v || "—"}
                                        </div>
                                      </td>
                                    );
                                  })}
                                  <td className="text-center px-3 py-2.5 font-semibold tabular-nums bg-primary-soft/40">
                                    {total}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Mini analytics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-border/60 shadow-soft">
            <CardContent className="p-5">
              <div className="text-sm text-muted-foreground">Itens distintos</div>
              <div className="text-2xl font-semibold mt-1">{contract.materiais.length}</div>
            </CardContent>
          </Card>
          <Card className="border-border/60 shadow-soft">
            <CardContent className="p-5">
              <div className="text-sm text-muted-foreground">Quantidade {ano}</div>
              <div className="text-2xl font-semibold mt-1 tabular-nums">
                {contract.materiais.reduce((s, m) => s + totalPorMaterial(m), 0).toLocaleString("pt-BR")}
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/60 shadow-soft">
            <CardContent className="p-5">
              <div className="text-sm text-muted-foreground">Estoque baixo</div>
              <div className="text-2xl font-semibold mt-1 text-warning-foreground">
                {contract.materiais.filter(m => m.estoqueAtual < m.estoqueMinimo).length}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
