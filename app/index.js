// app/index.js
const { app, BrowserWindow, globalShortcut, screen, protocol } = require("electron");
const path = require("path");
const fs = require("fs");
const https = require("https");

app.allowRendererProcessReuse = true;

// Register secure custom scheme before ready
protocol.registerSchemesAsPrivileged([
  {
    scheme: "swap",
    privileges: {
      secure: true,
      corsEnabled: true,
      supportFetchAPI: true,
    },
  },
]);

// --------------------------------------------------------------------------

// --- Chromium flags for performance ---
app.commandLine.appendSwitch("disable-gpu-vsync");
app.commandLine.appendSwitch("enable-threaded-compositing");
app.commandLine.appendSwitch("enable-gpu-rasterization");
app.commandLine.appendSwitch("enable-features", "UseHighPrecisionTimers");
app.commandLine.appendSwitch("ignore-gpu-blacklist");
app.commandLine.appendSwitch("high-dpi-support", "1");
app.commandLine.appendSwitch("autoplay-policy", "no-user-gesture-required");
app.commandLine.appendSwitch("enable-quic");
app.commandLine.appendSwitch("enable-pointer-lock-options");

// --------------------------------------------------------------------------
class VengeClient {
  constructor() {
    this.win = null;
  }

  createWindow() {
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;
    this.win = new BrowserWindow({
      width,
      height,
      fullscreen: true,
      backgroundColor: "#202020",
      title: "VengeClient",
      icon: __dirname + "/../icon.ico",
      autoHideMenuBar: true,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        sandbox: false,
        backgroundThrottling: false,
      },
    });

    this.win.loadURL("https://venge.io");

    // F4 to reload
    globalShortcut.register("F4", () => {
      if (!this.win.isDestroyed()) this.win.loadURL("https://venge.io");
    });

    // Escape to unlock pointer
    this.win.webContents.on("before-input-event", (event, input) => {
      if (input.type === "keyDown" && input.key === "Escape") {
        this.win.webContents
          .executeJavaScript("if (document.exitPointerLock) document.exitPointerLock();")
          .catch(() => {});
      }
    });

    // DOM ready, we can load user mods now
    this.win.webContents.on("dom-ready", () => {
      this.injectScripts();
      this.replaceResources();
      this.injectCSS();
    });

    this.win.on("closed", () => globalShortcut.unregisterAll());
  }

  // --------------------------------------------------------------------------
  injectScripts() {
    const scriptDirectory = path.join(app.getPath("documents"), "Venge Client", "Userscript");
    if (!fs.existsSync(scriptDirectory)) fs.mkdirSync(scriptDirectory, { recursive: true });

    const files = fs.readdirSync(scriptDirectory, { withFileTypes: true });
    for (const file of files) {
      if (!file.name.endsWith(".js")) continue;
      const script = fs.readFileSync(path.join(scriptDirectory, file.name), "utf8");
      this.win.webContents
        .executeJavaScript(script)
        .then(() => console.log(`[Userscript] Loaded: ${file.name}`))
        .catch((err) => console.error(`[Userscript Error] ${file.name}:`, err.message));
    }
  }

  // --------------------------------------------------------------------------
  injectInstalledScripts(url) {
    https
      .get(url, (response) => {
        let content = "";
        response.on("data", (chunk) => (content += chunk));
        response.on("end", () => {
          try {
            this.win.webContents.executeJavaScript(content);
            console.log("[Remote Script] Loaded:", url);
          } catch (err) {
            console.error("[Remote Script Error]", err.message);
          }
        });
      })
      .on("error", (err) => {
        console.error("[HTTP Error]", err.message);
      });
  }

  // --------------------------------------------------------------------------
  injectCSS() {
    const cssDirectory = path.join(app.getPath("documents"), "Venge Client", "CSS");
    if (!fs.existsSync(cssDirectory)) fs.mkdirSync(cssDirectory, { recursive: true });

    const files = fs.readdirSync(cssDirectory).filter((f) => f.endsWith(".css"));
    for (const file of files) {
      const css = fs.readFileSync(path.join(cssDirectory, file), "utf8");
      this.win.webContents
        .insertCSS(css)
        .then(() => console.log(`[UserCSS] Loaded: ${file}`))
        .catch((err) => console.error(`[UserCSS Error] ${file}:`, err.message));
    }
  }

  // --------------------------------------------------------------------------
  replaceResources() {
    const swapDir = path.join(app.getPath("documents"), "Venge Client", "Resource Swapper");
    const skinDir = path.join(app.getPath("documents"), "Venge Client", "Skin Swapper");

    if (!fs.existsSync(swapDir)) fs.mkdirSync(swapDir, { recursive: true });
    if (!fs.existsSync(skinDir)) fs.mkdirSync(skinDir, { recursive: true });

    this.win.webContents.session.webRequest.onBeforeRequest((details, callback) => {
      try {
        const url = new URL(details.url);

        // only apply swaps to requests from venge.io
        if (url.hostname !== "venge.io" && url.hostname !== "assets.venge.io") {
          return callback({ cancel: false });
        }

        // Resource Swapper
        const swapPath = path.join(swapDir, url.pathname);
        if (fs.existsSync(swapPath) && fs.statSync(swapPath).isFile()) {
          const encoded = encodeURIComponent(swapPath);
          console.log("[Swap] Redirecting:", details.url, "→", swapPath);
          return callback({ cancel: false, redirectURL: `swap:/${encoded}` });
        }

        // Skin Swapper
        if (url.hostname === "assets.venge.io") {
          const skinPath = path.join(skinDir, url.pathname);
          if (fs.existsSync(skinPath) && fs.statSync(skinPath).isFile()) {
            const encoded = encodeURIComponent(skinPath);
            console.log("[Skin] Redirecting:", details.url, "→", skinPath);
            return callback({ cancel: false, redirectURL: `swap:/${encoded}` });
          }
        }

        // Log missing resources for debugging
        console.warn("[Missing Swap Resource]", details.url);
      } catch (err) {
        console.error("[Resource Swap Error]", err);
      }

      return callback({ cancel: false });
    });
  }
}

// --------------------------------------------------------------------------
const client = new VengeClient();

app.on("ready", () => {
  // Register swap
  protocol.registerFileProtocol("swap", (request, callback) => {
    try {
      let filePath = request.url.replace(/^swap:\/*/, "");
      filePath = decodeURIComponent(filePath);
      filePath = path.normalize(filePath);

      if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
        console.warn("[swap:// Missing File]", filePath);
        return callback({ error: -6 }); // FILE_NOT_FOUND
      }

      console.log("[swap://]", filePath);
      callback({ path: filePath });
    } catch (err) {
      console.error("[swap:// Error]", err);
      callback({ error: -6 }); // FILE_NOT_FOUND
    }
  });

  client.createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
