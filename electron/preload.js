const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("tempoDesktop", {
  platform: process.platform,
  setWindowMode: (mode) => ipcRenderer.invoke("tempo:set-window-mode", mode),
  openExternal: (url) => ipcRenderer.invoke("tempo:open-external", url),
  spotifyLogin: (clientId) => ipcRenderer.invoke("tempo:spotify-login", clientId),
  spotifyCurrentPlayback: () => ipcRenderer.invoke("tempo:spotify-current-playback"),
  onNativeMode: (callback) => {
    ipcRenderer.on("tempo:native-mode", (_event, mode) => callback(mode));
  }
});
