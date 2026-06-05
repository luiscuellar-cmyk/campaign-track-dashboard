import type { Campaign, DailyActual } from "@shared/schema";

export const CHANNELS = ["instagram", "facebook", "googleSearch", "googleDisplay"] as const;
export type ChannelKey = typeof CHANNELS[number];

export const CHANNEL_META: Record<ChannelKey, { label: string; color: string; cssVar: string; icon: string }> = {
  instagram: { label: "Instagram", color: "#E1306C", cssVar: "--ig-color", icon: "IG" },
  facebook: { label: "Facebook", color: "#1877F2", cssVar: "--fb-color", icon: "FB" },
  googleSearch: { label: "Google Search", color: "#34A853", cssVar: "--gs-color", icon: "GS" },
  googleDisplay: { label: "Google Display", color: "#FBBC05", cssVar: "--gd-color", icon: "GD" },
};

// Budget allocation per channel from campaign config
export function getChannelBudget(campaign: Campaign, ch: ChannelKey): number {
  const pctMap: Record<ChannelKey, number> = {
    instagram: campaign.pctInstagram,
    facebook: campaign.pctFacebook,
    googleSearch: campaign.pctGoogleSearch,
    googleDisplay: campaign.pctGoogleDisplay,
  };
  return campaign.totalBudget * pctMap[ch];
}

// Projected daily spend (equal distribution baseline)
export function getDailyProjected(campaign: Campaign): number {
  return campaign.totalBudget / campaign.durationDays;
}

// Per-channel projected spend per day
export function getChannelDailyProjected(campaign: Campaign, ch: ChannelKey): number {
  return getChannelBudget(campaign, ch) / campaign.durationDays;
}

// Projected impressions from spend and CPM
export function projectedImpressions(spend: number, cpm: number): number {
  return cpm > 0 ? (spend / cpm) * 1000 : 0;
}

// Projected clicks from impressions and CTR
export function projectedClicks(impressions: number, ctr: number): number {
  return impressions * ctr;
}

// CPM map from campaign
export function getCPM(campaign: Campaign, ch: ChannelKey): number {
  const map: Record<ChannelKey, number> = {
    instagram: campaign.cpmInstagram,
    facebook: campaign.cpmFacebook,
    googleSearch: campaign.cpmGoogleSearch,
    googleDisplay: campaign.cpmGoogleDisplay,
  };
  return map[ch];
}

// CTR map from campaign
export function getCTR(campaign: Campaign, ch: ChannelKey): number {
  const map: Record<ChannelKey, number> = {
    instagram: campaign.ctrInstagram,
    facebook: campaign.ctrFacebook,
    googleSearch: campaign.ctrGoogleSearch,
    googleDisplay: campaign.ctrGoogleDisplay,
  };
  return map[ch];
}

// ─── Aggregate helpers ────────────────────────────────────────────

export interface DayData {
  day: number;
  date?: string;
  // Totals
  totalSpendReal: number;
  totalImpReal: number;
  totalClicksReal: number;
  totalSpendProj: number;
  totalImpProj: number;
  totalClicksProj: number;
  // Per channel real
  spendIG: number; spendFB: number; spendGS: number; spendGD: number;
  impIG: number; impFB: number; impGS: number; impGD: number;
  clicksIG: number; clicksFB: number; clicksGS: number; clicksGD: number;
  // Per channel projected
  projSpendIG: number; projSpendFB: number; projSpendGS: number; projSpendGD: number;
  projImpIG: number; projImpFB: number; projImpGS: number; projImpGD: number;
  projClicksIG: number; projClicksFB: number; projClicksGS: number; projClicksGD: number;
  // CTRs
  ctrRealIG: number; ctrRealFB: number; ctrRealGS: number; ctrRealGD: number;
  ctrProjIG: number; ctrProjFB: number; ctrProjGS: number; ctrProjGD: number;
  ctrRealTotal: number;
  ctrProjTotal: number;
  // CPC
  cpcRealTotal: number;
}

