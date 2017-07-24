const {app, BrowserWindow, ipcMain, dialog} = require('electron')
const url   = require('url')
const path  = require('path')
const fs    = require('fs')
const _     = require('lodash')
const { exec, spwan, fork } = require('child_process')
const CONFIG_PATH = 'config.json';
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

// 导入站点
ipcMain.on('import-site', (event, data) => {
	dialog.showOpenDialog({
		properties: ['openFile'],
		filters: [
			{ name: 'Images', extensions: ['jpg', 'png', 'gif'] },
			{ name: 'Movies', extensions: ['mkv', 'avi', 'mp4'] },
			{ name: 'Custom File Type', extensions: ['as'] },
			{ name: 'All Files', extensions: ['*'] }
		]
	}, (files) => {
		_.each(files, (file) => {
			var content = fs.readFileSync(file).toString()
			isValidJson(content) && (content = JSON.parse(content))
			event.sender.send('import-site', content)
		});
	});
})

// 关键词处理配置
ipcMain.on('word-config', (event, data) => {
	var file = data.type + '.txt';
	if (!fs.existsSync(file)) fs.writeFileSync(file, '');
	var cmd = 'notepad.exe ' + file;
	exec(cmd, (err, stdout, stderr) => {
	  if (err) return;
	});
})

// 配置变更
ipcMain.on('config', (event, data) => {
	if (data.action == 'save') {
		fs.writeFileSync(CONFIG_PATH, JSON.stringify(data.config));
	} else if (data.action == 'load') {
		var content = fs.readFileSync(CONFIG_PATH);
		var config = {}
		if (isValidJson(content)) config = JSON.parse(content);
		event.sender.send('config-loaded', config)
	}
})

// 进程状态检查
ipcMain.on('check-process', (event, data) => {

})

/** 工具类函数 **/
function isValidJson(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}
