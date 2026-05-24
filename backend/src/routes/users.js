import express from "express";
import bcrypt from "bcryptjs";
import { authenticate } from "../middleware/auth.js";
import { requirePermission } from "../middleware/permissions.js";
import { getDb } from "../db/index.js";

const router = express.Router();

router.get("/", authenticate, requirePermission("users", "view"), (req, res) => {
  const db = getDb();
  const users = db
    .prepare("SELECT id, name, email, role, is_active, created_at FROM users ORDER BY id DESC")
    .all();
  res.json({ users });
});

router.post("/", authenticate, requirePermission("users", "create"), (req, res) => {
  const { name, email, password, role = "cashier", isActive = true, permissions = [] } = req.body || {};
  if (!name || !email || !password) {
    return res.status(400).json({ error: "Name, email, and password are required" });
  }

  const db = getDb();
  const now = new Date().toISOString();
  const hash = bcrypt.hashSync(password, 10);

  try {
    const result = db
      .prepare(
        "INSERT INTO users (name, email, password_hash, role, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
      )
      .run(name, email, hash, role, isActive ? 1 : 0, now, now);

    const userId = result.lastInsertRowid;
    const insertPermission = db.prepare(
      "INSERT OR REPLACE INTO user_permissions (user_id, module_key, action_key, allowed) VALUES (?, ?, ?, ?)"
    );

    const transaction = db.transaction((items) => {
      for (const item of items) {
        if (!item.moduleKey) continue;
        if (item.actions && Array.isArray(item.actions)) {
          for (const actionKey of item.actions) {
            insertPermission.run(userId, item.moduleKey, actionKey, item.allowed ? 1 : 0);
          }
        } else if (item.actionKey) {
          insertPermission.run(userId, item.moduleKey, item.actionKey, item.allowed ? 1 : 0);
        }
      }
    });

    transaction(permissions);

    res.status(201).json({ id: userId });
  } catch (err) {
    return res.status(400).json({ error: "Email already exists" });
  }
});

router.put("/:id", authenticate, requirePermission("users", "update"), (req, res) => {
  const userId = Number(req.params.id);
  const { name, email, password, role, isActive } = req.body || {};

  const db = getDb();
  const user = db.prepare("SELECT id FROM users WHERE id = ?").get(userId);
  if (!user) return res.status(404).json({ error: "User not found" });

  const updates = [];
  const values = [];

  if (name) { updates.push("name = ?"); values.push(name); }
  if (email) { updates.push("email = ?"); values.push(email); }
  if (role) { updates.push("role = ?"); values.push(role); }
  if (typeof isActive === "boolean") { updates.push("is_active = ?"); values.push(isActive ? 1 : 0); }
  if (password) {
    updates.push("password_hash = ?");
    values.push(bcrypt.hashSync(password, 10));
  }

  updates.push("updated_at = ?");
  values.push(new Date().toISOString());

  if (updates.length === 0) {
    return res.json({ ok: true });
  }

  const sql = `UPDATE users SET ${updates.join(", ")} WHERE id = ?`;
  values.push(userId);
  db.prepare(sql).run(...values);

  res.json({ ok: true });
});

router.delete("/:id", authenticate, requirePermission("users", "delete"), (req, res) => {
  const userId = Number(req.params.id);
  const db = getDb();
  db.prepare("UPDATE users SET is_active = 0, updated_at = ? WHERE id = ?").run(
    new Date().toISOString(),
    userId
  );
  res.json({ ok: true });
});

export default router;
