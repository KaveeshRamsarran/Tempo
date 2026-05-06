const path = require("path");
const crypto = require("crypto");
const fs = require("fs");
const http = require("http");
const { app, BrowserWindow, ipcMain, Menu, shell, nativeTheme, safeStorage } = require("electron");

let mainWindow;
let spotifyAuth = null;
let oauthServer = null;

const spotifyRedirectUri = "http://127.0.0.1:17380/callback";
const spotifyScopes = [
  "user-read-currently-playing",
  "user-read-playback-state",
  "user-modify-playback-state",
  "streaming",
  "playlist-read-private",
  "playlist-read-collaborative",
  "user-read-private",
  "user-read-email"
];

const modeProfiles = {
  immersive: {
    fullscreen: true,
    alwaysOnTop: false,
    size: [1600, 980],
    opacity: 1
  },
  ultrawide: {
    fullscreen: false,
    alwaysOnTop: false,
    size: [1720, 960],
    opacity: 1
  },
  compact: {
    fullscreen: false,
    alwaysOnTop: false,
    size: [960, 590],
    opacity: 0.98
  },
  overlay: {
    fullscreen: false,
    alwaysOnTop: true,
    size: [760, 310],
    opacity: 0.94
  },
  mini: {
    fullscreen: false,
    alwaysOnTop: true,
    size: [430, 230],
    opacity: 0.96
  }
};

function applyWindowMode(window, mode) {
  const profile = modeProfiles[mode] || modeProfiles.ultrawide;

  window.setFullScreen(false);
  window.setAlwaysOnTop(Boolean(profile.alwaysOnTop), profile.alwaysOnTop ? "screen-saver" : "normal");
  window.setOpacity(profile.opacity);

  if (profile.fullscreen) {
    window.setFullScreen(true);
  } else {
    window.setSize(profile.size[0], profile.size[1], true);
    window.center();
  }

  window.webContents.send("tempo:native-mode", mode);
}

function createWindow() {
  nativeTheme.themeSource = "dark";

  mainWindow = new BrowserWindow({
    width: 1720,
    height: 960,
    minWidth: 1180,
    minHeight: 720,
    title: "TEMPO",
    backgroundColor: "#020302",
    show: true,
    trafficLightPosition: { x: 14, y: 14 },
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "default",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  Menu.setApplicationMenu(null);
  mainWindow.loadFile(path.join(__dirname, "../src/renderer/index.html"));

  mainWindow.once("ready-to-show", () => {
    mainWindow.focus();
    applyWindowMode(mainWindow, "ultrawide");
  });

  mainWindow.webContents.once("did-finish-load", () => {
    mainWindow.show();
    mainWindow.focus();
  });
}

function base64Url(buffer) {
  return buffer.toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function createPkcePair() {
  const verifier = base64Url(crypto.randomBytes(64));
  const challenge = base64Url(crypto.createHash("sha256").update(verifier).digest());
  return { verifier, challenge };
}

function spotifyTokenPath() {
  return path.join(app.getPath("userData"), "spotify-auth.json");
}

function saveSpotifyAuth() {
  if (!spotifyAuth?.refreshToken) return;

  const payload = JSON.stringify({
    clientId: spotifyAuth.clientId,
    refreshToken: spotifyAuth.refreshToken,
    expiresAt: spotifyAuth.expiresAt || 0
  });

  const tokenPayload = safeStorage.isEncryptionAvailable()
    ? { encrypted: true, payload: safeStorage.encryptString(payload).toString("base64") }
    : { encrypted: false, payload };

  fs.writeFileSync(spotifyTokenPath(), JSON.stringify(tokenPayload), "utf8");
}

function loadSpotifyAuth() {
  try {
    const filePath = spotifyTokenPath();
    if (!fs.existsSync(filePath)) return;

    const tokenPayload = JSON.parse(fs.readFileSync(filePath, "utf8"));
    const raw = tokenPayload.encrypted
      ? safeStorage.decryptString(Buffer.from(tokenPayload.payload, "base64"))
      : tokenPayload.payload;
    const parsed = JSON.parse(raw);

    if (parsed.clientId && parsed.refreshToken) {
      spotifyAuth = {
        clientId: parsed.clientId,
        refreshToken: parsed.refreshToken,
        accessToken: null,
        expiresAt: 0
      };
    }
  } catch (error) {
    console.warn("Could not load Spotify token store:", error.message);
  }
}

function closeOauthServer() {
  if (oauthServer) {
    oauthServer.close();
    oauthServer = null;
  }
}

function waitForSpotifyCallback(expectedState) {
  closeOauthServer();

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      closeOauthServer();
      reject(new Error("Spotify login timed out."));
    }, 5 * 60 * 1000);

    oauthServer = http.createServer((request, response) => {
      const callbackUrl = new URL(request.url, spotifyRedirectUri);

      if (callbackUrl.pathname !== "/callback") {
        response.writeHead(404);
        response.end("Not found");
        return;
      }

      const state = callbackUrl.searchParams.get("state");
      const code = callbackUrl.searchParams.get("code");
      const error = callbackUrl.searchParams.get("error");

      if (error) {
        clearTimeout(timeout);
        response.writeHead(400, { "Content-Type": "text/html" });
        response.end("<h1>TEMPO Spotify login failed</h1><p>You can close this tab and return to TEMPO.</p>");
        closeOauthServer();
        reject(new Error(error));
        return;
      }

      if (!code || state !== expectedState) {
        clearTimeout(timeout);
        response.writeHead(400, { "Content-Type": "text/html" });
        response.end("<h1>TEMPO Spotify login rejected</h1><p>State verification failed.</p>");
        closeOauthServer();
        reject(new Error("Spotify state verification failed."));
        return;
      }

      clearTimeout(timeout);
      response.writeHead(200, { "Content-Type": "text/html" });
      response.end("<h1>TEMPO linked to Spotify</h1><p>You can close this tab and return to the desktop app.</p>");
      closeOauthServer();
      resolve(code);
    });

    oauthServer.on("error", (error) => {
      clearTimeout(timeout);
      closeOauthServer();
      reject(error);
    });

    oauthServer.listen(17380, "127.0.0.1");
  });
}

