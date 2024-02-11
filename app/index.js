const { app, BrowserWindow, screen, ipcMain, protocol } = require('electron');
const path = require('path')
const fs = require('fs')

const shortcut = require('electron-localshortcut')
const Store = require('electron-store')
const userPrefs = new Store({
    defaults: {
        fullscreenMode: false,
        enableUserscripts: true,
        disableFrameRateLimit: false,
        disableAdvertisements: true,
        experimentalflags: false,
        lowlatency: false,
        scriptLinks: []
    }
})

const Injector = require('./Utils/Injector.js');
const replaceResources = require('./Utils/Swapper.js');
const launchArgs = require('./Utils/launchArgs.js');
launchArgs.pushArguments()

let win


console.log('Chrome:', process.versions.chrome, 'Electron:', process.versions.electron)


function createWindow() {
    const { width, height } = screen.getPrimaryDisplay().workAreaSize

    win = new BrowserWindow({
        width,
        height,
        background: '#202020',
        title: "Venge Client",
        icon: path.join(__dirname, 'icon.ico'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false
        }
    })
    // win.openDevTools()

    win.setFullScreen(userPrefs.get('fullscreenMode'))
    win.removeMenu()
    win.loadFile(path.join(__dirname, '../vengeSource/index.html'))
    
    win.on('ready-to-show', () => {
        win.show()
    })

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

    win.webContents.on('new-window', (event, url) => {
        event.preventDefault()
        const e = new URL(url)
        if (e.hostname === 'venge.io' && e.hash.length > 1) {
            return win.webContents.loadURL(url)
        }
        return shell.openExternal(url)
    })

    initShortcuts()
    initEvents()

    win.webContents.on('dom-ready', () => {
        Injector.injectScripts(win)
        replaceResources(win)
        // Injector.injectCSS(win)
        let scriptLinks = userPrefs.get('scriptLinks')
        for (let i = 0; i < scriptLinks.length; i++) {
            Injector.injectInstalledScripts(win, scriptLinks[i]);
        }
    })
}


function initShortcuts() {
    shortcut.register(win, 'F4', () => {
        win.loadFile(path.join(__dirname, '../vengeSource/index.html'))
            .catch((error) => console.log(error))
    })
    shortcut.register(win, 'Escape', () => {
        win.webContents.executeJavaScript('document.exitPointerLock()', true)
    })
    shortcut.register(win, 'F6', () => {
        if (clipboard.readText().includes("venge.io")) { this.win.loadURL(clipboard.readText()) }
    })
    shortcut.register(win, 'F5', () => {
        win.reload()
    })

    shortcut.register(win, 'F11', () => {
        win.setFullScreen(!win.isFullScreen())
        userPrefs.set('fullscreenMode', win.isFullScreen())
    })
    shortcut.register(win, 'F12', () => {
        win.webContents.openDevTools()
    })
}

function initEvents() {
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

app.whenReady().then(() => {
    createWindow()

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow()
        }
    })

    protocol.registerFileProtocol('swap', (request, callback) => {
        callback({
            path: path.normalize(request.url.replace(/^swap:/, ''))
        })
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})