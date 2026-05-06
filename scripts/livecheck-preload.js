const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("tempoDesktop", {
  platform: process.platform,
  setWindowMode: async () => true,
  openExternal: async () => true,
  spotifyAccessToken: async () => ({ connected: false }),
  spotifyCommand: async () => ({ ok: true }),
  spotifyCurrentPlayback: async () => ({ connected: true, active: false }),
  spotifyDisconnect: async () => ({ ok: true }),
  spotifyLogin: async () => ({ connected: true }),
  spotifyPlaylists: async () => ({
    connected: true,
    items: [
      { name: "Livecheck Playlist", tracks: 12, uri: "spotify:playlist:tempo-livecheck", artwork: null, externalUrl: null }
    ]
  }),
  spotifySearch: async () => ({
    connected: true,
    items: [
      {
        title: "Search Result",
        artist: "TEMPO",
        durationMs: 210000,
        uri: "spotify:track:tempo-search",
        artwork: null
      }
    ]
  }),
  spotifyTracks: async () => ({
    connected: true,
    items: [
      {
        title: "Saved Signal",
        artist: "TEMPO",
        durationMs: 194000,
        uri: "spotify:track:tempo-saved",
        artwork: null
      },
      {
        title: "Focus Carrier",
        artist: "TEMPO",
        durationMs: 226000,
        uri: "spotify:track:tempo-carrier",
        artwork: null
      }
    ]
  }),
  onNativeMode: () => {}
});
