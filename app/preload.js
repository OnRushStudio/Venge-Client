const { ipcRenderer, clipboard } = require('electron');

const settings = require('./modules/settings.json')
const ClientSettings = require('./modules/clientSettings')

document.addEventListener('DOMContentLoaded', () => {
    let clientSettingstest = new ClientSettings();
    clientSettingstest.addCategory('Client Settings')
    clientSettingstest.addSettings(settings)
    clientSettingstest.settingElem.id = 'ClientContent';

    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.id == "menu" || node.id == "play-section") {
                    if (!document.getElementById("closeClientBtn")) {
                        let menuCont = document.querySelector("#menu-items")
                        let closeClient = document.createElement("li")
                        closeClient.id = "closeClientBtn";
                        closeClient.innerHTML = `<i aria-hidden="true" class="fa fa-times"></i>`
                        menuCont.appendChild(closeClient)
                        closeClient.onclick = () => {
                            ipcRenderer.send("exit")
                        }
                        console.log(closeClient)
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
                                let link = clipboard.readText().split('#');
                                let roomhash = link[1]

                                pc.Menu.$data.invite.hash = roomhash;
                                pc.Menu.getRoomDetails();
                            } else {
                                alert('No valid link found on clipboard')
                            }
                        }
                        // document.querySelector("#play-section > div.content-wrapper").appendChild(document.querySelector("#play-section > div.content-wrapper > div.options"))
                    }
                }
                if (node.id == "settings") {
                    if (!document.getElementById("clientSettings")) {
                        let tabs = document.querySelector("#header > div > div");
                        let clientSettings = document.createElement("li")
                        clientSettings.className = '';
                        clientSettings.id = "clientSettings"
                        clientSettings.innerHTML = `Client Settings`
                        tabs.appendChild(clientSettings)

                        clientSettings.onclick = () => {
                            clientSettings.className = 'active';
                            var tabCont = document.querySelector("#content > div > div.tab-content")
                            tabCont.innerHTML = '';
                            clientSettingstest.settingElem.innerHTML += `
                            <button id="clientscriptbtn"style="                                     
                                border: none;
                                height: 2rem;
                                color: white;
                                background: #9729fe;
                                font-weight: 10 !important;
                            ">ManageScripts</button>
                            `
                            tabCont.appendChild(clientSettingstest.settingElem)
                            clientSettingstest.setFromStore(settings)
                            for (i = 0; i < tabs.children.length; i++) {
                                if (tabs.children[i].className == 'active' && tabs.children[i].id != 'clientSettings') {
                                    tabs.children[i].className = '';
                                }
                            }

                            document.getElementById('clientscriptbtn').onclick = () => {
                                ipcRenderer.send("loadhub")
                            }
                        }
                    }
                }
            });
        });
    });

    observer.observe(document.documentElement, {
        childList: true,
        subtree: true
    });
})

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