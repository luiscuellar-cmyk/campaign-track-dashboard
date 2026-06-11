import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { eq, and } from "drizzle-orm";
import {
  campaigns, dailyActuals,
  type Campaign, type InsertCampaign,
  type DailyActual, type InsertDailyActual,
} from "@shared/schema";

const sqlite = new Database("data.db");
const db = drizzle(sqlite);

// Auto-migrate tables
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS campaigns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    total_budget REAL NOT NULL,
    start_date TEXT NOT NULL,
    duration_days INTEGER NOT NULL DEFAULT 17,
    cpm_instagram REAL NOT NULL DEFAULT 7500,
    cpm_facebook REAL NOT NULL DEFAULT 6000,
    cpm_google_search REAL NOT NULL DEFAULT 5000,
    cpm_google_display REAL NOT NULL DEFAULT 3500,
    ctr_instagram REAL NOT NULL DEFAULT 0.018,
    ctr_facebook REAL NOT NULL DEFAULT 0.015,
    ctr_google_search REAL NOT NULL DEFAULT 0.045,
    ctr_google_display REAL NOT NULL DEFAULT 0.008,
    pct_instagram REAL NOT NULL DEFAULT 0.30,
    pct_facebook REAL NOT NULL DEFAULT 0.25,
    pct_google_search REAL NOT NULL DEFAULT 0.30,
    pct_google_display REAL NOT NULL DEFAULT 0.15
  );
  CREATE TABLE IF NOT EXISTS daily_actuals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    campaign_id INTEGER NOT NULL,
    day INTEGER NOT NULL,
    date TEXT,
    spend_instagram REAL NOT NULL DEFAULT 0,
    spend_facebook REAL NOT NULL DEFAULT 0,
    spend_google_search REAL NOT NULL DEFAULT 0,
    spend_google_display REAL NOT NULL DEFAULT 0,
    imp_instagram REAL NOT NULL DEFAULT 0,
    imp_facebook REAL NOT NULL DEFAULT 0,
    imp_google_search REAL NOT NULL DEFAULT 0,
    imp_google_display REAL NOT NULL DEFAULT 0,
    clicks_instagram REAL NOT NULL DEFAULT 0,
    clicks_facebook REAL NOT NULL DEFAULT 0,
    clicks_google_search REAL NOT NULL DEFAULT 0,
    clicks_google_display REAL NOT NULL DEFAULT 0,
    reach_instagram REAL NOT NULL DEFAULT 0,
    reach_facebook REAL NOT NULL DEFAULT 0,
    reach_google_search REAL NOT NULL DEFAULT 0,
    reach_google_display REAL NOT NULL DEFAULT 0
  );
`);

export interface IStorage {
  // Campaigns
  getCampaigns(): Campaign[];
  getCampaign(id: number): Campaign | undefined;
  createCampaign(data: InsertCampaign): Campaign;
  updateCampaign(id: number, data: Partial<InsertCampaign>): Campaign | undefined;
  deleteCampaign(id: number): void;
  // Daily actuals
  getDailyActuals(campaignId: number): DailyActual[];
  getDailyActual(campaignId: number, day: number): DailyActual | undefined;
  upsertDailyActual(data: InsertDailyActual): DailyActual;
  deleteDailyActual(campaignId: number, day: number): void;
  clearDailyActuals(campaignId: number): void;
}

export class SqliteStorage implements IStorage {
  getCampaigns(): Campaign[] {
    return db.select().from(campaigns).all();
  }

  getCampaign(id: number): Campaign | undefined {
    return db.select().from(campaigns).where(eq(campaigns.id, id)).get();
  }

  createCampaign(data: InsertCampaign): Campaign {
    return db.insert(campaigns).values(data).returning().get();
  }

  updateCampaign(id: number, data: Partial<InsertCampaign>): Campaign | undefined {
    return db.update(campaigns).set(data).where(eq(campaigns.id, id)).returning().get();
  }

  deleteCampaign(id: number): void {
    db.delete(dailyActuals).where(eq(dailyActuals.campaignId, id)).run();
    db.delete(campaigns).where(eq(campaigns.id, id)).run();
  }

  getDailyActuals(campaignId: number): DailyActual[] {
    return db.select().from(dailyActuals)
      .where(eq(dailyActuals.campaignId, campaignId))
      .all()
      .sort((a, b) => a.day - b.day);
  }

  getDailyActual(campaignId: number, day: number): DailyActual | undefined {
    return db.select().from(dailyActuals)
      .where(and(eq(dailyActuals.campaignId, campaignId), eq(dailyActuals.day, day)))
      .get();
  }

  upsertDailyActual(data: InsertDailyActual): DailyActual {
    const existing = this.getDailyActual(data.campaignId, data.day);
    if (existing) {
      return db.update(dailyActuals)
        .set(data)
        .where(eq(dailyActuals.id, existing.id))
        .returning().get()!;
    }
    return db.insert(dailyActuals).values(data).returning().get();
  }

  deleteDailyActual(campaignId: number, day: number): void {
    const existing = this.getDailyActual(campaignId, day);
    if (existing) {
      db.delete(dailyActuals).where(eq(dailyActuals.id, existing.id)).run();
    }
  }

  clearDailyActuals(campaignId: number): void {
    db.delete(dailyActuals).where(eq(dailyActuals.campaignId, campaignId)).run();
  }
}

export const storage = new SqliteStorage();