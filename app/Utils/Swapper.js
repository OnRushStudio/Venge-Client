const fs = require('fs')
const { protocol, app } = require('electron')
const path = require('path')
const Store = require('electron-store');
const userPrefs = new Store();


const replaceResources = (win) => {
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

    win.webContents.session.webRequest.onBeforeRequest((details, callback) => {
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

module.exports = replaceResources