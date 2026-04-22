/**
 * Bundle isolado dos gráficos (recharts) — carregado via React.lazy
 * apenas quando o usuário entra em /encargos/relatorios.
 * O prefixo "-" no nome impede que o TanStack Router gere uma rota.
 */
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

const PIE_COLORS = ["hsl(var(--accent))", "hsl(var(--primary))", "hsl(var(--warning))", "hsl(var(--success))"];

const fmtBRL = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

interface Props {
  comparativoUR: Array<Record<string, string | number>>;
  evolucao: Array<{ mes: string; label: string; valor: number }>;
  distribUR: Array<{ ur: string; valor: number }>;
  urCodesAtivas: string[];
  urColors: Record<string, string>;
  mesFilter: string;
  urFilter: string;
  onBarClick: (ur: string, mes: string) => void;
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

export default function RelatoriosCharts({
  comparativoUR, evolucao, distribUR, urCodesAtivas, urColors, mesFilter, urFilter, onBarClick,
}: Props) {
  return (
    <>
      <section className="mb-5">
        <ChartCard
          title="Comparativo de Medições Mensais por Unidade Regional"
          subtitle={urFilter === "TODAS" ? "UMB · UML · UMF — últimos 12 meses" : `${urFilter} — últimos 12 meses`}
        >
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={comparativoUR} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v: number) => `R$${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                formatter={(v: number, name: string) => [fmtBRL(v), `UR ${name}`]}
                labelFormatter={(label: string) => `Mês: ${label}`}
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 6, fontSize: 12 }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              {urCodesAtivas.map(code => (
                <Bar
                  key={code}
                  dataKey={code}
                  fill={urColors[code] ?? "hsl(var(--primary))"}
                  radius={[3, 3, 0, 0]}
                  cursor="pointer"
                  onClick={(data: { mes?: string }) => {
                    if (data && typeof data.mes === "string") onBarClick(code, data.mes);
                  }}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
        <ChartCard title="Evolução dos últimos 12 meses" subtitle={urFilter === "TODAS" ? "Todas as URs" : `Filtrado por ${urFilter}`}>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={evolucao} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v: number) => `R$${(v / 1000).toFixed(0)}k`} />
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
                <Pie data={distribUR} dataKey="valor" nameKey="ur" cx="50%" cy="50%" outerRadius={90} label={(e: { ur: string }) => e.ur}>
                  {distribUR.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => fmtBRL(v)} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 6, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </section>
    </>
  );
}
