/* =========================================================
   BUDAPEST NACHT-RALLYE – Spiellogik & UI
   ========================================================= */

const $  = sel => document.querySelector(sel);
const $$ = sel => [...document.querySelectorAll(sel)];
const TEAM_NAMES = ['Team Laterne', 'Team Paprika'];

let tickInterval = null;
let currentTaskId = null;
let wakeLock = null;

/* ---------------- Boot ---------------- */

document.addEventListener('DOMContentLoaded', () => {
  applyTheme(S.theme);
  applyAudioIcon();
  initLaunch();
  spawnFireflies();
  bindStatic();
  updateArchiveButton();
  startGeo(onGeoUpdate);
  if (S.game && !S.game.finished) {
    showScreen('splash');
    $('#btn-resume').hidden = false;
  } else if (S.game && S.game.finished) {
    $('#btn-resume').hidden = false;
    $('#btn-resume').textContent = 'Letztes Ergebnis ansehen';
    showScreen('splash');
  } else {
    showScreen('splash');
  }
});

function bindStatic() {
  $('#btn-new').onclick = () => { SFX.whoosh(); renderSetup(); showScreen('setup'); };
  $('#btn-resume').onclick = () => {
    if (S.game.finished) { showFinal(); } else { enterGame(); }
  };
  $('#btn-theme').onclick = toggleTheme;
  $('#btn-theme-splash').onclick = toggleTheme;
  $('#btn-audio').onclick = () => {
    const anyOn = S.sound || S.voice;
    S.sound = !anyOn; S.voice = !anyOn;
    if (!anyOn) SFX.chime(); else Narrator.stop();
    saveState(); applyAudioIcon();
  };

  $$('.navbtn').forEach(b => b.onclick = () => switchTab(b.dataset.tab));

  $('#btn-start').onclick = startGame;
  $('#btn-setup-back').onclick = () => showScreen('splash');

  $('#btn-endgame').onclick = () => {
    if (confirm('Rallye jetzt beenden und zur Auswertung?')) finishGame();
  };
  $('#btn-pause').onclick = pauseGame;
  $('#btn-resume-game').onclick = resumeGame;
  $('#btn-extend').onclick = () => {
    S.game.endsAt += 15 * 60000; S.game.extraMin += 15;
    $('#time-up-banner').hidden = true; saveState(); tick();
  };
  $('#btn-finish-now').onclick = finishGame;

  $('#ov-task .ov-close').onclick = closeTask;
  $('#ov-ar .ar-close').onclick = closeAR;
  // Tap ins Nichts (auf den abgedunkelten Hintergrund) schließt IMMER das Popup
  $('#ov-task').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeTask();
  });
  $('#ov-team').addEventListener('click', e => {
    // Team-Wahl abbrechen: Quest bleibt offen, nichts wird gewertet
    if (e.target === e.currentTarget) e.currentTarget.classList.remove('open');
  });
  $('#ov-pause').addEventListener('click', e => {
    // Tap neben das Bierglas = „Weiter geht's!"
    if (e.target === e.currentTarget) resumeGame();
  });

  // Karten-Legende auf-/zuklappen
  $('#legend-toggle').onclick = () => {
    const lg = $('#map-legend');
    lg.hidden = !lg.hidden;
    $('#legend-toggle').textContent = lg.hidden ? '❔ Legende' : '✕ Legende';
    SFX.tap();
  };

  // Stimmenliste kann (v. a. auf iOS) nachträglich wachsen → Picker aktuell halten
  document.addEventListener('br-voices', () => {
    if (S.screen === 'game' && $('#tab-crew').classList.contains('active')) renderCrew();
  });

  $('#btn-again').onclick = () => {
    // Ergebnis + Fotos liegen sicher in der Halle der Legenden
    S.game = null; saveState();
    renderSetup(); showScreen('setup');
  };
  $('#btn-archive').onclick = () => { SFX.whoosh(); renderArchive(); showScreen('archive'); };
  $('#btn-archive-back').onclick = () => showScreen('splash');
  $('#btn-final-back').onclick = () => { renderArchive(); showScreen('archive'); };

  // 🥚 Verstecktes Easter Egg: 5× auf den Splash-Titel tippen
  let secretTaps = 0;
  $('.splash-title').addEventListener('click', () => {
    if (S.secretUnlocked) return;
    if (++secretTaps < 5) return;
    S.secretUnlocked = true;
    if (S.game && !S.game.finished && !S.game.taskIds.includes('secret-oath')) {
      S.game.taskIds.push('secret-oath');
    }
    saveState();
    const el = $('#stamp-toast');
    el.innerHTML = `<div class="stamp-inner secret">🥚 GEHEIMAUFTRAG<br><b>freigeschaltet!</b><span>Der Budapester Schwur wartet in eurem Deck (+50 Pkt)</span></div>`;
    el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 3000);
    if (navigator.vibrate) navigator.vibrate([80, 60, 80, 60, 200]);
  });
}

/* ---------------- Hintergrund-Wächter & Service Worker ---------------- */

/* Offline-Fähigkeit + Benachrichtigungs-Basis (Homescreen-App auf iOS 16.4+) */
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => { /* optional */ });
}

/* Der Wächter: Ein stiller, geloopter Audio-Kanal hält die Seite auf iOS
   auch bei gesperrtem Bildschirm am Leben – GPS-Updates laufen weiter und
   der Näherungs-Alarm kommt hörbar durch den Lautsprecher. Experimentell,
   kostet etwas Akku, deshalb per Toggle im Crew-Tab (S.guard). */
