var main;
const https = require('https');
const Store = require('electron-store')
const userPrefs = new Store();
var scriptLinks = userPrefs.get('scriptLinks');

document.addEventListener("DOMContentLoaded", () => {
    main = document.getElementsByClassName('main')[0]
    usersciprtmanager();
})


function generateScriptElement(scriptData) {
    const actionText = scriptLinks.includes(scriptData.link) ? "Remove" : "Download";
    const actionClass = scriptLinks.includes(scriptData.link) ? "remove" : "download";

    console.log(scriptLinks)
    console.log(scriptData.link);

    return `
      <div class="cont">
        <div class="mod-cont">
          <div class="mod-name">${scriptData.name}</div>
          <div class="mod-desc">${scriptData.description}</div>
          <button class="actionbtn ${actionClass}" data-link="${scriptData.link}">${actionText}</button>
        </div>    
      </div>
    `;
}


function usersciprtmanager() {
    https.get('https://client.venge.io/userscripts.json', (response) => {
        let json = '';

        response.on('data', (chunk) => { json += chunk })

        response.on('end', () => {
            json = JSON.parse(json)
            Object.keys(json).forEach((name) => {
                let script_elem = document.createElement('div')
                script_elem.innerHTML = generateScriptElement(json[name]);
                main.appendChild(script_elem);
            })
        }).on("error", (error) => {
            console.error(error.message);
        });
    })

    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('actionbtn')) {
            handleButtonClick(e.target);
        }
    });
}


function handleButtonClick(button) {
    var link = button.dataset.link;
    if (scriptLinks.includes(link)) {
        scriptLinks.splice(scriptLinks.indexOf(link), 1);
        userPrefs.set('ScriptLink', scriptLinks);
        button.innerText = 'Download';
        button.classList = 'actionbtn download';
    } else {
        scriptLinks.push(link);
        userPrefs.set('scriptLinks', scriptLinks);
        button.innerText = 'Remove';
        button.classList = 'actionbtn remove';
    }
}