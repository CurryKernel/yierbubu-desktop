// 修复: 如果环境变量中 ELECTRON_RUN_AS_NODE=1，清除它
// 这解决了从某些shell环境启动时的兼容性问题
if (process.env.ELECTRON_RUN_AS_NODE === '1') {
  delete process.env.ELECTRON_RUN_AS_NODE;
}

// 确保 electron 内置模块正确加载
let app, BrowserWindow, ipcMain, screen;
try {
  const electron = require('electron');
  // electron 可能是内置API对象，也可能是npm包的字符串路径
  if (typeof electron === 'string') {
    // npm包路径 — 使用备用加载方式
    const Module = require('module');
    const builtinElectron = Module._load('electron', null, true);
    app = builtinElectron.app;
    BrowserWindow = builtinElectron.BrowserWindow;
    ipcMain = builtinElectron.ipcMain;
    screen = builtinElectron.screen;
  } else {
    app = electron.app;
    BrowserWindow = electron.BrowserWindow;
    ipcMain = electron.ipcMain;
    screen = electron.screen;
  }
} catch (e) {
  // 最后的备用方案
  const electron = require('electron');
  ({ app, BrowserWindow, ipcMain, screen } = electron);
}

const path = require('path');

let mainWindow = null;
let secondWindow = null;
let settingsWindow = null;

const PET_WINDOW_CONFIG = {
  width: 200,
  height: 220,
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
  ipcMain.handle('close-app', () => {
    app.quit();
  });

  ipcMain.handle('open-settings', () => {
    if (settingsWindow && !settingsWindow.isDestroyed()) {
      settingsWindow.focus();
      return;
    }
    settingsWindow = new BrowserWindow({
      width: 480,
      height: 680,
      resizable: true,
      title: '一二布布 - 设置',
      alwaysOnTop: false,
      parent: undefined,
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        contextIsolation: true,
        nodeIntegration: false,
      },
    });
    settingsWindow.loadFile('settings.html');
    settingsWindow.on('closed', () => { settingsWindow = null; });
  });

  ipcMain.handle('close-settings', () => {
    if (settingsWindow && !settingsWindow.isDestroyed()) {
      settingsWindow.close();
      settingsWindow = null;
    }
  });

  ipcMain.handle('toggle-second-pet', (event, enable) => {
    if (enable && !secondWindow) {
      secondWindow = createPetWindow({
        x: screen.getPrimaryDisplay().workAreaSize.width - 520,
        y: screen.getPrimaryDisplay().workAreaSize.height - 400,
      });
      // 第二只宠物用不同角色，通过URL参数传递
      return true;
    } else if (!enable && secondWindow) {
      secondWindow.close();
      secondWindow = null;
      return false;
    }
    return !!secondWindow;
  });

  ipcMain.handle('get-second-pet-status', () => {
    return !!secondWindow;
  });

  ipcMain.handle('move-window', (event, dx, dy) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) {
      const [x, y] = win.getPosition();
      win.setPosition(x + dx, y + dy);
    }
  });

  ipcMain.handle('get-window-position', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) {
      const [x, y] = win.getPosition();
      return { x, y };
    }
    return { x: 0, y: 0 };
  });

  // 双宠对话交互
  ipcMain.handle('pet-speak', (event, text) => {
    // 广播给另一只宠物
    const win = BrowserWindow.fromWebContents(event.sender);
    const other = (win === mainWindow) ? secondWindow : mainWindow;
    if (other && !other.isDestroyed()) {
      other.webContents.send('partner-speak', text);
    }
  });
}

// ===== 自动更新 =====
const { autoUpdater } = require('electron-updater');
autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;

function checkForUpdates() {
  autoUpdater.checkForUpdatesAndNotify().catch(() => {
    // 静默失败，不影响使用
  });
}

autoUpdater.on('update-available', () => {
  // 有更新可用，通知用户
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.executeJavaScript(`
      if (typeof BubbleSystem !== 'undefined') {
        BubbleSystem.show('🔔 发现新版本！正在后台下载...', 5000);
      }
    `);
  }
});

autoUpdater.on('update-downloaded', () => {
  // 下载完成，通知用户重启
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.executeJavaScript(`
      if (typeof BubbleSystem !== 'undefined') {
        BubbleSystem.show('✅ 新版本已下载！重启后生效~', 6000);
      }
    `);
  }
});

app.whenReady().then(() => {
  setupIPC();
  mainWindow = createPetWindow();
  // 启动后 5 秒检查更新
  setTimeout(checkForUpdates, 5000);
  // 每 6 小时检查一次
  setInterval(checkForUpdates, 6 * 60 * 60 * 1000);
});

app.on('window-all-closed', () => {
  app.quit();
});

app.on('activate', () => {
  if (!mainWindow) {
    mainWindow = createPetWindow();
  }
});
