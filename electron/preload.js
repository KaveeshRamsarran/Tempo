const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("tempoDesktop", {
  platform: process.platform,
  setWindowMode: (mode) => ipcRenderer.invoke("tempo:set-window-mode", mode),
  openExternal: (url) => ipcRenderer.invoke("tempo:open-external", url),
  spotifyLogin: (clientId) => ipcRenderer.invoke("tempo:spotify-login", clientId),
  spotifyAccessToken: () => ipcRenderer.invoke("tempo:spotify-access-token"),
  spotifyCommand: (command) => ipcRenderer.invoke("tempo:spotify-command", command),
  spotifyCurrentPlayback: () => ipcRenderer.invoke("tempo:spotify-current-playback"),
  spotifyDiagnostics: () => ipcRenderer.invoke("tempo:spotify-diagnostics"),
  spotifyDisconnect: () => ipcRenderer.invoke("tempo:spotify-disconnect"),
  spotifyPlaylists: () => ipcRenderer.invoke("tempo:spotify-playlists"),
  spotifySearch: (query) => ipcRenderer.invoke("tempo:spotify-search", query),
  spotifyTracks: () => ipcRenderer.invoke("tempo:spotify-tracks"),
  onNativeMode: (callback) => {
    ipcRenderer.on("tempo:native-mode", (_event, mode) => callback(mode));
  }
});
