const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const { exec, spwan, fork } = require('child_process')
const url   = require('url')
const path  = require('path')
const fs    = require('fs')
const _     = require('lodash')
const db    = require('./modules/database')
const util  = require('./modules/util')
const worker = require('./modules/worker')

const CONFIG_PATH = 'config.json';
const SITE_PATH   = 'sites.json';
const DEBUG       = false;

const osType = require('os').type()
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

function saveSites(content, sites) {
	_.each(content.split('\n'), (line) => {
		if (!line) return;
		var site = {}
		site.type = 'rss';
		site.cycle= 300;
		site.url = line;
		site.title = line;
		sites.push(site);
	});
	sites = _.uniqBy(sites, 'url')
	fs.writeFileSync(SITE_PATH, JSON.stringify(sites, undefined, 2))
	return sites;
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
			sites = saveSites(content, sites)
			event.sender.send('import-site', sites)
		});
	});
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
		fs.writeFileSync(CONFIG_PATH, JSON.stringify(data.config, undefined, 2));
	} else if (data.action == 'load') {
		var config = {}
		var content = fs.readFileSync(CONFIG_PATH);
		if (util.isValidJson(content)) config = JSON.parse(content);
		event.sender.send('config-loaded', config)
	} else if (data.action == 'sites') {
		var content = fs.readFileSync(SITE_PATH)
		if (util.isValidJson(content)) sites = JSON.parse(content)
		event.sender.send('import-site', sites)
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
				console.log(e)
				event.sender.send('app-state-change', false)
				return;
			}
			event.sender.send('app-state-change', true)
			break;
		case 'stop':
			try {
				db.disconnect()
			} catch(e) {
				console.log(e)
				event.sender.send('app-state-change', false)
				return;
			}
			event.sender.send('app-state-change', true)
			break;
		case 'quit':
			app.quit()
			break;
		default:
			console.log('unknown action!')
	}
})
