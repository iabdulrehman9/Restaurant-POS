import jwt from "jsonwebtoken";
import { WebSocketServer } from "ws";
import { config } from "./config.js";
import { getDb } from "./db/index.js";

let wss = null;

const authenticateSocket = (req) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const token = url.searchParams.get("token");
  if (!token) return null;

  try {
    const payload = jwt.verify(token, config.jwtSecret);
    const db = getDb();
    const user = db
      .prepare("SELECT id, name, email, role, is_active FROM users WHERE id = ?")
      .get(payload.sub);
    if (!user || !user.is_active) return null;
    return user;
  } catch {
    return null;
  }
};

export const createWebSocketServer = (server) => {
  wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", (socket, req) => {
    const user = authenticateSocket(req);
    if (!user) {
      socket.close(4401, "Unauthorized");
      return;
    }

    socket.send(JSON.stringify({ type: "connected", payload: { ok: true } }));
  });

  return wss;
};

export const broadcast = (type, payload) => {
  if (!wss) return;
  const message = JSON.stringify({ type, payload });

  for (const client of wss.clients) {
    if (client.readyState === 1) {
      client.send(message);
    }
  }
};
