const script_json = require('./userscripts.json')
var main;
const Store = require('electron-store');
const settings = new Store();

let scriptLink = settings.get('ScriptLink');

document.addEventListener("DOMContentLoaded", () => {
    main = document.getElementsByClassName('main')[0]
    console.log(scriptLink)
    Object.keys(script_json).forEach((name) => {


        if (scriptLink.includes(script_json[name].link)) {
            let script_elem = document.createElement('div')
            script_elem.innerHTML = `
                    <div class="cont">
                        <div class="mod-cont">
                            <div class="mod-name">${script_json[name].name}</div>
                            <div class="mod-desc">${script_json[name].description}</div>
                            <button class="actionbtn remove" data-link="${script_json[name].link}">Remove</button>
                        </div>    
                    </div>
                `
            main.appendChild(script_elem);
        }
        else {
            let script_elem = document.createElement('div')

            script_elem.innerHTML = `
                <div class="cont">
                    <div class="mod-cont">
                        <div class="mod-name">${script_json[name].name}</div>
                        <div class="mod-desc">${script_json[name].description}</div>
                        <button class="actionbtn download" data-link="${script_json[name].link}">Download</button>
                    </div>    
                </div>
            `
            main.appendChild(script_elem);
        }
    })

    var anchors = document.getElementsByClassName("actionbtn");
    for (var i = 0; i < anchors.length; i++) {
        var anchor = anchors[i];
        anchor.onclick = (e) => {
            console.log(e.srcElement.dataset.link)
            if (scriptLink.includes(e.srcElement.dataset.link)) {
                scriptLink.splice(scriptLink.indexOf(e.srcElement.dataset.link), 1);
                settings.set("ScriptLink", scriptLink)
                e.target.innerText = "Download"
                e.target.className = "actionbtn download"
            } else {
                scriptLink.push(e.srcElement.dataset.link)
                settings.set("ScriptLink", scriptLink)
                e.target.innerText = "Remove"
                e.target.className = "actionbtn remove"
            }
            console.log(scriptLink)
            console.log(e)
        }
    }
});