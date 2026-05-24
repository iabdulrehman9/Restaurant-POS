import express from "express";
import { authenticate } from "../middleware/auth.js";
import { requirePermission } from "../middleware/permissions.js";
import { getDb, listModules } from "../db/index.js";

const router = express.Router();

router.get("/modules", authenticate, (req, res) => {
  const modules = listModules().map((module) => ({
    moduleKey: module.key,
    label: module.label,
    actions: module.actions,
  }));

  res.json({ modules });
});

router.get(
  "/users/:id",
  authenticate,
  requirePermission("users", "view"),
  (req, res) => {
    const db = getDb();
    const userId = Number(req.params.id);

    const rows = db
      .prepare(
        "SELECT module_key, action_key, allowed FROM user_permissions WHERE user_id = ?"
      )
      .all(userId);

    res.json({ permissions: rows });
  }
);

router.put(
  "/users/:id",
  authenticate,
  requirePermission("users", "permissions"),
  (req, res) => {
    const db = getDb();
    const userId = Number(req.params.id);
    const { permissions = [] } = req.body || {};

    const insert = db.prepare(
      "INSERT OR REPLACE INTO user_permissions (user_id, module_key, action_key, allowed) VALUES (?, ?, ?, ?)"
    );

    const transaction = db.transaction((items) => {
      for (const item of items) {
        if (!item.moduleKey) continue;
        if (item.actions && Array.isArray(item.actions)) {
          for (const actionKey of item.actions) {
            insert.run(userId, item.moduleKey, actionKey, item.allowed ? 1 : 0);
          }
        } else if (item.actionKey) {
          insert.run(userId, item.moduleKey, item.actionKey, item.allowed ? 1 : 0);
        }
      }
    });

    transaction(permissions);

    res.json({ ok: true });
  }
);

export default router;