export function buildDayData(campaign: Campaign, actuals: DailyActual[]): DayData[] {
  const daysCount = campaign.durationDays;
  const results: DayData[] = [];

  for (let d = 1; d <= daysCount; d++) {
    const actual = actuals.find(a => a.day === d);

    // Daily projected (equal split)
    const pSpendIG = getChannelDailyProjected(campaign, "instagram");
    const pSpendFB = getChannelDailyProjected(campaign, "facebook");
    const pSpendGS = getChannelDailyProjected(campaign, "googleSearch");
    const pSpendGD = getChannelDailyProjected(campaign, "googleDisplay");

    const pImpIG = projectedImpressions(pSpendIG, getCPM(campaign, "instagram"));
    const pImpFB = projectedImpressions(pSpendFB, getCPM(campaign, "facebook"));
    const pImpGS = projectedImpressions(pSpendGS, getCPM(campaign, "googleSearch"));
    const pImpGD = projectedImpressions(pSpendGD, getCPM(campaign, "googleDisplay"));

    const pClicksIG = projectedClicks(pImpIG, getCTR(campaign, "instagram"));
    const pClicksFB = projectedClicks(pImpFB, getCTR(campaign, "facebook"));
    const pClicksGS = projectedClicks(pImpGS, getCTR(campaign, "googleSearch"));
    const pClicksGD = projectedClicks(pImpGD, getCTR(campaign, "googleDisplay"));

    const totalSpendProj = pSpendIG + pSpendFB + pSpendGS + pSpendGD;
    const totalImpProj = pImpIG + pImpFB + pImpGS + pImpGD;
    const totalClicksProj = pClicksIG + pClicksFB + pClicksGS + pClicksGD;

    // Actual data (0 if not entered)
    const spendIG = actual?.spendInstagram ?? 0;
    const spendFB = actual?.spendFacebook ?? 0;
    const spendGS = actual?.spendGoogleSearch ?? 0;
    const spendGD = actual?.spendGoogleDisplay ?? 0;
    const impIG = actual?.impInstagram ?? 0;
    const impFB = actual?.impFacebook ?? 0;
    const impGS = actual?.impGoogleSearch ?? 0;
    const impGD = actual?.impGoogleDisplay ?? 0;
    const clicksIG = actual?.clicksInstagram ?? 0;
    const clicksFB = actual?.clicksFacebook ?? 0;
    const clicksGS = actual?.clicksGoogleSearch ?? 0;
    const clicksGD = actual?.clicksGoogleDisplay ?? 0;

    const totalSpendReal = spendIG + spendFB + spendGS + spendGD;
    const totalImpReal = impIG + impFB + impGS + impGD;
    const totalClicksReal = clicksIG + clicksFB + clicksGS + clicksGD;

    const ctrRealIG = impIG > 0 ? clicksIG / impIG : 0;
    const ctrRealFB = impFB > 0 ? clicksFB / impFB : 0;
    const ctrRealGS = impGS > 0 ? clicksGS / impGS : 0;
    const ctrRealGD = impGD > 0 ? clicksGD / impGD : 0;
    const ctrRealTotal = totalImpReal > 0 ? totalClicksReal / totalImpReal : 0;

    const ctrProjIG = getCTR(campaign, "instagram");
    const ctrProjFB = getCTR(campaign, "facebook");
    const ctrProjGS = getCTR(campaign, "googleSearch");
    const ctrProjGD = getCTR(campaign, "googleDisplay");
    const ctrProjTotal = totalImpProj > 0 ? totalClicksProj / totalImpProj : 0;

    const cpcRealTotal = totalClicksReal > 0 ? totalSpendReal / totalClicksReal : 0;

    results.push({
      day: d,
      date: actual?.date ?? undefined,
      totalSpendReal, totalImpReal, totalClicksReal,
      totalSpendProj, totalImpProj, totalClicksProj,
      spendIG, spendFB, spendGS, spendGD,
      impIG, impFB, impGS, impGD,
      clicksIG, clicksFB, clicksGS, clicksGD,
      projSpendIG: pSpendIG, projSpendFB: pSpendFB, projSpendGS: pSpendGS, projSpendGD: pSpendGD,
      projImpIG: pImpIG, projImpFB: pImpFB, projImpGS: pImpGS, projImpGD: pImpGD,
      projClicksIG: pClicksIG, projClicksFB: pClicksFB, projClicksGS: pClicksGS, projClicksGD: pClicksGD,
      ctrRealIG, ctrRealFB, ctrRealGS, ctrRealGD,
      ctrProjIG, ctrProjFB, ctrProjGS, ctrProjGD,
      ctrRealTotal, ctrProjTotal,
      cpcRealTotal,
    });
  }

  return results;
}

// ─── Traffic-light logic ────────────────────────────────────────────────
export type TrafficLight = "green" | "yellow" | "red" | "na";

export interface ChannelAlert {
  channel: ChannelKey;
  label: string;
  color: string;
  status: TrafficLight;
  spendPacing: number;  // ratio real / projected so far
  ctrRatio: number;     // real CTR / projected CTR
  message: string;
}

