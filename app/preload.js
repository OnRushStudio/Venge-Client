const { ipcRenderer, clipboard } = require('electron');

const settingsJson = require('./modules/settings.json')

const Store = require('electron-store');
const userPrefs = new Store();

document.addEventListener('DOMContentLoaded', () => {
    //Sends RPC Events
    updateRPC();

    //Client Settings
    clientDiv = document.createElement('div');
    clientDiv.innerHTML = `
    <style>
        #managescripts {
            width: 90%;
            height: 2.5rem;
            background: #7e35c9;
            color: white;
            border: none;
            font-size: 1rem;
            margin-top: 1rem;
            cursor: pointer;
        }
        .sidebar-wrapper::before {
            content: "";
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.3);
            backdrop-filter: blur(5px);
            z-index: 4;
        }
        #sidebar {
            position: fixed;
            width: 22rem;
            height: 100vh;
            right: 0;
            top: 0;
            background: #101010;
            z-index: 5;
            color: white;
            text-align: center;
        }
        #sidebar label {
            cursor: pointer;
            position: absolute;
            left: 1rem;
            width: 100%;
            text-align: left;
        }
        .field-cont {
            font-size: 1.2rem;
            width: 22rem;
            align-items: center;
            padding-top: 1.5rem;
            height: 3rem;
        }
        .field-cont:hover {
            background: #7e35c9;
        }
        .client-toggle {
            right: 1rem;
            position: absolute;
            cursor: pointer;
            filter: hue-rotate(40deg);
        }
    </style>
    <div id="sidebar">
        <div style="padding-bottom: 1.5rem; padding-top: 1.5rem; font-size: 1.5rem;"> Client Settings </div>
        <hr>
        <div id="clientContent"></div>
        <button id="managescripts">Manage Scripts</button>
    </div>
    `;
    clientDiv.style.display = "none";
    clientDiv.classList.add('sidebar-wrapper')
    document.body.appendChild(clientDiv)

    Object.keys(settingsJson).forEach((setting) => {
        document.getElementById('clientContent').innerHTML += `
        <div class="field-cont">
            <label for="${setting}">${settingsJson[setting].text}</label>
            <input type="checkbox" id="${setting}" ${userPrefs.get(setting) ? 'checked' : ''} class="client-toggle" onclick=window.setSetting("${setting}")>
        </div>
        `
    })

    Object.keys(settingsJson).forEach((setting) => {
        document.getElementById(setting).onclick = () => {
            userPrefs.set(setting, document.getElementById(setting).checked)
        }
    })

    document.getElementById("managescripts").onclick = (e) => {
        ipcRenderer.send("loadhub")
    }

    document.addEventListener('keydown', (e) => {
        if (e.code === "Slash") {
            if (clientDiv.style.display === "none") {
                clientDiv.style.display = "block"
            } else {
                clientDiv.style.display = "none"
            }
        }
    })

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
                        // console.log(closeClient)
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
                                let roomhash = link[1];

                                pc.Menu.setSessionHash(roomhash);
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


function updateRPC() {
    pc.app.on('Player:Leave', function () {
        ipcRenderer.send('loadRPC', { area: 'menu' });
    }, this);

    pc.app.on('Overlay:Weapon', function (weapon) {
        let maps = app.session.defaultMaps.map((map) => map.split(' - ')[0]);
        ipcRenderer.send('loadRPC', { area: 'game', now: Date.now(), weapon: weapon, map: app.session.map, maps: maps, mapText: app.session.defaultMaps.filter((map) => map.split(' - ')[0] == app.session.map)[0] });
    }, this);
}

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