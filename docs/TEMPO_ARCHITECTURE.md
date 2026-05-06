# TEMPO Product And Technical Architecture

TEMPO is a desktop-first cinematic focus environment where time, music, and system visuals behave as one instrument. The product direction is not "timer plus player"; it is a mission-control layer for entering, holding, and completing flow states.

## Implementation Status

This repository includes a working cinematic prototype:

- Electron shell: `electron/main.js`, `electron/preload.js`
- Renderer cockpit: `src/renderer/index.html`
- Visual system and interaction layer: `src/renderer/styles.css`, `src/renderer/app.js`
- Package scripts: `package.json`

The renderer is dependency-light and can run directly from `src/renderer/index.html`. Electron provides the native window modes once dependencies are installed.

## 1. Full Application Architecture

Recommended stack: Electron + Web renderer now, React migration when the app grows past prototype scale.

```
TEMPO Desktop
  Electron Main Process
    Window mode controller
    Native menu and tray
    OAuth callback listener
    Secure token storage bridge
    OS media key bridge
    Optional desktop audio capture bridge

  Renderer Application
    Cockpit UI layer
    Timer/session engine
    Music metadata layer
    Visualization engine
    Motion state bus
    Local persistence adapter

  Integration Services
    Spotify OAuth PKCE client
    Spotify playback/playlist client
    Local audio analyzer
    Future music providers
    AI environment generator

  Data Layer
    SQLite for desktop production
    IndexedDB/localStorage for prototype
    Secure keychain for OAuth tokens
```

Architecture principle: the music provider never owns the experience. TEMPO owns session state, visual state, environment state, and analytics; Spotify or future providers supply metadata and playback control where permitted.

## 2. Desktop UX Breakdown

Launch state:

- User lands inside the active environment, not on a marketing screen.
- The central timer is armed with the last-used session.
- Visuals are already breathing at low intensity.
- Now Playing, queue, playlists, presets, and analytics are visible in one desktop cockpit.

Primary loop:

1. Choose a focus environment.
2. Attach a playlist or audio source.
3. Start countdown.
4. Visual energy follows audio and timer urgency.
5. Session milestones trigger subtle cinematic transitions.
6. Completion sequence captures the session and returns to ambient mode.

UX tone:

- Quiet when idle.
- Alive when music starts.
- More urgent as the countdown approaches zero.
- Dense enough for a workstation, restrained enough for all-day ambience.

## 3. Window Layout System

Desktop modes:

- Immersive: fullscreen cockpit for deep work, studying, gaming setups, and ultrawide monitors.
- Ultrawide: default command-center layout with left nav, center timer, right music panel, and bottom deck.
- Compact: collapsed left rail, center cockpit, and abbreviated lower deck.
- Floating Overlay: always-on-top horizontal module for secondary monitors.
- Mini Player: small holographic timer/playback unit.

The prototype maps these modes through `tempoDesktop.setWindowMode(mode)` in Electron and CSS `data-window-mode` layouts in the renderer.

## 4. Navigation Structure

Primary left rail:

- Sessions
- Playlists
- Focus Modes
- Timer Presets
- Analytics
- Library
- Settings

Secondary lower deck:

- Today sessions
- Playlist capsules
- Timer presets
- Visualizer/environment tabs
- Weekly stats

The navigation is intentionally shallow. TEMPO should feel like an operating surface, not a page app.

## 5. Component Hierarchy

```
TempoApp
  BackgroundSystem
    WebGLCanvas
    AtmosphereLayer
    ScanGrid

  LeftRail
    BrandBlock
    ActiveSessionSummary
    PlaylistSummary
    NavigationStack
    OperatorFocusStatus

  CommandCenter
    TopCommandBar
      SessionTitle
      WindowModeCluster
    TimerStage
      SideSpectrum
      OrbitalCountdown
      ScannerLayer
      TimerCore
    TransportZone
      PlaybackButtons
      TrackProgress
      TimerControls

  RightMusicPanel
    NowPlayingArtwork
    MetadataGrid
    Waveform
    Queue

  LowerDeck
    SessionList
    PlaylistList
    PresetGrid
    VisualizerPanel
    StatsPanel

  CompletionSequence
```

## 6. Motion Design System

Motion language:

