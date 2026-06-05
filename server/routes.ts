import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { insertCampaignSchema, insertDailyActualSchema } from "@shared/schema";
import { z } from "zod";
import loginHandler from "../api/auth/login";
import campaignsHandler from "../api/campaigns/index";
import campaignIdHandler from "../api/campaigns/[id]";
import actualsHandler from "../api/campaigns/[id]/actuals/index";
import bulkActualsHandler from "../api/campaigns/[id]/actuals/bulk";

import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

const JWT_SECRET = process.env.JWT_SECRET || "campaign-dashboard-secret-2026";

export function registerRoutes(httpServer: Server, app: Express) {
  // JWT Auth Middleware
  const checkAuth = (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies.token;
    if (!token && req.originalUrl !== "/api/auth/login") {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (token) {
      try {
      const decoded = jwt.verify(token, JWT_SECRET);
      (req as any).user = decoded;
      return next();
      } catch (err) {
      console.error("[Auth] JWT verification failed:", err);
      return res.status(401).json({ error: "Unauthorized" });
      }
    }
    
    // Allow login route
    if (req.originalUrl === "/api/auth/login") {
      return next();
    }
    
    return res.status(401).json({ error: "Unauthorized" });
  };
  
  app.use("/api/", checkAuth);

  // ─── AUTH ──────────────────────────────────────────────────────
  app.post("/api/auth/login", (req, res) => loginHandler(req as any, res as any));
  
  app.get("/api/auth/me", (req, res) => {
    const user = (req as any).user;
    if (user) {
      return res.json({ user });
    }
    return res.status(401).json({ error: "Unauthorized" });
  });

  app.post("/api/auth/logout", (req, res) => {
    res.clearCookie("token");
    res.sendStatus(200);
  });

  // ─── CAMPAIGNS ──────────────────────────────────────────────────
  app.all("/api/campaigns", (req, res) => campaignsHandler(req as any, res as any));

  app.all("/api/campaigns/:id", (req, res) => {
    // Inject the 'id' parameter into req.query for the Vercel handler
    const patchedReq = { ...req, query: { ...req.query, id: req.params.id } };
    return campaignIdHandler(patchedReq as any, res as any);
  });

  app.get("/api/campaigns/:id", (req, res) => {
    // This route is now handled by app.all above, but kept just in case for now.
    // Actually, I can remove the old route handlers now that app.all handles it.
  });

  app.patch("/api/campaigns/:id", (req, res) => {
    // Already handled by the app.all("/api/campaigns/:id") route above
  });

  app.delete("/api/campaigns/:id", (req, res) => {
    // Already handled by the app.all("/api/campaigns/:id") route above
  });

  // ─── DAILY ACTUALS ───────────────────────────────────────────────
  app.all("/api/campaigns/:id/actuals", (req, res) => {
    const patchedReq = { ...req, query: { ...req.query, id: req.params.id } };
    return actualsHandler(patchedReq as any, res as any);
  });

  app.all("/api/campaigns/:id/actuals/bulk", (req, res) => {
    const patchedReq = { ...req, query: { ...req.query, id: req.params.id } };
    return bulkActualsHandler(patchedReq as any, res as any);
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