async function exchangeSpotifyCode({ clientId, code, verifier }) {
  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      client_id: clientId,
      grant_type: "authorization_code",
      code,
      redirect_uri: spotifyRedirectUri,
      code_verifier: verifier
    })
  });

  if (!response.ok) {
    throw new Error(`Spotify token exchange failed: ${response.status}`);
  }

  return response.json();
}

async function refreshSpotifyToken() {
  if (!spotifyAuth?.refreshToken) {
    throw new Error("Spotify is not connected.");
  }

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      client_id: spotifyAuth.clientId,
      grant_type: "refresh_token",
      refresh_token: spotifyAuth.refreshToken
    })
  });

  if (!response.ok) {
    throw new Error(`Spotify token refresh failed: ${response.status}`);
  }

  const token = await response.json();
  spotifyAuth.accessToken = token.access_token;
  spotifyAuth.refreshToken = token.refresh_token || spotifyAuth.refreshToken;
  spotifyAuth.expiresAt = Date.now() + token.expires_in * 1000 - 30_000;
  saveSpotifyAuth();
}

async function ensureSpotifyAccessToken() {
  if (!spotifyAuth?.accessToken) {
    if (!spotifyAuth?.refreshToken) {
      return null;
    }
    await refreshSpotifyToken();
  }

  if (Date.now() >= spotifyAuth.expiresAt) {
    await refreshSpotifyToken();
  }

  return spotifyAuth.accessToken;
}

async function readSpotifyError(response) {
  const text = await response.text();

  if (!text) {
    return `${response.status} ${response.statusText}`;
  }

  try {
    const body = JSON.parse(text);
    return body.error?.message || body.error_description || `${response.status} ${response.statusText}`;
  } catch (_error) {
    return text.slice(0, 240);
  }
}

async function spotifyApi(pathname, options = {}) {
  const accessToken = await ensureSpotifyAccessToken();
  if (!accessToken) {
    return { connected: false };
  }

  const method = options.method || "GET";
  const query = options.query ? `?${new URLSearchParams(options.query).toString()}` : "";
  const init = {
    method,
    headers: {
      Authorization: `Bearer ${spotifyAuth.accessToken}`
    }
  };

  if (options.body !== undefined) {
    init.headers["Content-Type"] = "application/json";
    init.body = JSON.stringify(options.body);
  }

  let response = await fetch(`https://api.spotify.com/v1${pathname}${query}`, init);

  if (response.status === 401) {
    await refreshSpotifyToken();
    init.headers.Authorization = `Bearer ${spotifyAuth.accessToken}`;
    response = await fetch(`https://api.spotify.com/v1${pathname}${query}`, init);
  }

  if (response.status === 204) {
    return { connected: true, empty: true };
  }

  if (!response.ok) {
    const detail = await readSpotifyError(response);
    throw new Error(`Spotify API ${response.status}: ${detail}`);
  }

  return response.json();
}

