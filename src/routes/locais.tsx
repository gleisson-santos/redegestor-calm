import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { locations, ServiceLocation } from "@/data/mockData";
import { MapPin, Calendar, Users, Package, Filter } from "lucide-react";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/locais")({
  head: () => ({
    meta: [
      { title: "Locais & Serviços — RedeGestor" },
      { name: "description", content: "Mapa e lista geolocalizada dos serviços em campo." },
    ],
  }),
  component: LocaisPage,
});

const statusInfo: Record<ServiceLocation["status"], { label: string; cls: string; dot: string }> = {
  planejado: { label: "Planejado", cls: "bg-info-soft text-info border-info/20", dot: "bg-info" },
  em_andamento: { label: "Em andamento", cls: "bg-accent-soft text-accent border-accent/20", dot: "bg-accent" },
  concluido: { label: "Concluído", cls: "bg-muted text-muted-foreground border-border", dot: "bg-muted-foreground/50" },
};

function LocaisPage() {
  const [filter, setFilter] = useState<ServiceLocation["status"] | "todos">("todos");
  const [selected, setSelected] = useState<string | null>(locations[0]?.id ?? null);

  const filtered = useMemo(
    () => locations.filter(l => filter === "todos" || l.status === filter),
    [filter]
  );

  const filters: ({ value: typeof filter; label: string })[] = [
    { value: "todos", label: "Todos" },
    { value: "em_andamento", label: "Em andamento" },
    { value: "planejado", label: "Planejados" },
    { value: "concluido", label: "Concluídos" },
  ];

  // Map projection — bounds
  const lats = locations.map(l => l.lat);
  const lngs = locations.map(l => l.lng);
  const minLat = Math.min(...lats) - 0.05, maxLat = Math.max(...lats) + 0.05;
  const minLng = Math.min(...lngs) - 0.05, maxLng = Math.max(...lngs) + 0.05;
  const proj = (lat: number, lng: number) => ({
    x: ((lng - minLng) / (maxLng - minLng)) * 100,
    y: (1 - (lat - minLat) / (maxLat - minLat)) * 100,
  });

  return (
    <AppLayout>
      <div className="px-4 lg:px-8 py-8 lg:py-10 max-w-[1400px] mx-auto space-y-6">
        <div>
          <h1 className="text-display">Locais & Serviços</h1>
          <p className="text-muted-foreground mt-1.5">Acompanhe equipes em campo e materiais utilizados.</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="h-4 w-4 text-muted-foreground" />
          {filters.map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={cn(
                "px-3 h-9 rounded-lg text-sm border calm-transition",
                filter === f.value
                  ? "bg-primary text-primary-foreground border-primary shadow-soft"
                  : "bg-surface border-border text-foreground/70 hover:border-foreground/20"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Mapa */}
          <Card className="lg:col-span-3 border-border/60 shadow-soft overflow-hidden">
            <CardHeader className="border-b border-border/60">
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" /> Mapa de operações
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="relative aspect-[4/3] bg-gradient-to-br from-info-soft/40 via-background to-accent-soft/30">
                {/* Grid lines */}
                <svg className="absolute inset-0 w-full h-full opacity-30" preserveAspectRatio="none">
                  <defs>
                    <pattern id="grid" width="10%" height="10%" patternUnits="userSpaceOnUse">
                      <path d="M 100 0 L 0 0 0 100" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-border" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />
                </svg>

                {/* Pins */}
                {filtered.map(l => {
                  const p = proj(l.lat, l.lng);
                  const info = statusInfo[l.status];
                  const isSel = selected === l.id;
                  return (
                    <button
                      key={l.id}
                      onClick={() => setSelected(l.id)}
                      style={{ left: `${p.x}%`, top: `${p.y}%` }}
                      className="absolute -translate-x-1/2 -translate-y-full group"
                    >
                      <div className={cn(
                        "relative flex flex-col items-center calm-transition",
                        isSel ? "scale-110" : "hover:scale-105"
                      )}>
                        <div className={cn(
                          "h-8 w-8 rounded-full flex items-center justify-center border-2 border-surface shadow-card",
                          l.status === "em_andamento" && "bg-accent",
                          l.status === "planejado" && "bg-info",
                          l.status === "concluido" && "bg-muted-foreground/60",
                        )}>
                          <MapPin className="h-4 w-4 text-white" />
                        </div>
                        <div className={cn("h-2 w-2 rounded-full -mt-0.5", info.dot, l.status === "em_andamento" && "animate-gentle-pulse")} />
                        {isSel && (
                          <div className="absolute bottom-full mb-2 px-2.5 py-1.5 rounded-lg bg-foreground text-background text-xs whitespace-nowrap shadow-card">
                            {l.nome}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}

                {/* Legenda */}
                <div className="absolute bottom-3 left-3 flex gap-2 flex-wrap">
                  {(["em_andamento","planejado","concluido"] as const).map(s => (
                    <div key={s} className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-surface/90 backdrop-blur border border-border text-[11px]">
                      <span className={cn("h-2 w-2 rounded-full", statusInfo[s].dot)} />
                      {statusInfo[s].label}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista */}
          <Card className="lg:col-span-2 border-border/60 shadow-soft">
            <CardHeader className="border-b border-border/60">
              <CardTitle className="text-lg">Locais ({filtered.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-0 max-h-[600px] overflow-y-auto">
              {filtered.map(l => {
                const info = statusInfo[l.status];
                const isSel = selected === l.id;
                return (
                  <button
                    key={l.id}
                    onClick={() => setSelected(l.id)}
                    className={cn(
                      "w-full text-left p-4 border-b border-border hover:bg-muted/30 calm-transition",
                      isSel && "bg-primary-soft/40"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-medium text-sm">{l.nome}</div>
                        <div className="text-xs text-muted-foreground mt-1">{l.endereco} · {l.cidade}</div>
                        <div className="text-xs text-primary mt-1.5">Contrato {l.contratoNumero}</div>
                      </div>
                      <span className={cn("shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border", info.cls)}>
                        <span className={cn("h-1.5 w-1.5 rounded-full", info.dot)} />
                        {info.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(l.data).toLocaleDateString("pt-BR")}</span>
                      <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" /> {l.responsavel}</span>
                      <span className="inline-flex items-center gap-1"><Package className="h-3 w-3" /> {l.materiaisUsados} itens</span>
                    </div>
                  </button>
                );
              })}
              {filtered.length === 0 && (
                <div className="p-12 text-center text-sm text-muted-foreground">Nenhum local encontrado.</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
