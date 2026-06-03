import http from "http";
import path from "path";
import { fileURLToPath } from "url";
import { config, configure } from "./config.js";
import { initDb, closeDb, runIntegrityCheck } from "./db/index.js";
import { createWebSocketServer } from "./ws.js";

export const startServer = async (options = {}) => {
  if (options.config) {
    configure(options.config);
  }

  // Import app AFTER configure() so routes see correct uploadDir / paths
  const { default: app, registerFrontendStatic } = await import("./app.js");

  const frontendRegistered = registerFrontendStatic(config.frontendDir);
  if (config.frontendDir && !frontendRegistered) {
    console.warn("[server] Frontend static files could not be registered");
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
  console.log(`[server] frontendDir: ${config.frontendDir || "(none)"}`);

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
