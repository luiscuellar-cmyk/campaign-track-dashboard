import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import WebSocket from "ws";

function getDB() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
    global: { fetch },
    realtime: { transport: WebSocket as any },
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "DELETE") return res.status(405).json({ error: "Method not allowed" });

  const campaignId = Number(req.query.id);
  const day = Number(req.query.day);
  if (isNaN(campaignId) || isNaN(day)) return res.status(400).json({ error: "Invalid params" });

  try {
    const db = getDB();
    const { error } = await db.from("daily_actuals").delete().eq("campaign_id", campaignId).eq("day", day);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(204).end();
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}