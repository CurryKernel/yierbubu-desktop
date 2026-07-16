const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  closeApp: () => ipcRenderer.invoke('close-app'),
  openSettings: () => ipcRenderer.invoke('open-settings'),
  toggleSecondPet: (enable) => ipcRenderer.invoke('toggle-second-pet', enable),
  getSecondPetStatus: () => ipcRenderer.invoke('get-second-pet-status'),
  moveWindow: (dx, dy) => ipcRenderer.invoke('move-window', dx, dy),
  getWindowPosition: () => ipcRenderer.invoke('get-window-position'),
});
