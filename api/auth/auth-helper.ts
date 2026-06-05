import { VercelRequest, VercelResponse } from "@vercel/node";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "";

export function verifyAuth(req: VercelRequest, res: VercelResponse) {
  const token = req.cookies.token;
  if (!token) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (err) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }
}