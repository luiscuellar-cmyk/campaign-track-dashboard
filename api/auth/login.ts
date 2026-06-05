import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import WebSocket from "ws";

const JWT_SECRET = process.env.JWT_SECRET || "campaign-dashboard-secret-2026";

function getDB() {
    return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
        global: { fetch },
        realtime: { transport: WebSocket as any },
    });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") return res.status(200).end();
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const { username, password } = req.body || {};
    if (!username || !password)
        return res.status(400).json({ error: "Usuario y contraseña requeridos" });

    try {
        const db = getDB();
        const { data: user, error } = await db
            .from("users")
            .select("*")
            .eq("username", username)
            .single();

        if (error || !user)
            return res.status(401).json({ error: "Usuario o contraseña incorrectos" });

        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid)
            return res.status(401).json({ error: "Usuario o contraseña incorrectos" });

        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            JWT_SECRET,
            { expiresIn: "8h" }
        );

        return res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
    } catch (err: any) {
        return res.status(500).json({ error: err.message });
    }
}