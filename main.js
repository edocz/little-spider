const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const { exec, spwan, fork } = require('child_process')
const url    = require('url')
const path   = require('path')
const fs     = require('fs')
const _      = require('lodash')
const db     = require('./modules/database')
const util   = require('./modules/util')
const worker = require('./modules/worker')
const osType = require('os').type()

const DEBUG  = false;

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win
let debugWin
let sites = []

function createWindow () {
  // Create the browser window.
  win = new BrowserWindow({width: 800, height: 750})

  // and load the index.html of the app.
  win.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }))

  // Open the DevTools.
  if (DEBUG) win.webContents.openDevTools()

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
    debugWin = null
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

// 调试模式
ipcMain.on('site-debug', (event, data) => {
	createDebugWindow(data.url);
})

// 添加站点
ipcMain.on('add-site', (event, data) => {
	if (data) sites = util.saveSites(data, util.loadSites())
})

// 导入站点
ipcMain.on('import-site', (event, data) => {
	dialog.showOpenDialog({
		properties: ['openFile'],
		filters: [
			{ name: 'Images', extensions: ['json'] },
			{ name: 'All Files', extensions: ['*'] }
		]
	}, (files) => {
		_.each(files, (file) => {
			var content = fs.readFileSync(file).toString()
			sites = util.saveSites(content, sites)
			event.sender.send('import-site', sites)
		});
	});
})

// 删除站点
ipcMain.on('delete-site', (event, data) => {
	var newSites = _.differenceBy(util.loadSites(), data.urls, 'url')
	util.saveSites('', newSites)
})

// 关键词处理配置
ipcMain.on('word-config', (event, data) => {
	var cmd = 'notepad ';
	if (osType == 'Darwin') cmd = 'open ';
	var file = data.type + '.txt';
	if (!fs.existsSync(file)) fs.writeFileSync(file, '');
	cmd = cmd + file;
	exec(cmd, (err, stdout, stderr) => {
	  if (err) return;
	});
})

// 配置变更
ipcMain.on('config', (event, data) => {
	if (data.action == 'save') {
		util.saveConfig(data.config);
	} else if (data.action == 'load') {
		event.sender.send('config-loaded', util.loadConfig())
	} else if (data.action == 'sites') {
		event.sender.send('import-site', util.loadSites())
	}
})

// 程序运行状态切换
ipcMain.on('app', (event, data) => {
	switch(data.action) {
		case 'start':
			try {
				db.connect(data.config)
				worker.run(db, event)
			} catch(e) {
				event.sender.send('error', e.message)
				event.sender.send('app-state-change', false)
				return;
			}
			event.sender.send('app-state-change', true)
			break;
		case 'stop':
			try {
				db.disconnect()
			} catch(e) {
				event.sender.send('error', e.message)
				event.sender.send('app-state-change', false)
				return;
			}
			event.sender.send('app-state-change', true)
			break;
		case 'quit':
			app.quit()
			break;
		default:
			event.sender.send('error', 'unknown action!')
	}
})
