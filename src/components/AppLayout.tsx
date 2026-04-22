import { ReactNode, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
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
  BarChart3,
  Bell,
  Menu,
  X,
  ChevronDown,
  PanelLeftClose,
  PanelLeftOpen,
  MapPin,
  ListChecks,
  LogOut,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type NavTo =
  | "/" | "/urs" | "/obras" | "/obras/diario" | "/materiais"
  | "/consolidado" | "/alvaras" | "/mapa" | "/usuarios"
  | "/encargos" | "/encargos/lancamentos" | "/encargos/medicoes" | "/encargos/relatorios";
type NavItem = { to: NavTo; label: string; icon: typeof LayoutDashboard; exact?: boolean };

const navTop: NavItem[] = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/urs", label: "Unidades Regionais", icon: Building2 },
];

const obrasGroup: { to: NavTo; label: string; icon: typeof LayoutDashboard }[] = [
  { to: "/obras", label: "Carteira de Obras", icon: ListChecks },
  { to: "/obras/diario", label: "Diário de Obra", icon: BookOpen },
];

const navMid: NavItem[] = [
  { to: "/materiais", label: "Gestão de Materiais", icon: Package },
  { to: "/consolidado", label: "Consolidado", icon: Layers },
  { to: "/alvaras", label: "Alvarás", icon: FileCheck2 },
  { to: "/mapa", label: "Mapa de Calor", icon: MapPin },
];

const encargosGroup: { to: NavTo; label: string; icon: typeof LayoutDashboard }[] = [
  { to: "/encargos", label: "Tabela de Preços", icon: BookOpen },
  { to: "/encargos/lancamentos", label: "Lançamento de Serviços", icon: ClipboardList },
  { to: "/encargos/medicoes", label: "Medições Mensais", icon: Calculator },
  { to: "/encargos/relatorios", label: "Relatórios de Medição", icon: BarChart3 },
];

const SIDEBAR_STORAGE_KEY = "redegestor:sidebar-collapsed";

