import { Link, useLocation } from "wouter";
import { useTheme } from "@/components/ThemeProvider";
import { useCampaignStore } from "@/hooks/useCampaignStore";
import { LayoutDashboard, BarChart3, Upload, Settings, Sun, Moon, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Vista General", icon: LayoutDashboard },
  { href: "/data", label: "Ingresar Datos", icon: Upload },
  { href: "/charts", label: "Análisis", icon: BarChart3 },
  { href: "/settings", label: "Configuración", icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { theme, toggle } = useTheme();
  const { campaign } = useCampaignStore();

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className="dashboard-sidebar bg-card border-r border-border flex flex-col">
        {/* Logo */}
        <div className="p-5 border-b border-border">
          <div className="flex items-center gap-3">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-label="CampaignTrack">
              <rect width="32" height="32" rx="8" fill="hsl(var(--primary))"/>
              <path d="M6 22 L11 14 L16 18 L21 10 L26 14" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              <circle cx="26" cy="14" r="2.5" fill="white"/>
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
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href}>
              <a
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
              </a>
            </Link>
          ))}
        </nav>

        {/* Theme toggle */}
        <div className="p-4 border-t border-border">
          <button
            onClick={toggle}
            data-testid="btn-theme-toggle"
            className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            {theme === "dark" ? "Modo claro" : "Modo oscuro"}
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
          <span className="flex items-center gap-1.5 text-xs text-green-500 font-medium">
            <span className="w-2 h-2 rounded-full status-green pulse-dot inline-block" />
            17 días · en vivo
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
