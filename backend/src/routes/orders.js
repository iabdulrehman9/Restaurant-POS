import express from "express";
import { authenticate } from "../middleware/auth.js";
import { getDb } from "../db/index.js";
import { broadcast } from "../ws.js";
import { isAllowedOrderStatus } from "../constants/orders.js";

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

const buildOrderNumber = () => {
  const stamp = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  const rand = Math.floor(100 + Math.random() * 900);
  return `ORD-${stamp}-${rand}`;
};

const clampLimit = (value, fallback = 100, max = 500) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(Math.trunc(parsed), 1), max);
};

const clampOffset = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return Math.trunc(parsed);
};

/** Resolve line items from DB catalog — never trust client prices. */
const resolveOrderItems = (db, items) => {
  const getProduct = db.prepare(
    "SELECT id, name, price, active FROM products WHERE id = ?"
  );

  const resolved = [];
  for (const item of items) {
    const productId = Number(item.productId);
    const qty = Number(item.qty);

    if (!productId || !Number.isFinite(qty) || qty < 1) {
      throw new Error("Each item must have a valid product and quantity of at least 1");
    }

    const product = getProduct.get(productId);
    if (!product) {
      throw new Error(`Product ${productId} not found`);
    }
    if (product.active !== 1) {
      throw new Error(`Product "${product.name}" is inactive`);
    }
    if (Number(product.price) <= 0) {
      throw new Error(`Product "${product.name}" has invalid price`);
    }

    const price = Number(product.price);
    resolved.push({
      productId: product.id,
      name: product.name,
      price,
      qty,
      lineTotal: price * qty,
    });
  }

  return resolved;
};

const calculateTotals = ({
  resolvedItems,
  taxRate,
  serviceChargeRate,
  discountType,
  discountValue,
  paidAmount,
}) => {
  const subtotal = resolvedItems.reduce((sum, item) => sum + item.lineTotal, 0);
  const taxAmount = subtotal * (Number(taxRate) / 100);
  const serviceChargeAmount = subtotal * (Number(serviceChargeRate) / 100);

  let discountAmount = 0;
  if (discountType === "percentage") {
    discountAmount = subtotal * (Math.max(0, Number(discountValue)) / 100);
  } else if (discountType === "fixed") {
    discountAmount = Math.max(0, Number(discountValue));
  }

  discountAmount = Math.min(discountAmount, subtotal);
  const total = subtotal + taxAmount + serviceChargeAmount - discountAmount;

  if (total < 0) {
    throw new Error("Order total cannot be negative");
  }

  const changeDue = Number(paidAmount) - total;
  return { subtotal, taxAmount, serviceChargeAmount, discountAmount, total, changeDue };
};

router.get("/", authenticate, (req, res) => {
  const db = getDb();
  const user = req.user;

  const canViewPos = hasPermission(db, user, "pos", "view");
  const canViewKitchen = hasPermission(db, user, "kitchen", "view");

  if (!canViewPos && !canViewKitchen) {
    return res.status(403).json({ error: "Permission denied" });
  }

  const { status, type, from, to, limit = 100, offset = 0 } = req.query;
  const filters = [];
  const values = [];

  if (status) {
    if (status.includes(",")) {
      const statuses = status.split(",").map((s) => s.trim()).filter(Boolean);
      if (statuses.length) {
        filters.push(`status IN (${statuses.map(() => "?").join(",")})`);
        values.push(...statuses);
      }
    } else {
      filters.push("status = ?");
      values.push(status);
    }
  }
  if (type) {
    filters.push("order_type = ?");
    values.push(type);
  }
  if (from) {
    filters.push("created_at >= ?");
    values.push(from);
  }
  if (to) {
    filters.push("created_at <= ?");
    values.push(to);
  }

  const where = filters.length ? `WHERE ${filters.join(" AND ")}` : "";
  const orders = db
    .prepare(`SELECT * FROM orders ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`)
    .all(...values, clampLimit(limit), clampOffset(offset));

  const orderIds = orders.map((o) => o.id);
  const items = orderIds.length
    ? db
        .prepare(
          `SELECT * FROM order_items WHERE order_id IN (${orderIds.map(() => "?").join(",")})`
        )
        .all(...orderIds)
    : [];

  const byOrder = items.reduce((acc, item) => {
    acc[item.order_id] = acc[item.order_id] || [];
    acc[item.order_id].push(item);
    return acc;
  }, {});

  const payload = orders.map((order) => ({
    ...order,
    items: byOrder[order.id] || [],
  }));

  res.json({ orders: payload });
});

