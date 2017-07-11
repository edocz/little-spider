const {app, BrowserWindow, ipcMain, dialog} = require('electron')
const url   = require('url')
const path  = require('path')
const fs    = require('fs')
const spwan = require('child_process').spawn
const fork  = require('child_process').fork

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win
let debugWin

function createWindow () {
  // Create the browser window.
  win = new BrowserWindow({width: 800, height: 600})

  // and load the index.html of the app.
  win.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }))

  // Open the DevTools.
  win.webContents.openDevTools()

  win.on('closed', () => {
    win = null
  })
}

function createDebugWindow(url) {
	// Create the browser window.
  debugWin = new BrowserWindow({width: 1366, height: 768})

  // and load the index.html of the app.
  debugWin.loadURL(url)

  // Open the DevTools.
  debugWin.webContents.openDevTools()

  debugWin.on('closed', () => {
    win = null
  })
}

app.on('ready', createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (win === null) {
    createWindow()
  }
})

// 读取配置
function loadConfig(configPath) {
	return config;
}

// 授权检查
ipcMain.on('site-debug', (event, data) => {
	createDebugWindow(data.url);
})

ipcMain.on('import-site', (event, data) => {
	dialog.showOpenDialog({
		properties: ['openFile'],
		filters: [
			{ name: 'Images', extensions: ['jpg', 'png', 'gif'] },
			{ name: 'Movies', extensions: ['mkv', 'avi', 'mp4'] },
			{ name: 'Custom File Type', extensions: ['as'] },
			{ name: 'All Files', extensions: ['*'] }
		]
	});
})

// 配置变更
ipcMain.on('config-change', (event, data) => {

})

// 进程状态检查
ipcMain.on('check-process', (event, data) => {

})
