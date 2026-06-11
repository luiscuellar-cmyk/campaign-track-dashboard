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
    id: row.id,
    campaignId: row.campaign_id,
    day: row.day,
    date: row.date,
    spendInstagram: row.spend_instagram,
    spendFacebook: row.spend_facebook,
    spendGoogleSearch: row.spend_google_search,
    spendGoogleDisplay: row.spend_google_display,
    impInstagram: row.imp_instagram,
    impFacebook: row.imp_facebook,
    impGoogleSearch: row.imp_google_search,
    impGoogleDisplay: row.imp_google_display,
    clicksInstagram: row.clicks_instagram,
    clicksFacebook: row.clicks_facebook,
    clicksGoogleSearch: row.clicks_google_search,
    clicksGoogleDisplay: row.clicks_google_display,
    reachInstagram: row.reach_instagram,
    reachFacebook: row.reach_facebook,
    reachGoogleSearch: row.reach_google_search,
    reachGoogleDisplay: row.reach_google_display,
  };
}

function toSnake(b: any, campaignId: number) {
  return {
    campaign_id: campaignId,
    day: b.day,
    date: b.date ?? null,
    spend_instagram: b.spendInstagram ?? 0,
    spend_facebook: b.spendFacebook ?? 0,
    spend_google_search: b.spendGoogleSearch ?? 0,
    spend_google_display: b.spendGoogleDisplay ?? 0,
    imp_instagram: b.impInstagram ?? 0,
    imp_facebook: b.impFacebook ?? 0,
    imp_google_search: b.impGoogleSearch ?? 0,
    imp_google_display: b.impGoogleDisplay ?? 0,
    clicks_instagram: b.clicksInstagram ?? 0,
    clicks_facebook: b.clicksFacebook ?? 0,
    clicks_google_search: b.clicksGoogleSearch ?? 0,
    clicks_google_display: b.clicksGoogleDisplay ?? 0,
    reach_instagram: b.reachInstagram ?? 0,
    reach_facebook: b.reachFacebook ?? 0,
    reach_google_search: b.reachGoogleSearch ?? 0,
    reach_google_display: b.reachGoogleDisplay ?? 0,
  };
}

import { insertDailyActualSchema } from "../../../../shared/validators.js";
import { z } from "zod";
import { verifyAuth } from "../../../auth/auth-helper.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!verifyAuth(req, res)) return;

  const campaignId = Number(req.query.id);
  if (isNaN(campaignId)) return res.status(400).json({ error: "Invalid campaign id" });
// ... rest of handler

  try {
    const db = getDB();
    
    // Validate request body as an array and add limit
    const schema = z.array(insertDailyActualSchema.omit({ campaignId: true })).max(100);
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    const rows = parsed.data.map((r) => toSnake(r, campaignId));
    
    const { data, error } = await db
      .from("daily_actuals")
      .upsert(rows, { onConflict: "campaign_id,day" })
      .select();
    if (error) return res.status(500).json({ error: "Failed to bulk upsert actuals" });
    return res.status(201).json((data || []).map(toCamel));
  } catch (err: any) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
}