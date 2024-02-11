const { app } = require('electron');
const Store = require('electron-store');
const userPrefs = new Store();

class launchArgs {
    static pushArguments() {
        app.commandLine.appendSwitch('in-process-gpu');

        //Remove Useless
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

        //Helpful Flags
        app.commandLine.appendSwitch('enable-javascript-harmony');
        app.commandLine.appendSwitch('enable-future-v8-vm-features');
        app.commandLine.appendSwitch('enable-webgl');
        app.commandLine.appendSwitch('enable-webgl2-compute-context');
        app.commandLine.appendSwitch('disable-background-timer-throttling');
        app.commandLine.appendSwitch('disable-renderer-backgrounding');
        app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
        app.commandLine.appendSwitch('disable-renderer-backgrounding')
        app.commandLine.appendSwitch('disable-background-timer-throttling')
        app.commandLine.appendSwitch('disable-notifications')

        //Limit Increase
        app.commandLine.appendSwitch('renderer-process-limit', '100');
        app.commandLine.appendSwitch('max-active-webgl-contexts', '100');
        app.commandLine.appendSwitch('webrtc-max-cpu-consumption-percentage', '100');
        app.commandLine.appendSwitch('ignore-gpu-blacklist');

        // GPU Ras
        app.commandLine.appendSwitch('enable-gpu-rasterization');
        app.commandLine.appendSwitch('enable-oop-rasterization');
        app.commandLine.appendSwitch('disable-zero-copy');

        if (userPrefs.get('lowlatency')) {
            app.commandLine.appendSwitch('enable-highres-timer');
            app.commandLine.appendSwitch('enable-quic');
            app.commandLine.appendSwitch('enable-accelerated-2d-canvas');
        }
        if (userPrefs.get('experimentalflags')) {
            app.commandLine.appendSwitch('disable-low-end-device-mode');
            app.commandLine.appendSwitch('enable-accelerated-video-decode');
            app.commandLine.appendSwitch('enable-native-gpu-memory-buffers');
            app.commandLine.appendSwitch('high-dpi-support', '1');
            app.commandLine.appendSwitch('ignore-gpu-blacklist');
            app.commandLine.appendSwitch('no-pings');
            app.commandLine.appendSwitch('no-proxy-server');
        }

        if (userPrefs.get("disableFrameRateLimit")) {
            app.commandLine.appendSwitch('disable-frame-rate-limit');
            app.commandLine.appendSwitch('disable-gpu-vsync');
            app.commandLine.appendSwitch('max-gum-fps', '9999');
        }
    }
}
module.exports = launchArgs