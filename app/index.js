const { app, BrowserWindow, clipboard, protocol, screen, ipcMain, ipcRenderer, shell } = require('electron')
const path = require('path')
const fs = require('fs')
const https = require('https');
const Store = require('electron-store')
const userPrefs = new Store({
    defaults: {
        fullscreenMode: true,
        enableUserscripts: true,
        disableFrameRateLimit: false,
        disableAdvertisements: true,
        experimentalflags: false,
        lowlatency: false,
        scriptLinks: []
    }
})

const shortcut = require('electron-localshortcut')

const { autoUpdater } = require("electron-updater")
let updateLoaded = false;
let updateNow = false;

const launchArgs = require('./modules/launchArgs');
launchArgs.pushArguments()


const express = require('express');
const expressapp = express();

expressapp.use(express.static(path.join(__dirname, 'vengeSource')));

expressapp.listen(7481, function () {
    console.log('App listening on port 7481!');
});

app.allowRendererProcessReuse = true;

protocol.registerSchemesAsPrivileged([{
    scheme: "swap",
    privileges: {
        secure: true,
        corsEnabled: true
    }
}]);

//DiscordRPC
const DiscordRPC = require('discord-rpc');
const clientId = '727533470594760785';
const RPC = new DiscordRPC.Client({ transport: 'ipc' });
DiscordRPC.register(clientId);
const rpc_script = require('./modules/rpc.js');

console.log('Chrome:', process.versions.chrome, 'Electron:', process.versions.electron)

class Client {
    constructor() { }

    init() {
        this.createWindow()
        this.initUpdater()
        this.initShortcuts()
        this.ipcEvents()
    }

    createWindow() {
        var self = this;

        const { width, height } = screen.getPrimaryDisplay().workAreaSize
        this.win = new BrowserWindow({
            width,
            height,
            fullscreen: true,
            backgroundColor: '#202020',
            title: 'VengeClient',
            icon: __dirname + "/../icon.ico",
            webPreferences: {
                preload: __dirname + '/preload.js',
                nodeIntegration: false,
            }
        })

        this.win.removeMenu()
        this.win.setFullScreen(userPrefs.get('fullscreenMode'))
        this.win.loadURL('http://localhost:7481/')
            .catch((error) => console.log(error))

        this.win.on('ready-to-show', () => {
            self.win.show()
        })

        this.win.webContents.on('will-prevent-unload', (event) => event.preventDefault())

        this.win.webContents.on('unresponsive', () => {
            console.log('Client is unresponsive...')
            self.win.webContents.forcefullyCrashRenderer()
            self.win.webContents.reload()
        })

        this.win.webContents.on('render-process-gone', () => {
            console.log('Client\'s renderer is gone...')
            self.win.webContents.forcefullyCrashRenderer()
            self.win.webContents.reload()
        })

        this.win.webContents.on('new-window', (event, url) => {
            event.preventDefault()
            const e = new URL(url)
            if (e.hostname === 'venge.io' && e.hash.length > 1) {
                return self.win.webContents.loadURL(url)
            }
            return shell.openExternal(url)
        })

        this.win.webContents.on('dom-ready', () => {
            self.injectScripts()
            self.replaceResources()
            self.injectCSS()
            let scriptLinks = userPrefs.get('scriptLinks')
            for (let i = 0; i < scriptLinks.length; i++) {
                self.injectInstalledScripts(scriptLinks[i]);
            }
        })
    }

    initShortcuts() {
        var self = this;
        shortcut.register(this.win, 'F4', () => {
            self.win.loadURL('https://venge.io')
                .catch((error) => console.log(error))
        })
        shortcut.register(this.win, 'Escape', () => {
            self.win.webContents.executeJavaScript('document.exitPointerLock()', true)
        })
        shortcut.register(this.win, 'F11', () => {
            self.win.fullScreen = !self.win.fullScreen; userPrefs.set('fullscreenMode', self.win.fullScreen)
        });
        shortcut.register(this.win, 'F12', () => {
            self.win.toggleDevTools()
        })
        shortcut.register(this.win, 'F6', () => {
            if (clipboard.readText().includes("venge.io")) { self.win.loadURL(clipboard.readText()) }
        })
        shortcut.register(this.win, 'F5', () => {
            self.win.reload()
        })

        shortcut.register(this.win, 'F7', () => {
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

            // HubWindow.removeMenu()
            HubWindow.loadFile(path.join(__dirname, '/userscript/index.html'));
        })
    }

    initUpdater() {
        let splashScreen;
        autoUpdater.setFeedURL({
            owner: "OnRushStudio",
            repo: "Venge-Client",
            provider: "github",
            updaterCacheDirName: "venge-client-updater",
        });

        autoUpdater.checkForUpdates();

        autoUpdater.on('update-available', () => {
            splashScreen = new BrowserWindow({
                width: 520,
                height: 300,
                frame: false,
                transparent: true,
                icon: __dirname + "/../icon.ico",
                webPreferences: {
                    nodeIntegration: true
                }
            });
            splashScreen.center()
            splashScreen.webContents.executeJavaScript(`document.querySelector("body > div > div").innerText = '${appVer}'; document.getElementById('downloadtext').style.display = "block"`)
        });

        autoUpdater.on('update-downloaded', () => {
            updateLoaded = true;
            if (updateNow) {
                autoUpdater.quitAndInstall(true, true);
            }
            splashScreen.close()
        });
    }

