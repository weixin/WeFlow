'use strict';

const electron = require('electron');
const app = electron.app;
const dialog = electron.dialog;
const ipc = electron.ipcMain;
const BrowserWindow = electron.BrowserWindow;
const path = require('path');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;
let logo = path.join(__dirname, 'assets/img/WeFlow.png');

let willClose = false;

function createWindow() {
    // Create the browser window.
    mainWindow = new BrowserWindow({
        width: 360,
        height: 572,
        resizable: false,
        title: 'WeFlow',
        icon: logo,
				frame: false
    });

    // and load the index.html of the app.
    mainWindow.loadURL('file://' + __dirname + '/app.html');

    // Open the DevTools.
    // mainWindow.webContents.openDevTools();

    mainWindow.on('close', function (event) {
        if (process.platform !== 'win32' && !willClose) {
            app.hide();
            event.preventDefault();
        }
    });

    // Emitted when the window is closed.
    mainWindow.on('closed', function () {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null;
    });

}


// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', function () {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('before-quit', function () {
    willClose = true;
});


app.on('activate', function () {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        createWindow();
    }

    app.show();
});

/*注册事件*/
ipc.on('mini', function (event) {
	mainWindow.minimize();
});

ipc.on('close', function (event) {
	app.quit();
});
//检查更新
ipc.on('checkForUpdate', function (event, status) {
    let options = {};

    if(status){
        options = {
            type: 'info',
            title: '检查更新...',
            message: "当前已有新版本, 请更新",
            buttons: ['点击下载最新版本', '稍后提醒我']
        }
    }else{
        options = {
            type: 'info',
            title: '检查更新...',
            message: "当前为最新版本, 不需要更新",
            buttons: ['确定']
        }
    }

    dialog.showMessageBox(options, function (index) {
        event.sender.send('checkForUpdateReply', index, status);
    });
});
