import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import WebSocket from "ws";
import passport from "passport";

function getDB() {
    return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
        global: { fetch },
        realtime: { transport: WebSocket as any },
    });
}

export default async function handler(req: any, res: any) {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const { username, password } = req.body || {};
    if (!username || !password)
        return res.status(400).json({ error: "Usuario y contraseña requeridos" });

    try {
        const db = getDB();
        
        // Log the table structure or query to debug
        console.log("[Login] Querying public.users table...");
        const { data: users, error } = await db
            .from("users")
            .select("username, password_hash, id, role");
            
        console.log("[Login] Database query error:", error);
        console.log("[Login] Users found:", JSON.stringify(users));
        
        const user = users?.find(u => u.username === username) || null;

        if (error) {
            console.error("[Login] Supabase error:", error);
            return res.status(401).json({ error: "Error interno al consultar usuario" });
        }
        
        if (!user) {
            console.log("[Login] User not found:", username);
            return res.status(401).json({ error: "Usuario o contraseña incorrectos" });
        }

        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) {
            console.log("[Login] Invalid password for user:", username);
            return res.status(401).json({ error: "Usuario o contraseña incorrectos" });
        }

        // Establish session
        const userInfo = { id: user.id, username: user.username, role: user.role };
        req.login(userInfo, (err: any) => {
            if (err) {
              console.error("[Login] Passport login error:", err);
              return res.status(500).json({ error: "Error al iniciar sesión" });
            }
            console.log("[Login] Session established for user:", userInfo.username);
            return res.json({ user: userInfo });
        });
    } catch (err: any) {
        return res.status(500).json({ error: err.message });
    }
}