const Guard = {
  audio: null,
  running: false,

  silentWavUrl() {
    // 1 s Stille als WAV (44-Byte-Header + PCM-Nullen), zur Laufzeit gebaut
    const rate = 8000, samples = rate;
    const buf = new ArrayBuffer(44 + samples * 2);
    const v = new DataView(buf);
    const w = (o, s2) => { for (let i = 0; i < s2.length; i++) v.setUint8(o + i, s2.charCodeAt(i)); };
    w(0, 'RIFF'); v.setUint32(4, 36 + samples * 2, true); w(8, 'WAVE');
    w(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
    v.setUint32(24, rate, true); v.setUint32(28, rate * 2, true);
    v.setUint16(32, 2, true); v.setUint16(34, 16, true);
    w(36, 'data'); v.setUint32(40, samples * 2, true);
    return URL.createObjectURL(new Blob([buf], { type: 'audio/wav' }));
  },

  start() {
    if (this.running || !S.guard) return;
    try {
      if (!this.audio) {
        this.audio = new Audio(this.silentWavUrl());
        this.audio.loop = true;
      }
      const p = this.audio.play();
      if (p && p.then) p.then(() => { this.running = true; }).catch(() => { this.running = false; });
      this.running = true;
    } catch (e) { this.running = false; }
  },

  stop() {
    if (this.audio) { try { this.audio.pause(); } catch (e) {} }
    this.running = false;
  }
};

// Wächter (falls aktiviert) in einer User-Geste starten – iOS verlangt das
document.addEventListener('pointerdown', () => {
  if (S.guard && S.game && !S.game.finished) Guard.start();
}, { passive: true });

/* ---------------- Launch-Intro & Magie-Staub ---------------- */

/* „Die Nacht erwacht": rein visuelles Intro über der App –
   Taps gehen durch (pointer-events: none), nach ~2,8 s ist es weg. */
function initLaunch() {
  const el = $('#launch');
  if (!el) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { el.hidden = true; return; }
  setTimeout(() => { el.hidden = true; }, 2800);
}

/* Goldene Fünkchen an jeder Berührung */
let _lastDust = 0;
document.addEventListener('pointerdown', e => {
  const now = Date.now();
  if (now - _lastDust < 130) return;
  _lastDust = now;
  spawnDust(e.clientX, e.clientY);
}, { passive: true });

function spawnDust(x, y) {
  const layer = $('#dust');
  if (!layer || x == null || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  for (let i = 0; i < 7; i++) {
    const p = document.createElement('span');
    p.className = 'dust-p';
    const ang = Math.random() * 2 * Math.PI;
    const r = 16 + Math.random() * 28;
    p.style.left = x + 'px';
    p.style.top = y + 'px';
    p.style.setProperty('--dx', Math.cos(ang) * r + 'px');
    p.style.setProperty('--dy', (Math.sin(ang) * r - 16) + 'px');
    layer.appendChild(p);
    setTimeout(() => p.remove(), 750);
  }
}

/* Zahlen zählen magisch hoch statt hart zu springen */
function tweenNumber(el, to) {
  if (!el) return;
  const from = parseInt(el.textContent, 10) || 0;
  if (from === to) { el.textContent = to; return; }
  el.classList.remove('score-pop'); void el.offsetWidth; el.classList.add('score-pop');
  const t0 = performance.now(), dur = 500;
  const step = now => {
    const k = Math.min(1, (now - t0) / dur);
    el.textContent = Math.round(from + (to - from) * (1 - Math.pow(1 - k, 3)));
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/* ---------------- Screens & Theme ---------------- */

function showScreen(name) {
  $$('.screen').forEach(s => s.classList.toggle('active', s.id === 's-' + name));
  S.screen = name; saveState();
  if (name === 'game') requestWakeLock();
}

function toggleTheme() {
  S.theme = S.theme === 'night' ? 'day' : 'night';
  applyTheme(S.theme); saveState();
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  const meta = $('meta[name="theme-color"]');
  if (meta) meta.content = theme === 'day' ? '#f6efdf' : '#10132b';
  $$('.theme-icon').forEach(el => el.textContent = theme === 'night' ? '☀️' : '🌙');
  if (map) setMapTheme(theme);
}

function applyAudioIcon() {
  const el = $('#audio-icon');
  if (el) el.textContent = (S.sound || S.voice) ? '🔊' : '🔇';
}

async function requestWakeLock() {
  try { wakeLock = await navigator.wakeLock?.request('screen'); } catch (e) { /* optional */ }
}
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    if (S.screen === 'game') requestWakeLock();
    // App kommt aus dem Hintergrund: frische Position erzwingen,
    // Watch neu aufsetzen (iOS legt watchPosition im Hintergrund schlafen)
    refreshPosition(() => onGeoUpdate());
    restartGeoWatch(onGeoUpdate);
  }
});

/* ---------------- Setup ---------------- */

function renderSetup() {
  const st = S.settings;
  const wrap = $('#player-list');
  wrap.innerHTML = '';
  st.players.forEach((name, i) => {
    const row = document.createElement('div');
    row.className = 'player-row';
    row.innerHTML = `
      <span class="player-num">${i + 1}</span>
      <input type="text" placeholder="Spieler:in ${i + 1}" value="${escapeHtml(name)}" data-i="${i}" maxlength="18">
      ${st.players.length > 1 ? `<button class="player-del" data-i="${i}" aria-label="Entfernen">✕</button>` : ''}`;
    wrap.appendChild(row);
  });
  wrap.querySelectorAll('input').forEach(inp => inp.oninput = e => {
    st.players[+e.target.dataset.i] = e.target.value; saveState();
  });
  wrap.querySelectorAll('.player-del').forEach(btn => btn.onclick = e => {
    st.players.splice(+e.currentTarget.dataset.i, 1); saveState(); renderSetup();
  });
  $('#btn-add-player').hidden = st.players.length >= 8;
  $('#btn-add-player').onclick = () => {
    if (st.players.length < 8) { st.players.push(''); saveState(); renderSetup(); }
  };

  $$('#mode-picker .chip').forEach(c => {
    c.classList.toggle('sel', c.dataset.mode === st.mode);
    c.onclick = () => { st.mode = c.dataset.mode; saveState(); renderSetup(); };
  });

  $$('#gamemode-picker .chip').forEach(c => {
    c.classList.toggle('sel', c.dataset.gm === (st.gamemode || 'night'));
    c.onclick = () => { st.gamemode = c.dataset.gm; saveState(); renderSetup(); };
  });
  const gmInfo = {
    day:      '☀️ Nur Aufgaben, die tagsüber funktionieren – inklusive Markthalle, Passagen & Schatten-Kunst.',
    night:    '🌙 Der Klassiker: alles, was nach Einbruch der Dunkelheit spielbar ist.',
    daynight: '🌗 Alle Aufgaben im Deck. Tag-Quests (hell markiert) laufen nur tagsüber, Nacht-Quests (dunkel markiert) schalten erst ab ihrer Uhrzeit frei.'
  };
  $('#gm-info').textContent = gmInfo[st.gamemode || 'night'];

  const teamsBox = $('#teams-box');
  teamsBox.hidden = st.mode !== 'versus';
  if (st.mode === 'versus') renderTeamPicker();

  $$('#dur-picker .chip').forEach(c => {
    c.classList.toggle('sel', +c.dataset.min === st.durationMin);
    c.onclick = () => { st.durationMin = +c.dataset.min; saveState(); renderSetup(); };
  });
  const n = deckSizeFor(st.durationMin);
  $('#dur-info').textContent = `≈ ${n} Aufgaben, Pausen inklusive`;
}

function renderTeamPicker() {
  const st = S.settings;
  // Aufräumen: Indizes, die es nicht mehr gibt
  st.teams = st.teams.map(t => t.filter(i => i < st.players.length));
  const box = $('#teams-box .team-grid');
  box.innerHTML = '';
  st.players.forEach((name, i) => {
    const inA = st.teams[0].includes(i), inB = st.teams[1].includes(i);
    const row = document.createElement('div');
    row.className = 'team-row';
    row.innerHTML = `
      <span class="team-name">${escapeHtml(name || 'Spieler:in ' + (i + 1))}</span>
      <div class="team-toggle">
        <button class="tbtn a ${inA ? 'sel' : ''}" data-i="${i}" data-t="0">🏮 Laterne</button>
        <button class="tbtn b ${inB ? 'sel' : ''}" data-i="${i}" data-t="1">🌶️ Paprika</button>
      </div>`;
    box.appendChild(row);
  });
  box.querySelectorAll('.tbtn').forEach(b => b.onclick = () => {
    const i = +b.dataset.i, t = +b.dataset.t;
    st.teams.forEach(tm => { const ix = tm.indexOf(i); if (ix >= 0) tm.splice(ix, 1); });
    st.teams[t].push(i);
    saveState(); renderTeamPicker();
  });
}

/* ---------------- Deck bauen ---------------- */

function deckSizeFor(min) {
  return { 30: 5, 60: 8, 90: 11, 120: 13, 180: 17, 240: 21 }[min] || 10;
}

/* Passt die Aufgabe zum Spielmodus? (Daygame ohne Nacht-Quests & umgekehrt) */
function fitsGamemode(t, gamemode) {
  const gm = gamemode || 'night';
  if (gm === 'day') return t.time !== 'night';
  if (gm === 'night') return t.time !== 'day';
  return true;   // daynight: alles rein, die Uhr regelt den Rest
}

function buildDeck(durationMin, startPos, gamemode) {
  const origin = startPos || RALLY_CENTER;
  const pool = TASKS.filter(t =>
    (!t.minMin || t.minMin <= durationMin) &&
    (!t.secret || S.secretUnlocked) &&
    fitsGamemode(t, gamemode));
  const byDist = t => (t.free || t.lat == null) ? 0 : distMeters(origin, t);

  const size = deckSizeFor(durationMin);
  const nPause = Math.max(1, Math.min(4, Math.floor(durationMin / 60) || 1));
  const nAr    = durationMin >= 180 ? 3 : durationMin >= 90 ? 2 : 1;
  const nKiosk = durationMin >= 120 ? 2 : 1;
  const nEgg   = durationMin >= 150 ? 2 : durationMin >= 60 ? 1 : 0;

  const take = (arr, n) => arr.slice(0, n);
  const shuffle = arr => arr.map(v => [v, Math.sin(v.id.length * 7 + arr.indexOf(v) * 13 + Date.now() % 97)])
    .sort((a, b) => a[1] - b[1]).map(v => v[0]);

  const pauses = take(shuffle(pool.filter(t => t.cat === 'pause')), nPause);
  const ars    = take(pool.filter(t => t.cat === 'ar').sort((a, b) => byDist(a) - byDist(b)), nAr);
  const kiosks = take(shuffle(pool.filter(t => t.cat === 'kiosk')), nKiosk);
  const eggs   = take(shuffle(pool.filter(t => t.cat === 'egg' && !t.secret)), nEgg);
  const secret = pool.filter(t => t.secret);
  // Ketten-Aufgaben (Agentenmission) ab 1,5 h – immer komplett, nie einzeln
  const chain  = durationMin >= 90
    ? pool.filter(t => t.chain === 'spy').sort((a, b) => a.step - b.step) : [];

  const fixed = [...ars, ...kiosks, ...eggs, ...chain, ...secret];
  const used = new Set([...pauses, ...fixed].map(t => t.id));
  const rest = pool.filter(t =>
    !used.has(t.id) && !t.chain && !t.secret &&
    !['pause', 'ar', 'kiosk', 'egg'].includes(t.cat));
  const located = rest.filter(t => !t.free && t.lat != null).sort((a, b) => byDist(a) - byDist(b));
  const freeTasks = shuffle(rest.filter(t => t.free || t.lat == null));

  const needed = Math.max(0, size - pauses.length - fixed.length);
  const nFree = Math.min(freeTasks.length, Math.max(1, Math.round(needed / 4)));
  const picked = [...take(located, Math.max(0, needed - nFree)), ...take(freeTasks, nFree)];

  // Route: nearest-neighbor über alle ortsgebundenen Aufgaben (inkl. AR, Eggs, Kette)
  const all = [...picked, ...fixed];
  let routePool = all.filter(t => !t.free && t.lat != null);
  const route = [];
  let cur = origin;
  while (routePool.length) {
    routePool.sort((a, b) => distMeters(cur, a) - distMeters(cur, b));
    const next = routePool.shift();
    route.push(next); cur = next;
  }

  // Freie Aufgaben gleichmäßig einstreuen, Pausen in regelmäßigen Abständen
  const floaters = all.filter(t => t.free || t.lat == null);
  const deck = [...route];
  floaters.forEach((t, i) => {
    const pos = Math.min(deck.length, Math.round((i + 1) * deck.length / (floaters.length + 1)) + 1);
    deck.splice(pos, 0, t);
  });
  pauses.forEach((t, i) => {
    const pos = Math.min(deck.length, Math.round((i + 1) * deck.length / (pauses.length + 1)));
    deck.splice(pos, 0, t);
  });
  return enforceChainOrder(deck.map(t => t.id));
}

/* Ketten-Aufgaben behalten ihre Plätze im Deck, aber die Schritte
   werden in die richtige Reihenfolge (1 → 2 → 3) gebracht. */
function enforceChainOrder(ids) {
  const chains = {};
  ids.forEach(id => {
    const t = TASKS.find(x => x.id === id);
    if (t && t.chain) (chains[t.chain] = chains[t.chain] || []).push(t);
  });
  Object.values(chains).forEach(members => {
    const pos = ids
      .map((id, i) => ({ id, i }))
      .filter(o => members.some(m => m.id === o.id))
      .map(o => o.i)
      .sort((a, b) => a - b);
    members.sort((a, b) => a.step - b.step);
    pos.forEach((p, k) => { ids[p] = members[k].id; });
  });
  return ids;
}

/* Gesperrt, solange der vorherige Ketten-Schritt offen ist */
function taskLocked(t) {
  return !!(t.requires && S.game && !S.game.completed[t.requires]);
}

/* ---------- Day n Night: Zeit-Freischaltung ---------- */

function currentHour() {
  return window.__testHour != null ? window.__testHour : new Date().getHours();
}

/* Nur im Modus „Day n Night" sperrt die Uhr:
   Nacht-Quests öffnen ab fromHour (Default 17, nach Mitternacht bleiben sie offen),
   Tag-Quests nur innerhalb ihrer openHours (Default 8–18). */
function timeLocked(t) {
  const gm = (S.game && S.game.gamemode) || S.settings.gamemode || 'night';
  if (gm !== 'daynight') return false;
  const h = currentHour();
  if (t.time === 'night') {
    const from = t.fromHour != null ? t.fromHour : 17;
    return h >= 5 && h < from;
  }
  if (t.time === 'day') {
    const [a, b] = t.openHours || [8, 18];
    return !(h >= a && h < b);
  }
  return false;
}

function timeLockLabel(t) {
  if (t.time === 'night') return '🌙 ab ' + (t.fromHour != null ? t.fromHour : 17) + ' Uhr';
  const [a, b] = t.openHours || [8, 18];
  return '☀️ nur ' + a + '–' + b + ' Uhr';
}

/* Zeitfenster-Badge: Tag hell mit Öffnungsfenster, Nacht dunkel mit „ab X Uhr" */
function timeBadge(t) {
  if (t.time === 'day') {
    const [a, b] = t.openHours || [8, 18];
    return `<span class="badge tday">☀️ Tag · ${a}–${b} Uhr</span>`;
  }
  if (t.time === 'night') {
    return `<span class="badge tnight">🌙 ab ${t.fromHour != null ? t.fromHour : 17} Uhr</span>`;
  }
  return '';
}

/* ---------------- Spiel starten / fortsetzen ---------------- */

function startGame() {
  const st = S.settings;
  st.players = st.players.map(p => p.trim()).filter((p, i) => p || i < 1);
  if (!st.players.length) st.players = ['Team'];
  if (st.mode === 'versus') {
    const assigned = new Set([...st.teams[0], ...st.teams[1]]);
    st.players.forEach((_, i) => { if (!assigned.has(i)) st.teams[i % 2].push(i); });
    if (!st.teams[0].length || !st.teams[1].length) {
      alert('Für den Versus-Modus braucht jedes Team mindestens eine Person.');
      return;
    }
  }
  const now = Date.now();
  S.game = {
    startedAt: now,
    endsAt: now + st.durationMin * 60000,
    durationMin: st.durationMin,
    gamemode: st.gamemode || 'night',
    taskIds: buildDeck(st.durationMin, lastPos, st.gamemode),
    completed: {},
    jokersLeft: 2,
    scores: [0, 0],
    extraMin: 0,
    finished: false
  };
  // Theme passend zum Spielmodus: Daygame hell, Nightgame dunkel,
  // Day n Night nach der aktuellen Uhrzeit
  const gm = st.gamemode || 'night';
  const wantDay = gm === 'day' || (gm === 'daynight' && currentHour() >= 7 && currentHour() < 17);
  S.theme = wantDay ? 'day' : 'night';
  applyTheme(S.theme);
  saveState();
  // Näherungs-Benachrichtigungen: Erlaubnis im User-Gesten-Kontext anfragen
  if ('Notification' in window && Notification.permission === 'default') {
    try { Notification.requestPermission(); } catch (e) {}
  }
  enterGame();
  if (S.guard) Guard.start();   // läuft in der User-Geste des Start-Buttons
  SFX.chime();
  Narrator.say('welcome', 'Willkommen, Abenteurer der Nacht! Budapest liegt euch zu Füßen. Euer Quest-Log ist geschrieben – möge die Laterne euch leuchten!');
}

function enterGame() {
  showScreen('game');
  renderHud();
  listAnimated = false;
  renderTaskList();
  switchTab('tasks');
  if (tickInterval) clearInterval(tickInterval);
  tickInterval = setInterval(tick, 1000);
  tick();
  // App wurde mitten in der Barpause geschlossen? Dann direkt zurück ins Pausen-Overlay.
  if (S.game.pausedAt) openPauseOverlay();
}

function gameTasks() {
  return S.game.taskIds.map(id => TASKS.find(t => t.id === id)).filter(Boolean);
}

/* Realistische Gehzeit: Luftlinie × 1,3 Stadt-Umwegfaktor, 4,5 km/h */
function walkMinutes(meters) {
  return Math.max(1, Math.round(meters * 1.3 / 75));
}

/* Live-Reihenfolge: offene Orts-Quests nach aktueller GPS-Entfernung,
   dann „überall lösbar", dann Erledigtes. Agentenkette bleibt in Reihenfolge. */
function sortedGameTasks() {
  const g = S.game;
  const origin = lastPos || RALLY_CENTER;
  const all = gameTasks();
  const openLoc = all.filter(t => !g.completed[t.id] && !t.free && t.lat != null)
    .sort((a, b) => distMeters(origin, a) - distMeters(origin, b));
  const openFree = all.filter(t => !g.completed[t.id] && (t.free || t.lat == null));
  const done = all.filter(t => g.completed[t.id]);
  const ids = enforceChainOrder([...openLoc, ...openFree, ...done].map(t => t.id));
  return ids.map(id => TASKS.find(t => t.id === id));
}

function activeQuestId() {
  const g = S.game;
  const t = sortedGameTasks().find(x => !g.completed[x.id] && !taskLocked(x) && !timeLocked(x));
  return t ? t.id : null;
}

/* ---------------- Sör o'clock: Barpause ---------------- */

const PAUSE_QUOTES = [
  '„Egészségedre!" – aber beim Bier nicht anstoßen, ihr wisst Bescheid.',
  'Die Sanduhr macht ein Nickerchen. Die Geister warten geduldig.',
  'Auch Ritter von Belváros brauchen Hopfen.',
  '„Sör" heißt Bier. Mehr Ungarisch braucht ihr an der Theke nicht.',
  'Kolodko versteckt derweil keine neuen Mini-Statuen. Versprochen.',
  'Trinkt aus, Novizen – Budapest schläft nie, aber es wartet auf euch.',
  'Selbst Graf Széchenyi hat zwischen zwei Brücken mal ein Bier gebraucht.'
];
let pauseQuoteTimer = null;

function pauseGame() {
  const g = S.game;
  if (!g || g.finished || g.pausedAt) return;
  g.pausedAt = Date.now();
  saveState();
  openPauseOverlay();
  SFX.gong();
  Narrator.say('pause_on', 'Sör o clock! Die Sanduhr legt sich schlafen. Lasst es euch schmecken, Abenteurer.');
}

function resumeGame() {
  const g = S.game;
  if (!g || !g.pausedAt) return;
  const d = Date.now() - g.pausedAt;
  g.endsAt += d;
  g.pausedTotal = (g.pausedTotal || 0) + d;
  g.pausedAt = null;
  saveState();
  closePauseOverlay();
  tick();
  SFX.chime();
  Narrator.say('pause_off', 'Die Sanduhr erwacht! Weiter geht die Jagd durch die Nacht.');
}

function openPauseOverlay() {
  $('#ov-pause').classList.add('open');
  rotatePauseQuote();
  if (pauseQuoteTimer) clearInterval(pauseQuoteTimer);
  pauseQuoteTimer = setInterval(rotatePauseQuote, 7000);
  updatePauseClock();
}

function closePauseOverlay() {
  $('#ov-pause').classList.remove('open');
  if (pauseQuoteTimer) { clearInterval(pauseQuoteTimer); pauseQuoteTimer = null; }
}

function rotatePauseQuote() {
  const el = $('#pause-quote');
  const i = (parseInt(el.dataset.i || '-1', 10) + 1) % PAUSE_QUOTES.length;
  el.dataset.i = i;
  el.textContent = PAUSE_QUOTES[i];
}

function updatePauseClock() {
  const g = S.game;
  if (!g || !g.pausedAt) return;
  const s = Math.floor((Date.now() - g.pausedAt) / 1000);
  const m = Math.floor(s / 60);
  $('#pause-clock').textContent =
    String(m).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
}

/* ---------------- HUD & Timer ---------------- */

function renderHud() {
  const versus = S.settings.mode === 'versus';
  $('#hud-score-coop').hidden = versus;
  $('#hud-score-versus').hidden = !versus;
  updateScores();
}

function updateScores() {
  const g = S.game;
  if (S.settings.mode === 'versus') {
    tweenNumber($('#scoreA'), g.scores[0]);
    tweenNumber($('#scoreB'), g.scores[1]);
  } else {
    tweenNumber($('#score-total'), g.scores[0] + g.scores[1]);
  }
  const done = Object.keys(g.completed).length;
  $('#hud-progress').textContent = `${done}/${g.taskIds.length}`;
}

let lastWatchRestart = 0;

function tick() {
  const g = S.game;
  if (!g || g.finished) return;

  // GPS-Watchdog: kein Update seit >60 s → Watch neu aufsetzen + frische Position
  if (lastPos && Date.now() - lastPos.at > 60000 && Date.now() - lastWatchRestart > 30000) {
    lastWatchRestart = Date.now();
    restartGeoWatch(onGeoUpdate);
    refreshPosition(() => onGeoUpdate());
  }
  if ($('#tab-map').classList.contains('active')) updateGpsChip();

  if (g.pausedAt) {
    $('#hud-timer').textContent = 'PAUSE';
    $('#hud-timer').classList.remove('lastmins', 'overtime');
    updatePauseClock();
    return;
  }
  const left = g.endsAt - Date.now();
  const el = $('#hud-timer');
  const abs = Math.abs(left);
  const h = Math.floor(abs / 3600000), m = Math.floor(abs % 3600000 / 60000), s = Math.floor(abs % 60000 / 1000);
  const str = (h ? h + ':' : '') + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  el.textContent = (left < 0 ? '−' : '') + str;
  el.classList.toggle('overtime', left < 0);
  el.classList.toggle('lastmins', left >= 0 && left < 5 * 60000);
  if (left >= 0 && left < 5 * 60000 && !g.warned5) {
    g.warned5 = true; saveState();
    SFX.gong();
    Narrator.say('warn5', 'Die Sanduhr rinnt, Abenteurer – nur noch fünf Minuten!');
  }
  if (left < 0 && $('#time-up-banner').hidden) {
    $('#time-up-banner').hidden = false;
    SFX.gong();
    Narrator.say('timeup', 'Die Stunde ist gekommen! Eure Zeit ist abgelaufen.');
    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
  }
}

/* ---------------- Tabs ---------------- */

function switchTab(tab) {
  SFX.tap();
  $$('.navbtn').forEach(b => b.classList.toggle('sel', b.dataset.tab === tab));
  $$('.tab').forEach(t => t.classList.toggle('active', t.id === 'tab-' + tab));
  if (tab === 'map') {
    if (typeof L === 'undefined') {
      $('#map').innerHTML = '<div class="map-fail">🗺️ Karte konnte nicht geladen werden.<br>Nutzt die Google-Maps-Buttons in den Aufgaben!</div>';
      return;
    }
    initMap(S.theme);
    // GPS-Frische: beim Öffnen der Karte IMMER die aktuelle Position holen
    refreshPosition(() => { refreshMapLayers(); updateGpsChip(); });
    updateGpsChip();
    setTimeout(() => {
      map.invalidateSize();
      refreshMapLayers();
      fitToGame(gameTasks());
    }, 60);
  }
  if (tab === 'crew') renderCrew();
}

function refreshMapLayers() {
  if (!map) return;
  const sorted = decorateFreeTasks(sortedGameTasks());
  renderTaskMarkers(sorted, S.game.completed, openTask, activeQuestId());
  updateRouteLine(sorted.filter(t => !S.game.completed[t.id]));
}

/* „Überall lösbar"-Quests bekommen virtuelle Karten-Punkte AUF der Route:
   jeweils auf halber Strecke zwischen zwei Routen-Ankern (Start = eigene
   Position, dann die offenen Orts-Quests in Live-Reihenfolge), mit kleinem
   seitlichen Versatz. So zeigt die Karte IMMER alle Quests des Decks. */
function decorateFreeTasks(sorted) {
  const anchors = [];
  if (lastPos) anchors.push({ lat: lastPos.lat, lng: lastPos.lng });
  sorted.forEach(t => {
    if (!S.game.completed[t.id] && !t.free && t.lat != null) anchors.push({ lat: t.lat, lng: t.lng });
  });
  if (!anchors.length) anchors.push({ ...RALLY_CENTER });
  let k = 0;
  return sorted.map(t => {
    if (!(t.free || t.lat == null)) return t;
    const c = { ...t };
    if (anchors.length >= 2) {
      const segCount = anchors.length - 1;
      const seg = k % segCount;
      const a = anchors[seg], b = anchors[seg + 1];
      let lat = (a.lat + b.lat) / 2, lng = (a.lng + b.lng) / 2;
      // senkrecht zur Strecke versetzen, abwechselnd links/rechts
      const dx = b.lng - a.lng, dy = b.lat - a.lat;
      const len = Math.hypot(dx, dy) || 1;
      const off = 0.0009 * (1 + Math.floor(k / segCount)) * (k % 2 ? 1 : -1);
      lat += (-dx / len) * off;
      lng += (dy / len) * off;
      c._vlat = lat; c._vlng = lng;
    } else {
      // nur ein Anker (kein GPS / keine Orts-Quests): kleiner Ring drumherum
      const ang = (k * 2 * Math.PI) / 6;
      c._vlat = anchors[0].lat + 0.0012 * Math.cos(ang);
      c._vlng = anchors[0].lng + 0.0018 * Math.sin(ang);
    }
    k++;
    return c;
  });
}

/* GPS-Alters-Chip auf der Karte: zeigt, wie frisch die Position ist */
function updateGpsChip() {
  const chip = $('#gps-chip');
  if (!chip) return;
  const age = gpsAgeSec();
  if (age == null) {
    chip.hidden = false;
    chip.textContent = '🛰️ Suche GPS…';
    chip.classList.add('stale');
    return;
  }
  chip.hidden = false;
  chip.textContent = age <= 3 ? '🛰️ GPS live' : `🛰️ vor ${age} s`;
  chip.classList.toggle('stale', age > 30);
}

/* ---------------- Aufgabenliste ---------------- */

let listAnimated = false;

function renderTaskList() {
  const g = S.game;
  const list = $('#task-list');
  list.innerHTML = '';
  const tasks = sortedGameTasks();
  const activeIdx = tasks.findIndex(t => !g.completed[t.id] && !taskLocked(t));
  tasks.forEach((t, i) => {
    const done = g.completed[t.id];
    const locked = taskLocked(t);
    const tlocked = !done && !locked && timeLocked(t);
    const timeClass = t.time === 'day' ? 'time-day' : t.time === 'night' ? 'time-night' : '';
    const card = document.createElement('button');
    card.className = `ticket cat-${t.cat} ${timeClass} ${done ? 'done' : ''} ${locked || tlocked ? 'locked' : ''} ${i === activeIdx ? 'active-quest' : ''}`;
    if (!listAnimated) {
      card.classList.add('anim-in');
      card.style.animationDelay = Math.min(i * 45, 600) + 'ms';
    }
    card.dataset.task = t.id;
    const dMeters = (!t.free && t.lat != null && lastPos) ? distMeters(lastPos, t) : null;
    const dist = dMeters != null ? `${fmtDist(dMeters)} · 🚶${walkMinutes(dMeters)}′` : '';
    const reqTitle = locked ? (TASKS.find(x => x.id === t.requires) || {}).title : '';
    card.innerHTML = `
      <div class="ticket-side"><span class="ticket-num">${String(i + 1).padStart(2, '0')}</span></div>
      <div class="ticket-body">
        <div class="ticket-top">
          <span class="badge">${CATS[t.cat].icon} ${CATS[t.cat].label}</span>
          ${timeBadge(t)}
          ${t.complicated ? '<span class="badge hard">★ knifflig</span>' : ''}
          ${locked ? '<span class="badge lock">🔒 gesperrt</span>' : ''}
          ${tlocked ? '<span class="badge lock">⏰ ' + timeLockLabel(t) + '</span>' : ''}
          ${!done && !locked && attemptsLocked(t) ? '<span class="badge lock">⛔ ' + lockCountdown(t) + '</span>' : ''}
          ${i === activeIdx ? '<span class="badge active">▶ aktive Quest</span>' : ''}
        </div>
        <h3>${locked ? 'Agentenmission ' + t.step + '/3: ???' : t.title}</h3>
        <div class="ticket-meta">
          ${locked
            ? `<span class="place">🔒 erst „${reqTitle}" lösen</span>`
            : t.place ? `<span class="place">📍 ${t.place}</span>` : '<span class="place">🃏 überall lösbar</span>'}
          ${dist && !locked ? `<span class="dist">${dist}</span>` : ''}
        </div>
      </div>
      <div class="ticket-pts">
        <span class="pts">${t.points}</span><span class="pts-label">Pkt</span>
      </div>
      ${done ? `<div class="stamp">ERLEDIGT<span>${stampTime(done.at)}</span></div><div class="punch"></div>` : ''}`;
    card.onclick = () => openTask(t.id);
    list.appendChild(card);
  });
  listAnimated = true;
  updateScores();
  $('#joker-count').textContent = g.jokersLeft;
  $('#btn-joker').disabled = g.jokersLeft <= 0;
  $('#btn-joker').onclick = useJoker;
}

function stampTime(ts) {
  const d = new Date(ts);
  return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
}

function useJoker() {
  const g = S.game;
  if (g.jokersLeft <= 0) return;
  const open = gameTasks().filter(t => !g.completed[t.id]);
  if (!open.length) return;
  const names = open.map((t, i) => `${i + 1}: ${t.title}`).join('\n');
  const pick = prompt('Joker! Welche Aufgabe soll ersetzt werden?\n\n' + names + '\n\nNummer eingeben:');
  const idx = parseInt(pick, 10) - 1;
  if (isNaN(idx) || !open[idx]) return;
  const oldTask = open[idx];
  if (oldTask.chain) {
    alert('🕵️ Agentenmissionen lassen sich nicht abbrechen – der Geheimdienst besteht darauf.');
    return;
  }
  const inDeck = new Set(g.taskIds);
  const candidates = TASKS.filter(t =>
    !inDeck.has(t.id) && (!t.minMin || t.minMin <= g.durationMin) &&
    t.cat !== 'pause' && !t.chain && !t.secret &&
    fitsGamemode(t, g.gamemode || S.settings.gamemode));
  if (!candidates.length) { alert('Keine Ersatzaufgaben mehr im Vorrat!'); return; }
  const origin = lastPos || RALLY_CENTER;
  candidates.sort((a, b) => {
    const da = (a.free || a.lat == null) ? 400 : distMeters(origin, a);
    const db = (b.free || b.lat == null) ? 400 : distMeters(origin, b);
    return da - db;
  });
  const replacement = candidates[0];
  g.taskIds[g.taskIds.indexOf(oldTask.id)] = replacement.id;
  g.jokersLeft--;
  saveState(); renderTaskList();
  SFX.shuffle();
  alert(`🃏 „${oldTask.title}" fliegt raus.\nNeue Aufgabe: „${replacement.title}"`);
}

/* ---------------- Aufgaben-Detail ---------------- */

function openTask(id) {
  currentTaskId = id;
  const t = TASKS.find(x => x.id === id);
  const g = S.game;
  const done = g.completed[id];

  // Sperre nach 3 abgelehnten Foto-Versuchen: Countdown-Akte
  if (!done && attemptsLocked(t)) {
    SFX.nope();
    $('#task-badge').innerHTML = `<span class="badge lock">⛔ Prüfmeister-Sperre</span>`;
    $('#task-title').textContent = t.title;
    $('#task-place').textContent = '🧙 Der Prüfmeister hat dreimal abgelehnt.';
    $('#task-desc').textContent = `Diese Quest ist für eine Stunde gesperrt. Neuer Anlauf in ${lockCountdown(t)} – dann gibt es wieder ${MAX_ATTEMPTS} frische Versuche. Der Prüfmeister empfiehlt: erst mal ein Sör.`;
    $('#task-points').textContent = t.points + ' Punkte';
    $('#task-gmaps').hidden = true;
    $('#task-transit').hidden = true;
    $('#task-actions').innerHTML = '';
    $('#btn-speak').onclick = () => Narrator.speak('Geduld! Diese Quest ist gesperrt. Kommt in einer Stunde wieder.');
    $('#ov-task').classList.add('open');
    return;
  }

  // Day n Night: die Uhr hält diese Quest noch verschlossen
  if (!done && timeLocked(t)) {
    SFX.nope();
    const night = t.time === 'night';
    $('#task-badge').innerHTML = `<span class="badge lock">⏰ ${timeLockLabel(t)}</span>` +
      (night ? '<span class="badge tnight">🌙 Nacht-Quest</span>' : '<span class="badge tday">☀️ Tag-Quest</span>');
    $('#task-title').textContent = t.title;
    $('#task-place').textContent = night
      ? '🌙 Diese Quest gehört der Nacht.'
      : '☀️ Diese Quest braucht Tageslicht (oder Öffnungszeiten).';
    $('#task-desc').textContent = night
      ? `Der Schleier öffnet sich erst ${timeLockLabel(t).replace('🌙 ', '')} – vorher hat die Dunkelheit schlicht noch nicht das richtige Licht. Nehmt euch bis dahin eine Tag-Quest vor!`
      : `Dieses Fenster ist ${timeLockLabel(t).replace('☀️ ', '')} geöffnet. Danach schließen Tore, Läden oder schlicht die Sonne. Merkt sie euch für morgen – oder jagt jetzt eine Nacht-Quest!`;
    $('#task-points').textContent = t.points + ' Punkte';
    $('#task-gmaps').hidden = true;
    $('#task-transit').hidden = true;
    $('#task-actions').innerHTML = '';
    $('#btn-speak').onclick = () => Narrator.speak(night
      ? 'Geduld, Abenteurer. Diese Quest erwacht erst mit der Dunkelheit.'
      : 'Diese Quest gehört dem Tageslicht. Kehrt zurück, wenn die Sonne wieder regiert.');
    $('#ov-task').classList.add('open');
    return;
  }

  // Blitz-Bonus: Zeitpunkt des ERSTEN Öffnens merken
  if (!done && !taskLocked(t)) {
    g.opened = g.opened || {};
    if (!g.opened[id]) { g.opened[id] = Date.now(); saveState(); }
  }

  if (taskLocked(t) && !done) {
    SFX.nope();
    const req = TASKS.find(x => x.id === t.requires);
    $('#task-badge').innerHTML = `<span class="badge lock">🔒 Agentenmission – Teil ${t.step}</span>`;
    $('#task-title').textContent = 'Streng geheim';
    $('#task-place').textContent = '📁 Diese Akte ist noch versiegelt.';
    $('#task-desc').textContent = `Erst wenn „${req.title}" erledigt ist, wird dieser Auftrag freigeschaltet. Eine Mission nach der anderen, Agenten!`;
    $('#task-points').textContent = t.points + ' Punkte';
    $('#task-gmaps').hidden = true;
    $('#task-actions').innerHTML = '';
    $('#task-transit').hidden = true;
    $('#btn-speak').onclick = () => Narrator.speak('Diese Akte ist versiegelt. Erfüllt erst den vorherigen Teil der Mission.');
    $('#ov-task').classList.add('open');
    return;
  }
  const ov = $('#ov-task');
  const dist = (!t.free && t.lat != null && lastPos) ? distMeters(lastPos, t) : null;

  $('#task-badge').innerHTML =
    `<span class="badge">${CATS[t.cat].icon} ${CATS[t.cat].label}</span>` +
    timeBadge(t) +
    (t.complicated ? '<span class="badge hard">★ knifflig – Bonuswürdig</span>' : '');
  $('#task-title').textContent = t.title;
  $('#task-place').innerHTML = t.place
    ? `📍 ${t.place}${dist != null ? ` · <b>${fmtDist(dist)}</b> · 🚶 ~${walkMinutes(dist)} min zu Fuß` : ''}`
    : '🃏 Überall lösbar – wo ihr gerade steht.';
  $('#task-desc').textContent = t.desc;
  $('#task-points').textContent = t.points + ' Punkte';
  renderTransitPanel(t, done ? null : dist);

  $('#task-gmaps').hidden = !(t.lat != null && !t.free);
  if (t.lat != null && !t.free) $('#task-gmaps').href = gmapsLink(t);

  const act = $('#task-actions');
  act.innerHTML = '';
  if (done) {
    act.innerHTML = `<div class="done-note">✅ Erledigt um ${stampTime(done.at)}
      ${S.settings.mode === 'versus' ? ' – ' + TEAM_NAMES[done.team] : ''} (+${done.points} Pkt)</div>`;
    if (done.photoId) {
      loadPhoto(done.photoId).then(val => {
        if (!val) return;
        act.insertAdjacentHTML('beforeend', proofMediaHtml(val, 'Beweis'));
      });
    }
    if (done.answer) act.insertAdjacentHTML('beforeend',
      `<div class="answer-note">Eure Antwort: „${escapeHtml(done.answer)}"</div>`);
  } else {
    buildVerifyUI(t, act);
  }
  ov.classList.add('open');

  // Quest-Sound + magische Erzählerstimme
  SFX.quest();
  if (!done) Narrator.speakQuest(t);
  $('#btn-speak').onclick = () => {
    if (Narrator.available && speechSynthesis.speaking) Narrator.stop();
    else Narrator.speakQuest(t);
  };
}

function closeTask() {
  $('#ov-task').classList.remove('open');
  currentTaskId = null;
  Narrator.stop();
}

/* ÖPNV-Panel: erscheint, wenn die Quest weiter als 30 min zu Fuß entfernt ist */
function renderTransitPanel(t, dist) {
  const tr = $('#task-transit');
  tr.hidden = true; tr.innerHTML = '';
  if (dist == null || t.free || t.lat == null) return;
  const wm = walkMinutes(dist);
  if (wm <= 30) return;

  const from = lastPos || RALLY_CENTER;
  const sFrom = nearestStop(from);
  const sTo = nearestStop(t);
  const hour = new Date().getHours();
  const isNight = hour >= 23 || hour < 5;   // Metro-Betriebsschluss ~23:30
  const gmTransit = `https://www.google.com/maps/dir/?api=1&origin=${from.lat},${from.lng}&destination=${t.lat},${t.lng}&travelmode=transit`;

  tr.hidden = false;
  tr.innerHTML = `
    <div class="transit-head">🚌 Weiter Weg: <b>~${wm} min zu Fuß</b> – nehmt was Schnelleres!</div>
    ${sFrom ? `<div class="transit-row">🅰️ Einstieg bei euch: <b>${sFrom.name}</b> (${sFrom.lines}) · ${fmtDist(sFrom.dist)}</div>` : ''}
    ${sTo ? `<div class="transit-row">🅱️ Ausstieg am Ziel: <b>${sTo.name}</b> (${sTo.lines}) · ${fmtDist(sTo.dist)} bis zur Quest</div>` : ''}
    ${isNight ? '<div class="transit-row night-note">🌙 Nachtbetrieb: Die Metro schläft (~ab 23:30) – Tram 4/6 und die 9xx-Nachtbusse fahren durch.</div>' : ''}
    <div class="transit-btns">
      <a class="btn primary small-btn" target="_blank" rel="noopener" href="${gmTransit}">🚇 Live-Verbindung (ÖPNV)</a>
      <a class="btn ghost small-btn" target="_blank" rel="noopener" href="https://bkk.hu/budapestgo">🎫 Ticket: BudapestGO</a>
      <a class="btn ghost small-btn" target="_blank" rel="noopener" href="https://bolt.eu">🚗 Bolt bestellen</a>
      <a class="btn ghost small-btn" href="tel:+3612222222">📞 Főtaxi rufen</a>
    </div>`;
}

function buildVerifyUI(t, act) {
  // 🎥 Video-Beweis: eigener Quest-Typ ODER Zusatz-Option bei Foto-Quests
  const bindVideoInput = inp => {
    inp.onchange = async e => {
      const file = e.target.files[0];
      if (!file) return;
      if (file.size > 80 * 1024 * 1024) {
        alert('🎬 Das Video ist zu groß (max. ~80 MB). Dreht einen kürzeren Take – der Regisseur in euch schafft das!');
        e.target.value = '';
        return;
      }
      const videoId = 'vid_' + t.id + '_' + Date.now();
      const ok = await savePhoto(videoId, file);
      if (!ok) alert('Das Video konnte nicht gespeichert werden – die Quest zählt trotzdem!');
      completeTask(t, { photoId: ok ? videoId : null });
      e.target.value = '';
    };
  };

  if (t.verify === 'video') {
    act.innerHTML = `
      <label class="btn primary big" id="video-label">
        🎥 Video-Beweis drehen
        <input type="file" accept="video/*" capture="environment" hidden>
      </label>
      <p class="small muted">Das Video validiert die Quest. Es bleibt nur auf diesem Handy gespeichert.</p>`;
    bindVideoInput(act.querySelector('input'));
    return appendTipRow(t, act);
  }

  if (t.verify === 'photo') {
    const a = attemptState(t);
    const triesLeft = MAX_ATTEMPTS - (a ? a.n : 0);
    act.innerHTML = `
      <label class="btn primary big" id="photo-label">
        📸 Beweisfoto aufnehmen
        <input type="file" accept="image/*" capture="environment" hidden>
      </label>
      <div class="verdict" id="photo-verdict" hidden></div>
      ${t.video ? `
      <label class="btn ghost" id="video-label">
        🎥 Oder: Video-Beweis drehen
        <input type="file" accept="video/*" capture="environment" hidden>
      </label>` : ''}
      <p class="small muted">${S.apiKey && t.photoCheck
        ? '🧙 Der Magische Prüfmeister begutachtet jedes Foto – ' + triesLeft + ' von ' + MAX_ATTEMPTS + ' Versuchen übrig.'
        : 'Der Beweis validiert die Quest. Er bleibt nur auf diesem Handy gespeichert.'}</p>`;
    if (t.video) bindVideoInput(act.querySelector('#video-label input'));
    act.querySelector('#photo-label input').onchange = async e => {
      const file = e.target.files[0];
      if (!file) return;
      const label = $('#photo-label');
      const verdictBox = $('#photo-verdict');
      try {
        label.classList.add('checking');
        label.firstChild.textContent = '🧙 Der Prüfmeister begutachtet… ';
        const dataUrl = await shrinkImage(file);
        const verdict = await checkProof(t, dataUrl);
        if (verdict.pass) {
          const photoId = t.id + '_' + Date.now();
          await savePhoto(photoId, dataUrl);
          completeTask(t, { photoId, verdictReason: verdict.reason });
        } else {
          const st = registerFailedAttempt(t, verdict.reason);
          verdictBox.hidden = false;
          if (st.lockedUntil) {
            verdictBox.innerHTML = `<span class="denied-stamp">ABGELEHNT</span>
              <p>${escapeHtml(verdict.reason)}</p>
              <p><b>3 Fehlversuche – Quest gesperrt.</b> Neuer Anlauf in <b>${lockCountdown(t)}</b>. Nehmt euch derweil eine andere Quest vor!</p>`;
            act.querySelector('#photo-label').style.display = 'none';
            renderTaskList();
          } else {
            verdictBox.innerHTML = `<span class="denied-stamp">ABGELEHNT</span>
              <p>${escapeHtml(verdict.reason)}</p>
              <p><b>Erneut versuchen</b> – noch ${MAX_ATTEMPTS - st.n} von ${MAX_ATTEMPTS} Versuchen.</p>`;
            label.firstChild.textContent = '📸 Erneut versuchen ';
          }
        }
      } catch (err) {
        alert('Foto konnte nicht verarbeitet werden: ' + err.message);
      } finally {
        label.classList.remove('checking');
        if (label.firstChild.textContent.includes('Prüfmeister')) {
          label.firstChild.textContent = '📸 Beweisfoto aufnehmen ';
        }
        e.target.value = '';
      }
    };
  }

  if (t.verify === 'quiz') {
    act.innerHTML = `
      <div class="quiz-q">❓ ${t.quiz.q}</div>
      <div class="quiz-row">
        <input type="text" id="quiz-input" placeholder="Eure Antwort …" autocomplete="off">
        <button class="btn primary" id="quiz-check">Prüfen</button>
      </div>
      <div class="quiz-feedback" id="quiz-fb"></div>
      <div class="quiz-tools">
        <button class="btn ghost small-btn" id="quiz-hint">💡 Hinweis (−5 Pkt)</button>
        <button class="btn ghost small-btn" id="quiz-reveal">🏳️ Auflösen (nur 5 Pkt)</button>
      </div>`;
    let hintUsed = false;
    const check = () => {
      const val = normalize($('#quiz-input').value);
      if (!val) return;
      if (t.quiz.accept.some(a => val === normalize(a) || val.includes(normalize(a)))) {
        completeTask(t, { answer: $('#quiz-input').value, points: t.points - (hintUsed ? 5 : 0) });
      } else {
        const fb = $('#quiz-fb');
        fb.textContent = '❌ Leider nein – schaut nochmal genau hin!';
        fb.classList.remove('shake'); void fb.offsetWidth; fb.classList.add('shake');
        SFX.nope();
        if (navigator.vibrate) navigator.vibrate(120);
      }
    };
    $('#quiz-check').onclick = check;
    $('#quiz-input').onkeydown = e => { if (e.key === 'Enter') check(); };
    $('#quiz-hint').onclick = () => {
      hintUsed = true;
      $('#quiz-fb').textContent = '💡 ' + t.quiz.hint;
      $('#quiz-hint').disabled = true;
    };
    $('#quiz-reveal').onclick = () => {
      if (!confirm('Wirklich auflösen? Gibt nur 5 Punkte.')) return;
      alert(t.quiz.reveal);
      completeTask(t, { answer: '(aufgelöst)', points: 5 });
    };
  }

  if (t.verify === 'gps') {
    act.innerHTML = `
      <button class="btn primary big" id="gps-checkin">📍 GPS-Check-in</button>
      <div class="quiz-feedback" id="gps-fb"></div>
      <button class="btn ghost small-btn" id="gps-manual">Wir stehen hier, aber das GPS spinnt</button>`;
    $('#gps-checkin').onclick = () => {
      if (!lastPos) { $('#gps-fb').textContent = '🛰️ Noch kein GPS-Signal – kurz warten oder Standort freigeben.'; return; }
      const d = distMeters(lastPos, t);
      if (d <= 50) {
        completeTask(t, {});
      } else {
        $('#gps-fb').textContent = `🚶 Noch ${fmtDist(d)} bis zum Checkpoint – weiterlaufen!`;
      }
    };
    $('#gps-manual').onclick = () => {
      if (confirm('Ehrenwort, dass ihr wirklich dort steht?')) completeTask(t, {});
    };
  }

  if (t.verify === 'ghost') {
    const near = lastPos && t.lat != null ? distMeters(lastPos, t) : null;
    act.innerHTML = `
      <div class="ghost-gate">
        ${near != null && near > 70
          ? `<p class="small">👻 Das Zeitfenster öffnet sich erst vor Ort – noch <b>${fmtDist(near)}</b>.</p>`
          : '<p class="small">👻 Ihr seid nah genug. Bereit?</p>'}
        <button class="btn primary big" id="ghost-open">👻 Zeitfenster öffnen</button>
        ${near != null && near > 70
          ? '<button class="btn ghost small-btn" id="ghost-force">Wir sind da, GPS spinnt</button>' : ''}
      </div>`;
    const open = () => { closeTask(); openAR(t); };
    $('#ghost-open').onclick = () => {
      const d = lastPos && t.lat != null ? distMeters(lastPos, t) : null;
      if (d != null && d > 70) {
        alert('Noch ' + fmtDist(d) + ' bis zum Zeitfenster – die Geister sind ortsgebunden!');
        return;
      }
      open();
    };
    const force = $('#ghost-force');
    if (force) force.onclick = () => { if (confirm('Ehrenwort?')) open(); };
  }

  appendTipRow(t, act);
}

/* 💡 Tipp: günstige Stufe vor dem Joker (−5 XP auf die Belohnung) */
function appendTipRow(t, act) {
  if (!t.tip || t.verify === 'quiz') return;
  const g = S.game;
  const used = g.tips && g.tips[t.id];
  const tipRow = document.createElement('div');
  tipRow.className = 'tip-row';
  tipRow.innerHTML = used
    ? `<div class="tip-box">💡 ${escapeHtml(t.tip)}</div>`
    : `<button class="btn ghost small-btn" id="btn-tip">💡 Tipp anzeigen (−5 XP)</button><div class="tip-box" id="tip-box" hidden></div>`;
  act.appendChild(tipRow);
  const btn = tipRow.querySelector('#btn-tip');
  if (btn) btn.onclick = () => {
    g.tips = g.tips || {};
    g.tips[t.id] = true;
    saveState();
    btn.hidden = true;
    const box = tipRow.querySelector('#tip-box');
    box.hidden = false;
    box.textContent = '💡 ' + t.tip;
    SFX.sparkle();
    Narrator.say('tip_' + t.id, 'Ein Tipp vom Prüfmeister: ' + t.tip);
  };
}

function normalize(s) {
  return (s || '').toLowerCase().trim()
    .replace(/[.,!?"'´`]/g, '')
    .replace(/\s+/g, ' ');
}

/* ---------------- Der Magische Prüfmeister (Foto-Validierung) ---------------- */

const MAX_ATTEMPTS = 3;
const LOCK_MS = 60 * 60 * 1000;   // 1 Stunde Sperre nach 3 Fehlversuchen

function attemptState(t) {
  const g = S.game;
  g.attempts = g.attempts || {};
  const a = g.attempts[t.id];
  if (a && a.lockedUntil && Date.now() >= a.lockedUntil) {
    delete g.attempts[t.id];   // Stunde vorbei → 3 frische Versuche
    saveState();
    return null;
  }
  return a || null;
}

function attemptsLocked(t) {
  const a = attemptState(t);
  return !!(a && a.lockedUntil && Date.now() < a.lockedUntil);
}

function lockCountdown(t) {
  const a = attemptState(t);
  if (!a || !a.lockedUntil) return '';
  const s = Math.max(0, Math.floor((a.lockedUntil - Date.now()) / 1000));
  return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
}

function registerFailedAttempt(t, reason) {
  const g = S.game;
  g.attempts = g.attempts || {};
  const a = g.attempts[t.id] = g.attempts[t.id] || { n: 0 };
  a.n++;
  if (a.n >= MAX_ATTEMPTS) a.lockedUntil = Date.now() + LOCK_MS;
  saveState();
  SFX.nope();
  if (navigator.vibrate) navigator.vibrate([100, 60, 100]);
  if (a.lockedUntil) {
    Narrator.speak('Dreimal verweigert! Der Prüfmeister braucht eine Stunde Pause von euch. Versucht derweil eine andere Quest.');
  } else {
    Narrator.speak(`Abgelehnt! ${reason} Ihr habt noch ${MAX_ATTEMPTS - a.n} ${MAX_ATTEMPTS - a.n === 1 ? 'Versuch' : 'Versuche'}.`);
  }
  return a;
}

/* Stufe 1: lokaler Plausibilitäts-Check (ohne KI) –
   fängt schwarze, leere oder Winz-Bilder ab. Nacht-tauglich kalibriert. */
function heuristicPhotoCheck(dataUrl) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      if (img.width < 80 || img.height < 80) {
        resolve({ pass: false, reason: 'Das Bild ist verdächtig winzig – das war kein echtes Beweisfoto.' });
        return;
      }
      const c = document.createElement('canvas');
      c.width = 48; c.height = 48;
      const ctx = c.getContext('2d');
      ctx.drawImage(img, 0, 0, 48, 48);
      const d = ctx.getImageData(0, 0, 48, 48).data;
      let sum = 0;
      const lum = [];
      for (let i = 0; i < d.length; i += 4) {
        const l = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
        lum.push(l); sum += l;
      }
      const mean = sum / lum.length;
      const variance = lum.reduce((acc, l) => acc + (l - mean) ** 2, 0) / lum.length;
      if (mean < 6) resolve({ pass: false, reason: 'Der Prüfmeister sieht: nichts. Objektiv zugehalten? Selbst Budapester Nacht ist heller.' });
      else if (variance < 25) resolve({ pass: false, reason: 'Ein einfarbiges Bild? Der Prüfmeister ist alt, aber nicht blind.' });
      else resolve({ pass: true, reason: '' });
    };
    img.onerror = () => resolve({ pass: true, reason: '' });
    img.src = dataUrl;
  });
}

