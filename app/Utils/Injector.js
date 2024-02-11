const fs = require('fs');
const path = require('path')
const { app } = require('electron');

class Injector {
    static injectScripts(win) {
        const scriptDirectory = path.normalize(`${app.getPath('documents')}/Venge Client/Userscript`)

        if (!fs.existsSync(scriptDirectory)) {
            fs.mkdirSync(scriptDirectory, {
                recursive: true
            })
        }

        const files = fs.readdirSync(scriptDirectory, { withFileTypes: true })
        console.log(files)
        if (files.length === 0) return

        files.forEach(file => {
            if (!file.name.includes('js')) return;
            let script = fs.readFileSync(scriptDirectory + '/' + file.name, { encoding: 'utf-8' });
            console.log(script);
            try {
                win.webContents.executeJavaScript(script);
            } catch (error) {
                console.error("an error occurred while executing userscript: " + file + " error: " + error);
            }
        });
    }

    static async injectInstalledScripts(win,url) {
        https.get(url, (response) => {
            let content = '';

            response.on('data', (chunk) => { content += chunk })

            response.on('end', () => {
                try {
                    win.webContents.executeJavaScript(content);
                } catch (error) {
                    console.error(error.message);
                };
            }).on("error", (error) => {
                console.error(error.message);
            });
        })
    }

    static injectCSS(win) {
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
                    win.webContents.insertCSS(css)
                    console.log(css)
                })
            } catch (error) {
                console.log(error)
            }
        });
    }
}

module.exports = Injector