const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("tempoDesktop", {
  platform: process.platform,
  setWindowMode: (mode) => ipcRenderer.invoke("tempo:set-window-mode", mode),
  openExternal: (url) => ipcRenderer.invoke("tempo:open-external", url),
  spotifyLogin: (clientId) => ipcRenderer.invoke("tempo:spotify-login", clientId),
  spotifyAccessToken: () => ipcRenderer.invoke("tempo:spotify-access-token"),
  spotifyCommand: (command) => ipcRenderer.invoke("tempo:spotify-command", command),
  spotifyCurrentPlayback: () => ipcRenderer.invoke("tempo:spotify-current-playback"),
  spotifyPlaylists: () => ipcRenderer.invoke("tempo:spotify-playlists"),
  onNativeMode: (callback) => {
    ipcRenderer.on("tempo:native-mode", (_event, mode) => callback(mode));
  }
});
