const { app, Menu, BrowserWindow, dialog, session } = require('electron')
const Store = require('electron-store')
const path = require('path')
const url = require('url')

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

function createMainWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    show: true,
    width: 1280,
    height: 960,
    title: 'Agate Desktop',
    webPreferences: {
      nodeIntegration: false,
      preload: path.resolve(__dirname, 'content_script.js')
    }
  })

  createMenu(mainWindow)
  loadMainWindow()

  mainWindow.webContents.on('did-fail-load', () => {
    dialog.showMessageBox({
      type: 'warning',
      title: 'Oups !',
      message: "La page ne s'est pas chargée correctement. Le code unité est-il valide ?",
      buttons: ['Vérifier mes paramètres', 'Fermer']
    }, (index) => {
      if (index === 0) {
        createSettingsWindow()
      }
    })
  });

  // Emitted when the window is closed.
  mainWindow.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  })
}

exports.loadMainWindow = loadMainWindow

function loadMainWindow () {
  mainWindow.focus()

  const store = new Store()
  const unitCode = store.get('unitCode')
  const userId = store.get('userId')
  const recapOnStart = !!store.get('recapOnStart')

  if (!unitCode) {
    return dialog.showMessageBox({
      type: 'info',
      title: 'Code unité requis',
      message: "Aucun code unité n'est encore configuré. Avant de commencer, veuillez renseigner votre code unité dans les paramètres.",
      buttons: ['Ouvrir les paramètres', 'Fermer']
    }, (index) => {
      if (index === 0) {
        createSettingsWindow()
      }
    })
  }

  const targetUrl = {
    protocol: 'https',
    hostname: `${unitCode}.agateb.cnrs.fr`,
    pathname: '/index.php',
    query: {
      controller: 'Pointage/Calendar',
      action: 'show',
      user_id: userId
    }
  }

  if (recapOnStart) {
    const now = new Date()
    const year = now.getFullYear()
    let month = now.getMonth() + 1
    const lastDay = new Date(year, month, 0).getDate()

    if (month < 10) { month = `0${month}` }

    targetUrl.query = {
      controller: 'Pointage/Feuille',
      action: 'showTempsTheorique',
      date_debut:`${year}-${month}-01`,
      date_fin: `${year}-${month}-${lastDay}`,
      user_id: userId
    }
  }

  mainWindow.loadURL(url.format(targetUrl))
}

function createSettingsWindow () {
  const settingsWindow = new BrowserWindow({
    modal: true,
    show: false,
    frame: false,
    width: 530,
    height: 400,
    parent: mainWindow
  })

  settingsWindow.once('ready-to-show', () => {
    settingsWindow.show()
  })

  settingsWindow.on('close', loadMainWindow)

  settingsWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'settings.html'),
    protocol: 'file:',
    slashes: true
  }))
}

function createMenu (mainWindow) {
  const menu = Menu.buildFromTemplate([
    {
      label: 'Application',
      submenu: [
        {
          label: 'Se déconnecter',
          accelerator: 'Ctrl+D',
          click () {
            clearCasData(err => {
              if (err) { console.error(err) }
              loadMainWindow()
            })
          }
        },
        {
          label: 'Paramètres',
          accelerator: 'Ctrl+,',
          click () { createSettingsWindow() }
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
        { role: 'toggledevtools', label: 'Activer les outils de développement' }
      ]
    }
  ])

  Menu.setApplicationMenu(menu)
}

/**
 * Clear CAS storage data, resulting in a disconnection
 */
function clearCasData (callback) {
  if (mainWindow) {
    mainWindow.webContents.session.clearStorageData(callback)
  }
}

/**
 * Change expiration date of CAS cookies
 * That way we can keep the session alive accross app restarts
 */
function persistCasCookies (callback) {
  if (!mainWindow) { return callback() }

  const sessionCookies = mainWindow.webContents.session.cookies
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


