const { contextBridge, ipcRenderer } = require("electron");
const fs = require("fs");
const path = require("path");

async function getSettingsFile() {
  const documents = await ipcRenderer.invoke("clientsettings:get-documents-path");
  const dir = path.join(documents, "Venge Client", "config");
  const file = path.join(dir, "settings.json");
  if (!fs.existsSync(file)) return null;
  return file;
}

async function readSettings() {
  try {
    const file = await getSettingsFile();
    if (!file) return {};
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return {};
  }
}

function injectIntoPage(code) {
  const script = document.createElement("script");
  script.textContent = code;
  document.documentElement.appendChild(script);
  script.remove();
}

function applyResolution(resX, resY, resData) {
  const injected = `
    (function() {
      if (!window.pc || !pc.app || !pc.app.graphicsDevice) return;
      try {
        if(${resData}){
          pc.app.setCanvasResolution(pc.RESOLUTION_FIXED, ${resX}, ${resY});
        }
      } catch {}
    })();
  `;
  injectIntoPage(injected);
}

async function watchSettingsFile() {
  const file = await getSettingsFile();
  if (!file) return;
  let lastHash = "";

  setInterval(async () => {
    try {
      const data = fs.readFileSync(file, "utf8");
      const hash = data.length + "-" + data.charCodeAt(0);

      if (hash !== lastHash) {
        lastHash = hash;
        const json = JSON.parse(data);
        var resData = json.pc_resolution_enable;
        const resX = parseInt(json.pc_resolution_x || window.screen.width);
        const resY = parseInt(json.pc_resolution_y || window.screen.height);
        applyResolution(resX, resY, resData);
      }
    } catch {}
  }, 1500);
}

window.addEventListener("DOMContentLoaded", async () => {
  const data = await readSettings();
  const resX = parseInt(data.pc_resolution_x || window.screen.width);
  const resY = parseInt(data.pc_resolution_y || window.screen.height);
  var resData = data.pc_resolution_enable;

  const injected = `
    (function waitForPC() {
      if (window.pc && window.pc.app && window.pc.app.graphicsDevice) {
        setTimeout(() => {
          if(${resData}){
            pc.app.setCanvasResolution(pc.RESOLUTION_FIXED, ${resX}, ${resY});
          }
        }, 1000);
      } else {
        setTimeout(waitForPC, 500);
      }
    })();
  `;
  injectIntoPage(injected);

  watchSettingsFile();
});
