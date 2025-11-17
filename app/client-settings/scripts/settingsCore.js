class ClientSettingsCore {
    static async loadSettings() {
      try {
        const stored = await window.ClientSettingsBridge.readSettings();
        const merged = { ...stored };
  
        for (const entry of this.coreScriptList) {
          if (merged[entry.id] === undefined) {
            if (entry.id === "pc_resolution_x") {
              merged[entry.id] = window.screen?.width || 1920;
            } else if (entry.id === "pc_resolution_y") {
              merged[entry.id] = window.screen?.height || 1080;
            } else {
              merged[entry.id] = entry.default;
            }
          }
        }
  
        if (window.__customSettingsTabs) {
          for (const tab of window.__customSettingsTabs) {
            if (!tab.settings) continue;
            for (const setting of tab.settings) {
              if (merged[setting.id] === undefined) {
                merged[setting.id] = setting.default;
              }
            }
          }
        }
  
        const changed = JSON.stringify(stored) !== JSON.stringify(merged);
        if (changed) await this.saveSettings(merged);
  
        return merged;
      } catch (e) {
        console.error("[ClientSettingsCore] Failed to load settings:", e);
        return {};
      }
    }
  
    static async saveSettings(obj) {
      try {
        await window.ClientSettingsBridge.saveSettings(obj);
      } catch (e) {
        console.error("[ClientSettingsCore] Failed to save settings:", e);
      }
    }
  
    static async getValue(id, fallback) {
      const s = await this.loadSettings();
      return s[id] !== undefined ? s[id] : fallback;
    }
  
    static async setValue(id, value) {
      const s = await this.loadSettings();
      s[id] = value;
      await this.saveSettings(s);
      window.dispatchEvent(new CustomEvent("clientsettings:changed", { detail: { id, value } }));
    }
  
    static coreScriptList = [
      {
        id: "renderer_angle",
        name: "<b>Render API</b>",
        desc: "Select which rendering backend to use for the client.",
        type: "dropdown",
        default: "default",
        options: [
          { label: "Default (Auto)", value: "default" },
          { label: "D3D11 (Windows only)", value: "d3d11" },
          { label: "OpenGL", value: "opengl" },
          { label: "Vulkan (Experimental)", value: "vulkan" }
        ]
      },
      {
        id: "pc_resolution_enable",
        name: "<b>Resolution Override</b>",
        desc: "Enable/Disable the custom resolution override settings below to take effect <br><i>Note:This will override the game option 'Graphic Quality (Resolution)' when enabled and force it to be 100% always'</i>",
        type: "boolean",
        default: false
      },
      {
        id: "pc_resolution_x",
        name: "<b>Render Resolution Width</b>",
        desc: "Specify a custom resolution width for the game to render",
        type: "text",
        placeholder: "e.g. 1920"
      },
      {
        id: "pc_resolution_y",
        name: "<b>Render Resolution Height</b>",
        desc: "Specify a custom resolution height for the game to render",
        type: "text",
        placeholder: "e.g. 1080"
      }
    ];
  }
  
  window.ClientSettingsCore = ClientSettingsCore;
  