router.post("/", authenticate, (req, res) => {
  const db = getDb();
  const user = req.user;

  if (!hasPermission(db, user, "pos", "create")) {
    return res.status(403).json({ error: "Permission denied" });
  }

  const {
    orderType,
    status = "pending",
    tableNo,
    customer,
    items = [],
    paymentMethod = "cash",
    taxRate = 0,
    serviceChargeRate = 0,
    discountType = "percentage",
    discountValue = 0,
    notes = "",
    paidAmount = 0,
  } = req.body || {};

  if (!orderType || items.length === 0) {
    return res.status(400).json({ error: "Order type and items are required" });
  }

  if (!isAllowedOrderStatus(status)) {
    return res.status(400).json({ error: "Invalid order status" });
  }

  let resolvedItems;
  try {
    resolvedItems = resolveOrderItems(db, items);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }

  let totals;
  try {
    totals = calculateTotals({
      resolvedItems,
      taxRate,
      serviceChargeRate,
      discountType,
      discountValue,
      paidAmount,
    });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }

  const { subtotal, taxAmount, serviceChargeAmount, discountAmount, total, changeDue } = totals;
  const orderNumber = buildOrderNumber();
  const now = new Date().toISOString();

  const insertOrder = db.prepare(
    "INSERT INTO orders (order_number, order_type, status, table_no, customer_name, customer_phone, customer_address, subtotal, tax_rate, tax_amount, service_charge_rate, service_charge_amount, discount_type, discount_value, discount_amount, total, payment_method, paid_amount, change_due, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
  );
  const insertItem = db.prepare(
    "INSERT INTO order_items (order_id, product_id, name, price, qty, total) VALUES (?, ?, ?, ?, ?, ?)"
  );

  let orderId;
  try {
    orderId = db.transaction(() => {
      const result = insertOrder.run(
        orderNumber,
        orderType,
        status,
        tableNo || null,
        customer?.name || null,
        customer?.phone || null,
        customer?.address || null,
        subtotal,
        Number(taxRate),
        taxAmount,
        Number(serviceChargeRate),
        serviceChargeAmount,
        discountType,
        Number(discountValue),
        discountAmount,
        total,
        paymentMethod,
        Number(paidAmount),
        changeDue,
        notes,
        now,
        now
      );

      const id = result.lastInsertRowid;
      for (const item of resolvedItems) {
        insertItem.run(
          id,
          item.productId,
          item.name,
          item.price,
          item.qty,
          item.lineTotal
        );
      }
      return id;
    })();
  } catch (err) {
    return res.status(500).json({ error: "Failed to create order" });
  }

  const fullOrder = db.prepare("SELECT * FROM orders WHERE id = ?").get(orderId);
  const orderItems = db.prepare("SELECT * FROM order_items WHERE order_id = ?").all(orderId);

  broadcast("order.created", { order: { ...fullOrder, items: orderItems } });

  res.status(201).json({ id: orderId, orderNumber });
});

router.put("/:id", authenticate, (req, res) => {
  const db = getDb();
  const user = req.user;

  if (!hasPermission(db, user, "pos", "update")) {
    return res.status(403).json({ error: "Permission denied" });
  }

  const id = Number(req.params.id);
  const {
    status,
    paymentMethod,
    paidAmount,
    changeDue,
    notes,
    printedKOT,
    printedReceipt,
  } = req.body || {};

  const updates = [];
  const values = [];

  if (status) {
    if (!isAllowedOrderStatus(status)) {
      return res.status(400).json({ error: "Invalid order status" });
    }
    updates.push("status = ?");
    values.push(status);
  }
  if (paymentMethod) {
    updates.push("payment_method = ?");
    values.push(paymentMethod);
  }
  if (paidAmount !== undefined) {
    updates.push("paid_amount = ?");
    values.push(Number(paidAmount));
  }
  if (changeDue !== undefined) {
    updates.push("change_due = ?");
    values.push(Number(changeDue));
  }
  if (notes !== undefined) {
    updates.push("notes = ?");
    values.push(notes);
  }
  if (printedKOT !== undefined) {
    updates.push("printed_kot = ?");
    values.push(printedKOT ? 1 : 0);
  }
  if (printedReceipt !== undefined) {
    updates.push("printed_receipt = ?");
    values.push(printedReceipt ? 1 : 0);
  }

  if (updates.length === 0) {
    return res.json({ ok: true });
  }

  updates.push("updated_at = ?");
  values.push(new Date().toISOString());
  values.push(id);

  const sql = `UPDATE orders SET ${updates.join(", ")} WHERE id = ?`;
  db.prepare(sql).run(...values);

  res.json({ ok: true });
});

router.put("/:id/status", authenticate, (req, res) => {
  const db = getDb();
  const user = req.user;

  const canUpdate =
    hasPermission(db, user, "kitchen", "update") ||
    hasPermission(db, user, "pos", "update");

  if (!canUpdate) {
    return res.status(403).json({ error: "Permission denied" });
  }

  const id = Number(req.params.id);
  const { status } = req.body || {};
  if (!status) {
    return res.status(400).json({ error: "Status is required" });
  }
  if (!isAllowedOrderStatus(status)) {
    return res.status(400).json({ error: "Invalid order status" });
  }

  db.prepare("UPDATE orders SET status = ?, updated_at = ? WHERE id = ?").run(
    status,
    new Date().toISOString(),
    id
  );

  const order = db.prepare("SELECT * FROM orders WHERE id = ?").get(id);
  if (order) {
    const items = db.prepare("SELECT * FROM order_items WHERE order_id = ?").all(id);
    broadcast("order.status", { order: { ...order, items } });
  }

  res.json({ ok: true });
});

router.post("/:id/print/kot", authenticate, (req, res) => {
  const db = getDb();
  const user = req.user;

  if (!hasPermission(db, user, "pos", "print")) {
    return res.status(403).json({ error: "Permission denied" });
  }

  const id = Number(req.params.id);
  db.prepare("UPDATE orders SET printed_kot = 1, updated_at = ? WHERE id = ?").run(
    new Date().toISOString(),
    id
  );
  res.json({ ok: true });
});

router.post("/:id/print/receipt", authenticate, (req, res) => {
  const db = getDb();
  const user = req.user;

  if (!hasPermission(db, user, "pos", "print")) {
    return res.status(403).json({ error: "Permission denied" });
  }

  const id = Number(req.params.id);
  db.prepare("UPDATE orders SET printed_receipt = 1, updated_at = ? WHERE id = ?").run(
    new Date().toISOString(),
    id
  );
  res.json({ ok: true });
});

router.delete("/:id", authenticate, (req, res) => {
  const db = getDb();
  const user = req.user;

  if (!hasPermission(db, user, "pos", "delete")) {
    return res.status(403).json({ error: "Permission denied" });
  }

  const id = Number(req.params.id);
  db.prepare("DELETE FROM orders WHERE id = ?").run(id);
  res.json({ ok: true });
});

export default router;
