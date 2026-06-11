import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Campaign config — one row per campaign
export const campaigns = sqliteTable("campaigns", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  totalBudget: real("total_budget").notNull(),
  startDate: text("start_date").notNull(), // ISO date string YYYY-MM-DD
  durationDays: integer("duration_days").notNull().default(17),
  // Projected CPMs per channel (COP per 1000 impressions)
  cpmInstagram: real("cpm_instagram").notNull().default(7500),
  cpmFacebook: real("cpm_facebook").notNull().default(6000),
  cpmGoogleSearch: real("cpm_google_search").notNull().default(5000),
  cpmGoogleDisplay: real("cpm_google_display").notNull().default(3500),
  // Projected CTRs
  ctrInstagram: real("ctr_instagram").notNull().default(0.018),
  ctrFacebook: real("ctr_facebook").notNull().default(0.015),
  ctrGoogleSearch: real("ctr_google_search").notNull().default(0.045),
  ctrGoogleDisplay: real("ctr_google_display").notNull().default(0.008),
  // Budget allocation percentages
  pctInstagram: real("pct_instagram").notNull().default(0.30),
  pctFacebook: real("pct_facebook").notNull().default(0.25),
  pctGoogleSearch: real("pct_google_search").notNull().default(0.30),
  pctGoogleDisplay: real("pct_google_display").notNull().default(0.15),
  // Reach goal for the whole campaign
  reachGoal: integer("reach_goal").notNull().default(1000000),
});

// Daily actuals — one row per day per campaign
export const dailyActuals = sqliteTable("daily_actuals", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  campaignId: integer("campaign_id").notNull(),
  day: integer("day").notNull(), // 1–17
  date: text("date"), // YYYY-MM-DD
  // Real spend per channel
  spendInstagram: real("spend_instagram").notNull().default(0),
  spendFacebook: real("spend_facebook").notNull().default(0),
  spendGoogleSearch: real("spend_google_search").notNull().default(0),
  spendGoogleDisplay: real("spend_google_display").notNull().default(0),
  // Real impressions per channel
  impInstagram: real("imp_instagram").notNull().default(0),
  impFacebook: real("imp_facebook").notNull().default(0),
  impGoogleSearch: real("imp_google_search").notNull().default(0),
  impGoogleDisplay: real("imp_google_display").notNull().default(0),
  // Real clicks per channel
  clicksInstagram: real("clicks_instagram").notNull().default(0),
  clicksFacebook: real("clicks_facebook").notNull().default(0),
  clicksGoogleSearch: real("clicks_google_search").notNull().default(0),
  clicksGoogleDisplay: real("clicks_google_display").notNull().default(0),
  // Real reach per channel
  reachInstagram: real("reach_instagram").notNull().default(0),
  reachFacebook: real("reach_facebook").notNull().default(0),
  reachGoogleSearch: real("reach_google_search").notNull().default(0),
  reachGoogleDisplay: real("reach_google_display").notNull().default(0),
});

// Insert schemas
export const insertCampaignSchema = createInsertSchema(campaigns).omit({ id: true });
export const insertDailyActualSchema = createInsertSchema(dailyActuals).omit({ id: true });

// Types
export type Campaign = typeof campaigns.$inferSelect;
export type InsertCampaign = z.infer<typeof insertCampaignSchema>;
export type DailyActual = typeof dailyActuals.$inferSelect;
export type InsertDailyActual = z.infer<typeof insertDailyActualSchema>;

// Channels constant
export const CHANNELS = ["instagram", "facebook", "googleSearch", "googleDisplay"] as const;
export type Channel = typeof CHANNELS[number];

export const CHANNEL_LABELS: Record<string, string> = {
  instagram: "Meta Suite",
  facebook: "PILAS.COL",
  googleSearch: "Youtube",
  googleDisplay: "Google Display",
};

export const CHANNEL_COLORS: Record<string, string> = {
  instagram: "#E1306C",
  facebook: "#1877F2",
  googleSearch: "#34A853",
  googleDisplay: "#FBBC05",
};