/* Stufe 2: KI-Prüfmeister (Claude Vision, optional per API-Key) */
async function aiPhotoCheck(t, dataUrl) {
  const b64 = dataUrl.split(',')[1];
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': S.apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true'
    },
    body: JSON.stringify({
      model: 'claude-opus-4-8',
      max_tokens: 300,
      output_config: {
        format: {
          type: 'json_schema',
          schema: {
            type: 'object',
            properties: {
              pass: { type: 'boolean' },
              reason: { type: 'string' }
            },
            required: ['pass', 'reason'],
            additionalProperties: false
          }
        }
      },
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: b64 } },
          {
            type: 'text',
            text: `Du bist der „Magische Prüfmeister" einer nächtlichen Schnitzeljagd in Budapest. ` +
              `Quest: „${t.title}". Erwarteter Foto-Beweis: ${t.photoCheck || t.desc} ` +
              `Prüfe wohlwollend, aber ehrlich: Erfüllt das Foto die Quest plausibel? ` +
              `Nachtaufnahmen sind dunkel, verwackelt und chaotisch – das ist okay und KEIN Ablehnungsgrund. ` +
              `Lehne ab, wenn das Motiv klar NICHT zur Quest passt (z. B. eine Steinstatue statt der geforderten Bronzestatue, ` +
              `ein Zimmer statt eines Platzes, ein völlig anderes Objekt). ` +
              `Antworte mit pass (true/false) und reason: 1–2 witzige deutsche Sätze im Ton eines mittelalterlichen Prüfmeisters.`
          }
        ]
      }]
    })
  });
  if (!res.ok) throw new Error('HTTP ' + res.status);
  const data = await res.json();
  if (data.stop_reason === 'refusal') throw new Error('refusal');
  const txt = (data.content || []).find(b => b.type === 'text');
  return JSON.parse(txt.text);
}