- Radial rotation: scanner, progress ring, orbit marks.
- Low-frequency breathing: background fog, album light, core glow.
- Beat pulse: radial expansion, side spectrum amplitude, particle brightness.
- Timer urgency: increased ring brightness, faster scanner, denser particle motion.
- Session transitions: fade, scan wipe, then re-arm.

Timing:

- Idle: 10-45 second cycles.
- Music reactive: 80-160 ms visual response.
- Mode changes: 180-300 ms.
- Completion: 900-1500 ms cinematic lock sequence.

Avoid:

- Bounce.
- Cartoon spring motion.
- Rainbow gradients.
- Oversized SaaS-style transitions.

## 7. Color System

Core palette:

- Void: `#020302`
- Carbon: `#070a08`
- Tactical line: `rgba(220, 255, 160, 0.14)`
- Primary neon: `#d8ff3f`
- Muted white: `#f2f4ec`
- Soft gray: `#8e9288`
- Orange warning: `#ff9d42`
- Cyan instrument: `#65e9ff`
- Rose creative: `#ff6f9f`

Environment accents:

- Deep Work: neon yellow-green.
- Study: cool cyan.
- Creative Flow: rose with cyan secondary.
- Meditation: pale green and blue.
- Workout: orange with warning intensity.
- Rain Mode: blue-cyan and low contrast.
- Tactical: high-contrast yellow-green and red warning.
- Space Drift: violet accent with cold highlights.

## 8. Typography System

Prototype fonts:

- UI: system sans for stable desktop rendering.
- Instrument text: Cascadia Mono / SF Mono / Consolas fallback.

Production recommendation:

- Display/instrument: Berkeley Mono, Spline Sans Mono, or ABC Diatype Mono.
- UI support: Inter, Geist, or SF Pro.

Rules:

- Tabular numerals for timer and metrics.
- Uppercase for system labels.
- No playful rounded typography.
- Dense desktop sizing, with the timer as the only hero-scale type.

## 9. Spotify Integration Architecture

Use Authorization Code with PKCE for desktop because the app cannot safely store a client secret. Spotify's own authorization documentation describes PKCE as appropriate for desktop, mobile, and browser apps where a secret is not safe to store.

Flow:

1. Generate code verifier and S256 challenge locally.
2. Open Spotify authorization in the system browser.
3. Receive callback on localhost, for example `http://127.0.0.1:17380/callback`.
4. Exchange code for access and refresh tokens.
5. Store tokens in OS keychain, not plain local storage.
6. Use refresh token through a native main-process service.

Scopes:

- `user-read-currently-playing`
- `user-read-playback-state`
- `user-modify-playback-state`
- `playlist-read-private`
- `playlist-read-collaborative`
- `user-read-private`

Important 2026 constraint:

Spotify announced on November 27, 2024 that new Web API use cases can no longer access Audio Features or Audio Analysis. Existing extended-mode apps that already relied on those endpoints may be unaffected, but TEMPO should not require them for new app viability.

Practical design:

- Spotify supplies playback state, playlists, track metadata, device state, and artwork.
- BPM/energy come from local audio analysis when legally and technically permitted, a user-supplied local audio source, a licensed analysis partner, or a grandfathered Spotify app.
- Album artwork must be displayed with proper attribution and should not be distorted, overlaid, or used as a replacement for Spotify playback.
- TEMPO does not host, download, stream-rip, or rebroadcast Spotify music.

## 10. Audio-Reactive Visualization System

Visualization pipeline:

```
AudioSourceAdapter
  SpotifyMetadataAdapter
  LocalFileAnalyzer
  DesktopCaptureAnalyzer
  SyntheticPreviewAnalyzer

AudioAnalysisEngine
  FFT bands
  Bass energy
  Mid energy
  High shimmer
  BPM estimator
  Peak detector
  Loudness smoothing

ReactiveStateBus
  energy
  bassPulse
  bpm
  urgency
  environmentIntensity
  sessionPhase

VisualConsumers
  Orbital timer
  Side spectrum
  Particle field
  Fog waves
  Scanner
  UI glow
  Completion sequence
```

Smoothing:

- Attack: 70-120 ms for bass pulses.
- Release: 280-600 ms for cinematic decay.
- BPM lock: multi-second confidence window.
- UI brightness: eased separately from raw FFT to avoid flicker.

