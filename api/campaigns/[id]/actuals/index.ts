import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import WebSocket from "ws";

function getDB() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
    global: { fetch },
    realtime: { transport: WebSocket as any },
  });
}

function toCamel(row: any) {
  if (!row) return null;
  return {
    id: row.id, campaignId: row.campaign_id, day: row.day,
    spendIG: row.spend_ig, spendFB: row.spend_fb, spendGS: row.spend_gs, spendGD: row.spend_gd,
    impIG: row.imp_ig, impFB: row.imp_fb, impGS: row.imp_gs, impGD: row.imp_gd,
    clicksIG: row.clicks_ig, clicksFB: row.clicks_fb, clicksGS: row.clicks_gs, clicksGD: row.clicks_gd,
  };
}

function toSnake(b: any, campaignId: number) {
  return {
    campaign_id: campaignId, day: b.day,
    spend_ig: b.spendIG ?? b.spend_ig ?? 0, spend_fb: b.spendFB ?? b.spend_fb ?? 0,
    spend_gs: b.spendGS ?? b.spend_gs ?? 0, spend_gd: b.spendGD ?? b.spend_gd ?? 0,
    imp_ig: b.impIG ?? b.imp_ig ?? 0, imp_fb: b.impFB ?? b.imp_fb ?? 0,
    imp_gs: b.impGS ?? b.imp_gs ?? 0, imp_gd: b.impGD ?? b.imp_gd ?? 0,
    clicks_ig: b.clicksIG ?? b.clicks_ig ?? 0, clicks_fb: b.clicksFB ?? b.clicks_fb ?? 0,
    clicks_gs: b.clicksGS ?? b.clicks_gs ?? 0, clicks_gd: b.clicksGD ?? b.clicks_gd ?? 0,
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const campaignId = Number(req.query.id);
  if (isNaN(campaignId)) return res.status(400).json({ error: "Invalid campaign id" });

  try {
    const db = getDB();

    if (req.method === "GET") {
      const { data, error } = await db.from("daily_actuals").select("*").eq("campaign_id", campaignId).order("day");
      if (error) return res.status(500).json({ error: error.message });
      return res.json((data || []).map(toCamel));
    }

    if (req.method === "POST") {
      const { data, error } = await db.from("daily_actuals")
        .upsert([toSnake(req.body, campaignId)], { onConflict: "campaign_id,day" })
        .select().single();
      if (error) return res.status(500).json({ error: error.message });
      return res.status(201).json(toCamel(data));
    }

    if (req.method === "DELETE") {
      const { error } = await db.from("daily_actuals").delete().eq("campaign_id", campaignId);
      if (error) return res.status(500).json({ error: error.message });
      return res.status(204).end();
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
