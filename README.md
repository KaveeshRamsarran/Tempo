# TEMPO

TEMPO is a premium cinematic music + countdown desktop experience: a futuristic focus cockpit where time, music metadata, and reactive visuals behave like one atmospheric system.

## What Is Built

- Electron desktop shell with native window-mode hooks.
- Cinematic renderer prototype with a massive orbital countdown, reactive waveform systems, procedural canvas atmosphere, left navigation, right Now Playing panel, lower cockpit deck, and completion sequence.
- Interactive focus environments, presets, session list, playback controls, compact/overlay/mini layout modes, and simulated audio energy.
- Product and technical architecture covering the full requested deliverables in [docs/TEMPO_ARCHITECTURE.md](docs/TEMPO_ARCHITECTURE.md).

## Run

The renderer can be previewed directly:

```text
src/renderer/index.html
```

For the desktop shell:

```bash
npm install
npm.cmd run dev
```

Static syntax check:

```bash
npm.cmd run check:static
```

## Notes

Spotify support is designed as a metadata and playback-control layer. TEMPO does not host copyrighted music. The architecture accounts for Spotify's current restrictions on Audio Features and Audio Analysis for new Web API use cases.

## Spotify Setup

1. Open https://developer.spotify.com/dashboard and create an app.
2. Add this Redirect URI exactly:

```text
http://127.0.0.1:17380/callback
```

3. Copy the app's Client ID. Do not use a Client Secret in TEMPO.
4. Run TEMPO with `npm.cmd run dev`.
5. Click `Connect Spotify`, paste the Client ID, and approve the login in your browser.
6. Start playback in Spotify on any active device, then return to TEMPO. The Now Playing panel will pull the current track metadata and artwork.
