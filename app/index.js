const { app, BrowserWindow, clipboard, protocol, screen, ipcMain, ipcRenderer } = require('electron')
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
const { url } = require('inspector');
launchArgs.pushArguments()

app.allowRendererProcessReuse = true;

protocol.registerSchemesAsPrivileged([{
    scheme: "swap",
    privileges: {
        secure: true,
        corsEnabled: true
    }
}]);

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
        this.win.loadURL('https://venge.io')
            .catch((error) => console.log(error))

        this.win.on('ready-to-show', () => {
            this.win.show()
        })

        this.win.webContents.on('will-prevent-unload', (event) => event.preventDefault())

        this.win.webContents.on('unresponsive', () => {
            console.log('Client is unresponsive...')
            this.win.webContents.forcefullyCrashRenderer()
            this.win.webContents.reload()
        })

        this.win.webContents.on('render-process-gone', () => {
            console.log('Client\'s renderer is gone...')
            this.win.webContents.forcefullyCrashRenderer()
            this.win.webContents.reload()
        })

        this.win.webContents.on('new-window', (event, url) => {
            event.preventDefault()
            const e = new URL(url)
            if (e.hostname === 'venge.io' && e.hash.length > 1) {
                return this.win.webContents.loadURL(url)
            }
            return shell.openExternal(url)
        })

        this.win.webContents.on('dom-ready', () => {
            this.injectScripts()
            this.replaceResources()
            this.injectCSS()
            let scriptLinks = userPrefs.get('scriptLinks')
            for (let i = 0; i < scriptLinks.length; i++) {
                this.injectInstalledScripts(scriptLinks[i]);
            }
        })
    }

    initShortcuts() {
        shortcut.register(this.win, 'F4', () => {
            this.win.loadURL('https://venge.io')
                .catch((error) => console.log(error))
        })
        shortcut.register(this.win, 'Escape', () => {
            this.win.webContents.executeJavaScript('document.exitPointerLock()', true)
        })
        shortcut.register(this.win, 'F11', () => {
            this.win.fullScreen = !this.win.fullScreen; userPrefs.set('fullscreenMode', win.fullScreen)
        });
        shortcut.register(this.win, 'F12', () => {
            this.win.toggleDevTools()
        })
        shortcut.register(this.win, 'F6', () => {
            if (clipboard.readText().includes("venge.io")) { this.win.loadURL(clipboard.readText()) }
        })
        shortcut.register(this.win, 'F5', () => {
            this.win.reload()
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
                icon: __dirname + "/../icon.ico"
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
                console.log(script)
                this.win.webContents.executeJavaScript(script);
            } catch (error) {
                console.error("an error occurred while executing userscript: " + file + " error: " + error);
            }
        });
    }

    async injectInstalledScripts(url) {
        https.get(url, (response) => {
            let content = '';

            response.on('data', (chunk) => { content += chunk })

            response.on('end', () => {
                try {
                    this.win.webContents.executeJavaScript(content);
                    console.log('=-------------------------------------------------------------------------------=')
                    console.log(content)
                    console.log('=-------------------------------------------------------------------------------=')
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
        const skinSwapper = path.normalize(`${app.getPath('documents')}/Venge-Client/Skin Swapper`)

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
            if (new URL(details.url).hostname === 'venge.io' && new URL(details.url).pathname.length > 1) {
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
                win.webContents.on('did-finish-load', () => {
                    this.win.webContents.insertCSS(css)
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
    }
}

const client = new Client()

app.on('ready', () => {
    protocol.registerFileProtocol('swap', (request, callback) => {
        callback({
            path: path.normalize(request.url.replace(/^swap:/, ''))
        })
    })

    if (app.requestSingleInstanceLock()) client.init()
})

app.on('window-all-closed', () => app.exit())

process.on('uncaughtException', (error) => {
    console.log(error)
})
