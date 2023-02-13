require('v8-compile-cache');

const { app, BrowserWindow, protocol, ipcMain, dialog, clipboard } = require('electron');
app.startedAt = Date.now();
const path = require('path');
const official_settings = ['Unlimited FPS', 'Accelerated Canvas', 'Game Capture'];
const fs = require('fs')
var downloadPath = path.normalize(`${app.getPath('appData')}\\vengeclient\\userscript\\`);

const shortcuts = require('electron-localshortcut');

//auto update
const { autoUpdater } = require("electron-updater")
let updateLoaded = false;
let updateNow = false;


//Settings
const Store = require('electron-store');
Store.initRenderer();
const settings = new Store({
    defaults: {
        'Unlimited FPS': true,
        'Game Capture': false,
        'userscript': downloadPath,
        'Accelerated Canvas': false,
        'Game Capture': false,
        'remove-useless': true,
        'helpful-flag': true,
        'flag-limit-increase': true,
        'low latency': false,
        'Experimental Flags': false,
        'gpu-rasterization': true
    }
});

//Discord RPC
const DiscordRPC = require('discord-rpc');
const clientId = '727533470594760785';
const RPC = new DiscordRPC.Client({ transport: 'ipc' });
DiscordRPC.register(clientId);
const rpc_script = require('./rpc.js');

//swapper_func
const swapper = require('./swapper.js');
const { machine } = require('os');
const { download } = require('electron-dl');

//Flags

if (settings.get('remove-useless')) {
    app.commandLine.appendSwitch('disable-breakpad');
    app.commandLine.appendSwitch('disable-print-preview');
    app.commandLine.appendSwitch('disable-metrics-repo');
    app.commandLine.appendSwitch('disable-metrics');
    app.commandLine.appendSwitch('disable-2d-canvas-clip-aa');
    app.commandLine.appendSwitch('disable-bundled-ppapi-flash');
    app.commandLine.appendSwitch('disable-logging');
    app.commandLine.appendSwitch('disable-hang-monitor');
    app.commandLine.appendSwitch('disable-component-update');
    if (process.platform === 'darwin') app.commandLine.appendSwitch('disable-dev-shm-usage');
}

if (settings.get('helpful-flag')) {
    app.commandLine.appendSwitch('in-process-gpu');
    app.commandLine.appendSwitch('enable-javascript-harmony');
    app.commandLine.appendSwitch('enable-future-v8-vm-features');
    app.commandLine.appendSwitch('enable-webgl');
    app.commandLine.appendSwitch('enable-webgl2-compute-context');
    app.commandLine.appendSwitch('disable-background-timer-throttling');
    app.commandLine.appendSwitch('disable-renderer-backgrounding');
    app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
}

if (settings.get('flag-limit-increase')) {
    app.commandLine.appendSwitch('renderer-process-limit', '100');
    app.commandLine.appendSwitch('max-active-webgl-contexts', '100');
    app.commandLine.appendSwitch('webrtc-max-cpu-consumption-percentage', '100');
    app.commandLine.appendSwitch('ignore-gpu-blacklist');
}
if (settings.get('low latency')) {
    app.commandLine.appendSwitch('enable-highres-timer');
    app.commandLine.appendSwitch('enable-quic');
    app.commandLine.appendSwitch('enable-accelerated-2d-canvas');
}
if (settings.get('Experimental Flags')) {
    app.commandLine.appendSwitch('disable-low-end-device-mode');
    app.commandLine.appendSwitch('enable-accelerated-video-decode');
    app.commandLine.appendSwitch('enable-native-gpu-memory-buffers');
    app.commandLine.appendSwitch('high-dpi-support', '1');
    app.commandLine.appendSwitch('ignore-gpu-blacklist');
    app.commandLine.appendSwitch('no-pings');
    app.commandLine.appendSwitch('no-proxy-server');
}
if (settings.get('gpu-rasterization')) {
    app.commandLine.appendSwitch('enable-gpu-rasterization');
    app.commandLine.appendSwitch('enable-oop-rasterization');
    app.commandLine.appendSwitch('disable-zero-copy');
}


//Uncap FPS

if (settings.get('Unlimited FPS')) {
    app.commandLine.appendSwitch('disable-frame-rate-limit');
    app.commandLine.appendSwitch('disable-gpu-vsync');
    app.commandLine.appendSwitch('max-gum-fps', '9999');
}

//Capture Mode
if (settings.get("Game Capture")) {
    const os = require('os');
    if (os.cpus()[0].model.indexOf('AMD') > -1)
        app.commandLine.appendSwitch('enable-zero-copy');
    app.commandLine.appendSwitch('disable-gpu-compositing')
    app.commandLine.appendSwitch('disable-accelerated-video-decode')
    app.commandLine.appendSwitch('disable-accelerated-video-encode')
}

app.allowRendererProcessReuse = true;

