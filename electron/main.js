import {
  app,
  BrowserWindow,
  session,
} from "electron";
import path from "path";
import fs from "fs";
import { pathToFileURL, fileURLToPath } from "url";
import { initLogger } from "./logger.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const getPaths = () => {
  const appRoot = app.getAppPath();
  const asarDist = path.join(appRoot, "frontend", "dist");
  const unpackedRoot = appRoot.endsWith(".asar")
    ? appRoot.replace(/\.asar$/, ".asar.unpacked")
    : appRoot;
  const unpackedDist = path.join(unpackedRoot, "frontend", "dist");
  const frontendDist = fs.existsSync(path.join(unpackedDist, "index.html"))
    ? unpackedDist
    : asarDist;

  return {
    rootDir: appRoot,
    backendDir: path.join(appRoot, "backend"),
    frontendDist,
  };
};

const isDev = !app.isPackaged;
const gotMinimizedFlag = process.argv.includes("--minimized");
const DEV_BACKEND_PORT = Number(process.env.PORT || 5000);
const DEV_FRONTEND_URL = process.env.VITE_DEV_URL || "http://127.0.0.1:5173";

let mainWindow = null;
let backendHandle = null;
let log = null;

const readJson = (filePath, fallback = {}) => {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, "utf-8"));
    }
  } catch {
    // ignore corrupt state files
  }
  return fallback;
};

const writeJson = (filePath, data) => {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
};

const getStatePaths = () => {
  const userData = app.getPath("userData");
  return {
    userData,
    windowState: path.join(userData, "window-state.json"),
    appSettings: path.join(userData, "app-settings.json"),
    dbPath: path.join(userData, "pos.sqlite"),
    uploadDir: path.join(userData, "uploads"),
    secretsPath: path.join(userData, ".secrets.json"),
    logDir: path.join(userData, "logs"),
    frontendDir: isDev ? null : getPaths().frontendDist,
  };
};

const applyAutoLaunch = (enabled, openAsHidden) => {
  app.setLoginItemSettings({
    openAtLogin: enabled,
    openAsHidden,
    path: process.execPath,
    args: openAsHidden ? ["--minimized"] : [],
  });
};

const saveWindowState = () => {
  if (!mainWindow) return;
  const paths = getStatePaths();
  const bounds = mainWindow.getBounds();
  writeJson(paths.windowState, {
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height,
    isMaximized: mainWindow.isMaximized(),
    isMinimized: mainWindow.isMinimized(),
  });

  const settings = readJson(paths.appSettings, { autoLaunch: true });
  applyAutoLaunch(settings.autoLaunch !== false, mainWindow.isMinimized());
};

