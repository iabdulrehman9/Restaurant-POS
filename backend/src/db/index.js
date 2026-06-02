import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import Database from "better-sqlite3";
import { config } from "../config.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = path.join(__dirname, "migrations");

const MODULES = [
  { key: "dashboard", label: "Dashboard", actions: ["view"] },
  { key: "pos", label: "POS", actions: ["view", "create", "update", "delete", "print", "checkout", "void"] },
  { key: "kitchen", label: "Kitchen", actions: ["view", "update"] },
  { key: "products", label: "Products", actions: ["view", "create", "update", "delete"] },
  { key: "expenses", label: "Expenses", actions: ["view", "create", "update", "delete"] },
  { key: "reports", label: "Reports", actions: ["view", "print"] },
  { key: "settings", label: "Settings", actions: ["view", "update"] },
  { key: "users", label: "Users", actions: ["view", "create", "update", "delete", "permissions"] },
];

const DEFAULT_SETTINGS = {
  name: "Restaurant POS",
  logo: "",
  address: "Main Commercial Market, Block C, Lahore",
  phone: "+92 300 1234567",
  email: "info@restaurantpos.local",
  currency: "PKR",
  timezone: "Asia/Karachi",
  invoicePrefix: "RP-",
  invoiceStart: 1001,
  billFormat: "detailed",
  showLogo: true,
  showTax: true,
  footer: "Thank you for dining with us! Visit again.",
  tax: 5,
  serviceCharge: 2,
  discountType: "percentage",
  manualDiscount: true,
  printerType: "Thermal Network",
  paperSize: "80mm",
  autoPrint: true,
  kotPrint: true,
  copies: 1,
  tables: 12,
  layout: "grid",
  autoOpenBill: true,
  categoryDefault: "Burger",
  imageRequired: false,
  barcode: false,
  stockTracking: true,
  roles: ["Admin", "Cashier", "Kitchen"],
  theme: "light",
  language: "en",
  autoLogout: 30,
  sound: true,
  pinLogin: false,
  activityLog: true,
};

/** Default admin password for first-run seed only — must be changed on first login. */
export const DEFAULT_ADMIN_PASSWORD = "ChangeMe123!";

let dbInstance = null;

const ensureDirectories = () => {
  const dataDir = path.dirname(config.dbPath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(config.uploadDir)) {
    fs.mkdirSync(config.uploadDir, { recursive: true });
  }
};

const applyMigrations = (db) => {
  db.exec(
    "CREATE TABLE IF NOT EXISTS migrations (id TEXT PRIMARY KEY, applied_at TEXT NOT NULL)"
  );

  const applied = new Set(
    db.prepare("SELECT id FROM migrations").all().map((row) => row.id)
  );

  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((file) => file.endsWith(".sql"))
    .sort();

  for (const file of files) {
    if (applied.has(file)) continue;
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), "utf-8");
    db.exec(sql);
    db.prepare("INSERT INTO migrations (id, applied_at) VALUES (?, ?)").run(
      file,
      new Date().toISOString()
    );
  }
};

const seedModules = (db) => {
  const insertModule = db.prepare(
    "INSERT OR IGNORE INTO modules (module_key, label) VALUES (?, ?)"
  );
  const insertAction = db.prepare(
    "INSERT OR IGNORE INTO module_actions (module_key, action_key, label) VALUES (?, ?, ?)"
  );

  for (const module of MODULES) {
    insertModule.run(module.key, module.label);
    for (const action of module.actions) {
      insertAction.run(module.key, action, action.toUpperCase());
    }
  }
};

const seedAdminUser = async (db) => {
  const exists = db.prepare("SELECT COUNT(*) as count FROM users").get();
  if (exists.count > 0) return;

  const now = new Date().toISOString();
  const passwordHash = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, 10);
  const result = db
    .prepare(
      "INSERT INTO users (name, email, password_hash, role, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
    )
    .run("Admin", "admin@pos.local", passwordHash, "admin", 1, now, now);

  const adminId = result.lastInsertRowid;
  const insertPermission = db.prepare(
    "INSERT OR REPLACE INTO user_permissions (user_id, module_key, action_key, allowed) VALUES (?, ?, ?, 1)"
  );

  for (const module of MODULES) {
    for (const action of module.actions) {
      insertPermission.run(adminId, module.key, action);
    }
  }
};

const seedSettings = (db) => {
  const existing = db.prepare("SELECT key FROM settings WHERE key = ?").get("app_settings");
  if (existing) return;

  db.prepare("INSERT INTO settings (key, value) VALUES (?, ?)").run(
    "app_settings",
    JSON.stringify(DEFAULT_SETTINGS)
  );
};

const configurePragmas = (db) => {
  db.pragma("foreign_keys = ON");
  db.pragma("journal_mode = WAL");
  db.pragma("synchronous = NORMAL");
  db.pragma("busy_timeout = 5000");
};

export const initDb = async () => {
  if (dbInstance) return dbInstance;

  ensureDirectories();
  const db = new Database(config.dbPath);
  configurePragmas(db);

  applyMigrations(db);
  seedModules(db);
  seedSettings(db);
  await seedAdminUser(db);

  dbInstance = db;
  return dbInstance;
};

export const getDb = () => {
  if (!dbInstance) {
    throw new Error("Database has not been initialized");
  }
  return dbInstance;
};

export const closeDb = () => {
  if (!dbInstance) return;
  try {
    dbInstance.pragma("wal_checkpoint(TRUNCATE)");
  } catch {
    // ignore checkpoint errors during shutdown
  }
  dbInstance.close();
  dbInstance = null;
};

export const runIntegrityCheck = () => {
  const db = getDb();
  const row = db.pragma("integrity_check", { simple: true });
  return row;
};

export const listModules = () => MODULES;
