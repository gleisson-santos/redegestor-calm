import { ReactNode, useState } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Building2,
  HardHat,
  Package,
  FileCheck2,
  Layers,
  BookOpen,
  ClipboardList,
  Calculator,
  Search,
  Bell,
  Menu,
  X,
  Plus,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type NavTo = "/" | "/urs" | "/obras" | "/materiais" | "/consolidado" | "/alvaras" | "/encargos" | "/encargos/lancamentos" | "/encargos/medicoes";
type NavItem = { to: NavTo; label: string; icon: typeof LayoutDashboard; exact?: boolean };
const nav: NavItem[] = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/urs", label: "Unidades Regionais", icon: Building2 },
  { to: "/obras", label: "Base de Obras", icon: HardHat },
  { to: "/materiais", label: "Gestão de Materiais", icon: Package },
  { to: "/consolidado", label: "Consolidado", icon: Layers },
  { to: "/alvaras", label: "Alvarás", icon: FileCheck2 },
];

const encargosGroup: { to: NavTo; label: string; icon: typeof LayoutDashboard }[] = [
  { to: "/encargos", label: "Tabela de Preços", icon: BookOpen },
  { to: "/encargos/lancamentos", label: "Lançamento de Serviços", icon: ClipboardList },
  { to: "/encargos/medicoes", label: "Medições Mensais", icon: Calculator },
];

export function AppLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isEncargosActive = location.pathname.startsWith("/encargos");
  const [encargosOpen, setEncargosOpen] = useState(isEncargosActive);

  const isActive = (to: string, exact?: boolean) =>
    exact ? location.pathname === to : location.pathname === to || location.pathname.startsWith(to + "/");

  return (
    <div className="min-h-screen flex w-full bg-background">
      {/* Sidebar — desktop */}
      <aside className="hidden lg:flex w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
        <div className="h-14 flex items-center px-5 border-b border-sidebar-border">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-md bg-accent flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-white">
                <path d="M3 12h6l3-7 3 14 3-7h3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <div className="font-semibold text-white tracking-tight text-[15px]">RedeGestor</div>
              <div className="text-[10px] uppercase tracking-wider text-sidebar-foreground/60 -mt-0.5">Engenharia · Redes</div>
            </div>
          </Link>
        </div>

        <nav className="flex-1 px-2.5 py-5 space-y-0.5">
          <div className="px-2.5 mb-2 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/50">
            Operação
          </div>
          {nav.map((item) => {
            const active = isActive(item.to, item.exact);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[13px] transition-colors",
                  active
                    ? "bg-sidebar-accent text-white font-medium"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-white",
                )}
              >
                <item.icon className={cn("h-[16px] w-[16px]", active ? "text-accent" : "text-sidebar-foreground/70")} />
                {item.label}
              </Link>
            );
          })}

          {/* Grupo: Caderno de Encargos */}
          <button
            type="button"
            onClick={() => setEncargosOpen(o => !o)}
            className={cn(
              "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[13px] transition-colors mt-1",
              isEncargosActive
                ? "bg-sidebar-accent text-white font-medium"
                : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-white",
            )}
          >
            <BookOpen className={cn("h-[16px] w-[16px]", isEncargosActive ? "text-accent" : "text-sidebar-foreground/70")} />
            <span className="flex-1 text-left">Caderno de Encargos</span>
            <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", encargosOpen && "rotate-180")} />
          </button>
          {encargosOpen && (
            <div className="ml-3 pl-2 border-l border-sidebar-border/60 space-y-0.5 mt-0.5">
              {encargosGroup.map(sub => {
                const active = location.pathname === sub.to;
                return (
                  <Link
                    key={sub.to}
                    to={sub.to}
                    className={cn(
                      "flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[12.5px] transition-colors",
                      active ? "bg-sidebar-accent text-white font-medium" : "text-sidebar-foreground/85 hover:bg-sidebar-accent/60 hover:text-white",
                    )}
                  >
                    <sub.icon className={cn("h-[14px] w-[14px]", active ? "text-accent" : "text-sidebar-foreground/60")} />
                    {sub.label}
                  </Link>
                );
              })}
            </div>
          )}
        </nav>

        <div className="p-3 border-t border-sidebar-border">
          <div className="flex items-center gap-2.5 px-1.5 py-1.5 rounded-md hover:bg-sidebar-accent/60 transition-colors">
            <div className="h-8 w-8 rounded-md bg-accent/90 flex items-center justify-center text-white text-[12px] font-semibold">
              MC
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-medium text-white truncate">Marina Cardoso</div>
              <div className="text-[10px] text-sidebar-foreground/60 truncate">Gestora — Engenharia</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-foreground/40" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-72 bg-sidebar text-sidebar-foreground border-r border-sidebar-border flex flex-col">
            <div className="h-14 flex items-center justify-between px-4 border-b border-sidebar-border">
              <span className="font-semibold text-white">RedeGestor</span>
              <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)} className="text-sidebar-foreground hover:text-white hover:bg-sidebar-accent">
                <X className="h-5 w-5" />
              </Button>
            </div>
            <nav className="flex-1 px-2 py-3 space-y-0.5">
              {nav.map((item) => {
                const active = isActive(item.to, item.exact);
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[13px]",
                      active ? "bg-sidebar-accent text-white font-medium" : "text-sidebar-foreground",
                    )}
                  >
                    <item.icon className="h-[16px] w-[16px]" />
                    {item.label}
                  </Link>
                );
              })}
              <div className="px-2.5 mt-3 mb-1 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/50">
                Caderno de Encargos
              </div>
              {encargosGroup.map(sub => {
                const active = location.pathname === sub.to;
                return (
                  <Link
                    key={sub.to}
                    to={sub.to}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[13px]",
                      active ? "bg-sidebar-accent text-white font-medium" : "text-sidebar-foreground",
                    )}
                  >
                    <sub.icon className="h-[16px] w-[16px]" />
                    {sub.label}
                  </Link>
                );
              })}
            </nav>
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-14 border-b border-border bg-surface sticky top-0 z-30">
          <div className="h-full flex items-center gap-3 px-4 lg:px-6">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>

            <div className="flex-1 max-w-sm relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                placeholder="Buscar obra, logradouro, material…"
                className="w-full h-9 pl-9 pr-3 rounded-md bg-muted border border-transparent focus:bg-surface focus:border-input focus:outline-none focus:ring-2 focus:ring-ring/30 text-[13px] transition-colors"
              />
            </div>

            <div className="flex-1 sm:hidden" />

            <Button variant="ghost" size="icon" className="relative" aria-label="Notificações">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-destructive" />
            </Button>

            <Link to="/obras">
              <Button size="sm" className="gap-1.5 bg-accent hover:bg-accent/90 text-accent-foreground">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Nova obra</span>
                <span className="sm:hidden">Nova</span>
              </Button>
            </Link>
          </div>
        </header>

        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
