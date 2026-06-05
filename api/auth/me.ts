import type { VercelRequest, VercelResponse } from "@vercel/node";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "";

export default function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method === "OPTIONS") return res.status(200).end();
    if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: "No autorizado" });

    try {
        const payload = jwt.verify(token, JWT_SECRET) as any;
        return res.json({ user: { id: payload.id, username: payload.username, role: payload.role } });
    } catch {
        return res.status(401).json({ error: "Token invalido o expirado" });
    }
}
