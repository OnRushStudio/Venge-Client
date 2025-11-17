const { contextBridge, ipcRenderer } = require("electron");
const fs = require("fs");
const path = require("path");

let cache = null;
let lastRead = 0;

async function getSettingsFile() {
  const documents = await ipcRenderer.invoke("clientsettings:get-documents-path");
  const dir = path.join(documents, "Venge Client", "config");
  const file = path.join(dir, "settings.json");

  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(file)) fs.writeFileSync(file, "{}");
  return file;
}

async function readSettings(force = false) {
  const now = Date.now();
  if (!force && cache && now - lastRead < 1000) return cache;

  try {
    const file = await getSettingsFile();
    const json = JSON.parse(fs.readFileSync(file, "utf8"));
    cache = json;
    lastRead = now;
    return json;
  } catch {
    return {};
  }
}

async function writeSettings(obj) {
  try {
    const file = await getSettingsFile();
    fs.writeFileSync(file, JSON.stringify(obj, null, 2));
    cache = obj;
    lastRead = Date.now();
  } catch {}
}

contextBridge.exposeInMainWorld("ClientSettingsBridge", {
  readSettings,
  saveSettings: writeSettings
});
