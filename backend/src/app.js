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

if (config.frontendDir && fs.existsSync(config.frontendDir)) {
  app.use(express.static(config.frontendDir));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api") || req.path.startsWith("/uploads") || req.path.startsWith("/ws")) {
      return next();
    }
    res.sendFile(path.join(config.frontendDir, "index.html"));
  });
}

app.use(errorHandler);

export default app;
