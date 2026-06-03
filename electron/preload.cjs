const { contextBridge } = require("electron");

const readPortFromArgv = () => {
  const arg = process.argv.find((entry) => entry.startsWith("--pos-api-port="));
  return arg ? arg.split("=")[1] : null;
};

const port = readPortFromArgv() || "5000";
const apiBase = `http://127.0.0.1:${port}/api`;
const wsUrl = `ws://127.0.0.1:${port}/ws`;

contextBridge.exposeInMainWorld("__POS_API_BASE__", apiBase);
contextBridge.exposeInMainWorld("__POS_WS__", wsUrl);

contextBridge.exposeInMainWorld("posDesktop", {
  getApiBaseUrl: () => apiBase,
  getWsUrl: () => wsUrl,
  isDesktop: true,
});
