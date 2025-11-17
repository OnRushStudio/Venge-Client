window.__customSettingsTabs = [];

class ClientSettingCustom {
  constructor({ id, title, settings = [] }) {
    if (!id || !title) throw new Error("ClientSettingCustom requires id + title");
    this.id = id;
    this.title = title;
    this.settings = settings;

    window.__customSettingsTabs.push(this);
    window.dispatchEvent(new CustomEvent("clientsettings:newtab", { detail: this }));
  }
}

window.ClientSettingCustom = ClientSettingCustom;
