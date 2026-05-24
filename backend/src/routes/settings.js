import express from "express";
import { authenticate } from "../middleware/auth.js";
import { requirePermission } from "../middleware/permissions.js";
import { getDb } from "../db/index.js";

const router = express.Router();

router.get("/", authenticate, requirePermission("settings", "view"), (req, res) => {
  const db = getDb();
  const row = db.prepare("SELECT value FROM settings WHERE key = ?").get("app_settings");
  const settings = row ? JSON.parse(row.value) : {};
  res.json({ settings });
});

router.put("/", authenticate, requirePermission("settings", "update"), (req, res) => {
  const db = getDb();
  const row = db.prepare("SELECT value FROM settings WHERE key = ?").get("app_settings");
  const current = row ? JSON.parse(row.value) : {};
  const next = { ...current, ...(req.body || {}) };

  db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)").run(
    "app_settings",
    JSON.stringify(next)
  );

  res.json({ ok: true, settings: next });
});

export default router;
