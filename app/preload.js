const { ipcRenderer } = require("electron");
const fs = require("fs");
const path = require('path')
const Store = require('electron-store');
const userPrefs = new Store();

const { initClientSettings, initUserscripts } = require('./Utils/Settings.js');

document.addEventListener('DOMContentLoaded', () => {
    // Client Settings
    clientDiv = document.createElement('div');
    clientDiv.innerHTML = fs.readFileSync(path.join(__dirname, './Settings/Settings.html'), 'utf8');
    clientDiv.style.display = "none";
    document.body.appendChild(clientDiv)
    initClientSettings()
    initUserscripts()
    

    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.code === "Slash") {
            if (clientDiv.style.display === "none") {
                clientDiv.style.display = "block"
            } else {
                clientDiv.style.display = "none"
            }
        }
    })


    //DOM Observer to add custom elements to the web
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