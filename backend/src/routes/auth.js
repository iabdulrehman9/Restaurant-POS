import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import { config } from "../config.js";
import { getDb, listModules, DEFAULT_ADMIN_PASSWORD } from "../db/index.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many login attempts. Try again in 15 minutes." },
});

const getUserPermissions = (db, user) => {
  if (user.role === "admin") {
    return listModules().map((module) => ({
      moduleKey: module.key,
      actions: module.actions,
    }));
  }

  const rows = db
    .prepare(
      "SELECT module_key, action_key, allowed FROM user_permissions WHERE user_id = ?"
    )
    .all(user.id);

  const map = new Map();
  for (const row of rows) {
    if (!row.allowed) continue;
    const existing = map.get(row.module_key) || [];
    existing.push(row.action_key);
    map.set(row.module_key, existing);
  }

  return Array.from(map.entries()).map(([moduleKey, actions]) => ({
    moduleKey,
    actions,
  }));
};

router.post("/login", loginLimiter, (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const db = getDb();
  const user = db
    .prepare("SELECT id, name, email, role, is_active, password_hash FROM users WHERE email = ?")
    .get(email);

  if (!user || !user.is_active) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const match = bcrypt.compareSync(password, user.password_hash);
  if (!match) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const requirePasswordChange = bcrypt.compareSync(DEFAULT_ADMIN_PASSWORD, user.password_hash);

  const token = jwt.sign(
    { sub: user.id, role: user.role },
    config.jwtSecret,
    { expiresIn: "7d" }
  );

  const permissions = getUserPermissions(db, user);

  return res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    permissions,
    requirePasswordChange,
  });
});

router.get("/me", authenticate, (req, res) => {
  const db = getDb();
  const permissions = getUserPermissions(db, req.user);
  res.json({
    user: req.user,
    permissions,
  });
});

export default router;
