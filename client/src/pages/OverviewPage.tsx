import { useCampaignStore, useDailyActuals } from "@/hooks/useCampaignStore";
import { buildDayData, getChannelAlerts, fmtCOP, fmtNum, fmtPct, CHANNEL_META, type TrafficLight } from "@/lib/campaign-utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, TrendingUp, TrendingDown, Minus, DollarSign, Eye, MousePointerClick, Target, Users } from "lucide-react";
import { Link } from "wouter";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend
} from "recharts";

function TrafficDot({ status }: { status: TrafficLight }) {
  const cls = {
    green: "status-green",
    yellow: "status-yellow",
    red: "status-red",
    na: "bg-muted-foreground",
  }[status];
  return <span className={`inline-block w-3 h-3 rounded-full ${cls} flex-shrink-0`} />;
}

function KpiCard({ label, value, sub, trend, icon: Icon, color }: {
  label: string; value: string; sub?: string; trend?: "up" | "down" | "flat"; icon: any; color: string;
}) {
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendColor = trend === "up" ? "text-green-500" : trend === "down" ? "text-red-500" : "text-muted-foreground";
  return (
    <div className="bg-card border border-border rounded-xl p-5 fade-up">
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{label}</p>
        <div className="p-2 rounded-lg" style={{ backgroundColor: `${color}22` }}>
          <Icon size={16} style={{ color }} />
        </div>
      </div>
      <p className="text-xl font-bold text-foreground tabular">{value}</p>
      {sub && (
        <div className={`flex items-center gap-1 mt-1.5 text-xs ${trendColor}`}>
          {trend && <TrendIcon size={12} />}
          <span>{sub}</span>
        </div>
      )}
    </div>
  );
}

