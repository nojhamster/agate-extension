const { app, Menu, BrowserWindow, session, shell } = require('electron')
const Store = require('electron-store')
const store = new Store()

// Workaround to avoid errors when loading over HTTPS
app.commandLine.appendSwitch('ignore-certificate-errors')

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

function createMainWindow () {
  const windowState = store.get('windowState') || {}
  const startPage   = store.get('startPage')

  // Create the browser window.
  mainWindow = new BrowserWindow({
    show: true,
    x: windowState.x,
    y: windowState.y,
    width: windowState.width || 1024,
    height: windowState.height || 768,
    maximized: !!windowState.maximized,
    title: 'Agate'
  })

  createMenu(mainWindow)

  switch (startPage) {
    case 'agate':
      loadView('agate')
      break;
    case 'agate-badge':
    case 'recap':
      loadView('agate-badge')
      break;
    default:
      loadView('index')
  }

  mainWindow.on('close', saveWindowState);

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

function createMenu (mainWindow) {
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
            clearCasData(err => {
              if (err) { console.error(err) }
              loadView('index')
            })
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
 * Save window position, size and maximized state
 */
function saveWindowState () {
  if (mainWindow) {
    const bounds = mainWindow.getBounds()
    const maximized = mainWindow.isMaximized()
    store.set('windowState', { ...bounds, maximized })
  }
}

/**
 * Clear CAS cookies, resulting in a disconnection
 */
function clearCasData (callback) {
  if (mainWindow) {
    session.fromPartition('persist:agate').clearStorageData({ storages: ['cookies'] }, callback)
  }
}

/**
 * Change expiration date of CAS cookies
 * That way we can keep the session alive accross app restarts
 */
function persistCasCookies (callback) {
  if (!mainWindow) { return callback() }

  const sessionCookies = session.fromPartition('persist:agate').cookies
  const casUrl = 'https://cas.cnrs.fr/cas/'

  sessionCookies.get({ url: casUrl }, (error, cookies) => {
    if (error) { return callback(error) }

    (function nextCookie() {
      const cookie = cookies.pop()
      if (!cookie) {
        // Writes any unwritten cookies before leaving
        return sessionCookies.flushStore(callback)
      }

      cookie.expirationDate = parseInt(Date.now() / 1000) + (60 * 24 * 30)
      cookie.url = casUrl
      delete cookie.session

      sessionCookies.set(cookie, (error) => {
        if (error) { console.error(error) }
        nextCookie()
      })
    })()
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createMainWindow)

let cookiesPersisted = false

app.on('before-quit', event => {
  if (cookiesPersisted) { return }

  cookiesPersisted = true
  event.preventDefault()

  persistCasCookies(err => {
    if (err) { console.error(err) }
    app.quit()
  })
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


