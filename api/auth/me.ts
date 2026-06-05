import type { VercelRequest, VercelResponse } from "@vercel/node";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "campaign-dashboard-secret-2026";

export default function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
    if (req.method === "OPTIONS") return res.status(200).end();
    if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith("Bearer "))
        return res.status(401).json({ error: "No autorizado" });

    try {
        const token = auth.slice(7);
        const payload = jwt.verify(token, JWT_SECRET) as any;
        return res.json({ id: payload.id, username: payload.username, role: payload.role });
    } catch {
        return res.status(401).json({ error: "Token inválido o expirado" });
    }
}