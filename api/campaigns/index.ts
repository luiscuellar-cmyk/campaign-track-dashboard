import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import WebSocket from "ws";

function getDB() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    global: { fetch },
    realtime: { transport: WebSocket as any },
  });
}

function toCamel(row: any) {
  if (!row) return null;
  return {
    id: row.id, name: row.name,
    totalBudget: row.total_budget, durationDays: row.duration_days, startDate: row.start_date,
    pctInstagram: row.pct_instagram, pctFacebook: row.pct_facebook,
    pctGoogleSearch: row.pct_google_search, pctGoogleDisplay: row.pct_google_display,
    cpmInstagram: row.cpm_instagram, cpmFacebook: row.cpm_facebook,
    cpmGoogleSearch: row.cpm_google_search, cpmGoogleDisplay: row.cpm_google_display,
    ctrInstagram: row.ctr_instagram, ctrFacebook: row.ctr_facebook,
    ctrGoogleSearch: row.ctr_google_search, ctrGoogleDisplay: row.ctr_google_display,
    createdAt: row.created_at,
  };
}

function toSnake(b: any) {
  return {
    name: b.name,
    total_budget: b.totalBudget ?? b.total_budget,
    duration_days: b.durationDays ?? b.duration_days,
    start_date: b.startDate ?? b.start_date,
    pct_instagram: b.pctInstagram ?? b.pct_instagram,
    pct_facebook: b.pctFacebook ?? b.pct_facebook,
    pct_google_search: b.pctGoogleSearch ?? b.pct_google_search,
    pct_google_display: b.pctGoogleDisplay ?? b.pct_google_display,
    cpm_instagram: b.cpmInstagram ?? b.cpm_instagram,
    cpm_facebook: b.cpmFacebook ?? b.cpm_facebook,
    cpm_google_search: b.cpmGoogleSearch ?? b.cpm_google_search,
    cpm_google_display: b.cpmGoogleDisplay ?? b.cpm_google_display,
    ctr_instagram: b.ctrInstagram ?? b.ctr_instagram,
    ctr_facebook: b.ctrFacebook ?? b.ctr_facebook,
    ctr_google_search: b.ctrGoogleSearch ?? b.ctr_google_search,
    ctr_google_display: b.ctrGoogleDisplay ?? b.ctr_google_display,
  };
}

import { insertCampaignSchema } from "@shared/schema";

// ... [rest of functions] ...

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const db = getDB();

    if (req.method === "GET") {
      const { data, error } = await db.from("campaigns").select("*").order("id");
      if (error) return res.status(500).json({ error: "Failed to fetch campaigns" });
      return res.json((data || []).map(toCamel));
    }

    if (req.method === "POST") {
      const parsed = insertCampaignSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

      const { data, error } = await db.from("campaigns").insert([toSnake(parsed.data)]).select().single();
      if (error) return res.status(500).json({ error: "Failed to create campaign" });
      return res.status(201).json(toCamel(data));
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err: any) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
}