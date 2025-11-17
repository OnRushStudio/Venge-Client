const { ipcRenderer, webFrame } = require("electron");
const fs = require("fs");
const path = require("path");

(async function initModLoader() {
  try {
    const pcShim = `
      (function(){
        if (!Object.getOwnPropertyDescriptor(window, "pc")) {
          window._pc = false;
          Object.defineProperty(window, "pc", {
            configurable: true,
            enumerable: true,
            set(value) {
              if (!window._pc) {
                window._pc = value;
                window.dispatchEvent(new CustomEvent("pc-ready", { detail: value }));
              }
            },
            get() { return window._pc; }
          });
        }
      })();
    `;

    webFrame.executeJavaScriptInIsolatedWorld(
      999,
      [{ code: pcShim }],
      { runAt: "document_start" }
    );

    const documentsPath = await ipcRenderer.invoke("get-documents-path");
    const baseDir = path.join(documentsPath, "Venge Client");
    const userDir = path.join(baseDir, "Userscript");

    if (!fs.existsSync(userDir)) fs.mkdirSync(userDir, { recursive: true });

    const mods = fs.readdirSync(userDir).filter(f => f.endsWith(".js"));

    for (const mod of mods) {
      const code = fs.readFileSync(path.join(userDir, mod), "utf8");

      const wrapped = `
        window.addEventListener("pc-ready", function(){
          try {
            ${code}
          } catch(e){
            console.error('[Userscript Runtime Error]', e);
          }
        });
      `;

      webFrame.executeJavaScriptInIsolatedWorld(
        999,
        [{ code: wrapped }],
        { runAt: "document_start" }
      );
    }

  } catch (err) {
    console.error("[Mod Loader Error]", err);
  }
})();
