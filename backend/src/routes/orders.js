import express from "express";
import { authenticate } from "../middleware/auth.js";
import { getDb } from "../db/index.js";
import { broadcast } from "../ws.js";

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
    .all(...values, Number(limit), Number(offset));

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
    paidAmount = 0
  } = req.body || {};

  if (!orderType || items.length === 0) {
    return res.status(400).json({ error: "Order type and items are required" });
  }

  const subtotal = items.reduce((sum, item) => sum + Number(item.price) * Number(item.qty), 0);
  const taxAmount = subtotal * (Number(taxRate) / 100);
  const serviceChargeAmount = subtotal * (Number(serviceChargeRate) / 100);

  let discountAmount = 0;
  if (discountType === "percentage") {
    discountAmount = subtotal * (Number(discountValue) / 100);
  } else if (discountType === "fixed") {
    discountAmount = Number(discountValue);
  }

  const total = subtotal + taxAmount + serviceChargeAmount - discountAmount;
  const changeDue = Number(paidAmount) - total;

  const orderNumber = buildOrderNumber();
  const now = new Date().toISOString();

  const insertOrder = db.prepare(
    "INSERT INTO orders (order_number, order_type, status, table_no, customer_name, customer_phone, customer_address, subtotal, tax_rate, tax_amount, service_charge_rate, service_charge_amount, discount_type, discount_value, discount_amount, total, payment_method, paid_amount, change_due, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
  );
  const insertItem = db.prepare(
    "INSERT INTO order_items (order_id, product_id, name, price, qty, total) VALUES (?, ?, ?, ?, ?, ?)"
  );

  const transaction = db.transaction(() => {
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

    const orderId = result.lastInsertRowid;
    for (const item of items) {
      insertItem.run(
        orderId,
        item.productId || null,
        item.name,
        Number(item.price),
        Number(item.qty),
        Number(item.price) * Number(item.qty)
      );
    }

    return orderId;
  });

  const orderId = transaction();

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
    printedReceipt
  } = req.body || {};

  const updates = [];
  const values = [];

  if (status) {
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
