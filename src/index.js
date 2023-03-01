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
        'UncapFPS': true,
        'Game Capture': false,
        'userscript': downloadPath,
        'Accelerated Canvas': false,
        'remove-useless': true,
        'helpful-flag': true,
        'flag-limit-increase': true,
        'low latency': false,
        'Experimental Flags': false,
        'gpu-rasterization': true,
        'Fullscreen': false
    }
});

//Discord RPC
const DiscordRPC = require('discord-rpc');
const clientId = '727533470594760785';
const RPC = new DiscordRPC.Client({ transport: 'ipc' });
DiscordRPC.register(clientId);
const rpc_script = require('./modules/rpc.js');

//swapper_func
const swapper = require('./modules/swapper.js');
const { machine } = require('os');
const { download } = require('electron-dl');

//exit
ipcMain.on('exit', () => {
    app.exit();
});
//launch Args (thanks to CreepyCats)
const launchArgs = require('./modules/launchArgs.js');
launchArgs.pushArguments()


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
    // shortcuts.register('F2', async () => {
    //     loadHub();
    // });
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

        swapper.replaceResources(win, app);
    });

    swapper.initStyles(win, app)

    // ipcMain.on('click', (event, data) => {
    //     download(win, data.url, { "directory": downloadPath })
    // })

    // ipcMain.on('exit', () => {
    //     app.exit();
    // });

    // ipcMain.on('LoadHub', () => {
    //     loadHub()
    // })

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

// function loadHub() {
//     let HubWindow = new BrowserWindow({
//         width: 1200,
//         height: 800,
//         title: `Venge Client`,
//         backgroundColor: '#202020',
//         icon: __dirname + "/icon.ico",
//         webPreferences: {
//             preload: __dirname + '/userscript/script.js',
//             nodeIntegration: false,
//         }
//     });

//     //HubWindow.removeMenu()
//     HubWindow.loadFile(path.join(__dirname, 'userscript/index.html'));
//     HubWindow.savedTitle = 'URL Menu';
// }

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