## 11. Shader Concepts

Production WebGL/Three.js passes:

- Orbital timefield: conic progress mask with beat-reactive normal distortion.
- Fog sea: layered simplex noise displaced by low-frequency energy.
- Particle scanner: instanced points with radial velocity and beat bloom.
- Holographic grid: procedural line shader with scanline drift.
- Urgency chroma: time-left coefficient drives glow, edge burn, and ring density.
- Completion burst: radial wipe that collapses into a session stamp.

Prototype equivalent:

- Canvas 2D draws fog waves, particles, and radial pulses.
- CSS conic gradients render countdown rings.
- CSS variables carry energy, progress, and urgency to the UI.

## 12. Full UI Mockups

Implemented mockup surfaces:

- Full command center: center timer, left navigation, right music panel, bottom deck.
- Now Playing: album art, waveform, BPM, energy, source, queue.
- Sessions: today list and start affordances.
- Playlists: cinematic playlist rows.
- Timer presets: tactical preset grid.
- Visualizer: environment switching and reactor preview.
- Stats: weekly focus chart and key metrics.
- Window modes: immersive, ultrawide, compact, overlay, mini.

Layout sketch:

```
+----------------+-----------------------------+------------------+
| Left Rail      | Massive Reactive Timer       | Now Playing      |
| Session        | Orbits / Scanner / Waves     | Art / Queue      |
| Playlist       | Transport / Track Progress   | Metadata         |
| Navigation     | Timer Controls               | Spectrum         |
+----------------+-----------------------------+------------------+
| Sessions       | Playlists    | Presets       | Visuals | Stats   |
+-------------------------------------------------------------------+
```

## 13. Desktop Interaction Patterns

- Click center play to start both session time and visual energy.
- Use presets to re-arm duration without navigating away.
- Use environment tabs to change the whole visual mood instantly.
- Use mode buttons for desktop form factors.
- Keep controls small, precise, and instrument-like.
- Hover states should glow softly, never expand layout.
- Keyboard shortcuts in production:
  - Space: play/pause session.
  - R: reset timer.
  - F: immersive mode.
  - M: mini player.
  - 1-8: environment selection.

## 14. Onboarding Flow

First launch:

1. "Choose your environment" with cinematic previews.
2. "Connect music source" with Spotify PKCE first and local files as fallback.
3. "Pick your first ritual" with Deep Work, Study, Workout, Meditation.
4. "Select window behavior" for fullscreen, ultrawide, overlay, or mini.
5. Enter cockpit with a 25-minute armed session.

Onboarding should be visual and brief. Avoid tutorial copy on the main surface.

## 15. Focus Mode Concepts

- Deep Work: low motion, strong timer, minimal metadata.
- Study: cooler palette, softer urgency curve, long-session pacing.
- Creative Flow: more particle trails and color modulation.
- Dark Ambient: minimal waveform, slow scanner, low glow.
- Meditation: low BPM response, soft completion.
- Workout: high contrast, stronger BPM pulses, milestone hits.
- Sleep: dim palette, near-static motion, fade-out sequence.
- Cyberpunk: sharper scanlines and neon contrast.
- Space Drift: starfield particles, slow orbital drift.
- Tactical: grid overlays, mission language, high precision.
- Rain Mode: vertical streaks, cool highlights, reduced UI brightness.

## 16. Subscription And Premium Ideas

Free:

- Core timer.
- Three focus environments.
- Local prototype visualizer.
- Manual playlist linking.

Plus:

- Unlimited environments.
- Spotify integration.
- Desktop widgets and overlays.
- Advanced analytics.
- Custom rituals and completion sequences.

Pro:

- AI-generated focus environments.
- Cross-device sync.
- Productivity/music correlation insights.
- Workspace profiles.
- Reactive wallpaper engine.

Studio:

- Custom branded environments.
- Team focus rooms.
- Shared session rituals.
- Exportable session reports.

## 17. Technical Implementation Plan

Phase 1: Prototype

- Current static/Electron cockpit.
- Simulated audio-reactive state.
- Timer, modes, environment switching.
- Local session state.

Phase 2: Desktop Core

