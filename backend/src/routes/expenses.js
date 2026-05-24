import express from "express";
import { authenticate } from "../middleware/auth.js";
import { requirePermission } from "../middleware/permissions.js";
import { getDb } from "../db/index.js";

const router = express.Router();

router.get("/", authenticate, requirePermission("expenses", "view"), (req, res) => {
  const db = getDb();
  const { from, to } = req.query;

  const filters = [];
  const values = [];

  if (from) {
    filters.push("date >= ?");
    values.push(from);
  }

  if (to) {
    filters.push("date <= ?");
    values.push(to);
  }

  const where = filters.length ? `WHERE ${filters.join(" AND ")}` : "";
  const expenses = db
    .prepare(`SELECT * FROM expenses ${where} ORDER BY date DESC, id DESC`)
    .all(...values);

  res.json({ expenses });
});

router.post("/", authenticate, requirePermission("expenses", "create"), (req, res) => {
  const { category, amount, date, note } = req.body || {};
  if (!category || !amount || !date) {
    return res.status(400).json({ error: "Category, amount, and date are required" });
  }

  const now = new Date().toISOString();
  const db = getDb();
  const result = db
    .prepare(
      "INSERT INTO expenses (category, amount, date, note, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)"
    )
    .run(category, Number(amount), date, note || "", now, now);

  res.status(201).json({ id: result.lastInsertRowid });
});

router.put("/:id", authenticate, requirePermission("expenses", "update"), (req, res) => {
  const id = Number(req.params.id);
  const { category, amount, date, note } = req.body || {};

  const updates = [];
  const values = [];

  if (category) { updates.push("category = ?"); values.push(category); }
  if (amount !== undefined) { updates.push("amount = ?"); values.push(Number(amount)); }
  if (date) { updates.push("date = ?"); values.push(date); }
  if (note !== undefined) { updates.push("note = ?"); values.push(note); }

  updates.push("updated_at = ?");
  values.push(new Date().toISOString());

  const db = getDb();
  const sql = `UPDATE expenses SET ${updates.join(", ")} WHERE id = ?`;
  values.push(id);
  db.prepare(sql).run(...values);

  res.json({ ok: true });
});

router.delete("/:id", authenticate, requirePermission("expenses", "delete"), (req, res) => {
  const id = Number(req.params.id);
  const db = getDb();
  db.prepare("DELETE FROM expenses WHERE id = ?").run(id);
  res.json({ ok: true });
});

export default router;
