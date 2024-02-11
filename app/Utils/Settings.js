const Store = require('electron-store');
const userPrefs = new Store();

const clientData = [
    {
        label: "Unlimited FPS",
        id: "disableFrameRateLimit",
        tooltip: "Uncap your FPS from being limited to the monitor's refresh rate"
    },
    {
        label: "Fullscreen Mode",
        id: "fullscreenMode",
        tooltip: "Makes the client window full-screen"
    },
    {
        label: "Experimental Flags",
        id: "experimentalFlags",
        tooltip: "Enables use of Chromium-based experimental features that may or may not boost performance"
    },
    {
        label: "Low Latency",
        id: "lowLatency",
        tooltip: "Minimizes input delay for smoother gameplay"
    },
    {
        label: "Enable Userscripts",
        id: "enableUserscripts",
        tooltip: "Enables use of community made userscripts for added features"
    }
];
const scriptData = [
    {
        id: "vmodel", // ID of the setting
        label: "Viewmodel Adjustments", // Label of the setting
        subSettings: [ // Sub-settings
            { id: "togvm", label: "Toggle Viewmodel", type: "toggle" },
            { id: "hidehands", label: "Hide Viewmodel Hands", type: "toggle" },
            { id: "hideads", label: "Hide Viewmodel on ADS", type: "toggle" },
            { id: "hidereload", label: "Hide Viewmodel on Reload", type: "toggle" },
            { id: "wire", label: "Viewmodel Wireframe", type: "toggle" },
            { id: "rainbow", label: "Viewmodel Rainbow Textures", type: "toggle" },
            { id: "posx", label: "Viewmodel PosX", type: "slider" },
            { id: "posy", label: "Viewmodel PosY", type: "slider" },
            { id: "posz", label: "Viewmodel PosZ", type: "slider" },
            { id: "rotx", label: "Viewmodel RotX", type: "slider" },
            { id: "roty", label: "Viewmodel RotY", type: "slider" },
            { id: "rotz", label: "Viewmodel RotZ", type: "slider" },
            { id: "scalex", label: "Viewmodel ScaleX", type: "slider" },
            { id: "scaley", label: "Viewmodel ScaleY", type: "slider" },
            { id: "scalez", label: "Viewmodel ScaleZ", type: "slider" }
        ]
    },
    {
        id: "twitch",
        label: "Twitch Chat Integration",
        subSettings: [
            { id: "twitchuser", label: "Twitch Username", type: "textbox" }
        ]
    }
];

const initClientSettings = () => {
    // Function to generate HTML from JSON data
    function generateHTML(settings) {
        let html = '';
        settings.forEach(setting => {
            html += `
            <div class="vcsperfsettings-wrapper">
                <div class="vcsblockset">
                    <div class="vcsfield vcscheck">
                        <label for="${setting.id}">${setting.label}</label>
                        <div class="vcswrapper"><input type="checkbox" id="${setting.id}" class="vcstoggle"><label
                                for="${setting.id}"></label>
                        </div>
                    </div>
                </div>
                <button class="vcstooltip">
                    <svg id="vcsinfo-svg" width="35px" height="35px" viewBox="0 0 24 24" fill="none">
                        <path fill-rule="evenodd" clip-rule="evenodd"
                            d="M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12ZM12 17.75C12.4142 17.75 12.75 17.4142 12.75 17V11C12.75 10.5858 12.4142 10.25 12 10.25C11.5858 10.25 11.25 10.5858 11.25 11V17C11.25 17.4142 11.5858 17.75 12 17.75ZM12 7C12.5523 7 13 7.44772 13 8C13 8.55228 12.5523 9 12 9C11.4477 9 11 8.55228 11 8C11 7.44772 11.4477 7 12 7Z"
                            fill="white" />
                    </svg>
                    <div class="vcstooltip-text" id="vcstooltip-text">${setting.tooltip}</div>
                </button>
            </div>
        `;
        });
        return html;
    }

    // Generate HTML and append it to the document
    const settingsHTML = generateHTML(clientData);
    document.getElementById('vcsperfsettings').innerHTML += settingsHTML;

    initValues()
}