/* Gesamt-Prüfung: Heuristik → KI (falls Key) → sonst durchwinken */
async function checkProof(t, dataUrl) {
  const h = await heuristicPhotoCheck(dataUrl);
  if (!h.pass) return { ...h, source: 'lokal' };
  if (S.apiKey && t.photoCheck) {
    try {
      const v = await aiPhotoCheck(t, dataUrl);
      return { pass: !!v.pass, reason: v.reason || '', source: 'ki' };
    } catch (e) {
      // Prüfmeister nicht erreichbar → kein Fehlversuch, Foto zählt
      return { pass: true, reason: 'Der Prüfmeister schlummert (kein Netz) – euer Wort gilt.', source: 'offline' };
    }
  }
  return { pass: true, reason: '', source: 'lokal' };
}

/* ---------------- Aufgabe abschließen ---------------- */

function completeTask(t, extra) {
  const g = S.game;
  let points = extra.points != null ? extra.points : t.points;

  // 💡 Tipp genutzt → −5 XP (min. 5 bleiben)
  if (g.tips && g.tips[t.id]) points = Math.max(5, points - 5);

  // ⚡ Blitz-Bonus: schnell gelöst nach dem ersten Öffnen?
  let blitz = 0;
  const openedAt = g.opened && g.opened[t.id];
  if (openedAt) {
    const limitMin = t.points <= 15 ? 3 : t.points <= 30 ? 5 : 10;
    if (Date.now() - openedAt <= limitMin * 60000) blitz = 10;
  }
  points += blitz;

  const finish = team => {
    const rankBefore = rankFor(g.scores[0] + g.scores[1]);
    g.completed[t.id] = {
      at: Date.now(), points, team, blitz,
      photoId: extra.photoId || null, answer: extra.answer || null,
      verdict: extra.verdictReason || null
    };
    g.scores[team] += points;
    saveState();
    closeTask();
    renderTaskList();
    if (map) refreshMapLayers();
    if (navigator.vibrate) navigator.vibrate([60, 40, 120]);
    showStampToast(t, points, blitz);
    SFX.stamp();
    setTimeout(() => SFX.coins(), 250);
    confettiBurst();
    Narrator.praise(points);
    const rankAfter = rankFor(g.scores[0] + g.scores[1]);
    if (rankAfter !== rankBefore) {
      setTimeout(() => {
        SFX.fanfare();
        Narrator.say('rank_' + RANKS.indexOf(rankAfter), `Rangaufstieg! Ihr seid nun ${rankAfter.name}!`, { pitch: 1.25 });
        const el = $('#stamp-toast');
        el.innerHTML = `<div class="stamp-inner secret">${rankAfter.icon} RANGAUFSTIEG<br><b>${rankAfter.name}</b></div>`;
        el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
        setTimeout(() => el.classList.remove('show'), 2600);
        confettiBurst(40);
      }, 2400);
    }
    if (Object.keys(g.completed).length === g.taskIds.length) {
      setTimeout(() => {
        if (confirm('🎉 ALLE Aufgaben erledigt! Rallye beenden und zur Siegerehrung?')) finishGame();
      }, 900);
    }
  };

  if (S.settings.mode === 'versus') {
    const ov = $('#ov-team');
    ov.classList.add('open');
    $('#ov-team .team-q').textContent = `„${t.title}" – wer hat geliefert?`;
    $('#team-pick-a').onclick = () => { ov.classList.remove('open'); finish(0); };
    $('#team-pick-b').onclick = () => { ov.classList.remove('open'); finish(1); };
  } else {
    finish(0);
  }
}

