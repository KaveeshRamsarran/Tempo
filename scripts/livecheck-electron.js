const fs = require("fs");
const http = require("http");
const path = require("path");
const { app, BrowserWindow } = require("electron");

const root = path.resolve(__dirname, "..");
const rendererRoot = path.join(root, "src", "renderer");
const port = 17382;
let server;

function contentTypeFor(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8"
  }[ext] || "application/octet-stream";
}

function startServer() {
  return new Promise((resolve, reject) => {
    server = http.createServer((request, response) => {
      const url = new URL(request.url, `http://127.0.0.1:${port}`);
      const requestPath = url.pathname === "/" ? "/index.html" : decodeURIComponent(url.pathname);
      const filePath = path.normalize(path.join(rendererRoot, requestPath));

      if (!filePath.startsWith(rendererRoot)) {
        response.writeHead(403);
        response.end("Forbidden");
        return;
      }

      fs.readFile(filePath, (error, content) => {
        if (error) {
          response.writeHead(404);
          response.end("Not found");
          return;
        }
        response.writeHead(200, { "Content-Type": contentTypeFor(filePath) });
        response.end(content);
      });
    });

    server.once("error", reject);
    server.listen(port, "127.0.0.1", resolve);
  });
}

async function runAssertions(window) {
  return window.webContents.executeJavaScript(`
    (async () => {
      const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
      const assert = (condition, message) => {
        if (!condition) throw new Error(message);
      };
      const text = (id) => document.getElementById(id).textContent.trim();
      const click = (id) => document.getElementById(id).click();

      assert(document.querySelectorAll('button').length >= 35, 'expected controls to render');

      const before = text('timer-display');
      click('play-pause');
      window.tempoDebug.advance(3);
      await sleep(50);
      const after = text('timer-display');
      assert(before !== after, 'timer did not move after Start');

      click('timer-add');
      assert(text('session-subtitle').includes('50'), '+5 min did not update duration');

      const sessionCount = document.querySelectorAll('[data-session]').length;
      click('new-session');
      await sleep(50);
      assert(document.querySelectorAll('[data-session]').length === sessionCount + 1, 'New session did not add a session');

      const playlistCount = document.querySelectorAll('[data-playlist]').length;
      click('new-playlist');
      await sleep(50);
      assert(document.querySelectorAll('[data-playlist]').length === playlistCount + 1, 'New playlist did not add a playlist');

      click('load-songs');
      await sleep(150);
      assert(document.querySelectorAll('[data-song]').length >= 2, 'Saved songs did not load');

      document.querySelector('[data-song]').click();
      await sleep(100);
      assert(text('track-title') === 'Saved Signal', 'song click did not update now playing');

      document.getElementById('song-search').value = 'signal';
      click('song-search-button');
      await sleep(150);
      assert(text('track-title') === 'Saved Signal', 'search should not break current track');
      assert(document.querySelectorAll('[data-song]').length >= 1, 'search did not populate songs');

      click('shuffle');
      assert(document.getElementById('shuffle').classList.contains('active'), 'shuffle did not toggle');
      click('repeat');
      assert(text('repeat') !== 'Repeat Off', 'repeat did not cycle');
      click('save-track');
      assert(text('save-track') === 'Saved', 'save did not toggle');

      click('timer-reset');
      assert(text('timer-display') === '25:00', 'reset did not restore current session duration');

      const deck = document.querySelector('.deck').getBoundingClientRect();
      assert(deck.bottom <= window.innerHeight + 1, 'bottom deck is cropped');

      return {
        timerBefore: before,
        timerAfter: after,
        songCount: document.querySelectorAll('[data-song]').length,
        deckBottom: deck.bottom,
        viewportHeight: window.innerHeight
      };
    })();
  `);
}

app.whenReady().then(async () => {
  try {
    await startServer();
    const window = new BrowserWindow({
      show: false,
      width: 1720,
      height: 960,
      webPreferences: {
        preload: path.join(__dirname, "livecheck-preload.js"),
        contextIsolation: true,
        nodeIntegration: false,
        backgroundThrottling: false
      }
    });

    await window.loadURL(`http://127.0.0.1:${port}/index.html?livecheck=1`);
    const result = await runAssertions(window);
    console.log(JSON.stringify({ ok: true, result }, null, 2));
    server.close();
    app.quit();
  } catch (error) {
    console.error(error);
    if (server) server.close();
    app.exit(1);
  }
});