- React + Vite migration or componentized Web Components.
- SQLite persistence.
- Secure token storage.
- Tray, global shortcuts, media keys.
- Real local audio analyzer.

Phase 3: Spotify

- PKCE OAuth in Electron main process.
- Localhost callback server.
- Playlist and playback state.
- Current device control.
- Artwork and attribution handling.

Phase 4: Visual Engine

- Three.js/WebGL scene.
- Shader pipeline.
- Worker or AudioWorklet analysis.
- GPU-friendly instanced particles.

Phase 5: Product Depth

- Analytics dashboard.
- AI environment generation.
- Wallpaper/overlay sync.
- Subscription gates.
- Cloud profile sync.

## 18. Database Structure

Production recommendation: SQLite via main process with a typed repository layer.

Core tables:

```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  display_name TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  environment_id TEXT NOT NULL,
  planned_seconds INTEGER NOT NULL,
  started_at TEXT,
  completed_at TEXT,
  completion_ratio REAL NOT NULL DEFAULT 0,
  focus_score REAL,
  playlist_provider TEXT,
  playlist_external_id TEXT
);

CREATE TABLE session_events (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  type TEXT NOT NULL,
  occurred_at TEXT NOT NULL,
  payload_json TEXT NOT NULL DEFAULT '{}'
);

CREATE TABLE tracks (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  external_id TEXT,
  title TEXT NOT NULL,
  artist TEXT,
  album TEXT,
  artwork_url TEXT,
  duration_ms INTEGER,
  bpm REAL,
  energy REAL,
  analysis_source TEXT
);

CREATE TABLE focus_metrics (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  minute_index INTEGER NOT NULL,
  focus_score REAL,
  audio_energy REAL,
  interaction_count INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE environments (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  palette_json TEXT NOT NULL,
  motion_json TEXT NOT NULL,
  shader_preset_json TEXT NOT NULL
);

CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value_json TEXT NOT NULL
);
```

Sensitive data:

- OAuth access tokens: memory only.
- Refresh tokens: OS keychain/credential vault.
- No secrets in renderer code.

## 19. State Management Architecture

Runtime stores:

- `sessionStore`: duration, remaining time, phase, milestones.
- `playerStore`: provider, track, playback state, queue.
- `analysisStore`: FFT bands, bass, mids, highs, BPM, confidence.
- `environmentStore`: active palette, shader preset, motion profile.
- `windowStore`: native mode, always-on-top, opacity, bounds.
- `analyticsStore`: session history and derived insights.

State bus:

- Timer emits `progress`, `urgency`, `phase`.
- Audio emits `energy`, `bassPulse`, `bpm`, `peak`.
- Environment combines timer and audio into `visualIntensity`.
- Components subscribe to derived state, not raw provider APIs.

This keeps Spotify, local audio, and future providers interchangeable.

## 20. Performance Optimization Strategy

Renderer:

- Keep layout stable with fixed grid tracks and aspect ratios.
- Use CSS variables for animation data, not repeated DOM rebuilds.
- Batch DOM updates to 15-30 fps while canvas renders at display rate.
- Avoid expensive blur layers over huge opaque regions.

Visual engine:

- Prefer WebGL instancing for particles.
- Use one canvas/WebGL surface for atmospheric visuals.
- Keep FFT and BPM estimation in AudioWorklet or worker.
- Smooth audio data before it touches UI.
- Use reduced motion mode for battery and accessibility.

Electron:

- Keep token and provider calls in main process.
- Debounce IPC messages.
- Use background throttling carefully for overlay and mini modes.
- Profile GPU frame time on ultrawide displays.

Data:

- Write session metrics in batches.
- Store minute-level analytics, not every animation frame.
- Cache artwork with provider policy compliance.

## Source Notes

- Spotify Authorization overview: https://developer.spotify.com/documentation/web-api/concepts/authorization
- Spotify Authorization Code with PKCE: https://developer.spotify.com/documentation/web-api/tutorials/code-pkce-flow
- Spotify November 27, 2024 Web API changes: https://developer.spotify.com/blog/2024-11-27-changes-to-the-web-api
- Spotify playback-state reference and policy notes: https://developer.spotify.com/documentation/web-api/reference/get-information-about-the-users-current-playback
