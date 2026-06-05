import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { serialize } from "cookie";

const JWT_SECRET = process.env.JWT_SECRET || "campaign-dashboard-secret-2026";

function getDB() {
    return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
        global: { fetch },
    });
}

export default async function handler(req: any, res: any) {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const { username, password } = req.body || {};
    if (!username || !password)
        return res.status(400).json({ error: "Usuario y contraseña requeridos" });

    try {
        const db = getDB();
        const { data: users, error } = await db
            .from("users")
            .select("id, username, password_hash, role")
            .eq("username", username);

        const user = users && users.length > 0 ? users[0] : null;

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

        const cookie = serialize("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 8,
            path: "/"
        });
        console.log("[Login] Sending cookie:", cookie);
        res.setHeader("Set-Cookie", cookie);

        return res.json({ user: { id: user.id, username: user.username, role: user.role } });
        } catch (err: any) {
        return res.status(500).json({ error: "Internal Server Error" });
    }
}