export function AppLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, isAdmin, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isEncargosActive = location.pathname.startsWith("/encargos");
  const isObrasActive = location.pathname === "/obras" || location.pathname.startsWith("/obras/");
  const [encargosOpen, setEncargosOpen] = useState(isEncargosActive);
  const [obrasOpen, setObrasOpen] = useState(isObrasActive);
  const [collapsed, setCollapsed] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    toast.success("Sessão encerrada");
    navigate({ to: "/login" });
  };

  const displayName = profile?.nome || user?.email || "Usuário";
  const initials = displayName.split(" ").map(p => p[0]).slice(0, 2).join("").toUpperCase() || "U";
  const subtitle = isAdmin ? `${profile?.ur ?? ""} · Administrador` : `${profile?.ur ?? ""} · Usuário`;

  useEffect(() => {
    try {
      const v = localStorage.getItem(SIDEBAR_STORAGE_KEY);
      if (v === "1") setCollapsed(true);
    } catch { /* noop */ }
  }, []);

  const toggleCollapsed = () => {
    setCollapsed(c => {
      const next = !c;
      try { localStorage.setItem(SIDEBAR_STORAGE_KEY, next ? "1" : "0"); } catch { /* noop */ }
      return next;
    });
  };

  const isActive = (to: string, exact?: boolean) =>
    exact ? location.pathname === to : location.pathname === to || location.pathname.startsWith(to + "/");

  const renderNavItem = (item: NavItem) => {
    const active = isActive(item.to, item.exact);
    const link = (
      <Link
        key={item.to}
        to={item.to}
        className={cn(
          "flex items-center rounded-md text-[13px] transition-colors",
          collapsed ? "justify-center h-9 w-full" : "gap-2.5 px-2.5 py-2",
          active
            ? "bg-sidebar-accent text-white font-medium"
            : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-white",
        )}
      >
        <item.icon className={cn("h-[16px] w-[16px] shrink-0", active ? "text-accent" : "text-sidebar-foreground/70")} />
        {!collapsed && <span className="truncate">{item.label}</span>}
      </Link>
    );
    return collapsed ? (
      <Tooltip key={item.to}>
        <TooltipTrigger asChild>{link}</TooltipTrigger>
        <TooltipContent side="right">{item.label}</TooltipContent>
      </Tooltip>
    ) : link;
  };

  return (
    <TooltipProvider delayDuration={150}>
      <div className="min-h-screen flex w-full bg-background">
        {/* Sidebar — desktop */}
        <aside
          className={cn(
            "hidden lg:flex shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-300 ease-out",
            collapsed ? "w-[64px]" : "w-60",
          )}
        >
          <div className={cn("h-14 flex items-center border-b border-sidebar-border", collapsed ? "justify-center px-2" : "px-5")}>
            <Link to="/" className="flex items-center gap-2.5 min-w-0">
              <div className="h-8 w-8 shrink-0 rounded-md bg-accent flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-white">
                  <path d="M3 12h6l3-7 3 14 3-7h3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              {!collapsed && (
                <div className="min-w-0">
                  <div className="font-semibold text-white tracking-tight text-[15px] truncate">RedeGestor</div>
                  <div className="text-[10px] uppercase tracking-wider text-sidebar-foreground/60 -mt-0.5 truncate">Engenharia · Redes</div>
                </div>
              )}
            </Link>
          </div>

          <nav className={cn("flex-1 py-5 space-y-0.5 overflow-y-auto", collapsed ? "px-2" : "px-2.5")}>
            {!collapsed && (
              <div className="px-2.5 mb-2 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/50">
                Operação
              </div>
            )}
            {navTop.map(renderNavItem)}

            {/* Grupo: Base de Obras */}
            {collapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    to="/obras"
                    className={cn(
                      "flex items-center justify-center h-9 w-full rounded-md text-[13px] transition-colors",
                      isObrasActive
                        ? "bg-sidebar-accent text-white font-medium"
                        : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-white",
                    )}
                  >
                    <HardHat className={cn("h-[16px] w-[16px]", isObrasActive ? "text-accent" : "text-sidebar-foreground/70")} />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">Base de Obras</TooltipContent>
              </Tooltip>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setObrasOpen(o => !o)}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[13px] transition-colors",
                    isObrasActive
                      ? "bg-sidebar-accent text-white font-medium"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-white",
                  )}
                >
                  <HardHat className={cn("h-[16px] w-[16px]", isObrasActive ? "text-accent" : "text-sidebar-foreground/70")} />
                  <span className="flex-1 text-left">Base de Obras</span>
                  <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", obrasOpen && "rotate-180")} />
                </button>
                {obrasOpen && (
                  <div className="ml-3 pl-2 border-l border-sidebar-border/60 space-y-0.5 mt-0.5 animate-fade-in">
                    {obrasGroup.map(sub => {
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
              </>
            )}

            {navMid.map(renderNavItem)}
            {isAdmin && renderNavItem({ to: "/usuarios", label: "Usuários", icon: Users })}

            {/* Grupo: Caderno de Encargos */}
            {collapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    to="/encargos"
                    className={cn(
                      "flex items-center justify-center h-9 w-full rounded-md text-[13px] transition-colors mt-1",
                      isEncargosActive
                        ? "bg-sidebar-accent text-white font-medium"
                        : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-white",
                    )}
                  >
                    <BookOpen className={cn("h-[16px] w-[16px]", isEncargosActive ? "text-accent" : "text-sidebar-foreground/70")} />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">Caderno de Encargos</TooltipContent>
              </Tooltip>
            ) : (
              <>
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
                  <div className="ml-3 pl-2 border-l border-sidebar-border/60 space-y-0.5 mt-0.5 animate-fade-in">
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
              </>
            )}
          </nav>

          <div className={cn("border-t border-sidebar-border", collapsed ? "p-2" : "p-3")}>
            {collapsed ? (
              <div className="flex flex-col items-center gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="h-8 w-8 rounded-md bg-accent/90 flex items-center justify-center text-white text-[12px] font-semibold cursor-default">
                      {initials}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right">{displayName} · {subtitle}</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-sidebar-foreground hover:text-white hover:bg-sidebar-accent" onClick={handleSignOut} aria-label="Sair">
                      <LogOut className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">Sair</TooltipContent>
                </Tooltip>
              </div>
            ) : (
              <div className="flex items-center gap-2.5 px-1.5 py-1.5 rounded-md hover:bg-sidebar-accent/60 transition-colors">
                <div className="h-8 w-8 rounded-md bg-accent/90 flex items-center justify-center text-white text-[12px] font-semibold shrink-0">
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-medium text-white truncate">{displayName}</div>
                  <div className="text-[10px] text-sidebar-foreground/60 truncate">{subtitle}</div>
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-sidebar-foreground hover:text-white hover:bg-sidebar-accent" onClick={handleSignOut} aria-label="Sair">
                  <LogOut className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>
        </aside>

        {/* Mobile drawer */}
        {mobileOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            <div className="absolute inset-0 bg-foreground/40 animate-fade-in" onClick={() => setMobileOpen(false)} />
            <aside className="relative w-72 bg-sidebar text-sidebar-foreground border-r border-sidebar-border flex flex-col animate-slide-in-right" style={{ animation: "slide-in-right 0.25s ease-out" }}>
              <div className="h-14 flex items-center justify-between px-4 border-b border-sidebar-border">
                <span className="font-semibold text-white">RedeGestor</span>
                <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)} className="text-sidebar-foreground hover:text-white hover:bg-sidebar-accent">
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
                {[...navTop, ...obrasGroup.map(g => ({ ...g, exact: false } as NavItem)), ...navMid].map((item) => {
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
              <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Abrir menu">
                <Menu className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="hidden lg:inline-flex"
                onClick={toggleCollapsed}
                aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
              >
                {collapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
              </Button>

              <div className="flex-1" />

              <Button variant="ghost" size="icon" className="relative" aria-label="Notificações">
                <Bell className="h-5 w-5 text-muted-foreground" />
                <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-destructive" />
              </Button>
            </div>
          </header>

          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
    </TooltipProvider>
  );
}
