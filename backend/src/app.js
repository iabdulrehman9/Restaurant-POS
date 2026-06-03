import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { config } from "./config.js";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import permissionsRoutes from "./routes/permissions.js";
import productRoutes from "./routes/products.js";
import orderRoutes from "./routes/orders.js";
import expenseRoutes from "./routes/expenses.js";
import reportRoutes from "./routes/reports.js";
import settingsRoutes from "./routes/settings.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

const corsOptions = config.host === "127.0.0.1"
  ? {
      origin(origin, callback) {
        if (!origin || origin.startsWith("http://127.0.0.1") || origin.startsWith("http://localhost")) {
          callback(null, true);
          return;
        }
        callback(new Error("Not allowed by CORS"));
      },
      credentials: true,
    }
  : {};

app.use(cors(corsOptions));
app.use(express.json({ limit: "5mb" }));
app.use("/uploads", express.static(path.resolve(config.uploadDir)));

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/permissions", permissionsRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/settings", settingsRoutes);

/**
 * Must run AFTER configure() sets config.frontendDir (not at module import time).
 * Returns true when static + SPA fallback were registered.
 */
export const registerFrontendStatic = (frontendDir) => {
  if (!frontendDir) {
    console.warn("[frontend] No frontendDir configured — skipping static serve");
    return false;
  }

  const resolved = path.resolve(frontendDir);
  const indexHtml = path.join(resolved, "index.html");
  const indexExists = fs.existsSync(indexHtml);

  console.log("[frontend] frontendDir:", resolved);
  console.log("[frontend] index.html exists:", indexExists);

  if (!indexExists) {
    console.error("[frontend] index.html missing — UI will not load");
    return false;
  }

  app.use(express.static(resolved));

  app.get("*", (req, res, next) => {
    if (
      req.path.startsWith("/api") ||
      req.path.startsWith("/uploads") ||
      req.path.startsWith("/ws")
    ) {
      return next();
    }
    res.sendFile(indexHtml);
  });

  console.log("[frontend] Static + SPA fallback registered");
  return true;
};

app.use(errorHandler);

export default app;