const initUserscripts = () => {
    // Function to generate HTML for sub-settings with input sliders
    function generateInputSliderHTML(label, id) {
        return `
        <div class="vcsfield-range">
            <label>${label}</label>
            <div class="vcsinput-slider-wrapper">
                <div class="vcsinput-slider-text" id="${id}">0</div>
                <input type="range" min="-100" max="100" value="0" oninput="document.querySelector('#${id}').innerHTML = this.value">
            </div>
        </div>
    `;
    }

    // Function to generate HTML from JSON data
    function generateCustomSettingsHTML(settings) {
        let html = '';
        settings.forEach(setting => {
            html += `
            <div id="vcscustom-${setting.id}">
                <div class="vcscustom-blockset">
                    <details class="vcsdetails">
                        <summary class="vcssummary">
                            <div class="vcssummarymain">
                                <div class="vcsblockset">
                                    <div class="vcsfield vcscheck">
                                        <label for="vcstwitchchat">${setting.label}</label>
                                        <div class="vcswrapper">
                                            <input type="checkbox" id="vcstwitchchat" class="vcstoggle">
                                            <label for="vcstwitchchat"></label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="vcssummaryside">
                                <svg xmlns="http://www.w3.org/2000/svg" width="30px" height="30px" viewBox="0 0 24 24"
                                    fill="none">
                                    <path d="M6 12H18M12 6V18" stroke="#fff" stroke-width="3" stroke-linecap="round"
                                        stroke-linejoin="round" />
                                </svg>
                            </div>
                        </summary>
                        <div class="vcsdetailscontent">
                            <hr class="vcshr">
        `;

            setting.subSettings.forEach(subSetting => {
                if (subSetting.type === 'slider') {
                    html += generateInputSliderHTML(subSetting.label, subSetting.id);
                } else if (subSetting.type === 'textbox') {
                    html += `
                    <div class="vcsform-field">
                        <label for="${subSetting.id}">${subSetting.label}</label>
                        <input type="text" id="${subSetting.id}" placeholder="">
                    </div>
                `;
                } else {
                    html += `
                    <div class="vcsblockset">
                        <div class="vcsfield vcscheck">
                            <label for="${subSetting.id}">${subSetting.label}</label>
                            <div class="vcswrapper">
                                <input type="checkbox" id="${subSetting.id}" class="vcstoggle">
                                <label for="${subSetting.id}"></label>
                            </div>
                        </div>
                    </div>
                `;
                }
            });

            html += `
                        </div>
                    </details>
                </div>
                <div id="vcscustom-footer">Script By <a class="vcslinks" href="https://social.venge.io/#Captain_Cool"
                        target="_blank" rel="noopener noreferrer">Captain_Cool</a> and <a class="vcslinks"
                        href="https://social.venge.io/#shady" target="_blank" rel="noopener noreferrer">shady</a></div>
            </div>
        `;
        });

        return html;
    }


    // Generate HTML and append it to the document
    const customSettingsHTML = generateCustomSettingsHTML(scriptData);
    document.getElementById('vcscustomuserscripts').innerHTML += customSettingsHTML;
}

function saveSettings() {
    const allSettings = {};

    additionalSettingsData.forEach(setting => {
        const subSettingsObj = {};

        setting.subSettings.forEach(subSetting => {
            subSettingsObj[subSetting.id] = document.getElementById(subSetting.id).value;
        });

        allSettings[setting.id] = subSettingsObj;
    });

    localStorage.setItem('allSettings', JSON.stringify(allSettings));
}

const initValues = () => {
    clientData.forEach(setting => {
        const elem = document.getElementById(setting.id);
        elem.checked = userPrefs.get(setting.id)

        elem.onclick = () => {
            userPrefs.set(setting.id, elem.checked)
        }
    })
}

module.exports = { initClientSettings, initUserscripts }