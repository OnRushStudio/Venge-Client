const { app, BrowserWindow, globalShortcut, screen, protocol, autoUpdater, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");

const server = "https://update.electronjs.org";
const feedURL = `${server}/OnRushStudio/Venge-Client/${process.platform}-${process.arch}/${app.getVersion()}`;
autoUpdater.setFeedURL({ url: feedURL });

ipcMain.handle("clientsettings:get-documents-path", () => app.getPath("documents"));

ipcMain.handle("clientsettings:read-all", () => {
  try {
    const configFile = path.join(app.getPath("documents"), "Venge Client", "config", "settings.json");
    if (!fs.existsSync(configFile)) return {};
    return JSON.parse(fs.readFileSync(configFile, "utf8"));
  } catch (err) {
    console.error("[ClientSettings] Failed to read settings.json:", err);
    return {};
  }
});

app.allowRendererProcessReuse = true;

protocol.registerSchemesAsPrivileged([
  {
    scheme: "swap",
    privileges: { secure: true, corsEnabled: true, supportFetchAPI: true },
  },
]);

app.commandLine.appendSwitch("disable-gpu-vsync");
app.commandLine.appendSwitch("enable-threaded-compositing");
app.commandLine.appendSwitch("enable-gpu-rasterization");
app.commandLine.appendSwitch("ignore-gpu-blacklist");
app.commandLine.appendSwitch("high-dpi-support", "1");
app.commandLine.appendSwitch("autoplay-policy", "no-user-gesture-required");
app.commandLine.appendSwitch("enable-quic");
app.commandLine.appendSwitch("enable-pointer-lock-options");

let splash = null;
let mainClient = null;
let settingsWindow = null;

function createSplash() {
  splash = new BrowserWindow({
    width: 530,
    height: 300,
    frame: false,
    transparent: true,
    resizable: false,
    alwaysOnTop: true,
    center: true,
    webPreferences: { nodeIntegration: true },
  });

  splash.loadFile(path.join(__dirname, "splash/index.html"));
}

function setupResourceSwap(win) {
  const { session } = win.webContents;
  const documents = app.getPath("documents");
  const swapDir = path.join(documents, "Venge Client", "Resource Swapper");
  const skinDir = path.join(documents, "Venge Client", "Skin Swapper");

  if (!fs.existsSync(swapDir)) fs.mkdirSync(swapDir, { recursive: true });
  if (!fs.existsSync(skinDir)) fs.mkdirSync(skinDir, { recursive: true });

  session.webRequest.onBeforeRequest((details, callback) => {
    try {
      const url = new URL(details.url);
      if (!url.protocol.startsWith("http")) return callback({ cancel: false });
      if (url.pathname.endsWith(".html") || url.pathname.endsWith(".htm")) return callback({ cancel: false });

      const swapPath = path.join(swapDir, url.pathname);
      if (fs.existsSync(swapPath) && fs.statSync(swapPath).isFile()) {
        console.log("[Swap] Resource:", url.pathname);
        return callback({ redirectURL: `swap:/${encodeURIComponent(swapPath)}` });
      }

      if (url.hostname === "assets.venge.io") {
        const skinPath = path.join(skinDir, url.pathname);
        if (fs.existsSync(skinPath) && fs.statSync(skinPath).isFile()) {
          console.log("[Swap] Skin:", url.pathname);
          return callback({ redirectURL: `swap:/${encodeURIComponent(skinPath)}` });
        }
      }
    } catch (err) {
      console.error("[Resource Swap Error]", err);
    }

    return callback({ cancel: false });
  });

  console.log("[Swap] Active");
}

async function loadCustomClientSettings(win) {
  const dir = path.join(app.getPath("documents"), "Venge Client", "Userscript", "ClientSettings");
  if (!fs.existsSync(dir)) return;

  const files = fs.readdirSync(dir).filter(f => f.endsWith(".js"));
  if (files.length === 0) return;

  for (const file of files) {
    const filePath = path.join(dir, file);
    const js = fs.readFileSync(filePath, "utf8");

    try {
      await win.webContents.executeJavaScript(js);
      console.log("[ClientSettings] Loaded:", file);
    } catch (err) {
      console.error("[ClientSettings] Error executing", file, err.message);
    }
  }
}

function injectUserScripts(win) {
  const dir = path.join(app.getPath("documents"), "Venge Client", "Userscript");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const files = fs.readdirSync(dir);
  for (const f of files) {
    const fullPath = path.join(dir, f);
    if (fs.statSync(fullPath).isDirectory()) continue;
    if (f.toLowerCase().includes("clientsettings")) continue;

    if (f.endsWith(".js")) {
      const script = fs.readFileSync(fullPath, "utf8");
      win.webContents
        .executeJavaScript(script)
        .then(() => console.log("[Userscript] Loaded:", f))
        .catch(err => console.error("[Userscript] Error:", f, err.message));
    }
  }
}

function getRenderBackend() {
  try {
    const documents = app.getPath("documents");
    const configFile = path.join(documents, "Venge Client", "config", "settings.json");

    if (!fs.existsSync(configFile)) return "default";

    const data = JSON.parse(fs.readFileSync(configFile, "utf8"));
    return data.renderer_angle || "default";
  } catch (e) {
    console.error("[Renderer] Failed to read settings.json:", e);
    return "default";
  }
}

const rendererBackend = getRenderBackend();

switch (rendererBackend) {
  case "opengl":
    app.commandLine.appendSwitch("use-angle", "gl");
    console.log("[Renderer] OpenGL");
    break;

  case "d3d11":
    app.commandLine.appendSwitch("use-angle", "d3d11");
    console.log("[Renderer] D3D11");
    break;

  case "vulkan":
    app.commandLine.appendSwitch("use-angle", "vulkan");
    console.log("[Renderer] Vulkan");
    break;

  default:
    console.log("[Renderer] Default ANGLE");
}

class VengeClient {
  constructor() {
    this.win = null;
  }

  async createWindow() {
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;
    this.win = new BrowserWindow({
      width,
      height,
      fullscreen: true,
      backgroundColor: "#202020",
      title: "Venge Client",
      autoHideMenuBar: true,
      icon: path.join(__dirname, "icon.ico"),
      webPreferences: {
        preload: path.join(__dirname, "client-preload.js"),
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: false,
        backgroundThrottling: false,
      },
    });

    setupResourceSwap(this.win);

    this.win.loadURL("https://venge.io");

    this.win.webContents.on("dom-ready", () => {
      injectUserScripts(this.win);
    });

    globalShortcut.register("F4", () => {
      if (!this.win.isDestroyed()) this.win.loadURL("https://venge.io");
    });

    globalShortcut.register("F5", () => {
      this.win.reload();
    });

    globalShortcut.register("F7", async () => {
      if (settingsWindow && !settingsWindow.isDestroyed()) {
        settingsWindow.close();
        settingsWindow = null;
        return;
      }

      settingsWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        title: "Venge Client Settings",
        backgroundColor: "#202020",
        icon: path.join(__dirname, "icon.ico"),
        autoHideMenuBar: true,
        webPreferences: {
          preload: path.join(__dirname, "client-settings", "preload.js"),
          contextIsolation: true,
          sandbox: false,
          nodeIntegration: false,
        },
      });

      // May need to change it later
      settingsWindow.webContents.setFrameRate(1);

      settingsWindow.loadFile(path.join(__dirname, "client-settings", "index.html"));
      settingsWindow.on("closed", () => (settingsWindow = null));

      settingsWindow.webContents.on("did-finish-load", async () => {
        await loadCustomClientSettings(settingsWindow);
      });
    });

    this.win.on("closed", () => {
      globalShortcut.unregisterAll();
      if (settingsWindow && !settingsWindow.isDestroyed()) settingsWindow.close();
    });
  }
}

autoUpdater.on("checking-for-update", () => {
  console.log("[Updater] Checking...");
});

autoUpdater.on("update-available", info => {
  console.log(`[Updater] Update: v${info.version}`);
});

autoUpdater.on("update-not-available", () => {
  console.log("[Updater] None");
  splash?.close();
  const client = new VengeClient();
  client.createWindow();
});

autoUpdater.on("error", err => {
  console.error("[Updater] Error:", err);
  splash?.close();
  const client = new VengeClient();
  client.createWindow();
});

app.whenReady().then(() => {
  protocol.registerFileProtocol("swap", (req, cb) => {
    try {
      let filePath = decodeURIComponent(req.url.replace(/^swap:\/*/, ""));
      if (!fs.existsSync(filePath)) return cb({ error: -6 });
      cb({ path: filePath });
    } catch {
      cb({ error: -6 });
    }
  });

  createSplash();
  setTimeout(() => {
    autoUpdater.checkForUpdates().catch(err => {
      console.error("[Updater] Failed:", err);
      splash.close();
      const client = new VengeClient();
      client.createWindow();
    });
  }, 800);
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
