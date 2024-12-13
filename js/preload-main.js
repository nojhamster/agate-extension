const { contextBridge, ipcRenderer } = require('electron');
const url = require('url');

contextBridge.exposeInMainWorld(
  'store', {
    get (...params) { return ipcRenderer.invoke('store-get', ...params) },
    set (...params) { return ipcRenderer.invoke('store-set', ...params); },
  }
);

contextBridge.exposeInMainWorld(
  'utils', {
    formatUrl(opts) { return url.format(opts); },
    onMenuNavigation(fn) {
      ipcRenderer.on('loadPage', (evt, page) => { fn(page); })
    },
    onGoBack(fn) {
      ipcRenderer.on('goBack', () => { fn(); })
    },
    onGoForward(fn) {
      ipcRenderer.on('goForward', () => { fn(); })
    },
  }
)

contextBridge.exposeInMainWorld(
  'app', {
    async getName () { return ipcRenderer.invoke('get-app-name'); },
    async getVersion () { return ipcRenderer.invoke('get-app-version'); },
    getElectronVersion () { return process.versions.electron; },
    getChromeVersion () { return process.versions.chrome; },
    getNodeVersion () { return process.versions.node; },
    getV8Version () { return process.versions.v8; },
    loadAgate () { ipcRenderer.invoke('load-agate'); }
  }
);
