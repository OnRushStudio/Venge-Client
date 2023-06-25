const Store = require('electron-store')
const userPrefs = new Store()

class ClientSettings {
    constructor() {
        this.settingElem = document.createElement('div');
    }

    addCategory(name) {
        this.settingElem.innerHTML += `<label for="Settings" class="title active" style="font-size: 20px !important;">${name}</label>`
    }

    addSettings(json) {
        Object.keys(json).forEach((setting) => {
            this.settingElem.innerHTML += `
            <div class="field field-checkbox">
                <label for="${setting}">${json[setting].text}</label>
                <div class="field-toggle-wrapper"><input type="checkbox" id="${setting}" class="toggle"> 
                <label for="${setting}"></label></div>
            </div>
            `
        })
    }

    setFromStore(json) {
        Object.keys(json).forEach((name) => {
            document.getElementById(name).checked = userPrefs.get(name)
            document.getElementById(name).onclick = () => {
                userPrefs.set(name, document.getElementById(name).checked)
            }
        })
    }

    setFromLocalstorage(json) {
        Object.keys(json).forEach((name) => {
            if (localStorage.getItem(name) !== null) {                
                document.getElementById(name).checked = JSON.parse(localStorage.getItem(name))
            } else {
                localStorage.setItem(name, json[name].default)
                document.getElementById(name).checked = JSON.parse(localStorage.getItem(name))
            }
            document.getElementById(name).onclick = () => {
                localStorage.setItem(name, document.getElementById(name).checked)
            }
        })
    }
}

window.ClientSettings = ClientSettings;

module.exports = ClientSettings;