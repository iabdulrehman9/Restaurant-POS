import { WebSocketServer } from "ws";

let wss = null;

export const createWebSocketServer = (server) => {
  wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", (socket) => {
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
