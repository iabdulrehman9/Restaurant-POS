import express from "express";
import fs from "fs";
import path from "path";
import { authenticate } from "../middleware/auth.js";
import { requirePermission } from "../middleware/permissions.js";
import { getDb } from "../db/index.js";
import { config } from "../config.js";

const router = express.Router();

const parseSettings = (raw) => {
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error("Settings data is corrupted");
  }
};

router.get("/", authenticate, requirePermission("settings", "view"), (req, res) => {
  const db = getDb();
  const row = db.prepare("SELECT value FROM settings WHERE key = ?").get("app_settings");
  try {
    const settings = parseSettings(row?.value);
    res.json({ settings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/", authenticate, requirePermission("settings", "update"), (req, res) => {
  const db = getDb();
  const row = db.prepare("SELECT value FROM settings WHERE key = ?").get("app_settings");
  try {
    const current = parseSettings(row?.value);
    const next = { ...current, ...(req.body || {}) };

    db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)").run(
      "app_settings",
      JSON.stringify(next)
    );

    res.json({ ok: true, settings: next });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/backup", authenticate, requirePermission("settings", "update"), (req, res) => {
  const backupDir = path.join(path.dirname(config.dbPath), "backups");
  fs.mkdirSync(backupDir, { recursive: true });

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupPath = path.join(backupDir, `pos-backup-${stamp}.sqlite`);
  fs.copyFileSync(config.dbPath, backupPath);

  res.json({ ok: true, path: backupPath, filename: path.basename(backupPath) });
});

router.post("/restore", authenticate, requirePermission("settings", "update"), (req, res) => {
  const { backupPath } = req.body || {};
  if (!backupPath || !fs.existsSync(backupPath)) {
    return res.status(400).json({ error: "Valid backup path is required" });
  }

  const backupDir = path.join(path.dirname(config.dbPath), "backups");
  const resolved = path.resolve(backupPath);
  if (!resolved.startsWith(path.resolve(backupDir))) {
    return res.status(400).json({ error: "Backup must be located in the backups folder" });
  }

  fs.copyFileSync(resolved, config.dbPath);
  res.json({ ok: true, message: "Restore complete. Restart the application." });
});

export default router;
