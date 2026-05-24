import http from "http";
import app from "./app.js";
import { config } from "./config.js";
import { initDb } from "./db/index.js";
import { createWebSocketServer } from "./ws.js";

const startServer = async () => {
  await initDb();

  const server = http.createServer(app);
  createWebSocketServer(server);

  server.listen(config.port, () => {
    console.log(`POS backend running on port ${config.port}`);
  });
};

startServer();
