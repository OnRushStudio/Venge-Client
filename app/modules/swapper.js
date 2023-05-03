const fs = require('original-fs');
const path = require('path');
const Store = require('electron-store')
const userPrefs = new Store()

module.exports = {
    totalScripts: 0,
    initStyles: (win, app) => {
        let cssDirectory = path.normalize(`${app.getPath('documents')}/Venge-Client/CSS`);

        if (!fs.existsSync(cssDirectory)) {
            fs.mkdirSync(cssDirectory, {
                recursive: true
            });
        }

        let files = fs.readdirSync(cssDirectory, { withFileTypes: true });
        if (files.length == 0) return;

        files.forEach(file => {
            if (!file.name.includes('css')) return;
            let css = fs.readFileSync(cssDirectory + '/' + file.name, { encoding: 'utf-8' });
            try {
                win.webContents.on('did-finish-load', () => {
                    win.webContents.insertCSS(css)
                })
            } catch (error) {
                console.log(error)
            }
        });
    },
    replaceResources: (win, app) => {

        function checkCreateFolder(folder) {
            if (!fs.existsSync(folder)) {
                fs.mkdirSync(folder, { recursive: true });
            }
            return folder;
        }

        checkCreateFolder(app.getPath('documents') + "\\Venge-Client\\Resource Swapper\\");
        checkCreateFolder(app.getPath('documents') + "\\Venge-Client\\Skin Swapper\\");
        checkCreateFolder(app.getPath('documents') + "\\Venge-Client\\Scripts\\");

        const AdBlockList = [
            'pubads.g.doubleclick.net',
            'video-ad-stats.googlesyndication.com',
            'simage2.pubmatic.com/AdServer',
            'pagead2.googlesyndication.com',
            'securepubads.g.doubleclick.net',
            'googleads.g.doubleclick.net',
            'adclick.g.doubleclick.net'
        ]

        let swapDirectory = path.normalize(`${app.getPath('documents')}/Venge-Client/Resource Swapper`)
        let skinSwapper = path.normalize(`${app.getPath('documents')}/Venge-Client/Skin Swapper`)

        if (!fs.existsSync(swapDirectory)) {
            fs.mkdirSync(swapDirectory, {
                recursive: true
            });
        }

        win.webContents.session.webRequest.onBeforeRequest((details, callback) => {
            if (userPrefs.get('ADBlock')) {
                if (AdBlockList.includes(new URL(details.url).hostname)) {
                    return callback({ cancel: true });
                }
            }

            if (new URL(details.url).hostname === 'assets.venge.io' && new URL(details.url).pathname.length > 1) {
                let url = `${skinSwapper}\\${new URL(details.url).pathname}`;
                if (fs.existsSync(url)) {
                    return callback({ cancel: false, redirectURL: `swap:/${url}` });
                }
            }

            if (new URL(details.url).hostname === 'venge.io' && new URL(details.url).pathname.length > 1) {
                let url = `${swapDirectory}\\${new URL(details.url).pathname}`;
                if (fs.existsSync(url)) {
                    return callback({ cancel: false, redirectURL: `swap:/${url}` });
                }
            }

            return callback({ cancel: false });
        });
    }
}
