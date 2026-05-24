import express from "express";
import path from "path";
import fs from "fs";
import multer from "multer";
import { config } from "../config.js";
import { authenticate } from "../middleware/auth.js";
import { requirePermission } from "../middleware/permissions.js";
import { getDb } from "../db/index.js";

const router = express.Router();

const hasPermission = (db, user, moduleKey, actionKey) => {
  if (user.role === "admin") return true;
  const row = db
    .prepare(
      "SELECT allowed FROM user_permissions WHERE user_id = ? AND module_key = ? AND action_key = ?"
    )
    .get(user.id, moduleKey, actionKey);
  return row && row.allowed === 1;
};

const productDir = path.join(config.uploadDir, "products");
if (!fs.existsSync(productDir)) {
  fs.mkdirSync(productDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, productDir),
  filename: (req, file, cb) => {
    const safeName = `${Date.now()}-${file.originalname.replace(/\s+/g, "-")}`;
    cb(null, safeName);
  },
});

const upload = multer({ storage });

router.get("/", authenticate, (req, res) => {
  const db = getDb();
  const user = req.user;

  const canViewProducts = hasPermission(db, user, "products", "view");
  const canViewPos = hasPermission(db, user, "pos", "view");

  if (!canViewProducts && !canViewPos) {
    return res.status(403).json({ error: "Permission denied" });
  }
  const { active, search, category } = req.query;

  const filters = [];
  const values = [];

  if (active === "1" || active === "0") {
    filters.push("active = ?");
    values.push(Number(active));
  }

  if (search) {
    filters.push("name LIKE ?");
    values.push(`%${search}%`);
  }

  if (category) {
    filters.push("category = ?");
    values.push(category);
  }

  const where = filters.length ? `WHERE ${filters.join(" AND ")}` : "";
  const products = db
    .prepare(`SELECT * FROM products ${where} ORDER BY id DESC`)
    .all(...values);

  res.json({ products });
});

router.post(
  "/",
  authenticate,
  requirePermission("products", "create"),
  upload.single("image"),
  (req, res) => {
    const { name, category, price, active = 1 } = req.body || {};
    if (!name || !category || !price) {
      return res.status(400).json({ error: "Name, category, and price are required" });
    }

    const imagePath = req.file ? `/uploads/products/${req.file.filename}` : null;
    const now = new Date().toISOString();
    const db = getDb();
    const result = db
      .prepare(
        "INSERT INTO products (name, category, price, image_path, active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
      )
      .run(name, category, Number(price), imagePath, Number(active) ? 1 : 0, now, now);

    res.status(201).json({ id: result.lastInsertRowid });
  }
);

router.put(
  "/:id",
  authenticate,
  requirePermission("products", "update"),
  upload.single("image"),
  (req, res) => {
    const id = Number(req.params.id);
    const { name, category, price, active } = req.body || {};

    const updates = [];
    const values = [];

    if (name) { updates.push("name = ?"); values.push(name); }
    if (category) { updates.push("category = ?"); values.push(category); }
    if (price !== undefined) { updates.push("price = ?"); values.push(Number(price)); }
    if (active !== undefined) { updates.push("active = ?"); values.push(Number(active) ? 1 : 0); }

    if (req.file) {
      updates.push("image_path = ?");
      values.push(`/uploads/products/${req.file.filename}`);
    }

    updates.push("updated_at = ?");
    values.push(new Date().toISOString());

    if (updates.length === 0) {
      return res.json({ ok: true });
    }

    const db = getDb();
    const sql = `UPDATE products SET ${updates.join(", ")} WHERE id = ?`;
    values.push(id);
    db.prepare(sql).run(...values);

    res.json({ ok: true });
  }
);

router.delete("/:id", authenticate, requirePermission("products", "delete"), (req, res) => {
  const id = Number(req.params.id);
  const db = getDb();
  db.prepare("DELETE FROM products WHERE id = ?").run(id);
  res.json({ ok: true });
});

export default router;