async function spotifyCommand(command) {
  const deviceQuery = command.deviceId ? { device_id: command.deviceId } : undefined;

  if (command.type === "play") {
    const body = {};
    if (command.contextUri) body.context_uri = command.contextUri;
    if (Array.isArray(command.uris) && command.uris.length) body.uris = command.uris;
    if (Number.isFinite(command.positionMs)) body.position_ms = command.positionMs;
    return spotifyApi("/me/player/play", {
      method: "PUT",
      query: deviceQuery,
      body: Object.keys(body).length ? body : undefined
    });
  }

  if (command.type === "pause") {
    return spotifyApi("/me/player/pause", { method: "PUT", query: deviceQuery });
  }

  if (command.type === "next") {
    return spotifyApi("/me/player/next", { method: "POST", query: deviceQuery });
  }

  if (command.type === "previous") {
    return spotifyApi("/me/player/previous", { method: "POST", query: deviceQuery });
  }

  if (command.type === "shuffle") {
    return spotifyApi("/me/player/shuffle", {
      method: "PUT",
      query: { state: String(Boolean(command.state)), ...(deviceQuery || {}) }
    });
  }

  if (command.type === "repeat") {
    return spotifyApi("/me/player/repeat", {
      method: "PUT",
      query: { state: command.state || "off", ...(deviceQuery || {}) }
    });
  }

  if (command.type === "volume") {
    return spotifyApi("/me/player/volume", {
      method: "PUT",
      query: { volume_percent: String(command.volumePercent || 0), ...(deviceQuery || {}) }
    });
  }

  if (command.type === "transfer" && command.deviceId) {
    return spotifyApi("/me/player", {
      method: "PUT",
      body: { device_ids: [command.deviceId], play: Boolean(command.play) }
    });
  }

  throw new Error(`Unsupported Spotify command: ${command.type}`);
}

app.whenReady().then(() => {
  loadSpotifyAuth();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

ipcMain.handle("tempo:set-window-mode", (event, mode) => {
  const target = BrowserWindow.fromWebContents(event.sender);
  if (!target) return false;
  applyWindowMode(target, mode);
  return true;
});

ipcMain.handle("tempo:open-external", async (_event, url) => {
  if (typeof url !== "string" || !/^https?:\/\//i.test(url)) {
    return false;
  }
  await shell.openExternal(url);
  return true;
});

ipcMain.handle("tempo:spotify-login", async (_event, clientId) => {
  if (typeof clientId !== "string" || !clientId.trim()) {
    throw new Error("Spotify Client ID is required.");
  }

  const normalizedClientId = clientId.trim();
  const { verifier, challenge } = createPkcePair();
  const state = base64Url(crypto.randomBytes(24));
  const params = new URLSearchParams({
    response_type: "code",
    client_id: normalizedClientId,
    scope: spotifyScopes.join(" "),
    redirect_uri: spotifyRedirectUri,
    state,
    code_challenge_method: "S256",
    code_challenge: challenge
  });

  const callbackPromise = waitForSpotifyCallback(state);
  await shell.openExternal(`https://accounts.spotify.com/authorize?${params.toString()}`);
  const code = await callbackPromise;
  const token = await exchangeSpotifyCode({ clientId: normalizedClientId, code, verifier });

  spotifyAuth = {
    clientId: normalizedClientId,
    accessToken: token.access_token,
    refreshToken: token.refresh_token,
    expiresAt: Date.now() + token.expires_in * 1000 - 30_000
  };
  saveSpotifyAuth();

  return { connected: true };
});

ipcMain.handle("tempo:spotify-current-playback", async () => {
  const playback = await spotifyApi("/me/player");

  if (!playback.connected) {
    return playback;
  }

  if (playback.empty || !playback.item) {
    return {
      connected: true,
      active: false
    };
  }

  const item = playback.item;
  const artwork = Array.isArray(item.album?.images) && item.album.images.length > 0
    ? item.album.images[0].url
    : null;

  return {
    connected: true,
    active: true,
    isPlaying: Boolean(playback.is_playing),
    progressMs: playback.progress_ms || 0,
    device: playback.device?.name || "Spotify",
    track: {
      title: item.name || "Unknown Track",
      artist: Array.isArray(item.artists) ? item.artists.map((artist) => artist.name).join(", ") : "",
      album: item.album?.name || "",
      artwork,
      durationMs: item.duration_ms || 0,
      uri: item.uri,
      externalUrl: item.external_urls?.spotify
    }
  };
});

ipcMain.handle("tempo:spotify-access-token", async () => {
  const accessToken = await ensureSpotifyAccessToken();
  return {
    connected: Boolean(accessToken),
    accessToken
  };
});

ipcMain.handle("tempo:spotify-command", async (_event, command) => {
  await spotifyCommand(command || {});
  return { ok: true };
});

ipcMain.handle("tempo:spotify-playlists", async () => {
  const data = await spotifyApi("/me/playlists", { query: { limit: "20" } });

  if (!data.connected) {
    return data;
  }

  return {
    connected: true,
    items: (data.items || []).map((playlist) => ({
      id: playlist.id,
      name: playlist.name,
      uri: playlist.uri,
      tracks: playlist.tracks?.total || 0,
      artwork: Array.isArray(playlist.images) && playlist.images.length ? playlist.images[0].url : null,
      externalUrl: playlist.external_urls?.spotify || null
    }))
  };
});
