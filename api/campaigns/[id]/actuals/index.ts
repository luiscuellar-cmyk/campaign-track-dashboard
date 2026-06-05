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
  };
}

import { insertDailyActualSchema } from "../../../../shared/schema";
import { verifyAuth } from "../../../auth/auth-helper";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const campaignId = Number(req.query.id);
  if (isNaN(campaignId)) return res.status(400).json({ error: "Invalid campaign id" });

  if (req.method !== "GET") {
    if (!verifyAuth(req, res)) return;
  }

  try {
    const db = getDB();

    if (req.method === "GET") {
      const { data, error } = await db
        .from("daily_actuals").select("*").eq("campaign_id", campaignId).order("day");
      if (error) return res.status(500).json({ error: "Failed to fetch actuals" });
      return res.json((data || []).map(toCamel));
    }

    if (req.method === "POST") {
      const parsed = insertDailyActualSchema.omit({ campaignId: true }).safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

      const { data, error } = await db
        .from("daily_actuals")
        .upsert([toSnake(parsed.data, campaignId)], { onConflict: "campaign_id,day" })
        .select().single();
      if (error) return res.status(500).json({ error: "Failed to upsert actuals" });
      return res.status(201).json(toCamel(data));
    }

    if (req.method === "DELETE") {
      const { error } = await db.from("daily_actuals").delete().eq("campaign_id", campaignId);
      if (error) return res.status(500).json({ error: "Failed to delete actuals" });
      return res.status(204).end();
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err: any) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
}