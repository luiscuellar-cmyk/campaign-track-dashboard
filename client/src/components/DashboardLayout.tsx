import { Link, useLocation } from "wouter";
import { useTheme } from "@/components/ThemeProvider";
import { useAuth } from "@/components/AuthContext";
import { useCampaignStore } from "@/hooks/useCampaignStore";
import { canAccess } from "@/lib/auth";
import {
  LayoutDashboard, BarChart3, Upload, Settings,
  Sun, Moon, LogOut, ShieldCheck, Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Vista General", icon: LayoutDashboard, roles: ["admin", "lector"] },
  { href: "/datos", label: "Ingresar Datos", icon: Upload, roles: ["admin"] },
  { href: "/graficas", label: "Análisis", icon: BarChart3, roles: ["admin", "lector"] },
  { href: "/configuracion", label: "Configuración", icon: Settings, roles: ["admin"] },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { theme, toggle } = useTheme();
  const { campaign } = useCampaignStore();
  const { user, logout } = useAuth();

  const role = user?.role ?? "lector";
  const visibleNav = NAV_ITEMS.filter((item) => canAccess(role, item.href));

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className="dashboard-sidebar bg-card border-r border-border flex flex-col">
        {/* Logo */}
        <div className="p-5 border-b border-border">
          <div className="flex items-center gap-3">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-label="CampaignTrack">
              <rect width="32" height="32" rx="8" fill="hsl(var(--primary))" />
              <path d="M6 22 L11 14 L16 18 L21 10 L26 14" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              <circle cx="26" cy="14" r="2.5" fill="white" />
            </svg>
            <div>
              <p className="font-bold text-sm text-foreground leading-none">CampaignTrack</p>
              <p className="text-xs text-muted-foreground mt-0.5">Media Plan Monitor</p>
            </div>
          </div>
        </div>

        {/* Campaign info */}
        {campaign && (
          <div className="px-4 py-3 border-b border-border">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Campaña activa</p>
            <p className="text-sm font-semibold text-foreground truncate" data-testid="sidebar-campaign-name">{campaign.name}</p>
            <p className="text-xs text-muted-foreground tabular">
              {new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(campaign.totalBudget)}
            </p>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1">
          {visibleNav.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              data-testid={`nav-${label.toLowerCase().replace(/\s+/g, "-")}`}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                location === href
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <Icon size={16} />
              {label}
            </Link>
          ))}
        </nav>

        {/* User + controls */}
        <div className="p-4 border-t border-border space-y-1">
          {/* User info */}
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-md bg-muted/50 mb-2">
            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
              {role === "admin"
                ? <ShieldCheck size={13} className="text-primary" />
                : <Eye size={13} className="text-primary" />}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-foreground truncate">{user?.username}</p>
              <p className="text-[10px] text-muted-foreground capitalize">{role === "admin" ? "Administrador" : "Lector"}</p>
            </div>
          </div>

          {/* Theme toggle */}
          <button
            onClick={toggle}
            data-testid="btn-theme-toggle"
            className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            {theme === "dark" ? "Modo claro" : "Modo oscuro"}
          </button>

          {/* Logout */}
          <button
            onClick={logout}
            data-testid="btn-logout"
            className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
          >
            <LogOut size={16} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Header */}
      <header className="dashboard-header bg-card/80 backdrop-blur border-b border-border px-6 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-foreground">
            {NAV_ITEMS.find(n => n.href === location)?.label ?? "Dashboard"}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-xs text-red-500 font-semibold tracking-widest uppercase">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
            </span>
            En vivo
          </span>
        </div>
      </header>

      {/* Main content */}
      <main className="dashboard-main bg-background">
        {children}
      </main>
    </div>
  );
}