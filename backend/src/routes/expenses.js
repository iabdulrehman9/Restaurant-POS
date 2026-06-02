import express from "express";
import { authenticate } from "../middleware/auth.js";
import { requirePermission } from "../middleware/permissions.js";
import { getDb } from "../db/index.js";

const router = express.Router();

const pad2 = (value) => String(value).padStart(2, "0");

const formatLocalDate = (date) => {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
};

const normalizeDateInput = (value) => {
  if (!value) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return formatLocalDate(parsed);
};

const validateExpenseDate = (dateStr) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr || "")) {
    return "Invalid expense date format.";
  }

  const [year, month, day] = dateStr.split("-").map(Number);
  const parsed = new Date(year, month - 1, day);
  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return "Invalid expense date.";
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (parsed < startOfMonth) {
    return "Expense date must be within the current month.";
  }
  if (parsed > endOfToday) {
    return "Expense date cannot be in the future.";
  }

  return null;
};

router.get("/", authenticate, requirePermission("expenses", "view"), (req, res) => {
  const db = getDb();
  const { from, to } = req.query;

  const filters = [];
  const values = [];

  if (from) {
    const fromDate = normalizeDateInput(from);
    if (fromDate) {
      filters.push("date >= ?");
      values.push(fromDate);
    }
  }

  if (to) {
    const toDate = normalizeDateInput(to);
    if (toDate) {
      filters.push("date <= ?");
      values.push(toDate);
    }
  }

  const where = filters.length ? `WHERE ${filters.join(" AND ")}` : "";
  const expenses = db
    .prepare(`SELECT * FROM expenses ${where} ORDER BY date DESC, id DESC`)
    .all(...values);

  res.json({ expenses });
});

router.post("/", authenticate, requirePermission("expenses", "create"), (req, res) => {
  const { category, amount, date, note } = req.body || {};
  if (!category || amount === undefined || amount === null || !date) {
    return res.status(400).json({ error: "Category, amount, and date are required" });
  }
  if (Number(amount) <= 0) {
    return res.status(400).json({ error: "Amount must be greater than zero" });
  }

  const dateError = validateExpenseDate(date);
  if (dateError) {
    return res.status(400).json({ error: dateError });
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
  if (date) {
    const dateError = validateExpenseDate(date);
    if (dateError) {
      return res.status(400).json({ error: dateError });
    }
    updates.push("date = ?");
    values.push(date);
  }
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
