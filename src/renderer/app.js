(() => {
  const app = document.querySelector(".app-shell");
  const canvas = document.getElementById("tempo-canvas");
  const ctx = canvas.getContext("2d", { alpha: true });

  const tracks = [
    {
      title: "Midnight Drive",
      artist: "MOON",
      bpm: 78,
      energy: 0.64,
      duration: 206
    },
    {
      title: "Night Drive",
      artist: "KAIZEN",
      bpm: 92,
      energy: 0.58,
      duration: 235
    },
    {
      title: "Stargazing",
      artist: "EXILES",
      bpm: 112,
      energy: 0.72,
      duration: 261
    },
    {
      title: "Fragments",
      artist: "OKASHI",
      bpm: 86,
      energy: 0.51,
      duration: 164
    }
  ];

  const sessions = [
    { name: "Deep Work", minutes: 45, progress: 0.76, environment: "deep-work" },
    { name: "Study Session", minutes: 60, progress: 0.54, environment: "study" },
    { name: "Reading", minutes: 30, progress: 0.42, environment: "meditation" },
    { name: "Workout", minutes: 45, progress: 0.86, environment: "workout" },
    { name: "Meditation", minutes: 20, progress: 0.32, environment: "meditation" }
  ];

  const playlists = [
    { name: "Lofi Essentials", tracks: 24, active: true },
    { name: "Focus Flow", tracks: 31 },
    { name: "Cinematic", tracks: 18 },
    { name: "Dark Ambient", tracks: 27 },
    { name: "Chill Vibes", tracks: 35 }
  ];

  const presets = [
    { name: "Deep Work", minutes: 45, angle: 300 },
    { name: "Study", minutes: 60, angle: 240 },
    { name: "Workout", minutes: 45, angle: 320 },
    { name: "Meditation", minutes: 20, angle: 150 },
    { name: "Pomodoro", minutes: 25, angle: 190 },
    { name: "Custom", minutes: 15, angle: 90 }
  ];

  const environments = [
    { id: "deep-work", label: "Deep" },
    { id: "study", label: "Study" },
    { id: "creative-flow", label: "Create" },
    { id: "meditation", label: "Meditate" },
    { id: "workout", label: "Workout" },
    { id: "rain-mode", label: "Rain" },
    { id: "tactical", label: "Tactical" },
    { id: "space-drift", label: "Space" }
  ];

  const state = {
    running: false,
    sessionIndex: 0,
    sessionName: "Deep Work",
    trackIndex: 0,
    duration: 45 * 60,
    remaining: 45 * 60,
    trackElapsed: 77,
    energy: 0.64,
    bass: 0,
    bpm: 78,
    environment: "deep-work",
    windowMode: "ultrawide",
    completed: false,
    milestone: null
  };

  const el = {
    timerDisplay: document.getElementById("timer-display"),
    timerCaption: document.getElementById("timer-caption"),
    statusKicker: document.getElementById("status-kicker"),
    sessionTitle: document.getElementById("session-title"),
    sessionSubtitle: document.getElementById("session-subtitle"),
    editSession: document.getElementById("edit-session"),
    playPause: document.getElementById("play-pause"),
    reset: document.getElementById("timer-reset"),
    add: document.getElementById("timer-add"),
    trackMain: document.getElementById("track-title-main"),
    artistMain: document.getElementById("track-artist-main"),
    trackTitle: document.getElementById("track-title"),
    trackArtist: document.getElementById("track-artist"),
    bpm: document.getElementById("bpm-readout"),
    energy: document.getElementById("energy-readout"),
    source: document.getElementById("source-readout"),
    elapsedTrack: document.getElementById("elapsed-track"),
    trackLength: document.getElementById("track-length"),
    trackProgress: document.getElementById("track-progress-bar"),
    albumArt: document.getElementById("album-art"),
    focusLevel: document.getElementById("focus-level"),
    focusMeter: document.getElementById("focus-meter"),
    avgFocus: document.getElementById("avg-focus"),
    spectrumLeft: document.getElementById("spectrum-left"),
    spectrumRight: document.getElementById("spectrum-right"),
    waveform: document.getElementById("waveform-line"),
    sessionList: document.getElementById("session-list"),
    playlistList: document.getElementById("playlist-list"),
    queueList: document.getElementById("queue-list"),
    presetGrid: document.getElementById("preset-grid"),
    environmentTabs: document.getElementById("environment-tabs"),
    barChart: document.getElementById("bar-chart"),
    completion: document.getElementById("completion-sequence"),
    completionClose: document.getElementById("completion-close"),
    spotifyConnect: document.getElementById("spotify-connect")
  };

  const particles = Array.from({ length: 180 }, (_, index) => ({
    x: Math.random(),
    y: Math.random(),
    speed: 0.03 + Math.random() * 0.1,
    size: 0.5 + Math.random() * 1.8,
    drift: Math.random() * Math.PI * 2,
    index
  }));

  let width = 0;
  let height = 0;
  let dpr = 1;
  let lastFrame = performance.now();
  let lastDomPaint = 0;

  function makeBars(target, count) {
    target.innerHTML = "";
    for (let index = 0; index < count; index += 1) {
      target.appendChild(document.createElement("span"));
    }
  }

  function mountLists() {
    el.sessionList.innerHTML = sessions.map((session, index) => {
      const active = index === state.sessionIndex ? " active" : "";
      return `
        <button class="session-row${active}" data-session-index="${index}" style="--session-angle:${Math.round(session.progress * 360)}deg" type="button">
          <i class="session-ring"></i>
          <span><strong>${session.name}</strong><span>${session.minutes} min</span></span>
          <b>PL</b>
        </button>
      `;
    }).join("");

    el.playlistList.innerHTML = playlists.map((playlist, index) => {
      const active = playlist.active ? " active" : "";
      return `
        <button class="playlist-row${active}" data-playlist-index="${index}" type="button">
          <i class="mini-art"></i>
          <span><strong>${playlist.name}</strong><span>${playlist.tracks} tracks</span></span>
          <b>AR</b>
        </button>
      `;
    }).join("");

    el.queueList.innerHTML = tracks.slice(1).map((track) => `
      <div class="queue-item">
        <i class="mini-art"></i>
        <span><strong>${track.title}</strong><span>${track.artist}</span></span>
        <time>${formatTrackTime(track.duration)}</time>
      </div>
    `).join("");

    el.presetGrid.innerHTML = presets.map((preset, index) => {
      const active = index === 0 ? " active" : "";
      return `
        <button class="preset-card${active}" data-preset-index="${index}" type="button">
          <span><strong>${preset.name}</strong><span>${preset.minutes} min</span></span>
          <i class="preset-orbit" style="--preset-angle:${preset.angle}deg"></i>
        </button>
      `;
    }).join("");

    el.environmentTabs.innerHTML = environments.map((environment) => {
      const active = environment.id === state.environment ? " active" : "";
      return `<button class="${active}" data-environment="${environment.id}" type="button">${environment.label}</button>`;
    }).join("");

    el.barChart.innerHTML = [56, 48, 38, 64, 78, 70, 84].map((heightValue) => (
      `<span style="height:${heightValue}%"></span>`
    )).join("");
  }

  function attachEvents() {
    el.playPause.addEventListener("click", () => {
      state.running = !state.running;
      state.completed = false;
      updateStaticDom();
    });

    el.reset.addEventListener("click", () => {
      state.remaining = state.duration;
      state.completed = false;
      state.running = false;
      updateStaticDom();
    });

    el.add.addEventListener("click", () => {
      state.duration += 5 * 60;
      state.remaining += 5 * 60;
      updateStaticDom();
    });

    document.getElementById("next-track").addEventListener("click", () => changeTrack(1));
    document.getElementById("previous-track").addEventListener("click", () => changeTrack(-1));

    document.querySelectorAll(".nav-item").forEach((button) => {
      button.addEventListener("click", () => {
        document.querySelectorAll(".nav-item").forEach((item) => item.classList.remove("active"));
        button.classList.add("active");
      });
    });

    document.querySelectorAll(".mode-cluster [data-window-mode]").forEach((button) => {
      button.addEventListener("click", () => setWindowMode(button.dataset.windowMode));
    });

    el.sessionList.addEventListener("click", (event) => {
      const row = event.target.closest("[data-session-index]");
      if (!row) return;
      selectSession(Number(row.dataset.sessionIndex));
    });

    el.presetGrid.addEventListener("click", (event) => {
      const preset = event.target.closest("[data-preset-index]");
      if (!preset) return;
      selectPreset(Number(preset.dataset.presetIndex));
    });

    el.environmentTabs.addEventListener("click", (event) => {
      const button = event.target.closest("[data-environment]");
      if (!button) return;
      setEnvironment(button.dataset.environment);
    });

    el.spotifyConnect.addEventListener("click", connectSpotify);

    el.completionClose.addEventListener("click", () => {
      el.completion.hidden = true;
    });

    if (window.tempoDesktop) {
      window.tempoDesktop.onNativeMode((mode) => {
        state.windowMode = mode;
        app.dataset.windowMode = mode;
        markModeButton(mode);
      });
    }

    window.addEventListener("resize", resizeCanvas);
  }

  function selectSession(index) {
    const session = sessions[index];
    state.sessionIndex = index;
    state.sessionName = session.name;
    state.duration = session.minutes * 60;
    state.remaining = state.duration;
    state.completed = false;
    state.running = false;
    setEnvironment(session.environment);
    mountLists();
    updateStaticDom();
  }

  function selectPreset(index) {
    const preset = presets[index];
    state.sessionName = preset.name;
    state.duration = preset.minutes * 60;
    state.remaining = state.duration;
    state.completed = false;
    state.running = false;
    document.querySelectorAll(".preset-card").forEach((card) => card.classList.remove("active"));
    const selected = document.querySelector(`[data-preset-index="${index}"]`);
    if (selected) selected.classList.add("active");
    updateSessionLabels(preset.name, preset.minutes);
    updateStaticDom();
  }

  function setEnvironment(id) {
    state.environment = id;
    app.dataset.environment = id;
    document.querySelectorAll("[data-environment]").forEach((button) => {
      button.classList.toggle("active", button.dataset.environment === id);
    });
  }

  function setWindowMode(mode) {
    state.windowMode = mode;
    app.dataset.windowMode = mode;
    markModeButton(mode);
    if (window.tempoDesktop) {
      window.tempoDesktop.setWindowMode(mode);
    }
  }

  function markModeButton(mode) {
    document.querySelectorAll(".mode-cluster button").forEach((button) => {
      button.classList.toggle("active", button.dataset.windowMode === mode);
    });
  }

  function changeTrack(direction) {
    state.trackIndex = (state.trackIndex + direction + tracks.length) % tracks.length;
    state.trackElapsed = 0;
    const track = tracks[state.trackIndex];
    state.bpm = track.bpm;
    state.energy = track.energy;
    updateStaticDom();
  }

  function updateSessionLabels(name, minutes) {
    el.sessionTitle.textContent = name;
    el.editSession.textContent = name;
    el.sessionSubtitle.textContent = `${minutes} min focus`;
  }

  function updateStaticDom() {
    updateSessionLabels(state.sessionName, Math.round(state.duration / 60));

    const track = tracks[state.trackIndex];
    el.trackMain.textContent = track.title;
    el.artistMain.textContent = track.artist;
    el.trackTitle.textContent = track.title;
    el.trackArtist.textContent = track.artist;
    el.bpm.textContent = String(track.bpm);
    el.trackLength.textContent = formatTrackTime(track.duration);
    el.playPause.textContent = state.running ? "II" : "PL";
  }

  async function connectSpotify() {
    if (!window.tempoDesktop?.spotifyLogin) {
      openExternal("https://developer.spotify.com/documentation/web-api/tutorials/code-pkce-flow");
      pulseButtonLabel(el.spotifyConnect, "Open in Electron");
      return;
    }

    let clientId = localStorage.getItem("tempo.spotify.clientId") || "";
    if (!clientId) {
      clientId = window.prompt("Paste your Spotify Client ID. Use redirect URI http://127.0.0.1:17380/callback in the Spotify dashboard.") || "";
    }

    clientId = clientId.trim();
    if (!clientId) {
      pulseButtonLabel(el.spotifyConnect, "Client ID needed");
      return;
    }

    localStorage.setItem("tempo.spotify.clientId", clientId);
    el.spotifyConnect.textContent = "Awaiting login";

    try {
      await window.tempoDesktop.spotifyLogin(clientId);
      el.spotifyConnect.textContent = "Spotify linked";
      await pullSpotifyPlayback();
      startSpotifyPolling();
    } catch (error) {
      console.error(error);
      pulseButtonLabel(el.spotifyConnect, "Login failed");
    }
  }

  async function pullSpotifyPlayback() {
    if (!window.tempoDesktop?.spotifyCurrentPlayback) return;

    try {
      const playback = await window.tempoDesktop.spotifyCurrentPlayback();
      if (!playback.connected) {
        el.source.textContent = "Spotify offline";
        return;
      }

      if (!playback.active || !playback.track) {
        el.source.textContent = "No active device";
        pulseButtonLabel(el.spotifyConnect, "Start Spotify");
        return;
      }

      applySpotifyPlayback(playback);
      el.source.textContent = playback.device || "Spotify live";
    } catch (error) {
      console.error(error);
      el.source.textContent = "Spotify error";
    }
  }

  function applySpotifyPlayback(playback) {
    const duration = Math.max(1, Math.round(playback.track.durationMs / 1000));
    tracks[state.trackIndex] = {
      ...tracks[state.trackIndex],
      title: playback.track.title,
      artist: playback.track.artist,
      duration,
      energy: playback.isPlaying ? 0.68 : 0.38
    };
    state.trackElapsed = Math.round(playback.progressMs / 1000);
    state.energy = playback.isPlaying ? 0.68 : 0.38;
    state.running = state.running || Boolean(playback.isPlaying);

    if (playback.track.artwork) {
      el.albumArt.classList.add("spotify-artwork");
      el.albumArt.style.backgroundImage = `url("${playback.track.artwork}")`;
    }

    updateStaticDom();
  }

  function startSpotifyPolling() {
    window.clearInterval(startSpotifyPolling.timer);
    startSpotifyPolling.timer = window.setInterval(pullSpotifyPlayback, 15000);
  }

  function pulseButtonLabel(button, label) {
    const previous = button.textContent;
    button.textContent = label;
    window.setTimeout(() => {
      button.textContent = previous;
    }, 2200);
  }

  function updateFrameDom(now) {
    if (now - lastDomPaint < 64) return;
    lastDomPaint = now;

    const elapsed = state.duration - state.remaining;
    const progress = clamp(elapsed / state.duration, 0, 1);
    const urgency = clamp(1 - state.remaining / state.duration, 0, 1);
    const focusLevel = Math.round(76 + state.energy * 16 + (state.running ? 4 : 0) - urgency * 7);
    const track = tracks[state.trackIndex];

    el.timerDisplay.textContent = formatTime(state.remaining);
    el.timerCaption.textContent = `Focus session ${formatTime(state.duration)}`;
    el.statusKicker.textContent = state.milestone || (state.running ? "Remaining" : "Armed");
    el.elapsedTrack.textContent = formatTrackTime(state.trackElapsed);
    el.trackProgress.style.width = `${clamp(state.trackElapsed / track.duration, 0, 1) * 100}%`;
    el.energy.textContent = `${Math.round(state.energy * 100)}%`;
    el.focusLevel.textContent = `${focusLevel}%`;
    el.focusMeter.style.width = `${focusLevel}%`;
    el.avgFocus.textContent = `${Math.round(84 + state.energy * 6)}%`;

    app.style.setProperty("--progress", `${progress * 360}deg`);
    app.style.setProperty("--energy", state.energy.toFixed(3));
    app.style.setProperty("--urgency", urgency.toFixed(3));

    updateSpectrumBars();
  }

  function updateSpectrumBars() {
    const beat = state.bass;
    const leftBars = Array.from(el.spectrumLeft.children);
    const rightBars = Array.from(el.spectrumRight.children);
    const waveformBars = Array.from(el.waveform.children);
    const combined = leftBars.concat(rightBars);

    combined.forEach((bar, index) => {
      const phase = index * 0.31 + performance.now() * 0.005;
      const lift = Math.sin(phase) * 0.5 + 0.5;
      const heightValue = 10 + lift * 44 + beat * 38 + state.energy * 18;
      bar.style.height = `${clamp(heightValue, 8, 96)}%`;
      bar.style.opacity = String(0.24 + lift * 0.42 + beat * 0.28);
    });

    waveformBars.forEach((bar, index) => {
      const pulse = Math.sin(index * 0.42 + performance.now() * 0.006) * 0.5 + 0.5;
      const heightValue = 5 + pulse * 32 + beat * 24;
      bar.style.height = `${clamp(heightValue, 5, 52)}px`;
      bar.style.opacity = String(0.22 + pulse * 0.58);
    });
  }

  function updateMilestones() {
    const pctLeft = state.remaining / state.duration;
    if (pctLeft <= 0.25 && state.milestone !== "Final phase") {
      flashMilestone("Final phase");
    } else if (pctLeft <= 0.5 && pctLeft > 0.48) {
      flashMilestone("Halfway sync");
    }
  }

  function flashMilestone(text) {
    state.milestone = text;
    window.clearTimeout(flashMilestone.timeout);
    flashMilestone.timeout = window.setTimeout(() => {
      state.milestone = null;
    }, 2600);
  }

  function completeSession() {
    state.running = false;
    state.completed = true;
    state.remaining = 0;
    el.completion.hidden = false;
    updateStaticDom();
  }

  function tick(now) {
    const delta = Math.min((now - lastFrame) / 1000, 0.12);
    lastFrame = now;

    const track = tracks[state.trackIndex];
    const beatPhase = (now / 1000) * (state.bpm / 60) * Math.PI * 2;
    const bass = Math.pow(Math.max(0, Math.sin(beatPhase)), 3);
    const shimmer = Math.sin(now * 0.0017) * 0.5 + 0.5;
    state.bass = bass;
    state.energy = clamp(track.energy * 0.68 + bass * 0.24 + shimmer * 0.12, 0.18, 1);

    if (state.running && !state.completed) {
      state.remaining = Math.max(0, state.remaining - delta);
      state.trackElapsed = (state.trackElapsed + delta) % track.duration;
      updateMilestones();
      if (state.remaining <= 0) {
        completeSession();
      }
    }

    drawScene(now);
    updateFrameDom(now);
    requestAnimationFrame(tick);
  }

  function resizeCanvas() {
    dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    width = Math.floor(window.innerWidth);
    height = Math.floor(window.innerHeight);
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function drawScene(now) {
    ctx.clearRect(0, 0, width, height);

    const accent = getAccentRgb();
    const centerX = width * 0.5;
    const centerY = height * 0.43;
    const pulse = 0.7 + state.energy * 0.5 + state.bass * 0.36;
    const urgency = clamp(1 - state.remaining / state.duration, 0, 1);

    drawFog(now, accent, centerX, centerY, pulse);
    drawParticles(now, accent, urgency);
    drawRadialPulses(accent, centerX, centerY, pulse, urgency);
  }

  function drawFog(now, accent, centerX, centerY, pulse) {
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.lineWidth = 1;

    for (let layer = 0; layer < 7; layer += 1) {
      const y = centerY + (layer - 3) * 18;
      const amplitude = 26 + layer * 7 + state.energy * 18;
      const phase = now * (0.00018 + layer * 0.00002);
      ctx.beginPath();
      for (let x = -80; x <= width + 80; x += 14) {
        const wave = Math.sin(x * 0.012 + phase + layer) * amplitude;
        const yPoint = y + wave + Math.sin(x * 0.027 - phase) * 7;
        if (x === -80) {
          ctx.moveTo(x, yPoint);
        } else {
          ctx.lineTo(x, yPoint);
        }
      }
      ctx.strokeStyle = `rgba(${accent.r}, ${accent.g}, ${accent.b}, ${0.025 + layer * 0.007 * pulse})`;
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawParticles(now, accent, urgency) {
    ctx.save();
    ctx.globalCompositeOperation = "screen";

    particles.forEach((particle) => {
      particle.y -= particle.speed * (0.16 + state.energy * 0.5);
      particle.x += Math.sin(now * 0.0003 + particle.drift) * 0.00018;

      if (particle.y < -0.04) {
        particle.y = 1.04;
        particle.x = Math.random();
      }

      const x = particle.x * width;
      const y = particle.y * height;
      const alpha = 0.05 + state.energy * 0.16 + urgency * 0.08;

      ctx.fillStyle = `rgba(${accent.r}, ${accent.g}, ${accent.b}, ${alpha})`;
      ctx.fillRect(x, y, particle.size, particle.size);
    });

    ctx.restore();
  }

  function drawRadialPulses(accent, centerX, centerY, pulse, urgency) {
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    const maxRadius = Math.min(width, height) * (0.23 + urgency * 0.03);
    for (let ring = 0; ring < 5; ring += 1) {
      const radius = maxRadius + ring * 34 + state.bass * 32;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * pulse, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${accent.r}, ${accent.g}, ${accent.b}, ${0.035 + state.bass * 0.08 - ring * 0.005})`;
      ctx.lineWidth = 1 + ring * 0.2;
      ctx.stroke();
    }
    ctx.restore();
  }

  function getAccentRgb() {
    const value = getComputedStyle(app).getPropertyValue("--accent").trim();
    return hexToRgb(value) || { r: 216, g: 255, b: 63 };
  }

  function hexToRgb(hex) {
    const normalized = hex.replace("#", "");
    if (normalized.length !== 6) return null;
    const bigint = parseInt(normalized, 16);
    return {
      r: (bigint >> 16) & 255,
      g: (bigint >> 8) & 255,
      b: bigint & 255
    };
  }

  function formatTime(totalSeconds) {
    const safeSeconds = Math.max(0, Math.round(totalSeconds));
    const minutes = Math.floor(safeSeconds / 60);
    const seconds = safeSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  function formatTrackTime(totalSeconds) {
    const safeSeconds = Math.max(0, Math.floor(totalSeconds));
    const minutes = Math.floor(safeSeconds / 60);
    const seconds = safeSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function openExternal(url) {
    if (window.tempoDesktop) {
      window.tempoDesktop.openExternal(url);
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  }

  makeBars(el.spectrumLeft, 72);
  makeBars(el.spectrumRight, 72);
  makeBars(el.waveform, 80);
  mountLists();
  attachEvents();
  resizeCanvas();
  updateStaticDom();
  requestAnimationFrame(tick);
})();
