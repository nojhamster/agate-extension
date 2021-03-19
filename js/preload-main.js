const { contextBridge, ipcRenderer } = require('electron');
const url = require('url');
const Store = require('electron-store');
const store = new Store();

contextBridge.exposeInMainWorld(
  'store', {
    get (name) { return store.get(name); },
    set (name, value) { return store.set(name, value); },
  }
);

contextBridge.exposeInMainWorld(
  'utils', {
    formatUrl(opts) { return url.format(opts); }
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
