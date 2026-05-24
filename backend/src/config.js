import dotenv from "dotenv";
import path from "path";

dotenv.config();

const rootDir = process.cwd();

export const config = {
  port: Number(process.env.PORT || 5000),
  jwtSecret: process.env.JWT_SECRET || "dev_secret_change_me",
  dbPath: process.env.DB_PATH || path.join(rootDir, "data", "pos.sqlite"),
  uploadDir: process.env.UPLOAD_DIR || path.join(rootDir, "uploads"),
};
