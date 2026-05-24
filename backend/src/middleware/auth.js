import jwt from "jsonwebtoken";
import { config } from "../config.js";
import { getDb } from "../db/index.js";

export const authenticate = (req, res, next) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "Missing auth token" });
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret);
    const db = getDb();
    const user = db
      .prepare("SELECT id, name, email, role, is_active FROM users WHERE id = ?")
      .get(payload.sub);

    if (!user || !user.is_active) {
      return res.status(401).json({ error: "Invalid user" });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid auth token" });
  }
};
