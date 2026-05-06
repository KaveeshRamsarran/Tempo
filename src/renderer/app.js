(() => {
  const app = document.querySelector(".tempo-app");
  const canvas = document.getElementById("tempo-canvas");
  const ctx = canvas.getContext("2d", { alpha: true });
  const defaultSpotifyClientId = "ac068db0c6714a82b3d8de64da302fba";

  const sessions = [
    { name: "Deep Work", minutes: 45, environment: "deep-work" },
    { name: "Study", minutes: 60, environment: "study" },
    { name: "Workout", minutes: 45, environment: "workout" },
    { name: "Meditation", minutes: 20, environment: "meditation" },
    { name: "Creative Flow", minutes: 90, environment: "creative-flow" }
  ];

  const presets = [
    { name: "Deep Work", minutes: 45 },
    { name: "Study", minutes: 60 },
    { name: "Workout", minutes: 45 },
    { name: "Meditation", minutes: 20 },
    { name: "Pomodoro", minutes: 25 },
    { name: "Custom", minutes: 15 }
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

  const playlists = [
    { name: "Lofi Essentials", tracks: 24, uri: null, url: null, artwork: null },
    { name: "Focus Flow", tracks: 31, uri: null, url: null, artwork: null },
    { name: "Cinematic", tracks: 18, uri: null, url: null, artwork: null },
    { name: "Dark Ambient", tracks: 27, uri: null, url: null, artwork: null }
  ];

  const tracks = [
    { title: "Midnight Drive", artist: "MOON", duration: 206, bpm: 78, energy: 0.64, uri: null, artwork: null },
    { title: "Night Drive", artist: "KAIZEN", duration: 235, bpm: 92, energy: 0.58, uri: null, artwork: null },
    { title: "Stargazing", artist: "EXILES", duration: 261, bpm: 112, energy: 0.72, uri: null, artwork: null },
    { title: "Fragments", artist: "OKASHI", duration: 164, bpm: 86, energy: 0.51, uri: null, artwork: null }
  ];

  const songs = tracks.map((track) => ({ ...track }));

  const ranges = {
    week: { time: "12H 42M", label: "+18% from last week", bars: [54, 46, 38, 62, 72, 68, 80] },
    month: { time: "49H 05M", label: "+9% from last month", bars: [42, 62, 58, 71, 69, 82, 77] },
    all: { time: "318H", label: "prime flow archive", bars: [62, 74, 68, 80, 76, 88, 91] }
  };

  const state = {
    timerRunning: false,
    spotifyPlaying: false,
    sessionIndex: 0,
    playlistIndex: 0,
    trackIndex: 0,
    duration: 45 * 60,
    remaining: 45 * 60,
    trackElapsed: 0,
    environment: "deep-work",
    volume: 72,
    shuffle: false,
    repeat: "off",
    saved: false,
    spotify: {
      connected: false,
      deviceId: null,
      player: null,
      sdkReady: false
    },
    energy: 0.64,
    bass: 0,
    source: "Spotify online"
  };

  const el = {
    source: document.getElementById("source-readout"),
    device: document.getElementById("device-readout"),
    spotifyConnect: document.getElementById("spotify-connect"),
    spotifyRefresh: document.getElementById("spotify-refresh"),
    sessionList: document.getElementById("session-list"),
    environmentList: document.getElementById("environment-list"),
    playlistList: document.getElementById("playlist-list"),
    queueList: document.getElementById("queue-list"),
    presetGrid: document.getElementById("preset-grid"),
    editSession: document.getElementById("edit-session"),
    sessionSubtitle: document.getElementById("session-subtitle"),
    timerState: document.getElementById("timer-state"),
    timerDisplay: document.getElementById("timer-display"),
    timerDetail: document.getElementById("timer-detail"),
    playPause: document.getElementById("play-pause"),
    reset: document.getElementById("timer-reset"),
    add: document.getElementById("timer-add"),
    prev: document.getElementById("previous-track"),
    next: document.getElementById("next-track"),
    seekBack: document.getElementById("seek-back"),
    seekForward: document.getElementById("seek-forward"),
    seekRail: document.getElementById("track-seek"),
    elapsedTrack: document.getElementById("elapsed-track"),
    trackLength: document.getElementById("track-length"),
    trackProgress: document.getElementById("track-progress-bar"),
    trackTitle: document.getElementById("track-title"),
    trackArtist: document.getElementById("track-artist"),
    albumArt: document.getElementById("album-art"),
    waveform: document.getElementById("waveform-line"),
    centerWavefield: document.getElementById("center-wavefield"),
    nowPrev: document.getElementById("now-prev"),
    nowPlay: document.getElementById("now-play"),
    nowNext: document.getElementById("now-next"),
    shuffle: document.getElementById("shuffle"),
    repeat: document.getElementById("repeat"),
    volume: document.getElementById("volume-slider"),
    save: document.getElementById("save-track"),
    viewPlaylist: document.getElementById("view-playlist"),
    newSession: document.getElementById("new-session"),
    newPlaylist: document.getElementById("new-playlist"),
    loadSongs: document.getElementById("load-songs"),
    songList: document.getElementById("song-list"),
    songSearch: document.getElementById("song-search"),
    songSearchButton: document.getElementById("song-search-button"),
    statCopy: document.getElementById("stat-copy"),
    barChart: document.getElementById("bar-chart"),
    bpm: document.getElementById("bpm-readout"),
    energy: document.getElementById("energy-readout"),
    focus: document.getElementById("focus-readout"),
    completion: document.getElementById("completion-sequence"),
    completionClose: document.getElementById("completion-close")
  };

  const particles = Array.from({ length: 120 }, () => ({
    x: Math.random(),
    y: Math.random(),
    z: Math.random(),
    speed: 0.04 + Math.random() * 0.08
  }));

  let width = 0;
  let height = 0;
  let dpr = 1;
  let last = performance.now();

  function mount() {
    renderSessions();
    renderEnvironments();
    renderPresets();
    renderPlaylists();
    renderQueue();
    renderSongs();
    renderWaveform();
    renderCenterWavefield();
    renderStats("week");
    updateAll();
    bindEvents();
    resizeCanvas();
    resumeSpotify();
    requestAnimationFrame(tick);
  }

  function bindEvents() {
    el.playPause.addEventListener("click", toggleTimerAndPlayback);
    el.nowPlay.addEventListener("click", toggleTimerAndPlayback);
    el.reset.addEventListener("click", resetTimer);
    el.add.addEventListener("click", addFiveMinutes);
    el.prev.addEventListener("click", previousTrack);
    el.next.addEventListener("click", nextTrack);
    el.nowPrev.addEventListener("click", previousTrack);
    el.nowNext.addEventListener("click", nextTrack);
    el.seekBack.addEventListener("click", () => seekBy(-15));
    el.seekForward.addEventListener("click", () => seekBy(15));
    el.seekRail.addEventListener("click", seekFromClick);
    el.shuffle.addEventListener("click", toggleShuffle);
    el.repeat.addEventListener("click", cycleRepeat);
    el.volume.addEventListener("input", changeVolume);
    el.save.addEventListener("click", toggleSave);
    el.spotifyConnect.addEventListener("click", connectSpotify);
    el.spotifyRefresh.addEventListener("click", refreshSpotifyData);
    el.editSession.addEventListener("click", editSession);
    el.newSession.addEventListener("click", createSession);
    el.newPlaylist.addEventListener("click", createPlaylist);
    el.loadSongs.addEventListener("click", loadSpotifyTracks);
    el.songSearchButton.addEventListener("click", searchSongs);
    el.songSearch.addEventListener("keydown", (event) => {
      if (event.key === "Enter") searchSongs();
    });
    el.viewPlaylist.addEventListener("click", openPlaylist);
    el.completionClose.addEventListener("click", () => {
      el.completion.hidden = true;
    });

    document.querySelectorAll("[data-window-mode]").forEach((button) => {
      button.addEventListener("click", () => setWindowMode(button.dataset.windowMode));
    });

    document.querySelectorAll("[data-range]").forEach((button) => {
      button.addEventListener("click", () => {
        document.querySelectorAll("[data-range]").forEach((item) => item.classList.remove("active"));
        button.classList.add("active");
        renderStats(button.dataset.range);
      });
    });

    el.sessionList.addEventListener("click", (event) => {
      const button = event.target.closest("[data-session]");
      if (button) selectSession(Number(button.dataset.session));
    });

    el.environmentList.addEventListener("click", (event) => {
      const button = event.target.closest("[data-environment]");
      if (button) setEnvironment(button.dataset.environment);
    });

    el.presetGrid.addEventListener("click", (event) => {
      const button = event.target.closest("[data-preset]");
      if (button) selectPreset(Number(button.dataset.preset));
    });

    el.playlistList.addEventListener("click", (event) => {
      const button = event.target.closest("[data-playlist]");
      if (button) selectPlaylist(Number(button.dataset.playlist));
    });

    el.queueList.addEventListener("click", (event) => {
      const button = event.target.closest("[data-track]");
      if (button) selectTrack(Number(button.dataset.track), true);
    });

    el.songList.addEventListener("click", (event) => {
      const button = event.target.closest("[data-song]");
      if (button) selectSong(Number(button.dataset.song));
    });

    window.addEventListener("resize", resizeCanvas);

    if (window.tempoDesktop) {
      window.tempoDesktop.onNativeMode((mode) => {
        document.querySelectorAll("[data-window-mode]").forEach((button) => {
          button.classList.toggle("active", button.dataset.windowMode === mode);
        });
      });
    }
  }

  function renderSessions() {
    el.sessionList.innerHTML = sessions.map((session, index) => `
      <button class="list-button${index === state.sessionIndex ? " active" : ""}" data-session="${index}" type="button">
        <i></i>
        <span><strong>${escapeHtml(session.name)}</strong><small>${session.minutes} min focus</small></span>
        <em>Load</em>
      </button>
    `).join("");
  }

  function renderEnvironments() {
    el.environmentList.innerHTML = environments.map((environment) => `
      <button class="${environment.id === state.environment ? "active" : ""}" data-environment="${environment.id}" type="button">${environment.label}</button>
    `).join("");
  }

  function renderPresets() {
    el.presetGrid.innerHTML = presets.map((preset, index) => `
      <button class="preset-button" data-preset="${index}" type="button">
        <strong>${escapeHtml(preset.name)}</strong>
        <small>${preset.minutes} min</small>
      </button>
    `).join("");
  }

  function renderPlaylists() {
    el.playlistList.innerHTML = playlists.map((playlist, index) => {
      const art = playlist.artwork ? ` style="background-image:url('${escapeAttribute(playlist.artwork)}')"` : "";
      return `
        <button class="playlist-button${index === state.playlistIndex ? " active" : ""}" data-playlist="${index}" type="button">
          <i class="${playlist.artwork ? "spotify-artwork" : ""}"${art}></i>
          <span><strong>${escapeHtml(playlist.name)}</strong><small>${playlist.tracks} tracks</small></span>
        </button>
      `;
    }).join("");
  }

  function renderQueue() {
    el.queueList.innerHTML = tracks.map((track, index) => `
      <button class="queue-button${index === state.trackIndex ? " active" : ""}" data-track="${index}" type="button">
        <i class="${track.artwork ? "spotify-artwork" : ""}"${track.artwork ? ` style="background-image:url('${escapeAttribute(track.artwork)}')"` : ""}></i>
        <span><strong>${escapeHtml(track.title)}</strong><small>${escapeHtml(track.artist)}</small></span>
        <em>${formatTrackTime(track.duration)}</em>
      </button>
    `).join("");
  }

  function renderSongs() {
    el.songList.innerHTML = songs.map((song, index) => `
      <button class="song-button${song.uri && song.uri === tracks[state.trackIndex]?.uri ? " active" : ""}" data-song="${index}" type="button">
        <i class="${song.artwork ? "spotify-artwork" : ""}"${song.artwork ? ` style="background-image:url('${escapeAttribute(song.artwork)}')"` : ""}></i>
        <span><strong>${escapeHtml(song.title)}</strong><small>${escapeHtml(song.artist)}</small></span>
        <em>Play</em>
      </button>
    `).join("");
  }

  function renderWaveform() {
    el.waveform.innerHTML = Array.from({ length: 56 }, () => "<span></span>").join("");
  }

  function renderCenterWavefield() {
    el.centerWavefield.innerHTML = Array.from({ length: 96 }, () => "<span></span>").join("");
  }

  function renderStats(range) {
    const data = ranges[range] || ranges.week;
    el.statCopy.innerHTML = `<strong>${data.time}</strong><small>${data.label}</small>`;
    el.barChart.innerHTML = data.bars.map((bar) => `<span style="height:${bar}%"></span>`).join("");
  }

  function selectSession(index) {
    const session = sessions[index];
    state.sessionIndex = index;
    state.duration = session.minutes * 60;
    state.remaining = state.duration;
    state.timerRunning = false;
    state.environment = session.environment;
    app.dataset.environment = state.environment;
    renderSessions();
    renderEnvironments();
    updateAll();
    setStatus(`${session.name} armed`);
  }

  function selectPreset(index) {
    const preset = presets[index];
    sessions[state.sessionIndex].name = preset.name;
    sessions[state.sessionIndex].minutes = preset.minutes;
    state.duration = preset.minutes * 60;
    state.remaining = state.duration;
    state.timerRunning = false;
    renderSessions();
    updateAll();
    setStatus(`${preset.name} preset`);
  }

  function selectPlaylist(index) {
    state.playlistIndex = index;
    renderPlaylists();
    setStatus(`${playlists[index].name} selected`);
  }

  function selectTrack(index, playNow) {
    state.trackIndex = index;
    state.trackElapsed = 0;
    renderQueue();
    renderSongs();
    updateAll();
    if (playNow && tracks[index].uri) {
      spotifyPlay({ uris: [tracks[index].uri] });
    }
  }

  function selectSong(index) {
    const song = songs[index];
    if (!song) return;

    const existingIndex = tracks.findIndex((track) => track.uri && track.uri === song.uri);
    if (existingIndex >= 0) {
      selectTrack(existingIndex, true);
      return;
    }

    tracks.unshift({ ...song });
    state.trackIndex = 0;
    state.trackElapsed = 0;
    renderQueue();
    renderSongs();
    updateAll();
    spotifyPlay({ uris: song.uri ? [song.uri] : undefined });
  }

  function setEnvironment(id) {
    state.environment = id;
    sessions[state.sessionIndex].environment = id;
    app.dataset.environment = id;
    renderEnvironments();
    setStatus(`${id.replace(/-/g, " ")} mode`);
  }

  function editSession() {
    const current = sessions[state.sessionIndex];
    const name = window.prompt("Session name", current.name);
    if (name === null) return;
    const minutes = Number.parseInt(window.prompt("Minutes", String(current.minutes)) || String(current.minutes), 10);
    current.name = name.trim() || current.name;
    current.minutes = clamp(minutes || current.minutes, 1, 999);
    state.duration = current.minutes * 60;
    state.remaining = Math.min(state.remaining, state.duration);
    renderSessions();
    updateAll();
  }

  function createSession() {
    const nextNumber = sessions.length + 1;
    const minutes = 25;
    sessions.unshift({ name: `Focus Block ${nextNumber}`, minutes, environment: state.environment });
    state.sessionIndex = 0;
    state.duration = minutes * 60;
    state.remaining = state.duration;
    renderSessions();
    renderEnvironments();
    updateAll();
    setStatus("Session created");
  }

  function createPlaylist() {
    const nextNumber = playlists.length + 1;
    playlists.unshift({ name: `Manual Source ${nextNumber}`, tracks: 0, uri: null, url: null, artwork: null });
    state.playlistIndex = 0;
    renderPlaylists();
    setStatus("Playlist created");
  }

  async function toggleTimerAndPlayback() {
    state.timerRunning = !state.timerRunning;
    updateAll();

    if (state.timerRunning) {
      await spotifyPlay();
    } else {
      await spotifyPause();
    }
  }

  function resetTimer() {
    state.timerRunning = false;
    state.remaining = state.duration;
    updateAll();
    setStatus("Timer reset");
  }

  function addFiveMinutes() {
    state.duration += 300;
    state.remaining += 300;
    updateAll();
    setStatus("+5 minutes");
  }

  async function previousTrack() {
    if (state.spotify.connected && state.spotify.deviceId) {
      const ok = await spotifyCommand({ type: "previous", deviceId: state.spotify.deviceId });
      if (ok) return;
    }
    selectTrack((state.trackIndex - 1 + tracks.length) % tracks.length, false);
  }

  async function nextTrack() {
    if (state.spotify.connected && state.spotify.deviceId) {
      const ok = await spotifyCommand({ type: "next", deviceId: state.spotify.deviceId });
      if (ok) return;
    }
    selectTrack((state.trackIndex + 1) % tracks.length, false);
  }

  function seekBy(seconds) {
    const track = tracks[state.trackIndex];
    state.trackElapsed = clamp(state.trackElapsed + seconds, 0, track.duration);
    updateAll();
    if (state.spotify.deviceId) {
      spotifyCommand({ type: "seek", positionMs: Math.round(state.trackElapsed * 1000), deviceId: state.spotify.deviceId });
    }
  }

  function seekFromClick(event) {
    const rect = el.seekRail.getBoundingClientRect();
    const ratio = clamp((event.clientX - rect.left) / rect.width, 0, 1);
    state.trackElapsed = ratio * tracks[state.trackIndex].duration;
    updateAll();
    if (state.spotify.deviceId) {
      spotifyCommand({ type: "seek", positionMs: Math.round(state.trackElapsed * 1000), deviceId: state.spotify.deviceId });
    }
  }

  async function toggleShuffle() {
    state.shuffle = !state.shuffle;
    updateAll();
    if (!state.spotify.deviceId) {
      setStatus(state.shuffle ? "Shuffle armed" : "Shuffle off");
      return;
    }
    await spotifyCommand({ type: "shuffle", state: state.shuffle, deviceId: state.spotify.deviceId });
  }

  async function cycleRepeat() {
    state.repeat = state.repeat === "off" ? "context" : state.repeat === "context" ? "track" : "off";
    updateAll();
    if (!state.spotify.deviceId) {
      setStatus(`Repeat ${state.repeat}`);
      return;
    }
    await spotifyCommand({ type: "repeat", state: state.repeat, deviceId: state.spotify.deviceId });
  }

  async function changeVolume() {
    state.volume = Number(el.volume.value);
    if (state.spotify.player?.setVolume) {
      state.spotify.player.setVolume(state.volume / 100);
    }
    if (!state.spotify.deviceId) {
      setStatus(`Volume ${state.volume}%`);
      return;
    }
    await spotifyCommand({ type: "volume", volumePercent: state.volume, deviceId: state.spotify.deviceId });
  }

  function toggleSave() {
    state.saved = !state.saved;
    updateAll();
    setStatus(state.saved ? "Track saved" : "Track unsaved");
  }

  function openPlaylist() {
    const playlist = playlists[state.playlistIndex];
    if (playlist?.url) {
      openExternal(playlist.url);
      return;
    }
    setStatus("No playlist URL");
  }

  async function connectSpotify() {
    if (!window.tempoDesktop?.spotifyLogin) {
      setStatus("Electron only");
      return;
    }

    try {
      if (window.tempoDesktop.spotifyDisconnect) {
        await window.tempoDesktop.spotifyDisconnect();
      }
      setStatus("Approve Spotify");
      el.spotifyConnect.textContent = "Approve";
      await window.tempoDesktop.spotifyLogin(defaultSpotifyClientId);
      state.spotify.connected = true;
      el.spotifyConnect.textContent = "Spotify online";
      updateDeviceStatus();
      setStatus("Spotify online");
      await setupSpotifyPlayer();
      await loadSpotifyPlaylists();
      await loadSpotifyTracks();
      await refreshSpotifyPlayback();
      startSpotifyPolling();
    } catch (error) {
      showSpotifyError(error);
    }
  }

  async function resumeSpotify() {
    if (!window.tempoDesktop?.spotifyAccessToken) return;

    const token = await window.tempoDesktop.spotifyAccessToken();
    if (token.error) {
      showSpotifyError(token.error);
      return;
    }
    if (!token.connected) return;

    state.spotify.connected = true;
    el.spotifyConnect.textContent = "Spotify online";
    updateDeviceStatus();
    await setupSpotifyPlayer();
    await loadSpotifyPlaylists();
    await loadSpotifyTracks();
    await refreshSpotifyPlayback();
    startSpotifyPolling();
  }

  async function setupSpotifyPlayer() {
    if (!window.tempoDesktop?.spotifyAccessToken || state.spotify.player) return;

    try {
      await loadSpotifySdk();
      state.spotify.player = new window.Spotify.Player({
        name: "TEMPO Cockpit",
        volume: state.volume / 100,
        enableMediaSession: true,
        getOAuthToken: async (done) => {
          const token = await window.tempoDesktop.spotifyAccessToken();
          if (token?.accessToken) done(token.accessToken);
        }
      });

      state.spotify.player.addListener("ready", ({ device_id }) => {
        state.spotify.deviceId = device_id;
        state.spotify.sdkReady = true;
        updateDeviceStatus();
        setStatus("TEMPO device ready");
      });

      state.spotify.player.addListener("not_ready", () => {
        state.spotify.sdkReady = false;
        updateDeviceStatus();
        setStatus("TEMPO device offline");
      });

      ["initialization_error", "authentication_error", "account_error", "playback_error"].forEach((eventName) => {
        state.spotify.player.addListener(eventName, ({ message }) => {
          setStatus(short(message));
          el.source.title = message;
        });
      });

      state.spotify.player.addListener("player_state_changed", (playback) => {
        if (!playback?.track_window?.current_track) return;
        applySpotifyState(playback);
      });

      const connected = await state.spotify.player.connect();
      if (!connected) setStatus("SDK blocked");
    } catch (error) {
      showSpotifyError(error);
    }
  }

  function loadSpotifySdk() {
    if (window.Spotify?.Player) return Promise.resolve();

    return new Promise((resolve, reject) => {
      window.onSpotifyWebPlaybackSDKReady = () => resolve();
      const script = document.createElement("script");
      script.src = "https://sdk.scdn.co/spotify-player.js";
      script.async = true;
      script.onerror = () => reject(new Error("Spotify SDK failed"));
      document.head.appendChild(script);
      window.setTimeout(() => {
        if (!window.Spotify?.Player) reject(new Error("Spotify SDK timeout"));
      }, 12000);
    });
  }

  async function loadSpotifyPlaylists() {
    if (!window.tempoDesktop?.spotifyPlaylists) return;
    const response = await window.tempoDesktop.spotifyPlaylists();
    if (response.error) {
      showSpotifyError(response.error);
      return;
    }
    if (!response.items?.length) return;

    playlists.splice(0, playlists.length, ...response.items.map((playlist) => ({
      name: playlist.name,
      tracks: Number(playlist.tracks) || 0,
      uri: playlist.uri,
      url: playlist.externalUrl,
      artwork: playlist.artwork
    })));
    state.playlistIndex = 0;
    renderPlaylists();
  }

  async function loadSpotifyTracks() {
    if (!window.tempoDesktop?.spotifyTracks) return;

    const response = await window.tempoDesktop.spotifyTracks();
    if (response.error) {
      showSpotifyError(response.error);
      return;
    }
    if (!response.items?.length) {
      setStatus("No saved songs");
      return;
    }

    songs.splice(0, songs.length, ...response.items.map(normalizeTrack));

    if (!tracks.some((track) => track.uri)) {
      tracks.splice(0, tracks.length, ...songs.slice(0, 8).map((song) => ({ ...song })));
      state.trackIndex = 0;
      state.trackElapsed = 0;
      renderQueue();
      updateAll();
    }

    renderSongs();
    setStatus("Songs loaded");
  }

  async function searchSongs() {
    const query = el.songSearch.value.trim();
    if (!query) {
      await loadSpotifyTracks();
      return;
    }

    if (!window.tempoDesktop?.spotifySearch) {
      setStatus("Search unavailable");
      return;
    }

    const response = await window.tempoDesktop.spotifySearch(query);
    if (response.error) {
      showSpotifyError(response.error);
      return;
    }

    songs.splice(0, songs.length, ...(response.items || []).map(normalizeTrack));
    renderSongs();
    setStatus(songs.length ? "Search loaded" : "No results");
  }

  async function refreshSpotifyPlayback() {
    if (!window.tempoDesktop?.spotifyCurrentPlayback) return;
    const playback = await window.tempoDesktop.spotifyCurrentPlayback();
    if (playback.error) {
      showSpotifyError(playback.error);
      return;
    }
    if (!playback.active || !playback.track) {
      setStatus(state.spotify.deviceId ? "Press Start" : "No device");
      return;
    }

    const currentTrack = normalizeTrack(playback.track);
    currentTrack.energy = playback.isPlaying ? 0.72 : 0.42;
    tracks.splice(0, 1, currentTrack);
    state.trackIndex = 0;
    state.trackElapsed = Math.round(playback.progressMs / 1000);
    state.spotifyPlaying = playback.isPlaying;
    setStatus(playback.device || "Spotify live");
    renderQueue();
    renderSongs();
    updateAll();
  }

  async function spotifyPlay(options = {}) {
    if (!state.spotify.connected || !window.tempoDesktop?.spotifyCommand) return false;

    if (!state.spotify.deviceId) {
      await setupSpotifyPlayer();
    }

    if (!state.spotify.deviceId) {
      setStatus("TEMPO device starting");
      return false;
    }

    if (state.spotify.player?.activateElement) {
      await state.spotify.player.activateElement();
    }

    if (state.spotify.deviceId) {
      const transferred = await spotifyCommand({ type: "transfer", deviceId: state.spotify.deviceId, play: false });
      if (!transferred) return false;
    }

    const playlist = playlists[state.playlistIndex];
    const track = tracks[state.trackIndex];
    const contextUri = options.contextUri || playlist?.uri || undefined;
    const uris = options.uris || (track.uri ? [track.uri] : undefined);

    if (!contextUri && (!uris || !uris.length)) {
      setStatus("Pick a song");
      return false;
    }

    const ok = await spotifyCommand({
      type: "play",
      deviceId: state.spotify.deviceId,
      contextUri,
      uris
    });

    if (ok) {
      state.spotifyPlaying = true;
      setStatus(state.spotify.deviceId ? "Playing in TEMPO" : "Playing Spotify");
      window.setTimeout(refreshSpotifyPlayback, 900);
    }

    return ok;
  }

  async function spotifyPause() {
    if (!state.spotify.deviceId) {
      state.spotifyPlaying = false;
      setStatus("Playback paused");
      return false;
    }
    const ok = await spotifyCommand({ type: "pause", deviceId: state.spotify.deviceId });
    if (ok) {
      state.spotifyPlaying = false;
      setStatus("Playback paused");
    }
    return ok;
  }

  async function spotifyCommand(command) {
    if (!state.spotify.connected || !window.tempoDesktop?.spotifyCommand) return false;

    const result = await window.tempoDesktop.spotifyCommand(command);
    if (result?.error) {
      showSpotifyError(result.error);
      return false;
    }
    return true;
  }

  function applySpotifyState(playback) {
    const current = playback.track_window.current_track;
    const track = {
      title: current.name || "Spotify Track",
      artist: current.artists?.map((artist) => artist.name).join(", ") || "",
      duration: Math.max(1, Math.round(playback.duration / 1000)),
      bpm: tracks[state.trackIndex]?.bpm || 78,
      energy: playback.paused ? 0.42 : 0.72,
      uri: current.uri,
      artwork: current.album?.images?.[0]?.url || null
    };
    tracks.splice(0, 1, track);
    state.trackIndex = 0;
    state.trackElapsed = Math.round(playback.position / 1000);
    state.spotifyPlaying = !playback.paused;
    renderQueue();
    renderSongs();
    updateAll();
  }

  function startSpotifyPolling() {
    window.clearInterval(startSpotifyPolling.timer);
    startSpotifyPolling.timer = window.setInterval(refreshSpotifyPlayback, 12000);
  }

  async function refreshSpotifyData() {
    if (!state.spotify.connected) {
      await resumeSpotify();
    }
    await setupSpotifyPlayer();
    await loadSpotifyPlaylists();
    await loadSpotifyTracks();
    await refreshSpotifyPlayback();
    updateDeviceStatus();
  }

  function showSpotifyError(error) {
    const raw = error?.detail || error?.message || String(error);
    const message = friendly(raw);
    setStatus(message);
    el.source.title = raw;
    if (error?.status === 403 || raw.includes("403")) {
      el.spotifyConnect.textContent = "Reauth Spotify";
    }
    console.error(error);
  }

  function friendly(message) {
    if (message.includes("User not registered")) return "Add test user";
    if (message.includes("scope")) return "Reauth scopes";
    if (message.includes("403")) return "403 scope/account";
    if (message.includes("404")) return "No device";
    if (message.includes("Player command failed")) return state.spotify.deviceId ? "Command rejected" : "No TEMPO device";
    if (message.toLowerCase().includes("premium")) return "Premium needed";
    return short(message);
  }

  function setWindowMode(mode) {
    document.querySelectorAll("[data-window-mode]").forEach((button) => {
      button.classList.toggle("active", button.dataset.windowMode === mode);
    });
    if (window.tempoDesktop) window.tempoDesktop.setWindowMode(mode);
  }

  function updateAll() {
    const session = sessions[state.sessionIndex];
    const track = tracks[state.trackIndex];
    const timerProgress = 1 - state.remaining / state.duration;

    el.editSession.textContent = session.name;
    el.sessionSubtitle.textContent = `${Math.round(state.duration / 60)} min focus`;
    el.timerDisplay.textContent = formatTime(state.remaining);
    el.timerState.textContent = state.timerRunning ? "Running" : "Armed";
    el.timerDetail.textContent = `${Math.round(timerProgress * 100)}% complete`;
    el.playPause.textContent = state.timerRunning ? "Pause" : "Start";
    el.nowPlay.textContent = state.timerRunning ? "Pause" : "Play";
    el.playPause.classList.toggle("active", state.timerRunning);
    el.nowPlay.classList.toggle("active", state.timerRunning);
    el.trackTitle.textContent = track.title;
    el.trackArtist.textContent = track.artist;
    el.trackLength.textContent = formatTrackTime(track.duration);
    el.elapsedTrack.textContent = formatTrackTime(state.trackElapsed);
    el.trackProgress.style.width = `${clamp(state.trackElapsed / track.duration, 0, 1) * 100}%`;
    el.bpm.textContent = String(track.bpm || 78);
    el.energy.textContent = `${Math.round(state.energy * 100)}%`;
    el.focus.textContent = `${Math.round(80 + state.energy * 14)}%`;
    el.shuffle.classList.toggle("active", state.shuffle);
    el.repeat.classList.toggle("active", state.repeat !== "off");
    el.repeat.textContent = state.repeat === "off" ? "Repeat Off" : state.repeat === "track" ? "Repeat One" : "Repeat All";
    el.save.classList.toggle("active", state.saved);
    el.save.textContent = state.saved ? "Saved" : "Save";
    app.style.setProperty("--progress", `${timerProgress * 360}deg`);
    app.style.setProperty("--energy", state.energy.toFixed(2));
    updateDeviceStatus();

    if (track.artwork) {
      el.albumArt.classList.add("spotify-artwork");
      el.albumArt.style.backgroundImage = `url("${track.artwork}")`;
    } else {
      el.albumArt.classList.remove("spotify-artwork");
      el.albumArt.style.backgroundImage = "";
    }
  }

  function tick(now) {
    const delta = Math.min((now - last) / 1000, 0.1);
    last = now;
    const track = tracks[state.trackIndex];
    const phase = now * 0.001 * ((track.bpm || 78) / 60) * Math.PI * 2;
    state.bass = Math.pow(Math.max(0, Math.sin(phase)), 3);
    state.energy = clamp((track.energy || 0.55) * 0.7 + state.bass * 0.22 + 0.08, 0.18, 1);

    if (state.timerRunning) {
      state.remaining = Math.max(0, state.remaining - delta);
      if (!state.spotifyPlaying) {
        state.trackElapsed = (state.trackElapsed + delta) % track.duration;
      }
      if (state.remaining <= 0) completeSession();
      updateAll();
    }

    animateWaveform(now);
    draw(now);
    requestAnimationFrame(tick);
  }

  function completeSession() {
    state.timerRunning = false;
    state.remaining = 0;
    spotifyPause();
    el.completion.hidden = false;
    updateAll();
  }

  function animateWaveform(now) {
    Array.from(el.waveform.children).forEach((bar, index) => {
      const lift = Math.sin(index * 0.45 + now * 0.006) * 0.5 + 0.5;
      bar.style.height = `${8 + lift * 30 + state.bass * 20}px`;
      bar.style.opacity = String(0.28 + lift * 0.58);
    });

    Array.from(el.centerWavefield.children).forEach((bar, index) => {
      const lift = Math.sin(index * 0.2 + now * 0.004) * 0.5 + 0.5;
      const mirror = 1 - Math.abs(index / Math.max(1, el.centerWavefield.children.length - 1) - 0.5) * 2;
      bar.style.height = `${12 + lift * 64 + mirror * 90 * state.energy + state.bass * 70}px`;
      bar.style.opacity = String(0.16 + mirror * 0.38 + state.bass * 0.2);
    });
  }

  function resizeCanvas() {
    dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function draw(now) {
    ctx.clearRect(0, 0, width, height);
    const color = accentRgb();
    ctx.save();
    ctx.globalCompositeOperation = "screen";

    for (let i = 0; i < 8; i += 1) {
      ctx.beginPath();
      const y = height * 0.42 + (i - 4) * 22;
      for (let x = -40; x <= width + 40; x += 18) {
        const wave = Math.sin(x * 0.012 + now * 0.00035 + i) * (26 + i * 4 + state.energy * 20);
        if (x === -40) ctx.moveTo(x, y + wave);
        else ctx.lineTo(x, y + wave);
      }
      ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${0.025 + i * 0.006})`;
      ctx.stroke();
    }

    particles.forEach((particle) => {
      particle.y -= particle.speed * (0.2 + state.energy * 0.45);
      if (particle.y < 0) {
        particle.y = 1;
        particle.x = Math.random();
      }
      ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${0.07 + particle.z * 0.12})`;
      ctx.fillRect(particle.x * width, particle.y * height, 1 + particle.z * 2, 1 + particle.z * 2);
    });

    ctx.restore();
  }

  function setStatus(message) {
    state.source = short(message);
    el.source.textContent = state.source;
  }

  function updateDeviceStatus() {
    if (state.spotify.deviceId) {
      el.device.textContent = "TEMPO ready";
    } else if (state.spotify.connected) {
      el.device.textContent = "Device warming";
    } else {
      el.device.textContent = "No device";
    }
  }

  function normalizeTrack(track) {
    return {
      title: track.title || track.name || "Unknown Track",
      artist: track.artist || (Array.isArray(track.artists) ? track.artists.map((artist) => artist.name).join(", ") : ""),
      album: track.album || track.albumName || "",
      duration: track.duration || Math.max(1, Math.round((track.durationMs || track.duration_ms || 0) / 1000)) || 180,
      bpm: track.bpm || 78,
      energy: track.energy || 0.62,
      uri: track.uri || null,
      artwork: track.artwork || null,
      externalUrl: track.externalUrl || null
    };
  }

  function short(message) {
    return String(message || "Ready").replace(/^Error:\s*/i, "").slice(0, 22);
  }

  function openExternal(url) {
    if (window.tempoDesktop) window.tempoDesktop.openExternal(url);
    else window.open(url, "_blank", "noopener,noreferrer");
  }

  function accentRgb() {
    const hex = getComputedStyle(app).getPropertyValue("--accent").trim().replace("#", "");
    const value = Number.parseInt(hex, 16);
    return {
      r: (value >> 16) & 255,
      g: (value >> 8) & 255,
      b: value & 255
    };
  }

  function formatTime(total) {
    const seconds = Math.max(0, Math.round(total));
    return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  }

  function formatTrackTime(total) {
    const seconds = Math.max(0, Math.floor(total));
    return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
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

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  window.tempoDebug = {
    advance(seconds) {
      if (state.timerRunning) {
        const track = tracks[state.trackIndex];
        state.remaining = Math.max(0, state.remaining - seconds);
        state.trackElapsed = (state.trackElapsed + seconds) % track.duration;
        updateAll();
      }
    },
    snapshot() {
      return {
        timerRunning: state.timerRunning,
        remaining: state.remaining,
        sessionCount: sessions.length,
        playlistCount: playlists.length,
        songCount: songs.length,
        trackTitle: tracks[state.trackIndex]?.title,
        deviceId: state.spotify.deviceId
      };
    }
  };

  mount();
})();