//main Client Code
const createWindow = () => {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        title: `Venge Client`,
        backgroundColor: '#202020',
        icon: __dirname + "/icon.ico",
        webPreferences: {
            preload: __dirname + '/preload.js',
            nodeIntegration: false,
        }
    });
    win.removeMenu();
    win.maximize();
    win.setFullScreen(settings.get('Fullscreen'));

    win.loadURL('https://venge.io')
        .catch((error) => console.log(error))

    win.on('page-title-updated', (e) => {
        e.preventDefault();
    });
    win.webContents.on('will-prevent-unload', (event) => event.preventDefault())

    win.webContents.on('unresponsive', () => {
        console.log('Client is unresponsive...')
        win.webContents.forcefullyCrashRenderer()
        win.webContents.reload()
    })

    win.webContents.on('render-process-gone', () => {
        console.log('Client\'s renderer is gone...')
        win.webContents.forcefullyCrashRenderer()
        win.webContents.reload()
    })

    //Shortcuts
    shortcuts.register(win, "F4", () => win.loadURL('https://venge.io/'));
    shortcuts.register(win, "F5", () => win.reload());
    shortcuts.register(win, "F6", () => { if (clipboard.readText().includes("venge.io")) { win.loadURL(clipboard.readText()) } })
    shortcuts.register(win, 'F11', () => { win.fullScreen = !win.fullScreen; settings.set('Fullscreen', win.fullScreen) });
    shortcuts.register(win, "F12", () => win.webContents.toggleDevTools());
    shortcuts.register('F2', async () => {
        loadHub();
    });
    shortcuts.register(win, "Escape", () => win.webContents.executeJavaScript('document.exitPointerLock()', true));



    //Auto Update

    autoUpdater.setFeedURL({
        owner: "MetaHumanREAL",
        repo: "Venge-Client",
        provider: "github",
        updaterCacheDirName: "venge-client-updater",
    });


    autoUpdater.checkForUpdates();

    autoUpdater.on('update-available', () => {

        const options = {
            title: "Client Update",
            buttons: ["Now", "Later"],
            message: "Client Update available, do you want to install it now or after the next restart?",
            icon: __dirname + "/icon.ico"
        }
        dialog.showMessageBox(options).then((result) => {
            if (result.response === 0) {
                updateNow = true;
                if (updateLoaded) {
                    autoUpdater.quitAndInstall();
                }
            }
        });

    });

    autoUpdater.on('update-downloaded', () => {
        updateLoaded = true;
        if (updateNow) {
            autoUpdater.quitAndInstall(true, true);
        }
    });

    //Swapper
    win.webContents.on('dom-ready', () => {
        ipcMain.on('loadScripts', function (event) {
            swapper.runScripts(win, app);
            swapper.initScripts(win, app)
            event.sender.send('scriptsLoaded', true);
        });

        swapper.replaceResources(win, app);
    })

    ipcMain.on('click', (event, data) => {
        download(win, data.url, { "directory": downloadPath })
    })

    ipcMain.on('exit', () => {
        app.exit();
    });

    ipcMain.on('LoadHub', () => {
        loadHub()
    })

    //Discord RPC

    ipcMain.on('loadRPC', (event, data) => {
        if (data.area == 'game') {
            rpc_script.setActivity(RPC, {
                state: 'In a game',
                startTimestamp: data.now,
                largeImageKey: data.maps.includes(data.map) ? data.map.toLowerCase() : 'custom',
                largeImageText: data.mapText == undefined ? data.map + ' - CUSTOM MATCH' : data.mapText,
                smallImageKey: data.weapon.toLowerCase(),
                smallImageText: data.weapon,
                instance: false,
                buttons: [
                    {
                        label: 'Download Client',
                        url: 'https://social.venge.io/client.html'
                    }
                ]
            });
        }

        if (data.area == 'menu') {
            rpc_script.setActivity(RPC, {
                state: 'On the menu',
                startTimestamp: app.startedAt,
                largeImageKey: 'menu',
                largeImageText: 'Venge.io',
                instance: false,
                buttons: [
                    {
                        label: 'Download Client',
                        url: 'https://social.venge.io/client.html'
                    }
                ]
            });
        }
    });

    ipcMain.on('settingChange', function (event, setting) {
        if (official_settings.includes(setting.name)) {
            settings.set(setting.name, setting.value);
            if (setting.name == 'Unlimited FPS') { app.exit(); app.relaunch(); }
            if (setting.name == 'Accelerated Canvas') { app.exit(); app.relaunch(); }
            if (setting.name == 'Game Capture') { app.exit(); app.relaunch(); }

            console.log(setting.name)
        }
    });


}

function loadHub() {
    let HubWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        title: `Venge Client`,
        backgroundColor: '#202020',
        icon: __dirname + "/icon.ico",
        webPreferences: {
            preload: __dirname + '/userscript/script.js',
            nodeIntegration: false,
        }
    });

    //HubWindow.removeMenu()
    HubWindow.loadFile(path.join(__dirname, 'userscript/index.html'));
    HubWindow.savedTitle = 'URL Menu';
}

app.whenReady().then(() => {
    protocol.registerFileProtocol('swap', (request, callback) => {
        callback({
            path: path.normalize(request.url.replace(/^swap:/, ''))
        });
    });

    createWindow()
    app.on('activate', function () {
        // On macOS it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })

})

app.on('window-all-closed', () => {
    app.quit()
})

RPC.login({ clientId }).catch(console.error);
