import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import crypto from "crypto";

dotenv.config();

const rootDir = process.cwd();

let runtimeConfig = {
  port: Number(process.env.PORT || 5000),
  host: process.env.HOST || "127.0.0.1",
  jwtSecret: process.env.JWT_SECRET || null,
  secretsPath: process.env.SECRETS_PATH || null,
  dbPath: process.env.DB_PATH || path.join(rootDir, "data", "pos.sqlite"),
  uploadDir: process.env.UPLOAD_DIR || path.join(rootDir, "uploads"),
  frontendDir: process.env.FRONTEND_DIR || null,
  isPackaged: process.env.NODE_ENV === "production" || process.env.ELECTRON_RUN === "1",
};

export const configure = (overrides = {}) => {
  runtimeConfig = { ...runtimeConfig, ...overrides };
};

const ensureSecretsFile = () => {
  if (runtimeConfig.jwtSecret) return runtimeConfig.jwtSecret;

  const secretsPath =
    runtimeConfig.secretsPath || path.join(path.dirname(runtimeConfig.dbPath), ".secrets.json");

  if (fs.existsSync(secretsPath)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(secretsPath, "utf-8"));
      if (parsed.jwtSecret) {
        runtimeConfig.jwtSecret = parsed.jwtSecret;
        return runtimeConfig.jwtSecret;
      }
    } catch {
      // fall through to regenerate
    }
  }

  if (runtimeConfig.isPackaged) {
    throw new Error("JWT secret is missing. Delete .secrets.json only if you intend to reset auth.");
  }

  const jwtSecret = crypto.randomBytes(32).toString("hex");
  fs.mkdirSync(path.dirname(secretsPath), { recursive: true });
  fs.writeFileSync(secretsPath, JSON.stringify({ jwtSecret }, null, 2), "utf-8");
  runtimeConfig.jwtSecret = jwtSecret;
  runtimeConfig.secretsPath = secretsPath;
  return jwtSecret;
};

export const config = new Proxy(
  {},
  {
    get(_target, prop) {
      if (prop === "jwtSecret") {
        return ensureSecretsFile();
      }
      return runtimeConfig[prop];
    },
  }
);
