const { ipcRenderer } = require('electron');

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
    // try {
    //     mutationRecords.forEach(record => {
    //         record.addedNodes.forEach(el => {
    //             console.log(el.id)
    //             if (el.id == "settings") {
    //                 if (!document.getElementById("clientSettings")) {
    //                     let tabs = document.querySelector("#content > div > div.tabs")
    //                     let clientSettings = document.createElement("li")
    //                     clientSettings.id = "clientSettings"
    //                     clientSettings.innerHTML = `Client Settings`
    //                     tabs.appendChild(clientSettings)

    //                     clientSettings.onclick = () => {
    //                         clientSettings.classList.add("active")
    //                         let tabCont = document.querySelector("#content > div > div.tab-content")
    //                         let settingHTML = `
    //                         <div class="field field-checkbox"><label for="uncapFPS">Uncap FPS</label>
    //                             <div class="field-toggle-wrapper"><input type="checkbox" id="uncapFPS" class="toggle"> <label for="Uncap Fps"></label></div>
    //                         </div>
    //                         <div class="field field-checkbox"><label for="uncapFPS">Low Latency</label>
    //                             <div class="field-toggle-wrapper"><input type="checkbox" id="low_latency" class="toggle"> <label for="Low Latency"></label></div>
    //                         </div>
    //                         <div class="field field-checkbox"><label for="Experimental Flags">Uncap FPS</label>
    //                             <div class="field-toggle-wrapper"><input type="checkbox" id="expFlags" class="toggle"> <label for="Experimental Flags"></label></div>
    //                         </div>
    //                         <div class="field field-checkbox"><label for="uncapFPS">Gpu Rasterization</label>
    //                             <div class="field-toggle-wrapper"><input type="checkbox" id="gpu-rasterization" class="toggle"> <label for="Gpu Rasterization"></label></div>
    //                         </div>`
    //                         tabCont.innerHTML = settingHTML;
    //                     }
    //                 }
    //             }
    //         })
    //     })
    // } catch (error) {

    // }
}).observe(document, { childList: true, subtree: true });
