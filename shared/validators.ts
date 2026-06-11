import { z } from "zod";

export const insertCampaignSchema = z.object({
  name: z.string().min(1),
  totalBudget: z.number().positive(),
  startDate: z.string(),
  durationDays: z.number().int().positive().default(17),
  cpmInstagram: z.number().default(7500),
  cpmFacebook: z.number().default(6000),
  cpmGoogleSearch: z.number().default(5000),
  cpmGoogleDisplay: z.number().default(3500),
  ctrInstagram: z.number().default(0.018),
  ctrFacebook: z.number().default(0.015),
  ctrGoogleSearch: z.number().default(0.045),
  ctrGoogleDisplay: z.number().default(0.008),
  pctInstagram: z.number().default(0.30),
  pctFacebook: z.number().default(0.25),
  pctGoogleSearch: z.number().default(0.30),
  pctGoogleDisplay: z.number().default(0.15),
  reachGoal: z.number().default(1000000),
});

export const insertDailyActualSchema = z.object({
  campaignId: z.number().int(),
  day: z.number().int(),
  date: z.string().nullable().optional(),
  spendInstagram: z.number().default(0),
  spendFacebook: z.number().default(0),
  spendGoogleSearch: z.number().default(0),
  spendGoogleDisplay: z.number().default(0),
  impInstagram: z.number().default(0),
  impFacebook: z.number().default(0),
  impGoogleSearch: z.number().default(0),
  impGoogleDisplay: z.number().default(0),
  clicksInstagram: z.number().default(0),
  clicksFacebook: z.number().default(0),
  clicksGoogleSearch: z.number().default(0),
  clicksGoogleDisplay: z.number().default(0),
  reachInstagram: z.number().default(0),
  reachFacebook: z.number().default(0),
  reachGoogleSearch: z.number().default(0),
  reachGoogleDisplay: z.number().default(0),
});

export type InsertCampaign = z.infer<typeof insertCampaignSchema>;
export type InsertDailyActual = z.infer<typeof insertDailyActualSchema>;
