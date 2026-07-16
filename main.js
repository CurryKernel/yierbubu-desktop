const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');

let mainWindow = null;
let secondWindow = null;
let settingsWindow = null;

const PET_WINDOW_CONFIG = {
  width: 250,
  height: 300,
  transparent: true,
  alwaysOnTop: true,
  frame: false,
  resizable: false,
  skipTaskbar: true,
  hasShadow: false,
  type: 'toolwindow',
  webPreferences: {
    preload: path.join(__dirname, 'preload.js'),
    contextIsolation: true,
    nodeIntegration: false,
  },
};

function createPetWindow(config = {}) {
  const mergedConfig = { ...PET_WINDOW_CONFIG, ...config };
  const win = new BrowserWindow(mergedConfig);

  win.loadFile('index.html');

  const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize;
  const x = config.x || screenWidth - 300;
  const y = config.y || screenHeight - 400;
  win.setPosition(x, y);

  win.setAlwaysOnTop(true, 'screen-saver');

  win.on('closed', () => {
    if (win === mainWindow) mainWindow = null;
    if (win === secondWindow) secondWindow = null;
  });

  return win;
}

function setupIPC() {
  // 退出应用
  ipcMain.handle('close-app', () => {
    app.quit();
  });

  // 打开设置窗口
  ipcMain.handle('open-settings', () => {
    if (settingsWindow) {
      settingsWindow.focus();
      return;
    }
    settingsWindow = new BrowserWindow({
      width: 420,
      height: 520,
      resizable: false,
      title: '一二布布 - 设置',
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        contextIsolation: true,
        nodeIntegration: false,
      },
    });
    settingsWindow.loadFile('settings.html');
    settingsWindow.on('closed', () => { settingsWindow = null; });
  });

  // 双宠模式切换
  ipcMain.handle('toggle-second-pet', (event, enable) => {
    if (enable && !secondWindow) {
      secondWindow = createPetWindow({
        x: screen.getPrimaryDisplay().workAreaSize.width - 550,
        y: screen.getPrimaryDisplay().workAreaSize.height - 400,
      });
      return true;
    } else if (!enable && secondWindow) {
      secondWindow.close();
      secondWindow = null;
      return false;
    }
    return !!secondWindow;
  });

  // 获取第二只宠物状态
  ipcMain.handle('get-second-pet-status', () => {
    return !!secondWindow;
  });

  // 拖动窗口
  ipcMain.handle('move-window', (event, dx, dy) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) {
      const [x, y] = win.getPosition();
      win.setPosition(x + dx, y + dy);
    }
  });

  // 获取窗口位置
  ipcMain.handle('get-window-position', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) {
      const [x, y] = win.getPosition();
      return { x, y };
    }
    return { x: 0, y: 0 };
  });
}

app.whenReady().then(() => {
  setupIPC();
  mainWindow = createPetWindow();
});

app.on('window-all-closed', () => {
  app.quit();
});

app.on('activate', () => {
  if (!mainWindow) {
    mainWindow = createPetWindow();
  }
});