export default function OverviewPage() {
  const { campaign, isLoading: loadingCampaign } = useCampaignStore();
  const { data: actuals = [], isLoading: loadingActuals } = useDailyActuals(campaign?.id);

  if (loadingCampaign || loadingActuals) {
    return (
      <div className="p-6 space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-8">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Target size={28} className="text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground mb-1">Sin campaña configurada</h2>
          <p className="text-sm text-muted-foreground max-w-xs">
            Ve a Configuración para crear tu campaña con presupuesto y proyecciones.
          </p>
        </div>
        <Link
          href="/settings"
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          Configurar campaña
        </Link>
      </div>
    );
  }

  const dayData = buildDayData(campaign, actuals);
  const alerts = getChannelAlerts(campaign, actuals);
  // Consider any day that has any real data (spend, imp, clicks or reach)
  const daysWithData = dayData.filter(d =>
    d.totalSpendReal > 0 || d.totalImpReal > 0 || d.totalClicksReal > 0 || d.totalReachReal > 0
  );
  const lastDay = daysWithData[daysWithData.length - 1];
  const dayCount = daysWithData.length;

  // Cumulative KPIs
  const totalSpendReal = dayData.reduce((s, d) => s + d.totalSpendReal, 0);
  const totalSpendProj = campaign.totalBudget;
  const spendSoFarProj = (campaign.totalBudget / campaign.durationDays) * dayCount;
  const totalImpReal = dayData.reduce((s, d) => s + d.totalImpReal, 0);
  const totalImpProj = dayData.reduce((s, d) => s + d.totalImpProj, 0);
  const totalClicksReal = dayData.reduce((s, d) => s + d.totalClicksReal, 0);
  const totalClicksProj = dayData.reduce((s, d) => s + d.totalClicksProj, 0);
  const ctrReal = totalImpReal > 0 ? totalClicksReal / totalImpReal : 0;
  const totalReachReal = dayData.reduce((s, d) => s + d.totalReachReal, 0);
  const reachGoal = campaign.reachGoal || 1;
  const reachPacing = totalReachReal / reachGoal;
  const cprReal = totalReachReal > 0 ? totalSpendReal / totalReachReal : 0;
  const pacingRatio = spendSoFarProj > 0 ? totalSpendReal / spendSoFarProj : 0;
  const budgetRemaining = totalSpendProj - totalSpendReal;

  // Trend vs prev day
  const prevDay = daysWithData[daysWithData.length - 2];
  const spendTrend = prevDay && lastDay
    ? lastDay.totalSpendReal > prevDay.totalSpendReal ? "up" : "down"
    : "flat";

  // Chart data — cumulative spend pacing
  // Real line only shows up to the last day with actual data (no flat future extension)
  const lastDayWithData = daysWithData.length > 0 ? daysWithData[daysWithData.length - 1].day : 0;
  const pacingChartData = dayData.map((d, i) => ({
    day: `D${d.day}`,
    real: d.day <= lastDayWithData
      ? parseFloat((dayData.slice(0, i + 1).reduce((s, x) => s + x.totalSpendReal, 0) / 1000).toFixed(1))
      : null,
    proyectado: parseFloat(((campaign.totalBudget / campaign.durationDays) * (i + 1) / 1000).toFixed(1)),
    hasData: d.totalSpendReal > 0,
  }));

  // Daily spend bar chart — only days with actual data
  const dailyBarData = dayData.filter(d => d.totalSpendReal > 0).map(d => ({
    day: `D${d.day}`,
    IG: Math.round(d.spendIG / 1000),
    FB: Math.round(d.spendFB / 1000),
    GS: Math.round(d.spendGS / 1000),
    GD: Math.round(d.spendGD / 1000),
  }));

  return (
    <div className="p-6 space-y-6">
      {/* KPI Cards */}
      <section>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <KpiCard
            label="Inversión Acumulada"
            value={fmtCOP(totalSpendReal)}
            sub={`${fmtPct(totalSpendReal / totalSpendProj)} del presupuesto`}
            trend={pacingRatio >= 0.9 ? "up" : "down"}
            icon={DollarSign}
            color="#4f98a3"
          />
          <KpiCard
            label="Impresiones Reales"
            value={fmtNum(totalImpReal)}
            sub={dayCount > 0 ? `Meta parcial: ${fmtNum(dayData.slice(0, dayCount).reduce((s, d) => s + d.totalImpProj, 0))}` : "Sin datos"}
            trend={totalImpReal > 0 ? (totalImpReal >= dayData.slice(0, dayCount).reduce((s, d) => s + d.totalImpProj, 0) * 0.9 ? "up" : "down") : "flat"}
            icon={Eye}
            color="#E1306C"
          />
          <KpiCard
            label="Clicks Totales"
            value={fmtNum(totalClicksReal)}
            sub={`CTR real: ${fmtPct(ctrReal)}`}
            trend={dayCount > 0 ? (ctrReal >= (dayData[0]?.ctrProjTotal ?? 0) * 0.9 ? "up" : "down") : "flat"}
            icon={MousePointerClick}
            color="#34A853"
          />
          <KpiCard
            label="Pacing Presupuestal"
            value={fmtPct(pacingRatio)}
            sub={dayCount > 0 ? `Día ${dayCount} de ${campaign.durationDays}` : "Sin datos aún"}
            trend={pacingRatio >= 0.9 && pacingRatio <= 1.15 ? "up" : pacingRatio < 0.75 ? "down" : "flat"}
            icon={Target}
            color="#FBBC05"
          />
          <KpiCard
            label="Alcance Total"
            value={fmtNum(totalReachReal)}
            sub={`${fmtPct(reachPacing)} del objetivo (${fmtNum(reachGoal)})`}
            trend={reachPacing >= 0.9 ? "up" : "flat"}
            icon={Users}
            color="#8B5CF6"
          />
        </div>
      </section>

      {/* Traffic Light Alerts */}
      <section>
        <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <AlertTriangle size={15} />
          Semáforo de canales
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {alerts.map(alert => (
            <div
              key={alert.channel}
              data-testid={`alert-${alert.channel}`}
              className="bg-card border border-border rounded-xl p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold text-white"
                  style={{ backgroundColor: alert.color }}>
                  {alert.channel === "instagram" ? "Meta" : alert.channel === "facebook" ? "PILAS" : alert.channel === "googleSearch" ? "YT" : "GD"}
                </div>
                <span className="text-sm font-semibold text-foreground">{alert.label}</span>
                <TrafficDot status={alert.status} />
              </div>
              <p className="text-xs text-muted-foreground mb-2">{alert.message}</p>
              {alert.status !== "na" && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Pacing</span>
                    <span className={`tabular font-medium ${alert.spendPacing < 0.75 ? "text-red-500" : alert.spendPacing > 1.15 ? "text-yellow-500" : "text-green-500"}`}>
                      {fmtPct(alert.spendPacing)}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5">
                    <div
                      className="h-1.5 rounded-full transition-all"
                      style={{
                        width: `${Math.min(alert.spendPacing * 100, 100)}%`,
                        backgroundColor: alert.spendPacing < 0.75 ? "#ef4444" : alert.spendPacing > 1.15 ? "#eab308" : "#22c55e"
                      }}
                    />
                  </div>
                  {alert.ctrRatio > 0 && (
                    <div className="flex justify-between text-xs mt-1">
                      <span className="text-muted-foreground">CTR vs Objetivo</span>
                      <span className={`tabular font-medium ${alert.ctrRatio < 0.65 ? "text-red-500" : alert.ctrRatio < 0.85 ? "text-yellow-500" : "text-green-500"}`}>
                        {fmtPct(alert.ctrRatio)}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Pacing chart */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">Pacing acumulado (COP miles)</h2>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={pacingChartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="gradReal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f98a3" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#4f98a3" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradProj" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FBBC05" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#FBBC05" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: 12 }}
                formatter={(v: any, name: string) => [`$${v}k`, name === "real" ? "Real" : "Proyectado"]}
              />
              <Area type="monotone" dataKey="proyectado" stroke="#FBBC05" fill="url(#gradProj)" strokeWidth={1.5} strokeDasharray="4 2" dot={false} name="proyectado" />
              <Area type="monotone" dataKey="real" stroke="#4f98a3" fill="url(#gradReal)" strokeWidth={2} dot={false} name="real" connectNulls={false} />
            </AreaChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-2 justify-center">
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><span className="w-4 h-0.5 bg-[#4f98a3] inline-block" />Real</span>
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><span className="w-4 h-0.5 bg-[#FBBC05] inline-block" />Proyectado</span>
          </div>
        </div>

        {/* Daily bar chart by channel */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">Inversión diaria por canal (COP miles)</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={dailyBarData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: 12 }}
                formatter={(v: any) => [`$${v}k`]}
              />
              <Bar dataKey="IG" fill="#E1306C" stackId="a" radius={[0, 0, 0, 0]} />
              <Bar dataKey="FB" fill="#1877F2" stackId="a" />
              <Bar dataKey="GS" fill="#34A853" stackId="a" />
              <Bar dataKey="GD" fill="#FBBC05" stackId="a" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-3 mt-2 justify-center">
            {[["Meta", "#E1306C", "Meta Suite"], ["PILAS", "#1877F2", "PILAS.COL"], ["YT", "#34A853", "Youtube"], ["GD", "#FBBC05", "Google D."]].map(([k, c, l]) => (
              <span key={k} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: c as string }} />{l}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Budget summary */}
      <section className="bg-card border border-border rounded-xl p-5">
        <h2 className="text-sm font-semibold text-foreground mb-4">Resumen presupuestal</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {(["instagram", "facebook", "googleSearch", "googleDisplay"] as const).map(ch => {
            const meta = CHANNEL_META[ch];
            const totalReal = actuals.reduce((s, a) => {
              const key = `spend${ch === "instagram" ? "Instagram" : ch === "facebook" ? "Facebook" : ch === "googleSearch" ? "GoogleSearch" : "GoogleDisplay"}` as keyof typeof a;
              return s + ((a[key] as number) ?? 0);
            }, 0);
            const totalBudget = campaign.totalBudget * (
              ch === "instagram" ? campaign.pctInstagram :
                ch === "facebook" ? campaign.pctFacebook :
                  ch === "googleSearch" ? campaign.pctGoogleSearch :
                    campaign.pctGoogleDisplay
            );
            const pct = totalBudget > 0 ? totalReal / totalBudget : 0;
            return (
              <div key={ch} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold" style={{ color: meta.color }}>{meta.label}</span>
                  <span className="text-xs tabular text-muted-foreground">{fmtPct(pct)}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="h-2 rounded-full transition-all" style={{ width: `${Math.min(pct * 100, 100)}%`, backgroundColor: meta.color }} />
                </div>
                <div className="flex justify-between text-xs tabular">
                  <span className="text-foreground font-medium">{fmtCOP(totalReal)}</span>
                  <span className="text-muted-foreground">/ {fmtCOP(totalBudget)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}