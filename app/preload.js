const { ipcRenderer, clipboard } = require('electron');
const Store = require('electron-store');
const userPrefs = new Store();
const fs = require('fs');
const path = require('path');

const settingsData = Object.create(null)
settingsData.official_settings = ["uncapFPS", "low-latency", "exp-flag", "Fullscreen", "gpu-rasterization"]
settingsData.ingame_settings = ['HideHands', 'HideADS', 'ToggleWeapon', 'BetterUI']

//Settings vars
settingsData.uncapFPS = userPrefs.get("uncapFPS")
settingsData.ADBlock = userPrefs.get("ADBlock")
settingsData.lowLatency = userPrefs.get("low-latency")
settingsData.expFlag = userPrefs.get("exp-flag")
settingsData.gpu_ras = userPrefs.get("gpu-rasterization")
settingsData.fullscreen_mode = userPrefs.get('Fullscreen')

if (process.platform === 'win32') {
    const documents = ipcRenderer.sendSync('docs');
    const scriptFolder = documents + "\\Venge-Client\\scripts";

    if (!fs.existsSync(scriptFolder)) {
        fs.mkdirSync(scriptFolder, { recursive: true });
    }
    try {
        fs.readdirSync(scriptFolder).filter(file => path.extname(file).toLowerCase() === '.js').forEach(filename => {
            try {
                require(`${scriptFolder}/${filename}`);
            } catch (e) {
                console.error("an error occurred while executing userscript: " + filename + " error: " + e);
            }
        });
    } catch (e) {
        console.error("an error occurred while loading userscripts: " + e);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    window.isClient = true;
    new MutationObserver(mutationRecords => {
        try {
            mutationRecords.forEach(record => {
                record.addedNodes.forEach(el => {
                    if (el.id == "menu" || el.id == "play-section") {
                        if (!document.getElementById("closeClient")) {
                            let menuCont = document.querySelector("#menu-items")
                            let closeClient = document.createElement("li")
                            closeClient.id = "closeClient";
                            closeClient.innerHTML = `<i aria-hidden="true" class="fa fa-times"></i>`
                            menuCont.appendChild(closeClient)
                            closeClient.onclick = () => {
                                ipcRenderer.send("exit")
                            }
                            console.log(closeClient)
                        }
                        if (!document.getElementById("ClientSocialBtn")) {
                            let menuCont = document.querySelector("#menu-items")
                            let socialBtn = document.createElement("li")
                            socialBtn.id = "ClientSocialBtn";
                            socialBtn.innerHTML = `<img src="/files/assets/31216147/1/Crown-Icon.png"> SOCIAL`
                            menuCont.insertBefore(socialBtn, menuCont.children[2])
                            socialBtn.onclick = () => {
                                window.location.href = "https://social.venge.io/"
                                alert('Press F4 to return back to venge!')
                            }
                            console.log(socialBtn)
                        }
                        if (!document.getElementById("JoinBtn")) {
                            let joinLink = document.createElement("div")
                            joinLink.innerHTML = `
                            <button class="invite-button" style="background:linear-gradient(to bottom, rgb(255,165,0), rgb(190,123,0)); border-left: solid 8px rgb(170,110,0)" id="JoinBtn">
                                <i aria-hidden="true" class="fa fa-link">
                            </i> Join Link</button>
                            `
                            let contDiv = document.querySelector("#play-section > div.content-wrapper")
                            contDiv.insertBefore(joinLink, contDiv.children[0])
                            joinLink.onclick = () => {
                                if (clipboard.readText().includes("venge.io")) {
                                    window.location.href = clipboard.readText()
                                } else {
                                    alert('No valid link found on clipboard')
                                }
                            }
                            document.querySelector("#play-section > div.content-wrapper").appendChild(document.querySelector("#play-section > div.content-wrapper > div.options"))
                        }
                    }
                    if (el.id == "settings") {
                        if (!document.getElementById("clientSettings")) {
                            let tabs = document.querySelector("#content > div > div.tabs")
                            let clientSettings = document.createElement("li")
                            clientSettings.className = '';
                            clientSettings.id = "clientSettings"
                            clientSettings.innerHTML = `Client Settings`
                            tabs.appendChild(clientSettings)
                            let settingHTML, tabCont;
                            clientSettings.onclick = () => {
                                clientSettings.className = 'active';
                                tabCont = document.querySelector("#content > div > div.tab-content")
                                settingHTML = document.createElement("div")
                                settingHTML.id = 'ClientContent';
                                settingHTML.innerHTML = `
                                <style>
                                    .settingCont {
                                        font-size: 1.5rem;
                                        padding-top: 2rem;
                                        width: 100%;
                                    }
                                    .settingToggle {
                                        width: 1.2rem;
                                        height: 1.2rem;
                                        position: absolute;
                                        right: 10rem;
                                    }
                                    .Vengeance {
                                        padding-top: 100px;
                                    }
                                </style>                               
                                <label for="Settings" class="title active" style="font-size: 2rem !important;">Performance Settings</label>
                                <br/><br/>
                                <div class="settingCont">
                                    Unlimited FPS
                                    <input type="checkbox" class="settingToggle" id="uncapFPS">
                                </div>
                                <div class="settingCont">
                                    AD Blocker
                                    <input type="checkbox" class="settingToggle" id="ADBlock">
                                </div>
                                <div class="settingCont">
                                    Fullscreen Mode
                                    <input type="checkbox" class="settingToggle" id="Fullscreen">
                                </div>
                                <div class="settingCont">
                                    GPU Rasterization
                                    <input type="checkbox" class="settingToggle" id="gpu-rasterization">
                                </div>
                                <div class="settingCont">
                                    Experimental Flags
                                    <input type="checkbox" class="settingToggle" id="exp-flag">
                                </div>
                                <div class="settingCont">
                                    Low Latency
                                    <input type="checkbox" class="settingToggle" id="low-latency">
                                </div>
                                <div class="Vengeance">
                                    <label for="Settings" class="title active" style="font-size: 2rem !important;">InGame Settings</label>
                                    <div class="settingCont">
                                        Hide Hands
                                        <input type="checkbox" class="settingToggle" id="HideHands">
                                    </div>
                                    <div class="settingCont">
                                        Hide Weapon On ADS
                                        <input type="checkbox" class="settingToggle" id="HideADS">
                                    </div>
                                    <div class="settingCont">
                                        Toggle weapon model with backquote key (\`)
                                        <input type="checkbox" class="settingToggle" id="ToggleWeapon">
                                    </div>
                                    <div class="settingCont">
                                        Better Ingame UI
                                        <input type="checkbox" class="settingToggle" id="BetterUI">
                                    </div>
                                    <div class="settingCont">
                                        <label for="endmessage">End Game Message</label>
                                        <input type="text" class="settingToggle" id="endmessage" value="" style="width: 10rem;">
                                    </div>
                                </div>
                                `
                                tabCont.innerHTML = '';
                                tabCont.appendChild(settingHTML)

                                document.getElementById('endmessage').onchange = () => {
                                    localStorage.setItem('clientendmessage', document.getElementById('endmessage').value)
                                }
                                tabCont.onclick = (e) => {
                                    if (e.target.classList.contains("settingToggle")) {
                                        if (e.target.id == "uncapFPS") {
                                            settingsData.uncapFPS = e.target.checked;
                                            userPrefs.set('uncapFPS', settingsData.uncapFPS)
                                        }
                                        if (e.target.id == "ADBlock") {
                                            settingsData.ADBlock = e.target.checked;
                                            userPrefs.set('ADBlock', settingsData.ADBlock)
                                        }
                                        if (e.target.id == "low-latency") {
                                            settingsData.lowLatency = e.target.checked;
                                            userPrefs.set('low-latency', settingsData.lowLatency)
                                        }
                                        if (e.target.id == "exp-flag") {
                                            settingsData.expFlag = e.target.checked;
                                            userPrefs.set('exp-flag', settingsData.expFlag)
                                        }
                                        if (e.target.id == "gpu-rasterization") {
                                            settingsData.gpu_ras = e.target.checked;
                                            userPrefs.set('gpu-rasterization', settingsData.gpu_ras)
                                        }
                                        if (e.target.id == "Fullscreen") {
                                            settingsData.fullscreen_mode = e.target.checked;
                                            userPrefs.set('Fullscreen', settingsData.fullscreen_mode)
                                        }
                                        if (settingsData.ingame_settings.includes(e.target.id)) {
                                            userPrefs.set(e.target.id, e.target.checked)
                                        }
                                    }
                                }

                                settingsData.official_settings.forEach(name => {
                                    document.getElementById(name).checked = userPrefs.get(name)
                                });
                                settingsData.ingame_settings.forEach(name => {
                                    document.getElementById(name).checked = userPrefs.get(name)
                                });
                                for (i = 0; i < tabs.children.length; i++) {
                                    if (tabs.children[i].className == 'active' && tabs.children[i].id != 'clientSettings') {
                                        tabs.children[i].className = '';
                                    }
                                }
                            }
                        }
                    }
                })
            })
        } catch (error) {

        }
    }).observe(document, { childList: true, subtree: true });
})

