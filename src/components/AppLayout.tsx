import { ReactNode } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import {
  LayoutDashboard,
  FileText,
  MapPin,
  Boxes,
  Bell,
  Search,
  Plus,
  Menu,
  X,
  Building2,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/urs", label: "Unidades Regionais", icon: Building2 },
  { to: "/contratos", label: "Contratos", icon: FileText },
  { to: "/locais", label: "Locais & Serviços", icon: MapPin },
  { to: "/estoque", label: "Estoque & Relatórios", icon: Boxes },
];

export function AppLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (to: string, exact?: boolean) =>
    exact ? location.pathname === to : location.pathname === to || location.pathname.startsWith(to + "/");

  return (
    <div className="min-h-screen flex w-full bg-background">
      {/* Sidebar — desktop */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
        <div className="h-16 flex items-center px-6 border-b border-sidebar-border">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center shadow-soft">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-primary-foreground">
                <path d="M4 7h16M4 12h16M4 17h10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                <circle cx="18" cy="17" r="2.5" fill="currentColor"/>
              </svg>
            </div>
            <div>
              <div className="font-semibold text-sidebar-foreground tracking-tight">RedeGestor</div>
              <div className="text-[11px] text-muted-foreground -mt-0.5">Gestão de contratos</div>
            </div>
          </Link>
        </div>

        <nav className="flex-1 px-3 py-6 space-y-1">
          <div className="px-3 mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Principal
          </div>
          {nav.map((item) => {
            const active = isActive(item.to, item.exact);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm calm-transition",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                )}
              >
                <item.icon className={cn("h-[18px] w-[18px]", active && "text-primary")} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3 px-2">
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground text-sm font-semibold">
              MC
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">Marina Cardoso</div>
              <div className="text-xs text-muted-foreground truncate">Gerente de contratos</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-72 bg-sidebar border-r border-sidebar-border flex flex-col">
            <div className="h-16 flex items-center justify-between px-5 border-b border-sidebar-border">
              <span className="font-semibold">RedeGestor</span>
              <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <nav className="flex-1 px-3 py-4 space-y-1">
              {nav.map((item) => {
                const active = isActive(item.to, item.exact);
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm",
                      active ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" : "text-sidebar-foreground"
                    )}
                  >
                    <item.icon className="h-[18px] w-[18px]" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 border-b border-border bg-surface/80 backdrop-blur sticky top-0 z-30">
          <div className="h-full flex items-center gap-3 px-4 lg:px-8">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>

            <div className="flex-1 max-w-md relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                placeholder="Buscar contrato, material, local…"
                className="w-full h-10 pl-9 pr-3 rounded-lg bg-muted/60 border border-transparent focus:bg-surface focus:border-input focus:outline-none focus:ring-2 focus:ring-ring/30 text-sm calm-transition"
              />
            </div>

            <div className="flex-1 sm:hidden" />

            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-destructive animate-gentle-pulse" />
            </Button>

            <Link to="/contratos">
              <Button className="gap-2 shadow-soft">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Novo contrato</span>
                <span className="sm:hidden">Novo</span>
              </Button>
            </Link>
          </div>
        </header>

        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
