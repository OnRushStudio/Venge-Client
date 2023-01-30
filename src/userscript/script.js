const script_json = require('./userscripts.json')
var main;
const path = require('path');
const Store = require('electron-store');
const settings = new Store();
const fs = require('fs')

const https = require('https');

const { app, ipcRenderer } = require('electron')

var downloadPath = settings.get('userscript')


document.addEventListener("DOMContentLoaded", () => {
    scriptinit();
})

function scriptinit() {
    fetch('https://raw.githubusercontent.com/MetaHumanREAL/Venge-Client/main/userscript/userscripts.json')
        .then(response => response.json())
        .then((data) => {
            let script_json = data;

            main = document.getElementsByClassName('main')[0]

            Object.keys(script_json).forEach((name) => {
                if (fs.existsSync(downloadPath + script_json[name].file_name)) {
                    let script_elem = document.createElement('div')
                    script_elem.innerHTML = `
                        <div class="cont">
                            <div class="mod-cont">
                                <div class="mod-name">${script_json[name].name}</div>
                                <div class="mod-desc">${script_json[name].description}</div>
                                <button class="actionbtn remove" data-link="${script_json[name].link}" data-fname="${script_json[name].file_name}">Remove</button>
                            </div>    
                        </div>
                    `
                    main.appendChild(script_elem);
                } else {
                    let script_elem = document.createElement('div')

                    script_elem.innerHTML = `
                    <div class="cont">
                        <div class="mod-cont">
                            <div class="mod-name">${script_json[name].name}</div>
                            <div class="mod-desc">${script_json[name].description}</div>
                            <button class="actionbtn download" data-link="${script_json[name].link}" data-fname="${script_json[name].file_name}">Download</button>
                        </div>    
                    </div>
                `
                    main.appendChild(script_elem);
                }

                var anchors = document.getElementsByClassName("actionbtn");
                for (var i = 0; i < anchors.length; i++) {
                    var anchor = anchors[i];
                    anchor.onclick = (e) => {
                        if (fs.existsSync(downloadPath + e.srcElement.dataset.fname)) {
                            fs.unlink(downloadPath + e.srcElement.dataset.fname, (err) => {
                                if (err) throw err;
                                console.log('path/file.txt was deleted');
                            });
                            console.log("remove func")
                            e.target.innerText = "Download"
                            e.target.className = "actionbtn download"
                        } else {
                            ipcRenderer.send('click', { url: e.srcElement.dataset.link });
                            console.log("download func")
                            e.target.innerText = "Remove"
                            e.target.className = "actionbtn remove"
                        }
                    }
                }
            });
        });
}