document.addEventListener("DOMContentLoaded", () => {
    pc.app.on('Player:Focused', function (state) {
        try {
            if (state) {
                if (userPrefs.get('HideADS')) {
                    pc.app.scene.layers.getLayerByName('NonFOV').enabled = false;
                    let crosshair = pc.app.root.findByName('Crosshair');
                    crosshair.enabled = true;
                }
            } else {
                if (userPrefs.get('HideHands')) {
                    pc.app.root.findByName('Player').findByName('ArmLeft').enabled = false;
                    pc.app.root.findByName('Player').findByName('ArmRight').enabled = false;
                }

                if (userPrefs.get('HideADS')) pc.app.scene.layers.getLayerByName('NonFOV').enabled = true;

                if (userPrefs.get('BetterUI')) {
                    pc.app.root.findByName('Overlay').findByName("Hitmarker").enabled = false;
                    pc.app.root.findByName('Overlay').findByName('Leaderboard').enabled = false;
                    pc.app.root.findByName('Overlay').findByName("Weapons").enabled = false;
                    pc.app.root.findByName('Overlay').findByName('Stats').setLocalPosition(600, -700, 0)
                }
            }
        } catch (error) {
            console.log(error)
        }
    });

    if (userPrefs.get('ToggleWeapon')) {
        document.addEventListener('keydown', (e) => {
            if (e.code == 'Backquote') {
                try {
                    pc.app.root.findByName('WeaponCenter').enabled = !pc.app.root.findByName('WeaponCenter').enabled;
                } catch (error) {
                    console.log('not in a game')
                }
            }
        })
    }
    pc.app.on('Game:Finish', () => {
        if(localStorage.get('clientendmessage') == "" || localStorage.get('clientendmessage') == undefined || localStorage.get('clientendmessage') == " ") return
        pc.app.fire('Network:Chat', localStorage.get('clientendmessage'))
    })
})

try {
    window._pc = false;
    Object.defineProperty(window, "pc", {
        set(value) {
            if (!window.pc) {
                window._pc = value;
            }
        },
        get() {
            return (window._pc);
        }
    });
} catch (error) {
    console.log(error)
}