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

const buildDateFilter = (from, to) => {
  const filters = [];
  const values = [];
  if (from) {
    filters.push("created_at >= ?");
    values.push(from);
  }
  if (to) {
    filters.push("created_at <= ?");
    values.push(to);
  }
  return { filters, values };
};

const buildExpenseDateFilter = (from, to) => {
  const filters = [];
  const values = [];
  const fromDate = normalizeDateInput(from);
  const toDate = normalizeDateInput(to);

  if (fromDate) {
    filters.push("date >= ?");
    values.push(fromDate);
  }
  if (toDate) {
    filters.push("date <= ?");
    values.push(toDate);
  }

  return { filters, values };
};

router.get("/summary", authenticate, requirePermission("reports", "view"), (req, res) => {
  const db = getDb();
  const { from, to, expenseFrom, expenseTo } = req.query;
  const { filters, values } = buildDateFilter(from, to);

  const where = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

  const sales = db
    .prepare(
      `SELECT COUNT(*) as ordersCount, SUM(subtotal) as subtotal, SUM(tax_amount) as tax, SUM(total) as total FROM orders ${where}`
    )
    .get(...values);

  const expenseFilter = buildExpenseDateFilter(expenseFrom || from, expenseTo || to);
  const expenseWhere = expenseFilter.filters.length
    ? `WHERE ${expenseFilter.filters.join(" AND ")}`
    : "";

  const expenses = db
    .prepare(`SELECT SUM(amount) as total FROM expenses ${expenseWhere}`)
    .get(...expenseFilter.values);

  const totalSales = sales.total || 0;
  const totalExpenses = expenses.total || 0;
  const profit = totalSales - totalExpenses;
  const avgBill = sales.ordersCount ? totalSales / sales.ordersCount : 0;

  res.json({
    totalSales,
    subtotal: sales.subtotal || 0,
    tax: sales.tax || 0,
    ordersCount: sales.ordersCount || 0,
    totalExpenses,
    profit,
    avgBill
  });
});

router.get("/sales", authenticate, requirePermission("reports", "view"), (req, res) => {
  const db = getDb();
  const { from, to } = req.query;
  const { filters, values } = buildDateFilter(from, to);
  const where = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

  const rows = db
    .prepare(
      `SELECT substr(created_at, 1, 10) as date, COUNT(*) as ordersCount, SUM(subtotal) as subtotal, SUM(tax_amount) as tax, SUM(total) as total FROM orders ${where} GROUP BY substr(created_at, 1, 10) ORDER BY date DESC`
    )
    .all(...values);

  res.json({ sales: rows });
});

router.get("/expenses", authenticate, requirePermission("reports", "view"), (req, res) => {
  const db = getDb();
  const { from, to, expenseFrom, expenseTo } = req.query;

  const expenseFilter = buildExpenseDateFilter(expenseFrom || from, expenseTo || to);
  const where = expenseFilter.filters.length
    ? `WHERE ${expenseFilter.filters.join(" AND ")}`
    : "";

  const rows = db
    .prepare(
      `SELECT id, date, category, note as description, amount as total FROM expenses ${where} ORDER BY date DESC`
    )
    .all(...expenseFilter.values);

  res.json({ expenses: rows });
});

router.get("/products", authenticate, requirePermission("reports", "view"), (req, res) => {
  const db = getDb();
  const { from, to } = req.query;
  const { filters, values } = buildDateFilter(from, to);
  const where = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

  const rows = db
    .prepare(
      `SELECT oi.name as name, SUM(oi.qty) as sold, SUM(oi.total) as revenue
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       ${where}
       GROUP BY oi.name
       ORDER BY sold DESC`
    )
    .all(...values);

  res.json({ products: rows });
});

export default router;