    injectScripts() {
        const scriptDirectory = path.normalize(`${app.getPath('documents')}/Venge Client/Userscript`)

        if (!fs.existsSync(scriptDirectory)) {
            fs.mkdirSync(scriptDirectory, {
                recursive: true
            })
        }

        const files = fs.readdirSync(scriptDirectory, { withFileTypes: true })
        if (files.length === 0) return

        files.forEach(file => {
            if (!file.name.includes('js')) return;
            let script = fs.readFileSync(scriptDirectory + '/' + file.name, { encoding: 'utf-8' });
            try {
                // console.log(script)
                this.win.webContents.executeJavaScript(script);
            } catch (error) {
                console.error("an error occurred while executing userscript: " + file + " error: " + error);
            }
        });
    }

    async injectInstalledScripts(url) {
        var self = this;
        https.get(url, (response) => {
            let content = '';

            response.on('data', (chunk) => { content += chunk })

            response.on('end', () => {
                try {
                    self.win.webContents.executeJavaScript(content);
                    // console.log('=-------------------------------------------------------------------------------=')
                    // console.log(content)
                    // console.log('=-------------------------------------------------------------------------------=')
                } catch (error) {
                    console.error(error.message);
                };
            }).on("error", (error) => {
                console.error(error.message);
            });
        })
    }

    replaceResources() {
        const AdBlockList = [
            'pubads.g.doubleclick.net',
            'video-ad-stats.googlesyndication.com',
            'simage2.pubmatic.com/AdServer',
            'pagead2.googlesyndication.com',
            'securepubads.g.doubleclick.net',
            'googleads.g.doubleclick.net',
            'adclick.g.doubleclick.net'
        ]

        const swapDirectory = path.normalize(`${app.getPath('documents')}/Venge Client/Resource Swapper`)
        const skinSwapper = path.normalize(`${app.getPath('documents')}/Venge Client/Skin Swapper`)

        if (!fs.existsSync(swapDirectory)) {
            fs.mkdirSync(swapDirectory, {
                recursive: true
            })
        }

        if (!fs.existsSync(skinSwapper)) {
            fs.mkdirSync(skinSwapper, {
                recursive: true
            })
        }

        this.win.webContents.session.webRequest.onBeforeRequest((details, callback) => {
            if (AdBlockList.includes(new URL(details.url).hostname) && userPrefs.get('disableAdvertisements')) {
                return callback({ cancel: true })
            }
            if (new URL(details.url).hostname === 'localhost' && new URL(details.url).pathname.length > 1) {
                const url = path.join(swapDirectory, new URL(details.url).pathname);
                if (fs.existsSync(url)) {
                    return callback({ cancel: false, redirectURL: `swap:/${url}` })
                }
            }
            if (new URL(details.url).hostname === 'assets.venge.io' && new URL(details.url).pathname.length > 1) {
                const url = path.join(skinSwapper, new URL(details.url).pathname);
                if (fs.existsSync(url)) {
                    return callback({ cancel: false, redirectURL: `swap:/${url}` });
                }
            }
            return callback({ cancel: false })
        })
    }

    injectCSS() {
        var self = this;
        let cssDirectory = path.normalize(`${app.getPath('documents')}/Venge Client/CSS`)

        if (!fs.existsSync(cssDirectory)) {
            fs.mkdirSync(cssDirectory, {
                recursive: true
            });
        }

        const files = fs.readdirSync(cssDirectory, { withFileTypes: true })
        if (files.length === 0) return

        files.forEach(file => {
            if (!file.name.includes('css')) return;
            let css = fs.readFileSync(cssDirectory + '/' + file.name, { encoding: 'utf-8' });
            try {
                self.win.webContents.on('did-finish-load', () => {
                    self.win.webContents.insertCSS(css)
                })
            } catch (error) {
                console.log(error)
            }
        });
    }

    ipcEvents() {
        ipcMain.on('exit', () => {
            app.quit()
        })

        ipcMain.on('loadhub', () => {
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

            // HubWindow.removeMenu()
            HubWindow.loadFile(path.join(__dirname, '/userscript/index.html'));
        })

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
    }
}

const client = new Client()

app.on('ready', () => {
    let appVer = app.getVersion()
    let splashScreen = new BrowserWindow({
        width: 520,
        height: 300,
        frame: false,
        transparent: true,
        icon: __dirname + "/../icon.ico",
        webPreferences: {
            nodeIntegration: true
        }
    });
    splashScreen.center()

    setTimeout(() => {
        if (app.requestSingleInstanceLock()) { client.init() }
        splashScreen.close()
    }, 3000);

    // Load the splash screen HTML
    splashScreen.loadFile(path.join(__dirname, '/splash/index.html'));
    splashScreen.webContents.executeJavaScript(`document.querySelector("body > div > div").innerText = '${appVer}'; document.getElementById('tip').style.display = "block"`)
    protocol.registerFileProtocol('swap', (request, callback) => {
        callback({
            path: path.normalize(request.url.replace(/^swap:/, ''))
        })
    })

})

app.on('window-all-closed', () => app.exit())

process.on('uncaughtException', (error) => {
    console.log(error)
})
