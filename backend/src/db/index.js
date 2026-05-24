import fs from "fs";
import path from "path";
import initSqlJs from "sql.js";
import bcrypt from "bcryptjs";
import { config } from "../config.js";

const MIGRATIONS_DIR = path.join(process.cwd(), "src", "db", "migrations");

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
  name: "Crispy House Cafe",
  logo: "",
  address: "Main Commercial Market, Block C, Lahore",
  phone: "+92 300 1234567",
  email: "info@crispyhouse.com",
  currency: "PKR",
  timezone: "Asia/Karachi",
  invoicePrefix: "CH-",
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
  activityLog: true
};

let dbInstance = null;
let sqlModule = null;

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
  const passwordHash = await bcrypt.hash("admin123", 10);
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

const loadSqlModule = async () => {
  if (sqlModule) return sqlModule;
  sqlModule = await initSqlJs({
    locateFile: (file) => path.join(process.cwd(), "node_modules", "sql.js", "dist", file)
  });
  return sqlModule;
};

const normalizeParams = (params) => {
  if (params.length === 1 && Array.isArray(params[0])) {
    return params[0];
  }
  return params;
};

class StatementWrapper {
  constructor(db, sql, persist, shouldPersist) {
    this.db = db;
    this.sql = sql;
    this.persist = persist;
    this.shouldPersist = shouldPersist;
  }

  run(...params) {
    const stmt = this.db.prepare(this.sql);
    const values = normalizeParams(params);
    if (values.length) {
      stmt.bind(values);
    }
    stmt.step();
    stmt.free();

    const changes = this.db.getRowsModified();
    let lastInsertRowid = 0;
    try {
      const result = this.db.exec("SELECT last_insert_rowid() AS id");
      if (result.length && result[0].values.length) {
        lastInsertRowid = result[0].values[0][0];
      }
    } catch (err) {
      lastInsertRowid = 0;
    }

    if (this.persist && this.shouldPersist()) {
      this.persist();
    }
    return { changes, lastInsertRowid };
  }

  get(...params) {
    const stmt = this.db.prepare(this.sql);
    const values = normalizeParams(params);
    if (values.length) {
      stmt.bind(values);
    }
    const hasRow = stmt.step();
    const row = hasRow ? stmt.getAsObject() : undefined;
    stmt.free();
    if (!row || Object.keys(row).length === 0) return undefined;
    return row;
  }

  all(...params) {
    const stmt = this.db.prepare(this.sql);
    const values = normalizeParams(params);
    if (values.length) {
      stmt.bind(values);
    }
    const rows = [];
    while (stmt.step()) {
      rows.push(stmt.getAsObject());
    }
    stmt.free();
    return rows;
  }
}

class SqlJsDatabase {
  constructor(db, persist) {
    this.db = db;
    this.persist = persist;
    this.transactionDepth = 0;
  }

  shouldPersist() {
    return this.transactionDepth === 0;
  }

  exec(sql) {
    const result = this.db.exec(sql);
    if (this.persist && this.shouldPersist()) {
      this.persist();
    }
    return result;
  }

  prepare(sql) {
    return new StatementWrapper(this.db, sql, this.persist, () => this.shouldPersist());
  }

  transaction(fn) {
    return (...args) => {
      let committed = false;
      this.db.exec("BEGIN");
      this.transactionDepth += 1;
      try {
        const result = fn(...args);
        this.db.exec("COMMIT");
        committed = true;
        return result;
      } catch (err) {
        try {
          this.db.exec("ROLLBACK");
        } catch (rollbackErr) {
          // ignore rollback errors when no transaction is active
        }
        throw err;
      } finally {
        this.transactionDepth = Math.max(0, this.transactionDepth - 1);
        if (committed && this.persist && this.shouldPersist()) {
          this.persist();
        }
      }
    };
  }
}

const loadDatabase = async () => {
  ensureDirectories();
  const SQL = await loadSqlModule();
  if (fs.existsSync(config.dbPath)) {
    const fileBuffer = fs.readFileSync(config.dbPath);
    return new SQL.Database(fileBuffer);
  }
  return new SQL.Database();
};

const createPersist = (db) => () => {
  const data = db.export();
  fs.writeFileSync(config.dbPath, Buffer.from(data));
};

export const initDb = async () => {
  if (dbInstance) return dbInstance;

  const rawDb = await loadDatabase();
  const persist = createPersist(rawDb);
  const db = new SqlJsDatabase(rawDb, persist);

  rawDb.exec("PRAGMA foreign_keys = ON;");

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

export const listModules = () => MODULES;
