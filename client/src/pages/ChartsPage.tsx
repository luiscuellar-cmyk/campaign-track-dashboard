import { useState } from "react";
import { useCampaignStore, useDailyActuals } from "@/hooks/useCampaignStore";
import { buildDayData, fmtCOP, fmtNum, fmtPct, CHANNEL_META } from "@/lib/campaign-utils";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, ReferenceLine, Cell
} from "recharts";

const TOOLTIP_STYLE = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "8px",
  fontSize: 11,
};

function ChartCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

export default function ChartsPage() {
  const { campaign } = useCampaignStore();
  const { data: actuals = [], isLoading } = useDailyActuals(campaign?.id);
  const [activeChannel, setActiveChannel] = useState<string | null>(null);

  if (!campaign) return (
    <div className="flex items-center justify-center h-full p-8 text-center">
      <p className="text-muted-foreground">Configura una campaña primero.</p>
    </div>
  );

  if (isLoading) return (
    <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
      {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-64 rounded-xl" />)}
    </div>
  );

  const dayData = buildDayData(campaign, actuals);
  const daysWithData = dayData.filter(d => d.totalSpendReal > 0);

  // ── Chart datasets ──────────────────────────────────────────────

  // 1. Real vs Projected — daily spend
  const realVsProjData = dayData.map(d => ({
    day: `D${d.day}`,
    real: d.totalSpendReal > 0 ? Math.round(d.totalSpendReal / 1000) : null,
    proyectado: Math.round(d.totalSpendProj / 1000),
  }));

  // 2. Impressions Real vs Projected
  const impData = dayData.map(d => ({
    day: `D${d.day}`,
    real: d.totalImpReal > 0 ? Math.round(d.totalImpReal) : null,
    proyectado: Math.round(d.totalImpProj),
  }));

  // 3. CTR trend by channel
  const ctrData = dayData.map(d => ({
    day: `D${d.day}`,
    IG: d.impIG > 0 ? parseFloat((d.ctrRealIG * 100).toFixed(3)) : null,
    FB: d.impFB > 0 ? parseFloat((d.ctrRealFB * 100).toFixed(3)) : null,
    GS: d.impGS > 0 ? parseFloat((d.ctrRealGS * 100).toFixed(3)) : null,
    GD: d.impGD > 0 ? parseFloat((d.ctrRealGD * 100).toFixed(3)) : null,
    projIG: parseFloat((campaign.ctrInstagram * 100).toFixed(3)),
    projFB: parseFloat((campaign.ctrFacebook * 100).toFixed(3)),
    projGS: parseFloat((campaign.ctrGoogleSearch * 100).toFixed(3)),
    projGD: parseFloat((campaign.ctrGoogleDisplay * 100).toFixed(3)),
  }));

  // 4. Cumulative budget pacing
  // real line only extends up to the last day with actual data
  const lastDataDay = daysWithData.length > 0 ? daysWithData[daysWithData.length - 1].day : 0;
  let cumReal = 0;
  let cumProj = 0;
  const pacingData = dayData.map(d => {
    cumReal += d.totalSpendReal;
    cumProj += d.totalSpendProj;
    return {
      day: `D${d.day}`,
      real: d.day <= lastDataDay ? Math.round(cumReal / 1000) : null,
      proyectado: Math.round(cumProj / 1000),
    };
  });

  // 5. Clicks per channel bar
  const clicksData = dayData.map(d => ({
    day: `D${d.day}`,
    IG: d.clicksIG > 0 ? d.clicksIG : null,
    FB: d.clicksFB > 0 ? d.clicksFB : null,
    GS: d.clicksGS > 0 ? d.clicksGS : null,
    GD: d.clicksGD > 0 ? d.clicksGD : null,
    projIG: Math.round(d.projClicksIG),
    projFB: Math.round(d.projClicksFB),
    projGS: Math.round(d.projClicksGS),
    projGD: Math.round(d.projClicksGD),
  }));

  // 6. Channel share of spend real vs projected
  const channelShareData = [
    { name: "Instagram", real: Math.round(actuals.reduce((s, a) => s + a.spendInstagram, 0) / 1000), proj: Math.round(campaign.totalBudget * campaign.pctInstagram / 1000) },
    { name: "Facebook", real: Math.round(actuals.reduce((s, a) => s + a.spendFacebook, 0) / 1000), proj: Math.round(campaign.totalBudget * campaign.pctFacebook / 1000) },
    { name: "Google Search", real: Math.round(actuals.reduce((s, a) => s + a.spendGoogleSearch, 0) / 1000), proj: Math.round(campaign.totalBudget * campaign.pctGoogleSearch / 1000) },
    { name: "Google Display", real: Math.round(actuals.reduce((s, a) => s + a.spendGoogleDisplay, 0) / 1000), proj: Math.round(campaign.totalBudget * campaign.pctGoogleDisplay / 1000) },
  ];

  const CHANNEL_COLORS_ARR = ["#E1306C", "#1877F2", "#34A853", "#FBBC05"];

  if (daysWithData.length === 0) {
    return (
      <div className="p-6">
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <p className="text-muted-foreground text-sm">No hay datos reales aún.</p>
          <p className="text-xs text-muted-foreground mt-1">Ve a "Ingresar Datos" para cargar la inversión diaria.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      {/* Channel filter pills */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setActiveChannel(null)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${!activeChannel ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}
        >
          Todos
        </button>
        {[["instagram", "IG", "#E1306C"], ["facebook", "FB", "#1877F2"], ["googleSearch", "GS", "#34A853"], ["googleDisplay", "GD", "#FBBC05"]].map(([ch, abbr, color]) => (
          <button
            key={ch}
            onClick={() => setActiveChannel(activeChannel === ch ? null : ch as string)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors`}
            style={{
              backgroundColor: activeChannel === ch ? color as string : `${color}22`,
              color: activeChannel === ch ? "#fff" : color as string,
            }}
          >
            {CHANNEL_META[ch as keyof typeof CHANNEL_META].label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 1. Daily Spend Real vs Projected */}
        <ChartCard title="Inversión Diaria — Real vs Proyectado" subtitle="COP miles">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={realVsProjData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any, n) => [`$${v}k`, n === "real" ? "Real" : "Proyectado"]} />
              <Bar dataKey="proyectado" fill="hsl(var(--muted))" radius={[3, 3, 0, 0]} name="proyectado" />
              <Bar dataKey="real" fill="#4f98a3" radius={[3, 3, 0, 0]} name="real" />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-2 justify-center">
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><span className="w-3 h-3 rounded bg-[#4f98a3] inline-block" />Real</span>
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><span className="w-3 h-3 rounded bg-muted inline-block" />Proyectado</span>
          </div>
        </ChartCard>

        {/* 2. Budget Pacing Cumulative */}
        <ChartCard title="Pacing Presupuestal Acumulado" subtitle="COP miles — meta vs real acumulado">
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={pacingData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="gradR2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f98a3" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#4f98a3" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any, n) => [`$${v}k`, n === "real" ? "Real" : "Proyectado"]} />
              <Area type="monotone" dataKey="proyectado" stroke="#FBBC05" fill="none" strokeDasharray="4 2" strokeWidth={1.5} name="proyectado" />
              <Area type="monotone" dataKey="real" stroke="#4f98a3" fill="url(#gradR2)" strokeWidth={2} connectNulls name="real" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* 3. CTR Trend by Channel */}
        <ChartCard title="Tendencia CTR por Canal (%)" subtitle="CTR real diario vs meta punteada">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={ctrData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any) => [`${v}%`]} />
              {(!activeChannel || activeChannel === "instagram") && (
                <>
                  <Line type="monotone" dataKey="IG" stroke="#E1306C" strokeWidth={2} dot={false} connectNulls name="Meta Real" />
                  <Line type="monotone" dataKey="projIG" stroke="#E1306C" strokeWidth={1} strokeDasharray="3 2" dot={false} name="Meta Meta" />
                </>
              )}
              {(!activeChannel || activeChannel === "facebook") && (
                <>
                  <Line type="monotone" dataKey="FB" stroke="#1877F2" strokeWidth={2} dot={false} connectNulls name="Comitium Real" />
                  <Line type="monotone" dataKey="projFB" stroke="#1877F2" strokeWidth={1} strokeDasharray="3 2" dot={false} name="Comitium Meta" />
                </>
              )}
              {(!activeChannel || activeChannel === "googleSearch") && (
                <>
                  <Line type="monotone" dataKey="GS" stroke="#34A853" strokeWidth={2} dot={false} connectNulls name="Youtube Real" />
                  <Line type="monotone" dataKey="projGS" stroke="#34A853" strokeWidth={1} strokeDasharray="3 2" dot={false} name="Youtube Meta" />
                </>
              )}
              {(!activeChannel || activeChannel === "googleDisplay") && (
                <>
                  <Line type="monotone" dataKey="GD" stroke="#FBBC05" strokeWidth={2} dot={false} connectNulls name="GD Real" />
                  <Line type="monotone" dataKey="projGD" stroke="#FBBC05" strokeWidth={1} strokeDasharray="3 2" dot={false} name="GD Meta" />
                </>
              )}
            </LineChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-3 mt-2 justify-center">
            {[["Meta", "#E1306C"], ["Com", "#1877F2"], ["YT", "#34A853"], ["GD", "#FBBC05"]].map(([k, c]) => (
              <span key={k} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="w-4 h-0.5 inline-block" style={{ backgroundColor: c }} />{k}
                <span className="text-muted-foreground/50">— meta</span>
              </span>
            ))}
          </div>
        </ChartCard>

        {/* 4. Channel Spend Real vs Budget — custom bars */}
        <ChartCard title="Presupuesto Ejecutado por Canal" subtitle="COP miles — real vs asignado total">
          <div className="space-y-4 mt-2">
            {channelShareData.map((ch, i) => {
              const pct = ch.proj > 0 ? ch.real / ch.proj : 0;
              return (
                <div key={ch.name} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold" style={{ color: CHANNEL_COLORS_ARR[i] }}>{ch.name}</span>
                    <span className="tabular text-muted-foreground">${ch.real}k / ${ch.proj}k &nbsp;<span className="font-medium" style={{ color: CHANNEL_COLORS_ARR[i] }}>({(pct * 100).toFixed(0)}%)</span></span>
                  </div>
                  {/* Budget bar */}
                  <div className="relative w-full h-5 rounded-md overflow-hidden bg-muted">
                    <div className="absolute inset-0 flex items-center">
                      <div
                        className="h-full rounded-md transition-all"
                        style={{ width: `${Math.min(pct * 100, 100)}%`, backgroundColor: CHANNEL_COLORS_ARR[i], opacity: 0.85 }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ChartCard>

        {/* 5. Daily Impressions Real vs Projected */}
        <ChartCard title="Impresiones Diarias — Real vs Proyectado" subtitle="Impresiones totales por día">
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={impData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="gradImp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a86fdf" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#a86fdf" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any, n) => [v?.toLocaleString("es-CO"), n === "real" ? "Real" : "Proyectado"]} />
              <Area type="monotone" dataKey="proyectado" stroke="#FBBC05" fill="none" strokeDasharray="4 2" strokeWidth={1.5} name="proyectado" />
              <Area type="monotone" dataKey="real" stroke="#a86fdf" fill="url(#gradImp)" strokeWidth={2} connectNulls name="real" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* 6. Daily Clicks */}
        <ChartCard title="Clicks Diarios por Canal" subtitle="Clicks reales acumulados por canal">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={clicksData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              {(!activeChannel || activeChannel === "instagram") && <Bar dataKey="IG" fill="#E1306C" stackId="a" name="Meta" />}
              {(!activeChannel || activeChannel === "facebook") && <Bar dataKey="FB" fill="#1877F2" stackId="a" name="Comitium" />}
              {(!activeChannel || activeChannel === "googleSearch") && <Bar dataKey="GS" fill="#34A853" stackId="a" name="Youtube" />}
              {(!activeChannel || activeChannel === "googleDisplay") && <Bar dataKey="GD" fill="#FBBC05" stackId="a" radius={[3, 3, 0, 0]} name="Google D." />}
            </BarChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-3 mt-2 justify-center">
            {[["Meta", "#E1306C"], ["Comitium", "#1877F2"], ["Youtube", "#34A853"], ["Google D.", "#FBBC05"]].map(([l, c]) => (
              <span key={l} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: c }} />{l}
              </span>
            ))}
          </div>
        </ChartCard>
      </div>
    </div>
  );
}