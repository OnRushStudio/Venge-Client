const { app } = require('electron');

class launchArgs {
    static pushArguments(){
        if(true) {
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
        if(true) {
            app.commandLine.appendSwitch('enable-javascript-harmony');
            app.commandLine.appendSwitch('enable-future-v8-vm-features');
            app.commandLine.appendSwitch('enable-webgl');
            app.commandLine.appendSwitch('enable-webgl2-compute-context');
            app.commandLine.appendSwitch('disable-background-timer-throttling');
            app.commandLine.appendSwitch('disable-renderer-backgrounding');
            app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
        }
        if(true) {
            app.commandLine.appendSwitch('renderer-process-limit', '100');
            app.commandLine.appendSwitch('max-active-webgl-contexts', '100');
            app.commandLine.appendSwitch('webrtc-max-cpu-consumption-percentage', '100');
            app.commandLine.appendSwitch('ignore-gpu-blacklist');
        }
    
        // if(userPrefs.get("clientSettings.uncapFps")) {
        //     app.commandLine.appendSwitch('disable-frame-rate-limit');
        //     app.commandLine.appendSwitch('disable-gpu-vsync');
        //     app.commandLine.appendSwitch('max-gum-fps', '9999');
        // }
        if (true) {
            app.commandLine.appendSwitch('in-process-gpu');
        }
    }
}
module.exports = launchArgs