export function getChannelAlerts(campaign: Campaign, actuals: DailyActual[]): ChannelAlert[] {
  const completedDays = actuals.filter(a =>
    (a.spendInstagram + a.spendFacebook + a.spendGoogleSearch + a.spendGoogleDisplay) > 0
  ).length;

  if (completedDays === 0) {
    return CHANNELS.map(ch => ({
      channel: ch,
      label: CHANNEL_META[ch].label,
      color: CHANNEL_META[ch].color,
      status: "na" as TrafficLight,
      spendPacing: 0,
      ctrRatio: 0,
      message: "Sin datos aún",
    }));
  }

  return CHANNELS.map(ch => {
    const meta = CHANNEL_META[ch];
    const projDailySpend = getChannelDailyProjected(campaign, ch);
    const projTotalSoFar = projDailySpend * completedDays;

    const spendKey = `spend${ch.charAt(0).toUpperCase() + ch.slice(1)}` as keyof DailyActual;
    const impKey = `imp${ch.charAt(0).toUpperCase() + ch.slice(1)}` as keyof DailyActual;
    const clkKey = `clicks${ch.charAt(0).toUpperCase() + ch.slice(1)}` as keyof DailyActual;

    const realSpendTotal = actuals.reduce((s, a) => s + ((a as any)[`spend${cap(ch)}`] ?? 0), 0);
    const realImpTotal = actuals.reduce((s, a) => s + ((a as any)[`imp${cap(ch)}`] ?? 0), 0);
    const realClkTotal = actuals.reduce((s, a) => s + ((a as any)[`clicks${cap(ch)}`] ?? 0), 0);

    const projCTR = getCTR(campaign, ch);
    const realCTR = realImpTotal > 0 ? realClkTotal / realImpTotal : 0;

    const spendPacing = projTotalSoFar > 0 ? realSpendTotal / projTotalSoFar : 0;
    const ctrRatio = projCTR > 0 ? realCTR / projCTR : 0;

    let status: TrafficLight;
    let message: string;

    // Green: 85-110% pacing AND CTR >= 85% of target
    // Yellow: 110-130% overspend OR low pacing/CTR (not critical)
    // Red: >130% overspend OR critical underpacing/CTR
    if (spendPacing >= 0.85 && spendPacing <= 1.10 && ctrRatio >= 0.85) {
      status = "green";
      message = "En objetivo";
    } else if (spendPacing > 1.10 && spendPacing <= 1.30) {
      status = "yellow";
      message = `Pacing acelerado (${(spendPacing * 100).toFixed(0)}%) — revisar ritmo`;
    } else if (spendPacing > 1.30) {
      status = "red";
      message = `Sobregasto crítico (${(spendPacing * 100).toFixed(0)}%) — pausar`;
    } else if ((spendPacing < 0.85 && spendPacing >= 0.70) || (ctrRatio < 0.85 && ctrRatio >= 0.65)) {
      status = "yellow";
      const issues = [];
      if (spendPacing < 0.85) issues.push(`pacing bajo (${(spendPacing * 100).toFixed(0)}%)`);
      if (ctrRatio < 0.85) issues.push(`CTR bajo (${(ctrRatio * 100).toFixed(0)}% de meta)`);
      message = issues.join(" · ");
    } else {
      status = "red";
      const issues = [];
      if (spendPacing < 0.70) issues.push(`pacing crítico (${(spendPacing * 100).toFixed(0)}%)`);
      if (ctrRatio < 0.65) issues.push(`CTR crítico (${(ctrRatio * 100).toFixed(0)}% de meta)`);
      message = issues.join(" · ") || "Revisar urgente";
    }

    return { channel: ch, label: meta.label, color: meta.color, status, spendPacing, ctrRatio, message };
  });
}

// helper
function cap(s: string): string {
  // instagram → Instagram, googleSearch → GoogleSearch
  if (s === "instagram") return "Instagram";
  if (s === "facebook") return "Facebook";
  if (s === "googleSearch") return "GoogleSearch";
  if (s === "googleDisplay") return "GoogleDisplay";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ─── Formatters ───────────────────────────────────────────────────
export function fmtCOP(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(1)}k`;
  return `$${v.toFixed(0)}`;
}

export function fmtNum(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}k`;
  return `${Math.round(v)}`;
}

export function fmtPct(v: number): string {
  return `${(v * 100).toFixed(2)}%`;
}

export function fmtCOPFull(v: number): string {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(v);
}