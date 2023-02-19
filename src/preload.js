// const { ipcRenderer } = require('electron');

// let loadChecker = setInterval(() => {
//     if (app.page && app.session.map && pc !== undefined) {
//         ipcRenderer.send('loadScripts');
//         clearInterval(loadChecker);
//     }
// }, 500);

// window.onload = () => {
//     changePage(app.page, app.tab);
// }

// function changePage(page, tab) {
//     if (page == 'Home') {
//         if (!document.getElementById('ClientExit')) {
//             var div = document.getElementsByClassName('menu-button shop')[0];
//             if (div) div.parentElement.insertAdjacentHTML('beforeend', '<a aria-label="Exit" id="ClientExit" class="menu-button settings hint--left button-sound" style="cursor: pointer;"><img src="images/Close-Icon.png"></a>')

//             var div = document.getElementsByClassName('menu-button shop')[0];

//             if (div) div.parentElement.insertAdjacentHTML('beforeend', '<a aria-label="Client Hub" id="ClientHub" class="menu-button settings hint--left button-sound" style="cursor: pointer;"><img src="https://cdn.discordapp.com/attachments/925622910570336296/1066011519478931567/4703487_1.png"></a>')

//             document.getElementById('ClientExit').onclick = function () { ipcRenderer.send("exit") }
//             document.getElementById('ClientHub').onclick = function () { ipcRenderer.send("LoadHub") }
//         }
//     }
// }

// ipcRenderer.on('scriptsLoaded', (event, hasScripts) => {
//     if (hasScripts) {
//         app.settingsTabs.push({ name: 'Client', icon: 'fa-desktop', tab: 'Client' });
//         app.customSettings.push({ name: 'Client Message', type: 'message', value: 'Official Client Settings', tab: 'Client' });
//         app.customSettings.push({ name: 'Unlimited FPS', type: 'checkbox', value: true, tab: 'Client' });
//         app.customSettings.push({ name: 'info-flags', type: 'message', value: 'Performance Settins of the client', tab: 'Client' });
//         app.customSettings.push({ name: 'Gpu Rasterization', type: 'checkbox', value: true, tab: 'Client' });
//         app.customSettings.push({ name: 'flag-limit-increase', type: 'checkbox', value: true, tab: 'Client' });
//         app.customSettings.push({ name: 'low latency', type: 'checkbox', value: false, tab: 'Client' });
//         app.customSettings.push({ name: 'Experimental Flags', type: 'checkbox', value: false, tab: 'Client' });
//         app.customSettings.push({ name: 'GameCapture', type: 'message', value: 'Gives better peroformance if you are recording/streaming your game.', tab: 'Client' });
//         app.customSettings.push({ name: 'Game Capture', type: 'checkbox', value: false, tab: 'Client' });

//         pc.app.on('Client:CustomSettingsChange', function (setting) {
//             ipcRenderer.send('settingChange', setting);
//         });

//         pc.app.on('Player:Leave', function () {
//             ipcRenderer.send('loadRPC', { area: 'menu' });
//         }, this);

//         pc.app.on('Overlay:Weapon', function (weapon) {
//             let maps = app.session.defaultMaps.map((map) => map.split(' - ')[0]);
//             ipcRenderer.send('loadRPC', { area: 'game', now: Date.now(), weapon: weapon, map: app.session.map, maps: maps, mapText: app.session.defaultMaps.filter((map) => map.split(' - ')[0] == app.session.map)[0] });
//         }, this);


//         console.log('----------\nScripts Loaded\n----------');
//     }
// });
