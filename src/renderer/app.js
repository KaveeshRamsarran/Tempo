(() => {
  const app = document.querySelector(".app-shell");
  const canvas = document.getElementById("tempo-canvas");
  const ctx = canvas.getContext("2d", { alpha: true });
  const defaultSpotifyClientId = "ac068db0c6714a82b3d8de64da302fba";

  const tracks = [
    { title: "Midnight Drive", artist: "MOON", bpm: 78, energy: 0.64, duration: 206, uri: null },
    { title: "Night Drive", artist: "KAIZEN", bpm: 92, energy: 0.58, duration: 235, uri: null },
    { title: "Stargazing", artist: "EXILES", bpm: 112, energy: 0.72, duration: 261, uri: null },
    { title: "Fragments", artist: "OKASHI", bpm: 86, energy: 0.51, duration: 164, uri: null }
  ];

  const sessions = [
    { name: "Deep Work", minutes: 45, progress: 0.76, environment: "deep-work" },
    { name: "Study Session", minutes: 60, progress: 0.54, environment: "study" },
    { name: "Reading", minutes: 30, progress: 0.42, environment: "meditation" },
    { name: "Workout", minutes: 45, progress: 0.86, environment: "workout" },
    { name: "Meditation", minutes: 20, progress: 0.32, environment: "meditation" }
  ];

  const playlists = [
    { name: "Lofi Essentials", tracks: 24, active: true, contextUri: null, artwork: null, externalUrl: null },
    { name: "Focus Flow", tracks: 31, contextUri: null, artwork: null, externalUrl: null },
    { name: "Cinematic", tracks: 18, contextUri: null, artwork: null, externalUrl: null },
    { name: "Dark Ambient", tracks: 27, contextUri: null, artwork: null, externalUrl: null },
    { name: "Chill Vibes", tracks: 35, contextUri: null, artwork: null, externalUrl: null }
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

  const statRanges = {
    week: { time: "12H 42M", delta: "+18% from last week", bars: [56, 48, 38, 64, 78, 70, 84], sessions: 14, streak: "7 days", avg: 87 },
    month: { time: "49H 05M", delta: "+9% from last month", bars: [42, 62, 58, 71, 69, 82, 77], sessions: 48, streak: "16 days", avg: 84 },
    all: { time: "318H", delta: "prime flow archive", bars: [62, 74, 68, 80, 76, 88, 91], sessions: 312, streak: "41 days", avg: 89 }
  };

  const state = {
    running: false,
    sessionIndex: 0,
    sessionName: "Deep Work",
    activePlaylistIndex: 0,
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
    milestone: null,
    shuffle: false,
    repeat: "off",
    liked: true,
    volume: 72,
    spotify: {
      connected: false,
      deviceId: null,
      sdkReady: false,
      sdkError: null,
      player: null,
      isPlaying: false
    }
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
    shuffle: document.getElementById("shuffle"),
    repeat: document.getElementById("repeat"),
    previous: document.getElementById("previous-track"),
    next: document.getElementById("next-track"),
    volume: document.getElementById("volume-slider"),
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
    playlistTitle: document.querySelector(".playlist-card h2"),
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
    spotifyConnect: document.getElementById("spotify-connect"),
    heart: document.querySelector(".heart-button"),
    newSession: document.querySelector(".sessions-panel .line-button.small"),
    newPlaylist: document.querySelector(".playlists-panel .line-button.small"),
    viewPlaylist: document.querySelector(".queue-block .wide-button"),
    statHero: document.querySelector(".stat-hero"),
    statRow: document.querySelector(".stat-row")
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
          <span><strong>${escapeHtml(session.name)}</strong><span>${session.minutes} min</span></span>
          <b>PL</b>
        </button>
      `;
    }).join("");

    el.playlistList.innerHTML = playlists.map((playlist, index) => {
      const active = index === state.activePlaylistIndex ? " active" : "";
      const artStyle = playlist.artwork ? ` style="background-image:url('${escapeAttribute(playlist.artwork)}')"` : "";
      return `
        <button class="playlist-row${active}" data-playlist-index="${index}" type="button">
          <i class="mini-art${playlist.artwork ? " spotify-artwork" : ""}"${artStyle}></i>
          <span><strong>${escapeHtml(playlist.name)}</strong><span>${playlist.tracks} tracks</span></span>
          <b>AR</b>
        </button>
      `;
    }).join("");

    el.queueList.innerHTML = tracks.map((track, index) => {
      const active = index === state.trackIndex ? " active" : "";
      return `
        <button class="queue-item${active}" data-track-index="${index}" type="button">
          <i class="mini-art"></i>
          <span><strong>${escapeHtml(track.title)}</strong><span>${escapeHtml(track.artist)}</span></span>
          <time>${formatTrackTime(track.duration)}</time>
        </button>
      `;
    }).join("");

    el.presetGrid.innerHTML = presets.map((preset, index) => {
      const active = preset.name === state.sessionName && preset.minutes * 60 === state.duration ? " active" : "";
      return `
        <button class="preset-card${active}" data-preset-index="${index}" type="button">
          <span><strong>${escapeHtml(preset.name)}</strong><span>${preset.minutes} min</span></span>
          <i class="preset-orbit" style="--preset-angle:${preset.angle}deg"></i>
        </button>
      `;
    }).join("");

    el.environmentTabs.innerHTML = environments.map((environment) => {
      const active = environment.id === state.environment ? " active" : "";
      return `<button class="${active}" data-environment="${environment.id}" type="button">${environment.label}</button>`;
    }).join("");
  }

  function attachEvents() {
    el.playPause.addEventListener("click", togglePlayback);
    el.reset.addEventListener("click", resetTimer);
    el.add.addEventListener("click", addFiveMinutes);
    el.next.addEventListener("click", () => skipTrack(1));
    el.previous.addEventListener("click", () => skipTrack(-1));
    el.shuffle.addEventListener("click", toggleShuffle);
    el.repeat.addEventListener("click", cycleRepeat);
    el.volume.addEventListener("input", updateVolume);
    el.spotifyConnect.addEventListener("click", connectSpotify);
    el.editSession.addEventListener("click", editActiveSession);
    el.sessionTitle.addEventListener("click", editActiveSession);
    el.newSession.addEventListener("click", createSession);
    el.newPlaylist.addEventListener("click", createPlaylist);
    el.heart.addEventListener("click", toggleHeart);
    el.viewPlaylist.addEventListener("click", openActivePlaylist);
    el.completionClose.addEventListener("click", () => {
      el.completion.hidden = true;
    });

    document.querySelectorAll(".nav-item").forEach((button) => {
      button.addEventListener("click", () => {
        document.querySelectorAll(".nav-item").forEach((item) => item.classList.remove("active"));
        button.classList.add("active");
        focusPanel(button.dataset.panel);
      });
    });

    document.querySelectorAll(".mode-cluster [data-window-mode]").forEach((button) => {
      button.addEventListener("click", () => setWindowMode(button.dataset.windowMode));
    });

    document.querySelectorAll(".segmented button").forEach((button, index) => {
      const ranges = ["week", "month", "all"];
      button.dataset.range = ranges[index];
      button.addEventListener("click", () => setStatRange(button.dataset.range));
    });

    el.sessionList.addEventListener("click", (event) => {
      const row = event.target.closest("[data-session-index]");
      if (!row) return;
      selectSession(Number(row.dataset.sessionIndex));
    });

    el.playlistList.addEventListener("click", (event) => {
      const row = event.target.closest("[data-playlist-index]");
      if (!row) return;
      selectPlaylist(Number(row.dataset.playlistIndex));
    });

    el.queueList.addEventListener("click", (event) => {
      const row = event.target.closest("[data-track-index]");
      if (!row) return;
      selectTrack(Number(row.dataset.trackIndex));
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
    setSourceStatus(`${session.name} armed`);
  }

  function selectPreset(index) {
    const preset = presets[index];
    state.sessionName = preset.name;
    state.duration = preset.minutes * 60;
    state.remaining = state.duration;
    state.completed = false;
    state.running = false;
    mountLists();
    updateStaticDom();
    setSourceStatus(`${preset.name} preset`);
  }

  function selectPlaylist(index) {
    state.activePlaylistIndex = index;
    playlists.forEach((playlist, playlistIndex) => {
      playlist.active = playlistIndex === index;
    });
    mountLists();
    updateStaticDom();
    setSourceStatus(`${playlists[index].name} selected`);
  }

  function selectTrack(index) {
    state.trackIndex = index;
    state.trackElapsed = 0;
    const track = tracks[index];
    state.bpm = track.bpm || state.bpm;
    state.energy = track.energy || state.energy;
    mountLists();
    updateStaticDom();
    if (state.spotify.connected && track.uri) {
      playSpotify({ uris: [track.uri] });
    }
  }

  function editActiveSession() {
    const name = window.prompt("Session name", state.sessionName);
    if (name === null) return;

    const minutesText = window.prompt("Session length in minutes", String(Math.round(state.duration / 60)));
    if (minutesText === null) return;

    const minutes = clamp(Number.parseInt(minutesText, 10) || Math.round(state.duration / 60), 1, 999);
    state.sessionName = name.trim() || state.sessionName;
    state.duration = minutes * 60;
    state.remaining = Math.min(state.remaining, state.duration);
    sessions[state.sessionIndex] = { ...sessions[state.sessionIndex], name: state.sessionName, minutes };
    mountLists();
    updateStaticDom();
  }

  function createSession() {
    const name = window.prompt("New session name", "Focus Block");
    if (!name) return;

    const minutes = clamp(Number.parseInt(window.prompt("Minutes", "25") || "25", 10), 1, 999);
    sessions.unshift({ name: name.trim(), minutes, progress: 0, environment: state.environment });
    state.sessionIndex = 0;
    state.sessionName = name.trim();
    state.duration = minutes * 60;
    state.remaining = state.duration;
    mountLists();
    updateStaticDom();
  }

  function createPlaylist() {
    const name = window.prompt("Playlist label", "New Focus Source");
    if (!name) return;

    playlists.unshift({ name: name.trim(), tracks: 0, active: true, contextUri: null, artwork: null, externalUrl: null });
    state.activePlaylistIndex = 0;
    mountLists();
    updateStaticDom();
  }

  function toggleHeart() {
    state.liked = !state.liked;
    el.heart.classList.toggle("active", state.liked);
    el.heart.textContent = state.liked ? "HV" : "SV";
    setSourceStatus(state.liked ? "Track saved" : "Track unsaved");
  }

  function openActivePlaylist() {
    const playlist = playlists[state.activePlaylistIndex];
    if (playlist?.externalUrl) {
      openExternal(playlist.externalUrl);
      return;
    }
    setSourceStatus("No playlist URL");
  }

  function resetTimer() {
    state.remaining = state.duration;
    state.completed = false;
    state.running = false;
    updateStaticDom();
    setSourceStatus("Timer reset");
  }

  function addFiveMinutes() {
    state.duration += 5 * 60;
    state.remaining += 5 * 60;
    updateStaticDom();
    setSourceStatus("+5 min added");
  }

  async function togglePlayback() {
    if (state.running) {
      state.running = false;
      await pauseSpotify();
      updateStaticDom();
      return;
    }

    state.running = true;
    state.completed = false;
    updateStaticDom();
    await playSpotify();
  }

  async function skipTrack(direction) {
    if (state.spotify.connected) {
      try {
        await window.tempoDesktop.spotifyCommand({
          type: direction > 0 ? "next" : "previous",
          deviceId: state.spotify.deviceId
        });
        await pullSpotifyPlayback();
        return;
      } catch (error) {
        showSpotifyError(error);
      }
    }

    changeLocalTrack(direction);
  }

  function changeLocalTrack(direction) {
    state.trackIndex = (state.trackIndex + direction + tracks.length) % tracks.length;
    state.trackElapsed = 0;
    const track = tracks[state.trackIndex];
    state.bpm = track.bpm || state.bpm;
    state.energy = track.energy || state.energy;
    mountLists();
    updateStaticDom();
  }

  async function toggleShuffle() {
    state.shuffle = !state.shuffle;
    el.shuffle.classList.toggle("active", state.shuffle);
    if (state.spotify.connected) {
      try {
        await window.tempoDesktop.spotifyCommand({ type: "shuffle", state: state.shuffle, deviceId: state.spotify.deviceId });
      } catch (error) {
        showSpotifyError(error);
      }
    }
    setSourceStatus(state.shuffle ? "Shuffle on" : "Shuffle off");
  }

  async function cycleRepeat() {
    state.repeat = state.repeat === "off" ? "context" : state.repeat === "context" ? "track" : "off";
    el.repeat.classList.toggle("active", state.repeat !== "off");
    el.repeat.textContent = state.repeat === "track" ? "R1" : state.repeat === "context" ? "RP" : "RP";
    if (state.spotify.connected) {
      try {
        await window.tempoDesktop.spotifyCommand({ type: "repeat", state: state.repeat, deviceId: state.spotify.deviceId });
      } catch (error) {
        showSpotifyError(error);
      }
    }
    setSourceStatus(`Repeat ${state.repeat}`);
  }

  async function updateVolume() {
    state.volume = Number(el.volume.value);
    if (state.spotify.player?.setVolume) {
      state.spotify.player.setVolume(state.volume / 100);
    }
    if (state.spotify.connected) {
      try {
        await window.tempoDesktop.spotifyCommand({
          type: "volume",
          volumePercent: state.volume,
          deviceId: state.spotify.deviceId
        });
      } catch (error) {
        showSpotifyError(error);
      }
    }
  }

  function setEnvironment(id) {
    state.environment = id;
    app.dataset.environment = id;
    document.querySelectorAll("[data-environment]").forEach((button) => {
      button.classList.toggle("active", button.dataset.environment === id);
    });
    setSourceStatus(`${environmentName(id)} environment`);
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

  function focusPanel(panel) {
    document.querySelectorAll(".deck-panel, .right-panel, .command-center").forEach((target) => {
      target.classList.remove("focused");
    });

    const map = {
      now: ".right-panel",
      timer: ".command-center",
      playlists: ".playlists-panel",
      sessions: ".sessions-panel",
      analytics: ".stats-panel",
      library: ".playlists-panel",
      settings: ".visualizer-panel"
    };

    const target = document.querySelector(map[panel]);
    if (target) target.classList.add("focused");
    setSourceStatus(`${panel} panel`);
  }

  function setStatRange(range) {
    const data = statRanges[range] || statRanges.week;
    document.querySelectorAll(".segmented button").forEach((button) => {
      button.classList.toggle("active", button.dataset.range === range);
    });
    el.statHero.innerHTML = `
      <span>Focus time</span>
      <strong>${data.time}</strong>
      <em>${data.delta}</em>
    `;
    el.barChart.innerHTML = data.bars.map((heightValue) => `<span style="height:${heightValue}%"></span>`).join("");
    el.statRow.innerHTML = `
      <span>Sessions <strong>${data.sessions}</strong></span>
      <span>Longest streak <strong>${data.streak}</strong></span>
      <span>Avg focus <strong id="avg-focus">${data.avg}%</strong></span>
    `;
    el.avgFocus = document.getElementById("avg-focus");
  }

  function updateSessionLabels(name, minutes) {
    el.sessionTitle.textContent = name;
    el.editSession.textContent = name;
    el.sessionSubtitle.textContent = `${minutes} min focus`;
  }

  function updateStaticDom() {
    updateSessionLabels(state.sessionName, Math.round(state.duration / 60));

    const track = tracks[state.trackIndex];
    const playlist = playlists[state.activePlaylistIndex];
    el.trackMain.textContent = track.title;
    el.artistMain.textContent = track.artist;
    el.trackTitle.textContent = track.title;
    el.trackArtist.textContent = track.artist;
    el.bpm.textContent = String(track.bpm || state.bpm);
    el.trackLength.textContent = formatTrackTime(track.duration);
    el.playPause.textContent = state.running ? "II" : "PL";
    el.playlistTitle.textContent = playlist?.name || "No playlist";
    el.shuffle.classList.toggle("active", state.shuffle);
    el.repeat.classList.toggle("active", state.repeat !== "off");
    el.heart.classList.toggle("active", state.liked);
  }

  async function connectSpotify() {
    if (!window.tempoDesktop?.spotifyLogin) {
      openExternal("https://developer.spotify.com/documentation/web-api/tutorials/code-pkce-flow");
      pulseButtonLabel(el.spotifyConnect, "Open in Electron");
      return;
    }

    const clientId = (localStorage.getItem("tempo.spotify.clientId") || defaultSpotifyClientId).trim();
    localStorage.setItem("tempo.spotify.clientId", clientId);
    el.spotifyConnect.textContent = "Awaiting login";
    setSourceStatus("Spotify login");

    try {
      await window.tempoDesktop.spotifyLogin(clientId);
      state.spotify.connected = true;
      el.spotifyConnect.textContent = "Spotify linked";
      await initializeSpotifyPlayer();
      await loadSpotifyPlaylists();
      await pullSpotifyPlayback();
      startSpotifyPolling();
    } catch (error) {
      showSpotifyError(error);
      pulseButtonLabel(el.spotifyConnect, "Login failed");
    }
  }

  async function resumeSpotifyIfPossible() {
    if (!window.tempoDesktop?.spotifyAccessToken) return;

    try {
      const token = await window.tempoDesktop.spotifyAccessToken();
      if (!token.connected) return;
      state.spotify.connected = true;
      el.spotifyConnect.textContent = "Spotify linked";
      await initializeSpotifyPlayer();
      await loadSpotifyPlaylists();
      await pullSpotifyPlayback();
      startSpotifyPolling();
    } catch (error) {
      showSpotifyError(error);
    }
  }

  async function initializeSpotifyPlayer() {
    if (!window.tempoDesktop?.spotifyAccessToken || state.spotify.sdkReady || state.spotify.player) return;

    try {
      await loadSpotifySdk();

      state.spotify.player = new window.Spotify.Player({
        name: "TEMPO Cockpit",
        volume: state.volume / 100,
        enableMediaSession: true,
        getOAuthToken: async (callback) => {
          const token = await window.tempoDesktop.spotifyAccessToken();
          callback(token.accessToken);
        }
      });

      state.spotify.player.addListener("ready", ({ device_id }) => {
        state.spotify.deviceId = device_id;
        state.spotify.sdkReady = true;
        setSourceStatus("TEMPO device ready");
      });

      state.spotify.player.addListener("not_ready", () => {
        state.spotify.sdkReady = false;
        setSourceStatus("TEMPO device offline");
      });

      ["initialization_error", "authentication_error", "account_error", "playback_error"].forEach((eventName) => {
        state.spotify.player.addListener(eventName, ({ message }) => {
          state.spotify.sdkError = message;
          setSourceStatus(shortStatus(message));
        });
      });

      state.spotify.player.addListener("player_state_changed", (playbackState) => {
        if (!playbackState?.track_window?.current_track) return;
        applySdkPlayback(playbackState);
      });

      const connected = await state.spotify.player.connect();
      state.spotify.sdkReady = Boolean(connected);
      if (!connected) {
        setSourceStatus("SDK unavailable");
      }
    } catch (error) {
      state.spotify.sdkError = error.message;
      setSourceStatus(shortStatus(error.message || "SDK error"));
    }
  }

  function loadSpotifySdk() {
    if (window.Spotify?.Player) return Promise.resolve();

    return new Promise((resolve, reject) => {
      const existing = document.querySelector("script[data-spotify-sdk]");
      window.onSpotifyWebPlaybackSDKReady = () => resolve();

      if (existing) {
        const startedAt = Date.now();
        const waitForSdk = window.setInterval(() => {
          if (window.Spotify?.Player) {
            window.clearInterval(waitForSdk);
            resolve();
          } else if (Date.now() - startedAt > 12000) {
            window.clearInterval(waitForSdk);
            reject(new Error("Spotify Web Playback SDK timed out."));
          }
        }, 120);
        return;
      }

      const script = document.createElement("script");
      script.src = "https://sdk.scdn.co/spotify-player.js";
      script.async = true;
      script.dataset.spotifySdk = "true";
      script.onerror = () => reject(new Error("Could not load Spotify Web Playback SDK."));
      window.setTimeout(() => {
        if (!window.Spotify?.Player) {
          reject(new Error("Spotify Web Playback SDK timed out."));
        }
      }, 12000);
      document.head.appendChild(script);
    });
  }

  async function loadSpotifyPlaylists() {
    if (!window.tempoDesktop?.spotifyPlaylists) return;

    try {
      const response = await window.tempoDesktop.spotifyPlaylists();
      if (!response.connected || !Array.isArray(response.items)) return;

      playlists.splice(0, playlists.length, ...response.items.map((playlist, index) => ({
        name: playlist.name,
        tracks: playlist.tracks,
        active: index === 0,
        contextUri: playlist.uri,
        artwork: playlist.artwork,
        externalUrl: playlist.externalUrl
      })));
      state.activePlaylistIndex = 0;
      mountLists();
      updateStaticDom();
    } catch (error) {
      showSpotifyError(error);
    }
  }

  async function pullSpotifyPlayback() {
    if (!window.tempoDesktop?.spotifyCurrentPlayback) return;

    try {
      const playback = await window.tempoDesktop.spotifyCurrentPlayback();
      if (!playback.connected) {
        setSourceStatus("Spotify offline");
        return;
      }

      if (!playback.active || !playback.track) {
        setSourceStatus(state.spotify.deviceId ? "Press play in TEMPO" : "No active device");
        return;
      }

      applySpotifyPlayback(playback);
      setSourceStatus(playback.device || "Spotify live");
    } catch (error) {
      showSpotifyError(error);
    }
  }

  async function playSpotify(options = {}) {
    if (!state.spotify.connected || !window.tempoDesktop?.spotifyCommand) {
      return;
    }

    try {
      if (state.spotify.deviceId) {
        await window.tempoDesktop.spotifyCommand({ type: "transfer", deviceId: state.spotify.deviceId, play: false });
      }

      const playlist = playlists[state.activePlaylistIndex];
      const track = tracks[state.trackIndex];
      const command = {
        type: "play",
        deviceId: state.spotify.deviceId,
        contextUri: options.contextUri || playlist?.contextUri || undefined,
        uris: options.uris || (track.uri ? [track.uri] : undefined)
      };

      await window.tempoDesktop.spotifyCommand(command);
      state.spotify.isPlaying = true;
      setSourceStatus(state.spotify.deviceId ? "Playing in TEMPO" : "Playback started");
      window.setTimeout(pullSpotifyPlayback, 850);
    } catch (error) {
      showSpotifyError(error);
    }
  }

  async function pauseSpotify() {
    if (!state.spotify.connected || !window.tempoDesktop?.spotifyCommand) return;

    try {
      await window.tempoDesktop.spotifyCommand({ type: "pause", deviceId: state.spotify.deviceId });
      state.spotify.isPlaying = false;
      setSourceStatus("Playback paused");
    } catch (error) {
      showSpotifyError(error);
    }
  }

  function applySpotifyPlayback(playback) {
    const duration = Math.max(1, Math.round(playback.track.durationMs / 1000));
    tracks[state.trackIndex] = {
      ...tracks[state.trackIndex],
      title: playback.track.title,
      artist: playback.track.artist,
      duration,
      uri: playback.track.uri,
      energy: playback.isPlaying ? 0.68 : 0.38
    };
    state.trackElapsed = Math.round(playback.progressMs / 1000);
    state.energy = playback.isPlaying ? 0.68 : 0.38;
    state.spotify.isPlaying = playback.isPlaying;
    state.running = state.running || Boolean(playback.isPlaying);

    if (playback.track.artwork) {
      el.albumArt.classList.add("spotify-artwork");
      el.albumArt.style.backgroundImage = `url("${playback.track.artwork}")`;
    }

    mountLists();
    updateStaticDom();
  }

  function applySdkPlayback(playbackState) {
    const current = playbackState.track_window.current_track;
    tracks[state.trackIndex] = {
      ...tracks[state.trackIndex],
      title: current.name || "Spotify Track",
      artist: current.artists?.map((artist) => artist.name).join(", ") || "",
      duration: Math.max(1, Math.round((playbackState.duration || 0) / 1000)),
      uri: current.uri,
      energy: playbackState.paused ? 0.38 : 0.72
    };
    state.trackElapsed = Math.round((playbackState.position || 0) / 1000);
    state.spotify.isPlaying = !playbackState.paused;
    if (current.album?.images?.length) {
      el.albumArt.classList.add("spotify-artwork");
      el.albumArt.style.backgroundImage = `url("${current.album.images[0].url}")`;
    }
    mountLists();
    updateStaticDom();
  }

  function startSpotifyPolling() {
    window.clearInterval(startSpotifyPolling.timer);
    startSpotifyPolling.timer = window.setInterval(pullSpotifyPlayback, 12000);
  }

  function showSpotifyError(error) {
    const message = friendlySpotifyError(error?.message || String(error));
    console.error(error);
    setSourceStatus(message);
    if (message.includes("403")) {
      el.spotifyConnect.textContent = "Reauth Spotify";
    }
  }

  function friendlySpotifyError(message) {
    if (message.includes("403")) {
      return "403 scope/account";
    }
    if (message.includes("404")) {
      return "No device";
    }
    if (message.includes("401")) {
      return "Login expired";
    }
    if (message.includes("Premium") || message.includes("premium")) {
      return "Premium needed";
    }
    return shortStatus(message);
  }

  function setSourceStatus(message) {
    el.source.textContent = shortStatus(message);
  }

  function shortStatus(message) {
    return String(message || "Ready").replace(/^Error:\s*/i, "").slice(0, 18);
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
    if (el.avgFocus) {
      el.avgFocus.textContent = `${Math.round(84 + state.energy * 6)}%`;
    }

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
    pauseSpotify();
    updateStaticDom();
  }

  function tick(now) {
    const delta = Math.min((now - lastFrame) / 1000, 0.12);
    lastFrame = now;

    const track = tracks[state.trackIndex];
    const beatPhase = (now / 1000) * ((track.bpm || state.bpm) / 60) * Math.PI * 2;
    const bass = Math.pow(Math.max(0, Math.sin(beatPhase)), 3);
    const shimmer = Math.sin(now * 0.0017) * 0.5 + 0.5;
    state.bass = bass;
    state.energy = clamp(track.energy * 0.68 + bass * 0.24 + shimmer * 0.12, 0.18, 1);

    if (state.running && !state.completed) {
      state.remaining = Math.max(0, state.remaining - delta);
      if (!state.spotify.isPlaying) {
        state.trackElapsed = (state.trackElapsed + delta) % track.duration;
      }
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

  function environmentName(id) {
    return environments.find((environment) => environment.id === id)?.label || "Focus";
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function escapeAttribute(value) {
    return escapeHtml(value).replace(/\(/g, "%28").replace(/\)/g, "%29");
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
  setStatRange("week");
  attachEvents();
  resizeCanvas();
  updateStaticDom();
  resumeSpotifyIfPossible();
  requestAnimationFrame(tick);
})();
