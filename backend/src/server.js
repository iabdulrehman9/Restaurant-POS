import http from "http";
import path from "path";
import { fileURLToPath } from "url";
import app from "./app.js";
import { config } from "./config.js";
import { initDb, closeDb, runIntegrityCheck } from "./db/index.js";
import { createWebSocketServer } from "./ws.js";

export const startServer = async (options = {}) => {
  if (options.config) {
    const { configure } = await import("./config.js");
    configure(options.config);
  }

  await initDb();

  const integrity = runIntegrityCheck();
  if (integrity !== "ok") {
    console.warn("Database integrity check:", integrity);
  }

  const server = http.createServer(app);
  createWebSocketServer(server);

  const host = config.host || "127.0.0.1";
  const requestedPort = options.port ?? config.port;

  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(requestedPort, host, () => {
      server.removeListener("error", reject);
      resolve();
    });
  });

  const address = server.address();
  const port = typeof address === "object" && address ? address.port : requestedPort;

  console.log(`POS backend running on http://${host}:${port}`);

  return {
    server,
    host,
    port,
    close: async () => {
      await new Promise((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      });
      closeDb();
    },
  };
};

const modulePath = fileURLToPath(import.meta.url);
const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";

if (invokedPath === modulePath) {
  startServer().catch((err) => {
    console.error("Failed to start server:", err);
    process.exit(1);
  });
}
