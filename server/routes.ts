import type { Express } from "express";
import type { Server } from "http";
import loginHandler from "../api/auth/login";
import campaignsHandler from "../api/campaigns/index";
import campaignIdHandler from "../api/campaigns/[id]";
import actualsHandler from "../api/campaigns/[id]/actuals/index";
import bulkActualsHandler from "../api/campaigns/[id]/actuals/bulk";
import dayActualHandler from "../api/campaigns/[id]/actuals/[day]";

import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

const JWT_SECRET = process.env.JWT_SECRET || "";

export function registerRoutes(httpServer: Server, app: Express) {
  // JWT Auth Middleware — skip login route
  const checkAuth = (req: Request, res: Response, next: NextFunction) => {
    if (req.originalUrl === "/api/auth/login") return next();

    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      (req as any).user = decoded;
      return next();
    } catch {
      return res.status(401).json({ error: "Unauthorized" });
    }
  };

  app.use("/api/", checkAuth);

  // ─── AUTH ──────────────────────────────────────────────────────
  app.post("/api/auth/login", (req, res) => loginHandler(req as any, res as any));

  app.get("/api/auth/me", (req, res) => {
    const user = (req as any).user;
    if (user) return res.json({ user });
    return res.status(401).json({ error: "Unauthorized" });
  });

  app.post("/api/auth/logout", (req, res) => {
    res.clearCookie("token", { path: "/" });
    res.status(200).json({ ok: true });
  });

  // ─── CAMPAIGNS ──────────────────────────────────────────────────
  app.all("/api/campaigns", (req, res) => campaignsHandler(req as any, res as any));

  app.all("/api/campaigns/:id", (req, res) => {
    const patchedReq = { ...req, query: { ...req.query, id: req.params.id } };
    return campaignIdHandler(patchedReq as any, res as any);
  });

  // ─── DAILY ACTUALS ───────────────────────────────────────────────
  app.all("/api/campaigns/:id/actuals/bulk", (req, res) => {
    const patchedReq = { ...req, query: { ...req.query, id: req.params.id } };
    return bulkActualsHandler(patchedReq as any, res as any);
  });

  app.all("/api/campaigns/:id/actuals/:day", (req, res) => {
    const patchedReq = { ...req, query: { ...req.query, id: req.params.id, day: req.params.day } };
    return dayActualHandler(patchedReq as any, res as any);
  });

  app.all("/api/campaigns/:id/actuals", (req, res) => {
    const patchedReq = { ...req, query: { ...req.query, id: req.params.id } };
    return actualsHandler(patchedReq as any, res as any);
  });
}
