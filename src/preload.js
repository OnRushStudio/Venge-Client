const { ipcRenderer } = require('electron');

let loadChecker = setInterval(() => {
    if(app.page && app.session.map && pc !== undefined) {
        ipcRenderer.send('loadScripts');
        ipcRenderer.send('loadRPC', { area: 'menu' });
        clearInterval(loadChecker);
    }
}, 500);

ipcRenderer.on('scriptsLoaded', (event, hasScripts) => {
    if(hasScripts) {
        app.settingsTabs.push({ name: 'Client', icon: 'fa-desktop', tab: 'Client' });
        app.customSettings.push({ name: 'Client Message', type: 'message', value: 'Official Client Settings', tab: 'Client' });
        app.customSettings.push({ name: 'Unlimited FPS', type: 'checkbox', value: true, tab: 'Client' });
        app.customSettings.push({ name: 'acceleratedCanvas', type: 'message', value: 'Enables the use of the GPU to perform 2d canvas rendering instead of using software rendering.', tab: 'Client' });
        app.customSettings.push({ name: 'Accelerated Canvas', type: 'checkbox', value: false, tab: 'Client' });
        app.customSettings.push({ name: 'GameCapture', type: 'message', value: 'Gives better peroformance if you are recording/streaming your game.', tab: 'Client' });
        app.customSettings.push({ name: 'Game Capture', type: 'checkbox', value: false, tab: 'Client' });
        
        pc.app.on('Client:CustomSettingsChange', function(setting){
            ipcRenderer.send('settingChange', setting);
        });

        pc.app.on('Player:Leave', function() {
            ipcRenderer.send('loadRPC', { area: 'menu' });
        }, this);
    
        pc.app.on('Overlay:Weapon', function(weapon) {
            let maps = app.session.defaultMaps.map((map) => map.split(' - ')[0]);
            ipcRenderer.send('loadRPC', { area: 'game', now: Date.now(), weapon: weapon, map: app.session.map, maps: maps, mapText: app.session.defaultMaps.filter((map) => map.split(' - ')[0] == app.session.map)[0] });
        }, this);


        console.log('----------\nScripts Loaded\n----------');
    }
});
