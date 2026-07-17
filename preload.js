const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  closeApp: () => ipcRenderer.invoke('close-app'),
  openSettings: () => ipcRenderer.invoke('open-settings'),
  closeSettings: () => ipcRenderer.invoke('close-settings'),
  showContextMenu: (settings) => ipcRenderer.invoke('show-context-menu', settings),
  onMenuAction: (callback) => {
    ipcRenderer.on('menu-action', (event, action) => callback(action));
    return () => ipcRenderer.removeAllListeners('menu-action');
  },
  toggleSecondPet: (enable) => ipcRenderer.invoke('toggle-second-pet', enable),
  getSecondPetStatus: () => ipcRenderer.invoke('get-second-pet-status'),
  moveWindow: (dx, dy) => ipcRenderer.invoke('move-window', dx, dy),
  getWindowPosition: () => ipcRenderer.invoke('get-window-position'),
  petSpeak: (text) => ipcRenderer.invoke('pet-speak', text),
  onPartnerSpeak: (callback) => {
    ipcRenderer.on('partner-speak', (event, text) => callback(text));
    return () => ipcRenderer.removeAllListeners('partner-speak');
  },
});
