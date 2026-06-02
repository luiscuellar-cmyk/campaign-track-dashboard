import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { insertCampaignSchema, insertDailyActualSchema } from "@shared/schema";
import { z } from "zod";

export function registerRoutes(httpServer: Server, app: Express) {
  // ─── CAMPAIGNS ──────────────────────────────────────────────────
  app.get("/api/campaigns", (_req, res) => {
    res.json(storage.getCampaigns());
  });

  app.get("/api/campaigns/:id", (req, res) => {
    const id = parseInt(req.params.id);
    const campaign = storage.getCampaign(id);
    if (!campaign) return res.status(404).json({ error: "Not found" });
    res.json(campaign);
  });

  app.post("/api/campaigns", (req, res) => {
    const parsed = insertCampaignSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    const campaign = storage.createCampaign(parsed.data);
    res.status(201).json(campaign);
  });

  app.patch("/api/campaigns/:id", (req, res) => {
    const id = parseInt(req.params.id);
    const parsed = insertCampaignSchema.partial().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    const updated = storage.updateCampaign(id, parsed.data);
    if (!updated) return res.status(404).json({ error: "Not found" });
    res.json(updated);
  });

  app.delete("/api/campaigns/:id", (req, res) => {
    const id = parseInt(req.params.id);
    storage.deleteCampaign(id);
    res.json({ ok: true });
  });

  // ─── DAILY ACTUALS ───────────────────────────────────────────────
  app.get("/api/campaigns/:id/actuals", (req, res) => {
    const campaignId = parseInt(req.params.id);
    res.json(storage.getDailyActuals(campaignId));
  });

  app.post("/api/campaigns/:id/actuals", (req, res) => {
    const campaignId = parseInt(req.params.id);
    const body = { ...req.body, campaignId };
    const parsed = insertDailyActualSchema.safeParse(body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    const actual = storage.upsertDailyActual(parsed.data);
    res.json(actual);
  });

  // Bulk upsert — array of daily rows
  app.post("/api/campaigns/:id/actuals/bulk", (req, res) => {
    const campaignId = parseInt(req.params.id);
    const rows = z.array(insertDailyActualSchema.omit({ campaignId: true })).safeParse(req.body);
    if (!rows.success) return res.status(400).json({ error: rows.error.flatten() });
    const results = rows.data.map(row =>
      storage.upsertDailyActual({ ...row, campaignId })
    );
    res.json(results);
  });

  app.delete("/api/campaigns/:id/actuals/:day", (req, res) => {
    const campaignId = parseInt(req.params.id);
    const day = parseInt(req.params.day);
    storage.deleteDailyActual(campaignId, day);
    res.json({ ok: true });
  });

  app.delete("/api/campaigns/:id/actuals", (req, res) => {
    const campaignId = parseInt(req.params.id);
    storage.clearDailyActuals(campaignId);
    res.json({ ok: true });
  });
}
