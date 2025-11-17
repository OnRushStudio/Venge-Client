document.addEventListener("DOMContentLoaded", async () => {
    await waitForCustomTabs();
    buildSidebar();
    switchTab("builtins");
  });
  
  function waitForCustomTabs() {
    return new Promise(resolve => {
      const check = () => {
        if (window.ClientSettingCustom && window.ClientSettingsCore) resolve();
        else setTimeout(check, 100);
      };
      check();
    });
  }
  
  function buildSidebar() {
    const existing = document.querySelector(".sidebar");
    if (existing) existing.remove();
  
    const sidebar = document.createElement("div");
    sidebar.className = "sidebar";
  
    const customTabs = window.__customSettingsTabs || [];
  
    sidebar.innerHTML = `
      <div class="tabButton" data-tab="builtins">Client Settings</div>
      ${customTabs.map(tab => `<div class="tabButton" data-tab="${tab.id}">${tab.title}</div>`).join("")}
    `;
  
    document.body.appendChild(sidebar);
  
    sidebar.addEventListener("click", e => {
      if (e.target.classList.contains("tabButton")) switchTab(e.target.dataset.tab);
    });
  }
  
  window.addEventListener("clientsettings:newtab", buildSidebar);
  
  async function switchTab(tabId) {
    const container = document.querySelector(".main");
    container.innerHTML = "";
  
    document.querySelectorAll(".tabButton").forEach(btn =>
      btn.classList.toggle("active", btn.dataset.tab === tabId)
    );
  
    const settings = await ClientSettingsCore.loadSettings();
  
    if (tabId === "builtins") {
      ClientSettingsCore.coreScriptList.forEach(entry => {
        container.innerHTML += createSettingHTML(entry, settings[entry.id]);
      });
    } else {
      const tab = window.__customSettingsTabs.find(t => t.id === tabId);
      if (!tab) {
        container.innerHTML = "<div style='padding:1rem;color:#ccc;'>Settings not found.</div>";
        return;
      }
      tab.settings.forEach(setting => {
        container.innerHTML += createSettingHTML(setting, settings[setting.id]);
      });
    }
  }
  
  function createSettingHTML(setting, value) {
    const val = value ?? setting.default;
  
    if (setting.type === "boolean") {
      return `
        <div class="mod-cont">
          <div class="mod-name">${setting.name}</div>
          <div class="mod-desc">${setting.desc}</div>
          <button class="toggle-btn" data-id="${setting.id}">
            ${val ? "Disable" : "Enable"}
          </button>
        </div>`;
    }
  
    if (setting.type === "slider") {
      return `
        <div class="mod-cont">
          <div class="mod-name">${setting.name}</div>
          <div class="mod-desc">${setting.desc}</div>
          <input type="range" class="slider" data-id="${setting.id}"
                 min="${setting.min}" max="${setting.max}" value="${val}">
          <div class="slider-value">Value: ${val}</div>
        </div>`;
    }
  
    if (setting.type === "dropdown") {
      const opts = setting.options
        .map(opt => `<option value="${opt.value}" ${opt.value === val ? "selected" : ""}>${opt.label}</option>`)
        .join("");
      return `
        <div class="mod-cont">
          <div class="mod-name">${setting.name}</div>
          <div class="mod-desc">${setting.desc}</div>
          <select class="dropdown" data-id="${setting.id}">
            ${opts}
          </select>
        </div>`;
    }
  
    if (setting.type === "text") {
      return `
        <div class="mod-cont">
          <div class="mod-name">${setting.name}</div>
          <div class="mod-desc">${setting.desc}</div>
          <input type="text" class="text-input" data-id="${setting.id}"
                 placeholder="${setting.placeholder || ''}" value="${val}">
        </div>`;
    }
  
    return "";
  }
  
  document.addEventListener("click", async e => {
    if (e.target.classList.contains("toggle-btn")) {
      const id = e.target.dataset.id;
      const current = await ClientSettingsCore.getValue(id, false);
      const newVal = !current;
      await ClientSettingsCore.setValue(id, newVal);
      e.target.innerText = newVal ? "Disable" : "Enable";
    }
  });
  
  document.addEventListener("input", async e => {
    if (e.target.classList.contains("slider")) {
      const val = Number(e.target.value);
      await ClientSettingsCore.setValue(e.target.dataset.id, val);
      e.target.parentNode.querySelector(".slider-value").innerText = `Value: ${val}`;
    }
  
    if (e.target.classList.contains("dropdown")) {
      const id = e.target.dataset.id;
      const val = e.target.value;
      await ClientSettingsCore.setValue(id, val);
      if (id === "renderer_angle") {
        alert("⚠️ Restart required for Render API changes to take effect.");
      }
    }
  
    if (e.target.classList.contains("text-input")) {
      await ClientSettingsCore.setValue(e.target.dataset.id, e.target.value.trim());
    }
  });
  