function showStampToast(t, points, blitz) {
  const el = $('#stamp-toast');
  el.innerHTML = `<div class="stamp-inner">ENTWERTET<br><b>+${points} XP${blitz ? ' ⚡' : ''}</b><span>${t.title}${blitz ? ' · Blitz-Bonus +' + blitz : ''}</span></div>`;
  el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2200);
}

/* ---------------- Crew-Tab ---------------- */

function renderCrew() {
  const st = S.settings, g = S.game;
  const box = $('#crew-box');
  const done = Object.keys(g.completed).length;
  const elapsed = Math.round((Date.now() - g.startedAt) / 60000);
  const total = g.scores[0] + g.scores[1];
  const rank = rankFor(total);
  const next = RANKS.find(r => r.min > total);
  let html = `
    <div class="rank-card">
      <span class="rank-icon">${rank.icon}</span>
      <div>
        <div class="rank-name">${rank.name}</div>
        <div class="small muted">${next ? `Noch ${next.min - total} XP bis „${next.name}"` : 'Höchster Rang erreicht – Legenden!'}</div>
      </div>
    </div>`;
  html += `
    <div class="crew-stats">
      <div class="stat"><b>${done}</b><span>erledigt</span></div>
      <div class="stat"><b>${g.taskIds.length - done}</b><span>offen</span></div>
      <div class="stat"><b>${elapsed}′</b><span>unterwegs</span></div>
      <div class="stat"><b>${g.jokersLeft}</b><span>Joker übrig</span></div>
      <div class="stat"><b>🍺 ${Math.round((g.pausedTotal || 0) / 60000)}′</b><span>Barpause</span></div>
    </div>`;
  if (st.mode === 'versus') {
    html += `<div class="crew-teams">
      <div class="crew-team a"><h4>🏮 ${TEAM_NAMES[0]}</h4>
        <p>${st.teams[0].map(i => escapeHtml(st.players[i] || '?')).join(', ') || '–'}</p>
        <div class="crew-score">${g.scores[0]} Pkt</div></div>
      <div class="crew-team b"><h4>🌶️ ${TEAM_NAMES[1]}</h4>
        <p>${st.teams[1].map(i => escapeHtml(st.players[i] || '?')).join(', ') || '–'}</p>
        <div class="crew-score">${g.scores[1]} Pkt</div></div>
    </div>`;
  } else {
    html += `<div class="crew-team solo"><h4>🌃 Eure Crew</h4>
      <p>${st.players.map(escapeHtml).join(', ')}</p>
      <div class="crew-score">${g.scores[0] + g.scores[1]} Pkt gemeinsam</div></div>`;
  }
  const clipN = Narrator.clips ? Narrator.clips.size : 0;
  html += `
    <div class="card audio-card">
      <h3>🎚️ Klang der Nacht</h3>
      <div class="studio-box ${clipN ? 'ok' : 'warn'}">
        <p class="small"><b>🎙️ Studio-Erzähler „Friedrich Weber"</b><br>
        ${clipN
          ? `✅ ${clipN} Studio-Clips geladen – Quests, Tipps, Geister und Ansagen sprechen mit der tiefen Studio-Stimme.`
          : '⚠️ Studio-Clips noch nicht geladen – einmal „Studio-Stimme laden" tippen (Internet nötig). Bis dahin springt die Gerätestimme ein.'}</p>
        <div class="voice-tools">
          <button class="btn ghost small-btn" id="studio-preview">▶ Studio-Hörprobe</button>
          ${clipN ? '' : '<button class="btn ghost small-btn" id="studio-reload">🔄 Studio-Stimme laden</button>'}
        </div>
      </div>
      <label class="toggle-row"><span>🔔 Soundeffekte</span>
        <button class="tbtn a ${S.sound ? 'sel' : ''}" id="tog-sound">${S.sound ? 'an' : 'aus'}</button></label>
      <label class="toggle-row"><span>🔮 Erzählerstimme</span>
        <button class="tbtn a ${S.voice ? 'sel' : ''}" id="tog-voice">${S.voice ? 'an' : 'aus'}</button></label>
      <div class="voice-style">
        <p class="small muted">Stimmlage der Ersatzstimme (greift nur, wenn ein Studio-Clip fehlt oder ihr offline seid)</p>
        <div class="chip-row" id="voicestyle-picker">
          ${Object.entries(VOICE_STYLES).map(([key, st2]) => `
            <button class="chip ${(S.voiceStyle || 'wizard') === key ? 'sel' : ''}" data-vs="${key}">
              ${st2.label}<small>${st2.desc}</small>
            </button>`).join('')}
        </div>
      </div>
      ${renderVoicePicker()}
    </div>`;
  const notifStatus = !('Notification' in window)
    ? '❌ System-Benachrichtigung: vom Browser nicht unterstützt (iPhone: erst als Homescreen-App ab iOS 16.4)'
    : Notification.permission === 'granted'
      ? '✅ System-Benachrichtigung: erlaubt'
      : Notification.permission === 'denied'
        ? '⛔ System-Benachrichtigung: blockiert (in den Website-Einstellungen freigeben)'
        : '🕐 System-Benachrichtigung: noch nicht angefragt – Probe-Alarm tippen';
  const vibStatus = navigator.vibrate
    ? '✅ Vibration: unterstützt'
    : '❌ Vibration: vom iPhone-Browser gesperrt (Apple-Limit, kein App-Fehler)';
  html += `
    <div class="card audio-card">
      <h3>🛡️ Alarm & Benachrichtigungen</h3>
      <label class="toggle-row"><span>🔊 Hintergrund-Wächter</span>
        <button class="tbtn a ${S.guard ? 'sel' : ''}" id="tog-guard">${S.guard ? 'an' : 'aus'}</button></label>
      <p class="small muted">Der Wächter hält die Rallye über einen stillen Ton-Kanal wach: GPS läuft weiter
      und der Näherungs-Alarm klingelt hörbar durch den Lautsprecher – auch bei gesperrtem Display.
      Kostet etwas Akku; je nach iOS-Version experimentell.</p>
      <button class="btn ghost small-btn" id="btn-probe">🔔 Probe-Alarm auslösen</button>
      <p class="small muted" id="alert-status">
        ✅ In-App-Alarm (Klingeln, Banner, Erzähler): immer aktiv, solange die App offen ist<br>
        ${vibStatus}<br>
        ${notifStatus}<br>
        ${S.guard ? (Guard.running ? '✅ Wächter: wacht' : '🕐 Wächter: startet beim nächsten Tippen im Spiel') : '💤 Wächter: aus'}
      </p>
      <p class="small muted">📲 <b>Sperrbildschirm-Banner auf dem iPhone:</b> Die App über Teilen →
      „Zum Home-Bildschirm" installieren (ab iOS 16.4) und dort einmal den Probe-Alarm tippen –
      dann fragt iOS nach der Benachrichtigungs-Erlaubnis.</p>
    </div>`;
  html += `
    <div class="card audio-card">
      <h3>🧙 Magischer Prüfmeister</h3>
      <p class="small muted">Mit einem Anthropic-API-Key prüft eine KI eure Beweisfotos wirklich inhaltlich
      (falsches Motiv = abgelehnt, max. 3 Versuche, dann 1 h Sperre). Ohne Key gilt der lokale Basis-Check.
      Der Key bleibt nur auf diesem Gerät.</p>
      <div class="voice-row">
        <input type="password" id="apikey-input" placeholder="sk-ant-…" value="${S.apiKey ? '••••••••' : ''}" autocomplete="off">
        <button class="btn ghost small-btn" id="apikey-save">${S.apiKey ? 'Ändern' : 'Aktivieren'}</button>
      </div>
      ${S.apiKey ? '<button class="btn ghost small-btn" id="apikey-test">🔍 Key testen</button>' : ''}
      <p class="small ${S.apiKey ? '' : 'muted'}" id="apikey-status">${S.apiKey ? '✅ Prüfmeister wacht – Fotos werden von der KI begutachtet.' : 'Prüfmeister schläft – Fotos zählen per Ehrenwort + Basis-Check.'}</p>
    </div>`;
  html += `<p class="small muted center">Spielstand wird automatisch gespeichert –
    ihr könnt die App jederzeit schließen und weiterspielen.</p>`;
  box.innerHTML = html;
  $('#apikey-save').onclick = () => {
    const val = $('#apikey-input').value.trim();
    if (!val || val.startsWith('••')) {
      if (S.apiKey && confirm('Prüfmeister deaktivieren (Key löschen)?')) {
        S.apiKey = null; saveState(); renderCrew();
      }
      return;
    }
    S.apiKey = val; saveState(); renderCrew();
    Narrator.speak('Der Magische Prüfmeister ist erwacht. Ab jetzt wird jedes Beweisfoto begutachtet!');
    SFX.unlock();
  };
  const studioPrev = $('#studio-preview');
  if (studioPrev) studioPrev.onclick = () => {
    // Spielt die Studio-MP3 direkt (unabhängig vom Stimmen-Toggle);
    // wenn die Clips fehlen: frisch laden und erneut versuchen.
    if (!Narrator.playClip('welcome')) {
      studioPrev.disabled = true;
      Narrator.loadClips(true).then(n => {
        studioPrev.disabled = false;
        renderCrew();
        if (n) Narrator.playClip('welcome');
        else alert('Studio-Clips nicht erreichbar – seid ihr offline? Die Gerätestimme übernimmt derweil.');
      });
    }
  };
  const studioReload = $('#studio-reload');
  if (studioReload) studioReload.onclick = () => {
    studioReload.disabled = true;
    Narrator.loadClips(true).then(n => {
      renderCrew();
      if (n) { SFX.unlock(); Narrator.playClip('welcome'); }
    });
  };
  $('#tog-guard').onclick = () => {
    S.guard = !S.guard;
    saveState();
    if (S.guard) {
      Guard.start();   // wir sind in einer User-Geste
      Narrator.speak('Der Wächter der Nacht ist wach. Ich rufe euch, sobald eine Quest nahe ist – auch bei dunklem Bildschirm.');
    } else {
      Guard.stop();
    }
    renderCrew();
  };
  $('#btn-probe').onclick = () => {
    if ('Notification' in window && Notification.permission === 'default') {
      try { Notification.requestPermission().then(() => renderCrew()); } catch (e) {}
    }
    const t = (S.game && gameTasks().find(x => !S.game.completed[x.id])) || TASKS[0];
    questNearbyAlert(t, 42);
  };
  const testBtn = $('#apikey-test');
  if (testBtn) testBtn.onclick = async () => {
    const status = $('#apikey-status');
    testBtn.disabled = true;
    status.textContent = '🧙 Der Prüfmeister wird geweckt …';
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': S.apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
          model: 'claude-opus-4-8',
          max_tokens: 16,
          messages: [{ role: 'user', content: 'Antworte nur mit: OK' }]
        })
      });
      if (res.ok) {
        status.textContent = '✅ Prüfmeister antwortet – der Key funktioniert!';
        SFX.unlock();
        Narrator.speak('Der Prüfmeister ist wach und bereit, eure Fotos zu begutachten.');
      } else if (res.status === 401) {
        status.textContent = '❌ Key ungültig (401) – bitte prüfen und neu einfügen.';
        SFX.nope();
      } else {
        status.textContent = `⚠️ Prüfmeister meldet HTTP ${res.status} – Key oder Kontingent prüfen.`;
        SFX.nope();
      }
    } catch (e) {
      status.textContent = '⚠️ Keine Verbindung zur KI (offline?). Fotos zählen derweil per Ehrenwort.';
    } finally {
      testBtn.disabled = false;
    }
  };
  $('#tog-sound').onclick = () => {
    S.sound = !S.sound; saveState(); applyAudioIcon(); renderCrew();
    if (S.sound) SFX.chime();
  };
  $('#tog-voice').onclick = () => {
    S.voice = !S.voice; saveState(); applyAudioIcon(); renderCrew();
    if (S.voice) Narrator.speak('Die Stimme der Nacht ist erwacht.');
    else Narrator.stop();
  };
  const sel = $('#voice-select');
  if (sel) {
    sel.onchange = () => {
      S.voiceURI = sel.value || null;
      saveState();
      Narrator.pickVoice();
      Narrator.preview(Narrator.voice ? Narrator.voice.voiceURI : null);
    };
  }
  const prev = $('#voice-preview');
  if (prev) prev.onclick = () => {
    Narrator.pickVoice();
    if (Narrator.voice) Narrator.preview(Narrator.voice.voiceURI);
  };
  $$('#voicestyle-picker .chip').forEach(c => c.onclick = () => {
    S.voiceStyle = c.dataset.vs;
    saveState();
    renderCrew();
    const lines = {
      wizard: 'Ah… willkommen, Abenteurer. Die Nacht hat auf euch gewartet.',
      fee: 'Huiii! Auf gehts, ihr Nachtschwärmer!',
      neutral: 'Erzählerstimme bereit. Die Rallye kann beginnen.'
    };
    Narrator.speak(lines[c.dataset.vs] || lines.wizard);
  });
  const reload = $('#voice-reload');
  if (reload) reload.onclick = () => {
    const n = Narrator.reloadVoices();
    renderCrew();
    Narrator.speak(n
      ? `${n} deutsche ${n === 1 ? 'Stimme' : 'Stimmen'} gefunden. Die beste spricht zu euch.`
      : 'Noch keine deutsche Stimme gefunden. Einmal tippen, kurz warten, nochmal laden.');
  };
  const showAllBtn = $('#voice-showall');
  if (showAllBtn) showAllBtn.onclick = () => {
    S.voiceShowAll = !S.voiceShowAll;
    saveState();
    renderCrew();
  };
}

function renderVoicePicker() {
  if (!Narrator.available) {
    return '<p class="small muted">Dieses Gerät stellt leider keine Vorlesestimme bereit.</p>';
  }
  const all = Narrator.allVoices();
  const de = Narrator.germanVoices();
  const hasSiri = Narrator.hasSiriVoice();
  const showAll = !!S.voiceShowAll;
  const voices = showAll ? all : de;
  Narrator.pickVoice();
  const current = S.voiceURI || (Narrator.voice ? Narrator.voice.voiceURI : '');
  const sorted = voices.slice().sort((a, b) => Narrator.scoreVoice(b) - Narrator.scoreVoice(a));
  const opts = sorted.map(v => {
    const s = (v.name + ' ' + (v.voiceURI || '')).toLowerCase();
    const mark = s.includes('siri') ? ' 🪄 Siri' : Narrator.scoreVoice(v) >= 25 ? ' ✨' : '';
    const lang = showAll ? ` [${escapeHtml(v.lang || '?')}]` : '';
    return `<option value="${escapeHtml(v.voiceURI)}" ${v.voiceURI === current ? 'selected' : ''}>${escapeHtml(v.name)}${lang}${mark}</option>`;
  }).join('');
  return `
    <div class="voice-picker">
      <p class="small muted" id="voice-diagnose">📡 Gerät meldet <b>${all.length}</b> ${all.length === 1 ? 'Stimme' : 'Stimmen'},
        davon <b>${de.length}</b> deutsch · Siri-Stimme: <b>${hasSiri ? 'gefunden ✅' : 'vom iPhone nicht freigegeben'}</b></p>
      ${voices.length ? `
      <label class="small muted" for="voice-select">🛟 Ersatzstimme wählen (🪄 = Siri, ✨ = beste Qualität)</label>
      <div class="voice-row">
        <select id="voice-select">${opts}</select>
        <button class="btn ghost small-btn" id="voice-preview">▶ Hörprobe</button>
      </div>` : `
      <p class="small muted">Noch keine ${showAll ? '' : 'deutsche '}Stimme gemeldet – iPhones rücken die Liste oft erst nach dem ersten Tippen raus.</p>`}
      <div class="voice-tools">
        <button class="btn ghost small-btn" id="voice-showall">${showAll ? '🇩🇪 Nur deutsche Stimmen' : '🌍 Alle Stimmen anzeigen (' + all.length + ')'}</button>
        <button class="btn ghost small-btn" id="voice-reload">🔄 Stimmen neu laden</button>
      </div>
      ${hasSiri ? '' : `
      <div class="tip-box small">🪄 <b>Warum fehlt eure Siri-Stimme?</b> Apple gibt Siri-Stimmen grundsätzlich
      nicht an Browser und Web-Apps frei – keine Website kann sie abspielen, das ist eine iOS-Sperre und kein
      Fehler der Rallye. Der beste Ersatz: Unter <b>Einstellungen → Bedienungshilfen → Gesprochene Inhalte →
      Stimmen → Deutsch</b> die Stimme <b>„Anna (Premium)"</b> oder <b>„Helena (Premium)"</b> laden – die
      erscheint danach hier in der Liste (notfalls „🔄 Stimmen neu laden") und klingt mit der
      🧙-Dumbledore-Stimmlage fast so würdevoll. Über „🌍 Alle Stimmen anzeigen" seht ihr außerdem ALLES,
      was euer iPhone wirklich meldet – falls eure Stimme unter anderem Namen läuft, wählt sie einfach dort.</div>`}
    </div>`;
}

/* ---------------- Finale ---------------- */

function finishGame() {
  const g = S.game;
  if (g.pausedAt) {   // Beenden mitten in der Barpause: Pause sauber abschließen
    g.pausedTotal = (g.pausedTotal || 0) + (Date.now() - g.pausedAt);
    g.pausedAt = null;
    closePauseOverlay();
  }
  S.game.finished = true;
  S.game.finishedAt = Date.now();

  // 🏆 Halle der Legenden: komplette Rallye archivieren (inkl. Foto-Referenzen)
  S.archive = S.archive || [];
  S.archive.unshift({
    id: 'ral_' + g.startedAt,
    date: Date.now(),
    settings: JSON.parse(JSON.stringify(S.settings)),
    game: JSON.parse(JSON.stringify(g))
  });
  if (S.archive.length > 20) {
    const old = S.archive.pop();
    deletePhotoList(Object.values(old.game.completed || {}).map(c => c.photoId).filter(Boolean));
  }
  saveState();
  updateArchiveButton();
  Guard.stop();

  if (tickInterval) clearInterval(tickInterval);
  showFinal();
  SFX.fanfare();
  confettiBurst(48);
  setTimeout(() => confettiBurst(32), 900);
}

async function showFinal(entry, fromArchive) {
  showScreen('final');
  const g = entry ? entry.game : S.game;
  const st = entry ? entry.settings : S.settings;
  $('#btn-final-back').hidden = !fromArchive;
  $('#btn-again').hidden = !!fromArchive;
  const total = g.scores[0] + g.scores[1];
  const done = Object.keys(g.completed).length;
  const mins = Math.round(((g.finishedAt || Date.now()) - g.startedAt) / 60000);

  let headline, sub;
  if (st.mode === 'versus') {
    if (g.scores[0] === g.scores[1]) {
      headline = '🤝 Unentschieden!';
      sub = `Beide Teams: ${g.scores[0]} Punkte. Das gibt ein Stechen an der Bar.`;
    } else {
      const w = g.scores[0] > g.scores[1] ? 0 : 1;
      headline = (w === 0 ? '🏮 ' : '🌶️ ') + TEAM_NAMES[w] + ' gewinnt!';
      sub = `${g.scores[w]} : ${g.scores[1 - w]} Punkte – die Verlierer zahlen die nächste Runde.`;
    }
  } else {
    headline = total >= 200 ? '🏆 Legendäre Nacht!' : total >= 100 ? '🌟 Starke Runde!' : '🌙 Guter Anfang!';
    sub = `${total} Punkte, ${done} von ${g.taskIds.length} Aufgaben in ${mins} Minuten.`;
  }
  const rank = rankFor(total);
  const pausedMin = Math.round((g.pausedTotal || 0) / 60000);
  $('#final-headline').textContent = headline;
  $('#final-sub').textContent = sub + ` Euer Rang: ${rank.icon} ${rank.name}.` +
    (pausedMin > 0 ? ` Davon ${pausedMin} min ehrenwerte Barpause. 🍺` : '');
  if (!fromArchive) {
    Narrator.speak(`${headline.replace(/[^\wäöüÄÖÜß !:.,-]/g, '')} ${sub} Ihr tragt fortan den Rang: ${rank.name}. Die Nacht wird sich an euch erinnern.`);
  }

  const entryTasks = g.taskIds.map(id => TASKS.find(t => t.id === id)).filter(Boolean);
  const list = $('#final-list');
  list.innerHTML = '';
  entryTasks.forEach(t => {
    const c = g.completed[t.id];
    list.insertAdjacentHTML('beforeend', `
      <div class="final-row ${c ? 'ok' : 'miss'}">
        <span>${CATS[t.cat].icon} ${t.title}${c && c.blitz ? ' ⚡' : ''}</span>
        <b>${c ? '+' + c.points : '–'}</b>
      </div>`);
  });

  const gal = $('#final-gallery');
  gal.innerHTML = '';
  for (const t of entryTasks) {
    const c = g.completed[t.id];
    if (!c || !c.photoId) continue;
    const val = await loadPhoto(c.photoId);
    if (val) gal.insertAdjacentHTML('beforeend',
      `<figure>${proofMediaHtml(val, t.title)}<figcaption>${escapeHtml(t.title)}</figcaption></figure>`);
  }
  $('#final-gallery-empty').hidden = gal.children.length > 0;
}

/* ---------------- Halle der Legenden (Archiv) ---------------- */

function updateArchiveButton() {
  const btn = $('#btn-archive');
  if (!btn) return;
  const n = (S.archive || []).length;
  btn.hidden = n === 0;
  btn.textContent = `🏆 Halle der Legenden (${n})`;
}

function renderArchive() {
  const list = $('#archive-list');
  list.innerHTML = '';
  if (!(S.archive || []).length) {
    list.innerHTML = '<p class="small muted center">Noch keine abgeschlossenen Rallyes. Zieht los und schreibt Geschichte!</p>';
    return;
  }
  S.archive.forEach(entry => {
    const g = entry.game;
    const total = g.scores[0] + g.scores[1];
    const rank = rankFor(total);
    const d = new Date(entry.date);
    const done = Object.keys(g.completed || {}).length;
    const row = document.createElement('div');
    row.className = 'archive-row';
    row.innerHTML = `
      <button class="archive-main" type="button">
        <span class="archive-icon">${rank.icon}</span>
        <span class="archive-info">
          <b>${d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}, ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')} Uhr</b>
          <span class="small muted">${entry.settings.mode === 'versus' ? '⚔️ Versus' : '🤝 Koop'} · ${done}/${g.taskIds.length} Quests · ${total} XP · ${rank.name}</span>
        </span>
        <span class="archive-go">›</span>
      </button>
      <button class="archive-del" type="button" aria-label="Eintrag löschen">🗑️</button>`;
    row.querySelector('.archive-main').onclick = () => showFinal(entry, true);
    row.querySelector('.archive-del').onclick = async () => {
      if (!confirm('Diese Rallye samt Siegerehrungs-Fotos endgültig löschen?')) return;
      await deletePhotoList(Object.values(entry.game.completed || {}).map(c => c.photoId).filter(Boolean));
      S.archive = S.archive.filter(e => e.id !== entry.id);
      saveState();
      updateArchiveButton();
      renderArchive();
    };
    list.appendChild(row);
  });
}

/* ---------------- AR: Zeitfenster ---------------- */

let arStream = null;
let arTask = null;
let arHeadingHandler = null;
let arGhostVisible = false;
let arDrag = { on: false, x: 0, y: 0 };

async function openAR(t) {
  arTask = t;
  const ghost = GHOSTS[t.ghost];
  const ov = $('#ov-ar');
  ov.classList.add('open');
  $('#ar-story h3').textContent = ghost.name;
  $('#ar-story p').textContent = t.story;
  Narrator.say('ghost_' + t.ghost, `Der Schleier öffnet sich. ${ghost.name}. ${t.story}`);
  $('#ar-hint').textContent = 'Kamera startet …';
  $('#ar-preview').hidden = true;
  $('#ar-live').hidden = false;

  const img = $('#ar-ghost');
  img.src = ghost.img;
  img.style.left = '50%'; img.style.top = '46%';
  img.classList.remove('appear');

  // Kamera
  try {
    arStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment', width: { ideal: 1280 } }, audio: false
    });
    $('#ar-video').srcObject = arStream;
    await $('#ar-video').play();
  } catch (e) {
    $('#ar-hint').textContent = '🚫 Kamera nicht verfügbar (' + e.name + '). Der Geist erscheint trotzdem – Screenshot zählt auch.';
  }

  // Kompass (iOS braucht explizite Erlaubnis)
  let orientationOK = false;
  try {
    if (typeof DeviceOrientationEvent !== 'undefined' &&
        typeof DeviceOrientationEvent.requestPermission === 'function') {
      const p = await DeviceOrientationEvent.requestPermission();
      orientationOK = p === 'granted';
    } else {
      orientationOK = 'DeviceOrientationEvent' in window;
    }
  } catch (e) { orientationOK = false; }

  if (orientationOK) {
    $('#ar-hint').textContent = '🔦 Dreht euch langsam im Kreis, bis das Zeitfenster aufglüht …';
    arHeadingHandler = ev => onHeading(ev, ghost.heading);
    window.addEventListener('deviceorientationabsolute', arHeadingHandler, true);
    window.addEventListener('deviceorientation', arHeadingHandler, true);
    // Fallback: falls nach 8s nie sichtbar, Geist einfach zeigen
    setTimeout(() => { if (arTask && !arGhostVisible) showGhostFree(); }, 8000);
  } else {
    showGhostFree();
  }

  // Drag-Fallback immer erlauben
  enableGhostDrag();

  $('#ar-capture').onclick = captureAR;
  $('#ar-keep').onclick = keepARPhoto;
  $('#ar-retry').onclick = () => { $('#ar-preview').hidden = true; $('#ar-live').hidden = false; };
}

function onHeading(ev, target) {
  let heading = null;
  if (typeof ev.webkitCompassHeading === 'number') heading = ev.webkitCompassHeading;
  else if (ev.absolute && typeof ev.alpha === 'number') heading = 360 - ev.alpha;
  if (heading == null) return;
  let diff = ((target - heading + 540) % 360) - 180; // -180..180
  const img = $('#ar-ghost');
  if (Math.abs(diff) < 45) {
    img.style.left = `calc(50% + ${Math.round(diff * 8)}px)`;
    if (!arGhostVisible) {
      arGhostVisible = true;
      img.classList.add('appear');
      $('#ar-hint').textContent = '👻 Da! Haltet drauf und drückt den Auslöser!';
      SFX.ghost();
      if (navigator.vibrate) navigator.vibrate([50, 50, 50]);
    }
  } else {
    arGhostVisible = false;
    img.classList.remove('appear');
    $('#ar-hint').textContent = diff > 0
      ? '🔦 Weiter nach rechts drehen →' : '🔦 ← Weiter nach links drehen';
  }
}

function showGhostFree() {
  arGhostVisible = true;
  const img = $('#ar-ghost');
  img.classList.add('appear');
  SFX.ghost();
  $('#ar-hint').textContent = '👻 Der Geist ist da! Verschiebt ihn mit dem Finger, dann Auslöser drücken.';
}

function enableGhostDrag() {
  const img = $('#ar-ghost');
  const stage = $('#ar-stage');
  img.onpointerdown = e => {
    arDrag.on = true; img.setPointerCapture(e.pointerId);
  };
  img.onpointermove = e => {
    if (!arDrag.on) return;
    const r = stage.getBoundingClientRect();
    img.style.left = ((e.clientX - r.left) / r.width * 100) + '%';
    img.style.top = ((e.clientY - r.top) / r.height * 100) + '%';
  };
  img.onpointerup = () => { arDrag.on = false; };
}

function captureAR() {
  SFX.shutter();
  const video = $('#ar-video');
  const stage = $('#ar-stage');
  const img = $('#ar-ghost');
  const canvas = $('#ar-canvas');
  const sw = stage.clientWidth, sh = stage.clientHeight;
  canvas.width = sw * 2; canvas.height = sh * 2;   // 2x für Schärfe
  const ctx = canvas.getContext('2d');
  ctx.scale(2, 2);

  // Video "cover"-gerecht zeichnen
  if (video.videoWidth) {
    const vr = video.videoWidth / video.videoHeight, sr = sw / sh;
    let dw, dh;
    if (vr > sr) { dh = sh; dw = sh * vr; } else { dw = sw; dh = sw / vr; }
    ctx.drawImage(video, (sw - dw) / 2, (sh - dh) / 2, dw, dh);
  } else {
    ctx.fillStyle = '#10132b'; ctx.fillRect(0, 0, sw, sh);
  }

  // Geist an seiner Bildschirmposition einzeichnen
  if (arGhostVisible) {
    const ir = img.getBoundingClientRect(), sr2 = stage.getBoundingClientRect();
    ctx.globalAlpha = 0.85;
    ctx.shadowColor = 'rgba(255,193,69,0.9)';
    ctx.shadowBlur = 30;
    ctx.drawImage(img, ir.left - sr2.left, ir.top - sr2.top, ir.width, ir.height);
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
  }

  // Hyper-real-Finish: warmes Zeitfenster-Licht, Vignette und feines Filmkorn –
  // das gespeicherte Foto sieht aus wie eine Aufnahme aus einer anderen Zeit.
  const warm = ctx.createRadialGradient(sw / 2, sh * 0.42, 10, sw / 2, sh * 0.42, Math.max(sw, sh) * 0.75);
  warm.addColorStop(0, 'rgba(255, 205, 110, 0.10)');
  warm.addColorStop(0.55, 'rgba(255, 193, 69, 0.03)');
  warm.addColorStop(1, 'rgba(8, 4, 24, 0.38)');
  ctx.fillStyle = warm;
  ctx.fillRect(0, 0, sw, sh);
  ctx.globalAlpha = 0.05;
  for (let i = 0; i < 900; i++) {
    const x = (i * 733) % sw, y = (i * 397 + (i % 13) * 41) % sh;
    ctx.fillStyle = (i % 2) ? '#fff' : '#000';
    ctx.fillRect(x, y, 1, 1);
  }
  ctx.globalAlpha = 1;

  const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
  $('#ar-photo').src = dataUrl;
  $('#ar-live').hidden = true;
  $('#ar-preview').hidden = false;
}

async function keepARPhoto() {
  const dataUrl = $('#ar-photo').src;
  const photoId = arTask.id + '_' + Date.now();
  await savePhoto(photoId, dataUrl);
  const t = arTask;
  closeAR();
  completeTask(t, { photoId });
}

function closeAR() {
  $('#ov-ar').classList.remove('open');
  if (arStream) { arStream.getTracks().forEach(tr => tr.stop()); arStream = null; }
  if (arHeadingHandler) {
    window.removeEventListener('deviceorientationabsolute', arHeadingHandler, true);
    window.removeEventListener('deviceorientation', arHeadingHandler, true);
    arHeadingHandler = null;
  }
  arGhostVisible = false;
  arTask = null;
}

/* ---------------- GPS-Update-Hook + Näherungs-Alarm ---------------- */

const NEAR_RADIUS = 60;   // Meter bis zum Alarm

function onGeoUpdate() {
  if (S.game && !S.game.finished) checkProximity();
  if (S.screen === 'game' && $('#tab-tasks').classList.contains('active')) {
    // Liste live nach Entfernung umsortieren (nicht bei offenem Overlay)
    if (!$('#ov-task').classList.contains('open')) renderTaskList();
  }
  if (S.screen === 'game' && $('#tab-map').classList.contains('active')) {
    refreshMapLayers();
  }
}

function checkProximity() {
  const g = S.game;
  if (!g || g.finished || g.pausedAt || !lastPos) return;
  g.notified = g.notified || {};
  gameTasks().forEach(t => {
    if (t.free || t.lat == null || g.completed[t.id] || taskLocked(t) || timeLocked(t) || g.notified[t.id]) return;
    const d = distMeters(lastPos, t);
    if (d <= NEAR_RADIUS) {
      g.notified[t.id] = Date.now();
      saveState();
      questNearbyAlert(t, d);
    }
  });
}

function questNearbyAlert(t, d) {
  SFX.ring();
  if (navigator.vibrate) navigator.vibrate([300, 100, 300, 100, 600]);
  Narrator.say('near', `Haltet ein, Abenteurer! Eine Quest ist zum Greifen nah: ${t.title}.`);

  const el = $('#near-toast');
  el.innerHTML = `
    <button class="near-inner" type="button">
      <span class="near-icon">${CATS[t.cat].icon}</span>
      <span class="near-text"><b>Quest in Reichweite!</b><br>${escapeHtml(t.title)} · ${fmtDist(d)}</span>
      <span class="near-go">Öffnen ›</span>
    </button>`;
  el.querySelector('.near-inner').onclick = () => { el.classList.remove('show'); openTask(t.id); };
  el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 9000);

  showSystemNotification('🌃 Quest in Reichweite!',
    `${t.title} – nur noch ${fmtDist(d)}. ${t.points} XP warten auf euch.`, 'br-near-' + t.id);
}

/* System-Benachrichtigung: bevorzugt über den Service Worker (funktioniert
   auch als installierte Homescreen-App auf iOS 16.4+), sonst klassisch. */
function showSystemNotification(title, body, tag) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  const opts = { body, icon: 'assets/icon.svg', badge: 'assets/icon.svg', tag };
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.ready
      .then(reg => reg.showNotification(title, opts))
      .catch(() => { try { new Notification(title, opts); } catch (e) {} });
    return;
  }
  try { new Notification(title, opts); } catch (e) { /* optional */ }
}

/* Beweis rendern: Foto-DataURL als <img>, Video-Blob als <video> */
function proofMediaHtml(val, alt) {
  if (val instanceof Blob) {
    const url = URL.createObjectURL(val);
    return `<video class="proof-thumb" src="${url}" controls playsinline preload="metadata"></video>`;
  }
  return `<img class="proof-thumb" src="${val}" alt="${escapeHtml(alt || 'Beweisfoto')}">`;
}

/* ---------------- Utils ---------------- */

function escapeHtml(s) {
  return (s || '').replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
