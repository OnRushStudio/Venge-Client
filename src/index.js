const { app, BrowserWindow, globalShortcut, protocol, ipcMain, dialog } = require('electron');
app.startedAt = Date.now();
const path = require('path');
const official_settings = ['Unlimited FPS'];

//auto update
const { autoUpdater } = require("electron-updater")
const { MacUpdater } = require("electron-updater")
let updateLoaded = false;
let updateNow = false;


//Settings
const Store = require('electron-store');
Store.initRenderer();
const settings = new Store();

//Discord RPC
const DiscordRPC = require('discord-rpc');
const clientId = '727533470594760785';
const RPC = new DiscordRPC.Client({ transport: 'ipc' });
RPC.login({ clientId }).catch(console.error);
DiscordRPC.register(clientId);
const rpc_script = require('./rpc.js');

//swapper_func
const swapper = require('./swapper.js');
const { machine } = require('os');


//Uncap FPS
if (settings.get('Unlimited FPS') === undefined) settings.set('Unlimited FPS', true);
if (settings.get('Unlimited FPS')) {
    app.commandLine.appendSwitch('disable-frame-rate-limit');
    app.commandLine.appendSwitch('disable-gpu-vsync');
}


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

    globalShortcut.register('F6', () => win.loadURL('https://venge.io/'));
    globalShortcut.register('F5', () => win.reload());
    globalShortcut.register('Escape', () => win.webContents.executeJavaScript('document.exitPointerLock()', true));
    globalShortcut.register('F7', () => win.webContents.toggleDevTools());
    globalShortcut.register('F11', () => { win.fullScreen = !win.fullScreen; settings.set('Fullscreen', win.fullScreen) });

    win.on('page-title-updated', (e) => {
        e.preventDefault();
    });

    win.loadURL('https://venge.io/');

    //Swapper

    //Auto Update

    console.log("hello")
    console.log(process.platform)

    if (process.platform == "win32") {
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
    }

    if (process.platform == "darwin") {
        MacUpdater.checkForUpdates();

        MacUpdater.on('update-available', () => {
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

        MacUpdater.on('update-downloaded', () => {
            updateLoaded = true;
            if (updateNow) {
                MacUpdater.quitAndInstall();
            }
        });
    }

    ipcMain.on('loadScripts', function (event) {
        swapper.runScripts(win, app);
        event.sender.send('scriptsLoaded', true);
    });

    swapper.replaceResources(win, app);

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
        }
    });
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

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});