const createMainWindow = async ({ port, loadUrl, apiPort }) => {
  const paths = getStatePaths();
  const saved = readJson(paths.windowState, {
    width: 1280,
    height: 800,
  });

  mainWindow = new BrowserWindow({
    x: saved.x,
    y: saved.y,
    width: saved.width || 1280,
    height: saved.height || 800,
    minWidth: 1024,
    minHeight: 640,
    show: false,
    title: "Restaurant POS",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
    },
  });

  if (saved.isMaximized) {
    mainWindow.maximize();
  }

  const apiBase = `http://127.0.0.1:${apiPort}/api`;
  const wsUrl = `ws://127.0.0.1:${apiPort}/ws`;

  mainWindow.webContents.on("did-finish-load", () => {
    mainWindow.webContents.executeJavaScript(`
      globalThis.__POS_API_BASE__ = ${JSON.stringify(apiBase)};
      globalThis.__POS_WS__ = ${JSON.stringify(wsUrl)};
      globalThis.__POS_VERSION__ = ${JSON.stringify(app.getVersion())};
      globalThis.__POS_LOG_PATH__ = ${JSON.stringify(path.join(paths.logDir, "main.log"))};
    `);
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url === "about:blank") {
      return { action: "allow" };
    }
    return { action: "deny" };
  });

  mainWindow.webContents.on("will-navigate", (event, url) => {
    const allowedOrigin = isDev
      ? new URL(loadUrl).origin
      : `http://127.0.0.1:${port}`;
    if (!url.startsWith(allowedOrigin) && !url.startsWith(`http://127.0.0.1:${apiPort}`)) {
      event.preventDefault();
    }
  });

  mainWindow.webContents.on("did-fail-load", (_event, errorCode, errorDescription, validatedURL) => {
    log.error("Page failed to load", { errorCode, errorDescription, validatedURL, loadUrl });
  });

  log.info("Loading window URL", { loadUrl, apiPort });

  await mainWindow.loadURL(loadUrl);

  mainWindow.once("ready-to-show", () => {
    if (gotMinimizedFlag || saved.isMinimized) {
      mainWindow.minimize();
    }
    mainWindow.show();
  });

  mainWindow.on("close", () => {
    saveWindowState();
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
};

const blockExternalRequests = () => {
  session.defaultSession.webRequest.onBeforeRequest({ urls: ["*://*/*"] }, (details, callback) => {
    const url = details.url;
    const allowed =
      url.startsWith("http://127.0.0.1") ||
      url.startsWith("http://localhost") ||
      url.startsWith("ws://127.0.0.1") ||
      url.startsWith("ws://localhost") ||
      url.startsWith("devtools://") ||
      url.startsWith("chrome-devtools://") ||
      url.startsWith("data:") ||
      url.startsWith("blob:");

    callback({ cancel: !allowed });
  });
};

const startEmbeddedBackend = async (paths) => {
  const { backendDir } = getPaths();
  const { startServer } = await import(pathToFileURL(path.join(backendDir, "src", "server.js")).href);

  return startServer({
    port: isDev ? DEV_BACKEND_PORT : 0,
    config: {
      host: "127.0.0.1",
      dbPath: paths.dbPath,
      uploadDir: paths.uploadDir,
      secretsPath: paths.secretsPath,
      frontendDir: isDev ? null : getPaths().frontendDist,
      isPackaged: app.isPackaged,
    },
  });
};

const bootstrap = async () => {
  const paths = getStatePaths();
  fs.mkdirSync(paths.logDir, { recursive: true });
  log = initLogger(paths.userData);
  log.info("Starting Restaurant POS", { isDev, packaged: app.isPackaged });

  process.env.ELECTRON_RUN = "1";
  process.env.NODE_ENV = app.isPackaged ? "production" : "development";

  const settings = readJson(paths.appSettings, { autoLaunch: true });
  if (settings.autoLaunch !== false) {
    applyAutoLaunch(true, gotMinimizedFlag);
  }

  blockExternalRequests();

  if (isDev) {
    backendHandle = await startEmbeddedBackend(paths);
    await createMainWindow({
      port: DEV_BACKEND_PORT,
      apiPort: DEV_BACKEND_PORT,
      loadUrl: DEV_FRONTEND_URL,
    });
  } else {
    backendHandle = await startEmbeddedBackend(paths);
    const frontendDist = getPaths().frontendDist;
    const indexHtml = path.join(frontendDist, "index.html");
    const loadUrl = `http://127.0.0.1:${backendHandle.port}/`;

    log.info("Packaged app paths", {
      appPath: app.getAppPath(),
      frontendDist,
      indexHtmlExists: fs.existsSync(indexHtml),
      backendPort: backendHandle.port,
      loadUrl,
    });

    await createMainWindow({
      port: backendHandle.port,
      apiPort: backendHandle.port,
      loadUrl,
    });
  }
};

app.whenReady().then(bootstrap).catch((err) => {
  if (log) log.error("Bootstrap failed:", err);
  else console.error("Bootstrap failed:", err);
  app.quit();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", async (event) => {
  if (!backendHandle) return;
  event.preventDefault();
  try {
    saveWindowState();
    await backendHandle.close();
    backendHandle = null;
    app.exit(0);
  } catch (err) {
    if (log) log.error("Shutdown error:", err);
    app.exit(1);
  }
});

app.on("activate", async () => {
  if (BrowserWindow.getAllWindows().length === 0 && backendHandle) {
    const loadUrl = isDev
      ? DEV_FRONTEND_URL
      : `http://127.0.0.1:${backendHandle.port}`;
    await createMainWindow({
      port: backendHandle.port,
      apiPort: isDev ? DEV_BACKEND_PORT : backendHandle.port,
      loadUrl,
    });
  }
});

process.on("uncaughtException", (err) => {
  if (log) log.error("Uncaught exception:", err);
});

process.on("unhandledRejection", (err) => {
  if (log) log.error("Unhandled rejection:", err);
});
