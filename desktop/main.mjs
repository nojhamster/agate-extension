import {
  app,
  Menu,
  BrowserWindow,
  session,
  shell,
  ipcMain,
} from 'electron'
import path from 'path';
import Store from 'electron-store';
import windowStateKeeper from 'electron-window-state';

const store = new Store()

let extensionPath = path.resolve(import.meta.dirname, '../extension');

if (process.env.EXTENSION_PATH) {
  extensionPath = path.resolve(process.env.EXTENSION_PATH);
}

console.log('extensionPath', extensionPath);

// Workaround to avoid errors when loading over HTTPS
app.commandLine.appendSwitch('ignore-certificate-errors')

ipcMain.handle('store-get', (_event, ...params) => store.get(...params))
ipcMain.handle('store-set', (_event, ...params) => store.set(...params))
ipcMain.handle('get-app-name', () => app.getName())
ipcMain.handle('get-app-version', () => app.getVersion())

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

function createMainWindow () {
  const mainWindowState = windowStateKeeper({
    defaultWidth: 1000,
    defaultHeight: 800
  })

  // Create the browser window.
  mainWindow = new BrowserWindow({
    show: true,
    x: mainWindowState.x,
    y: mainWindowState.y,
    width: mainWindowState.width,
    height: mainWindowState.height,
    title: 'Agate',
    webPreferences: {
      contextIsolation: true,
      sandbox: false,
      enableRemoteModule: false,
      webviewTag: true,
      preload: path.resolve(import.meta.dirname, 'js/preload-main.js'),
    }
  })

  mainWindowState.manage(mainWindow);

  loadView('index');

  // Emitted when the window is closed.
  mainWindow.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  })
}

function loadView (name) {
  mainWindow.loadFile(`views/${name}.html`)
}

function createMenu () {
  const menu = Menu.buildFromTemplate([
    {
      label: 'Application',
      submenu: [
        {
          label: 'Accueil',
          accelerator: 'Ctrl+H',
          click () { loadView('index') }
        },
        {
          label: 'Se déconnecter',
          accelerator: 'Ctrl+D',
          click () {
            clearCasData()
              .then(() => { loadView('index') })
              .catch((err) => { console.error(err) })
          }
        },
        {
          label: 'Paramètres',
          accelerator: 'Ctrl+,',
          click () { loadView('settings') }
        },
        { type: 'separator' },
        { role: 'quit', label: 'Quitter' }
      ]
    },
    {
      label: 'Navigation',
      submenu: [
        {
          label: 'Précédent',
          accelerator: 'Alt+Left',
          click () { mainWindow.webContents.send('goBack') }
        },
        {
          label: 'Suivant',
          accelerator: 'Alt+Right',
          click () { mainWindow.webContents.send('goForward') }
        },
        { type: 'separator' },
        {
          label: 'Feuille mensuelle',
          accelerator: 'Ctrl+U',
          click () { mainWindow.webContents.send('loadPage', 'timesheet-month') }
        },
        {
          label: 'Solde congés',
          accelerator: 'Ctrl+I',
          click () { mainWindow.webContents.send('loadPage', 'leave-balance') }
        },
        {
          label: 'Calendrier congés',
          accelerator: 'Ctrl+O',
          click () { mainWindow.webContents.send('loadPage', 'leave-balance') }
        },
        {
          label: 'Planning',
          accelerator: 'Ctrl+P',
          click () { mainWindow.webContents.send('loadPage', 'planning') }
        },
      ]
    },
    {
      label: 'Affichage',
      submenu: [
        { role: 'reload', label: 'Actualiser' },
        { role: 'resetzoom', label: 'Réinitialiser le zoom' },
        { role: 'zoomin', label: 'Zoom avant' },
        { role: 'zoomout', label: 'Zoom arrière' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'Plein écran' }
      ]
    },
    {
      label: 'Fenêtre',
      submenu: [
        { role: 'minimize', label: 'Minimiser' }
      ]
    },
    {
      label: 'Aide',
      submenu: [
        {
          label: 'À propos',
          click () { createAboutWindow() }
        },
        {
          label: 'Signaler un problème',
          click () { shell.openExternal('https://github.com/nojhamster/agate-extension/issues') }
        },
        { role: 'toggledevtools', label: 'Activer les outils de développement' }
      ]
    }
  ])

  Menu.setApplicationMenu(menu)
}

/**
 * Clear CAS cookies, resulting in a disconnection
 */
function clearCasData () {
  if (mainWindow) {
    return session.fromPartition('persist:agate').clearStorageData({ storages: ['cookies'] })
  }
}

async function loadExtension () {
  try {
    await session.fromPartition('persist:agate').loadExtension(extensionPath)
  } catch (e) {
    console.error(`Failed to load extension: ${e}`)
  }
}

function createAboutWindow () {
  const bounds = mainWindow.getBounds()
  const width = 400
  const height = 300

  const aboutWindow = new BrowserWindow({
    modal: true,
    show: false,
    x: Math.round(bounds.x + bounds.width / 2 - width / 2),
    y: Math.round(bounds.y + bounds.height / 2 - height / 2),
    width,
    height,
    parent: mainWindow,
    webPreferences: {
      preload: path.resolve(import.meta.dirname, 'js/preload-main.js'),
    }
  })

  aboutWindow.once('ready-to-show', () => {
    aboutWindow.show()
  })

  aboutWindow.setMenu(null)
  aboutWindow.loadFile('views/about.html')
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
  await loadExtension()
  createMenu()
  createMainWindow()
})

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createMainWindow()
  }
})


