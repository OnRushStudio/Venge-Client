const { ipcRenderer } = require('electron');
const Store = require('electron-store');
const settings = new Store();
let official_settings = ["UncapFPS", "low-latency", "exp-flag", "gpu-rasterization"]
const uncapFPS = settings.get("UncapFPS")
const lowLatency = settings.get("low-latency")
const expFlag = settings.get("exp-flag")
const gpu_ras = settings.get("gpu-rasterization")


new MutationObserver(mutationRecords => {
    if (window.location.href === "https://venge.io/") {
        if (document.querySelector("#menu-items")) {
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
        }

    }
    try {
        mutationRecords.forEach(record => {
            record.addedNodes.forEach(el => {
                if (el.id == "settings") {
                    if (!document.getElementById("clientSettings")) {
                        let tabs = document.querySelector("#content > div > div.tabs")
                        let clientSettings = document.createElement("li")
                        clientSettings.id = "clientSettings"
                        clientSettings.innerHTML = `Client Settings`
                        tabs.appendChild(clientSettings)
                        let settingHTML, tabCont;
                        clientSettings.onclick = () => {
                            clientSettings.classList.add("active")
                            tabCont = document.querySelector("#content > div > div.tab-content")
                            settingHTML = document.createElement("div")
                            settingHTML.innerHTML = `
                            <label for="Settings" class="title active">Performance</label>
                            <br/><br/>
                            <div class="field-wrap">
                                <div class="field field-checkbox"><label for="UncapFPS">UnCap FPS</label>
                                    <div class="field-toggle-wrapper"><input type="checkbox" id="UncapFPS" class="toggle"> 
                                    <label for="UncapFPS"></label></div>
                                </div>
                                <div class="field field-checkbox"><label for="low-latency">Low Latency</label>
                                    <div class="field-toggle-wrapper">
                                    <input type="checkbox" id="low-latency" class="toggle"> 
                                    <label for="low-latency"></label></div>
                                </div>
                            </div>
                            <div class="field-wrap">
                            <div class="field field-checkbox"><label for="exp-flag">Experimental Flags</label>
                                <div class="field-toggle-wrapper">
                                <input type="checkbox" id="exp-flag" class="toggle"> 
                                <label for="exp-flag"></label></div>
                            </div>
                            <div class="field field-checkbox"><label for="hideChatMessages">GPU Rasterization</label>
                                <div class="field-toggle-wrapper">
                                    <input type="checkbox" id="gpu-rasterization" class="toggle"> 
                                    <label for="hideChatMessages"></label></div>
                                </div>
                            </div>
                            <div class="field"><label for="weaponBobbing">Custom FrameCap</label> 
                            <div class="input-slider-wrapper"><div class="input-slider-text">
                                100
                            </div> <input id="weaponBobbing" type="range" min="0" max="100"></div></div>
                            `
                            tabCont.innerHTML = '';
                            tabCont.appendChild(settingHTML)


                            tabCont.onclick = (e) => {
                                if(e.target.id == "UncapFPS")  {
                                    uncapFPS = e.target.checked;
                                    settings.set('UncapFPS', uncapFPS)
                                }
                                if(e.target.id == "low-latency")  {
                                    lowLatency = e.target.checked;
                                    settings.set('low-latency', lowLatency)
                                }
                                if(e.target.id == "exp-flag")  {
                                    expFlag = e.target.checked;
                                    settings.set('Experimental Flags', expFlag)
                                }
                                if(e.target.id == "gpu-rasterization")  {
                                    gpu_ras = e.target.checked;
                                    settings.set('gpu-rasterization', gpu_ras)
                                }
                            }

                            official_settings.forEach(name => {
                                    document.getElementById(name).checked = settings.get(name)
                            });
                        }
                    }
                }
                // if(el.id = "play-section") {
                //     if(!document.getElementById("JoinBtn")){
                //         let joinLink = document.createElement("div")
                //         joinLink.innerHTML = `
                //         <button class="invite-button" style="background:orange !important;border-left: solid 8px orange;" id="JoinBtn">
                //             <i aria-hidden="true" class="fa fa-link">
                //         </i>Join Link</button>
                //         `
                //         document.querySelector("#play-section").appendChild(joinLink)
                //     }
                // }
            })
        })
    } catch (error) {

    }
}).observe(document, { childList: true, subtree: true });
