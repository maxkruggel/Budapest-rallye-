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
  bindStatic();
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
  $('#btn-new').onclick = () => { renderSetup(); showScreen('setup'); };
  $('#btn-resume').onclick = () => {
    if (S.game.finished) { showFinal(); } else { enterGame(); }
  };
  $('#btn-theme').onclick = toggleTheme;
  $('#btn-theme-splash').onclick = toggleTheme;

  $$('.navbtn').forEach(b => b.onclick = () => switchTab(b.dataset.tab));

  $('#btn-start').onclick = startGame;
  $('#btn-setup-back').onclick = () => showScreen('splash');

  $('#btn-endgame').onclick = () => {
    if (confirm('Rallye jetzt beenden und zur Auswertung?')) finishGame();
  };
  $('#btn-extend').onclick = () => {
    S.game.endsAt += 15 * 60000; S.game.extraMin += 15;
    $('#time-up-banner').hidden = true; saveState(); tick();
  };
  $('#btn-finish-now').onclick = finishGame;

  $('#ov-task .ov-close').onclick = closeTask;
  $('#ov-ar .ar-close').onclick = closeAR;

  $('#btn-again').onclick = async () => {
    if (!confirm('Neue Rallye starten? Das alte Ergebnis inkl. Fotos wird gelöscht.')) return;
    await clearPhotos();
    S.game = null; saveState();
    renderSetup(); showScreen('setup');
  };
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

async function requestWakeLock() {
  try { wakeLock = await navigator.wakeLock?.request('screen'); } catch (e) { /* optional */ }
}
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && S.screen === 'game') requestWakeLock();
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

function buildDeck(durationMin, startPos) {
  const origin = startPos || RALLY_CENTER;
  const pool = TASKS.filter(t => !t.minMin || t.minMin <= durationMin);
  const byDist = t => (t.free || t.lat == null) ? 0 : distMeters(origin, t);

  const size = deckSizeFor(durationMin);
  const nPause = Math.max(1, Math.min(4, Math.floor(durationMin / 60) || 1));
  const nAr    = durationMin >= 180 ? 3 : durationMin >= 90 ? 2 : 1;
  const nKiosk = durationMin >= 120 ? 2 : 1;

  const take = (arr, n) => arr.slice(0, n);
  const shuffle = arr => arr.map(v => [v, Math.sin(v.id.length * 7 + arr.indexOf(v) * 13 + Date.now() % 97)])
    .sort((a, b) => a[1] - b[1]).map(v => v[0]);

  const pauses = take(shuffle(pool.filter(t => t.cat === 'pause')), nPause);
  const ars    = take(pool.filter(t => t.cat === 'ar').sort((a, b) => byDist(a) - byDist(b)), nAr);
  const kiosks = take(shuffle(pool.filter(t => t.cat === 'kiosk')), nKiosk);

  const used = new Set([...pauses, ...ars, ...kiosks].map(t => t.id));
  const rest = pool.filter(t => !used.has(t.id) && !['pause', 'ar', 'kiosk'].includes(t.cat));
  const located = rest.filter(t => !t.free && t.lat != null).sort((a, b) => byDist(a) - byDist(b));
  const freeTasks = shuffle(rest.filter(t => t.free || t.lat == null));

  const needed = Math.max(0, size - pauses.length - ars.length - kiosks.length);
  const nFree = Math.min(freeTasks.length, Math.max(1, Math.round(needed / 4)));
  const picked = [...take(located, needed - nFree), ...take(freeTasks, nFree)];

  // Route: nearest-neighbor über alle ortsgebundenen Aufgaben (inkl. AR)
  let routePool = [...picked.filter(t => !t.free && t.lat != null), ...ars];
  const route = [];
  let cur = origin;
  while (routePool.length) {
    routePool.sort((a, b) => distMeters(cur, a) - distMeters(cur, b));
    const next = routePool.shift();
    route.push(next); cur = next;
  }

  // Freie Aufgaben + Kioske gleichmäßig einstreuen, Pausen in regelmäßigen Abständen
  const floaters = [...picked.filter(t => t.free || t.lat == null), ...kiosks];
  const deck = [...route];
  floaters.forEach((t, i) => {
    const pos = Math.min(deck.length, Math.round((i + 1) * deck.length / (floaters.length + 1)) + 1);
    deck.splice(pos, 0, t);
  });
  pauses.forEach((t, i) => {
    const pos = Math.min(deck.length, Math.round((i + 1) * deck.length / (pauses.length + 1)));
    deck.splice(pos, 0, t);
  });
  return deck.map(t => t.id);
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
    taskIds: buildDeck(st.durationMin, lastPos),
    completed: {},
    jokersLeft: 2,
    scores: [0, 0],
    extraMin: 0,
    finished: false
  };
  saveState();
  enterGame();
}

function enterGame() {
  showScreen('game');
  renderHud();
  renderTaskList();
  switchTab('tasks');
  if (tickInterval) clearInterval(tickInterval);
  tickInterval = setInterval(tick, 1000);
  tick();
}

function gameTasks() {
  return S.game.taskIds.map(id => TASKS.find(t => t.id === id)).filter(Boolean);
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
    $('#scoreA').textContent = g.scores[0];
    $('#scoreB').textContent = g.scores[1];
  } else {
    $('#score-total').textContent = g.scores[0] + g.scores[1];
  }
  const done = Object.keys(g.completed).length;
  $('#hud-progress').textContent = `${done}/${g.taskIds.length}`;
}

function tick() {
  const g = S.game;
  if (!g || g.finished) return;
  const left = g.endsAt - Date.now();
  const el = $('#hud-timer');
  const abs = Math.abs(left);
  const h = Math.floor(abs / 3600000), m = Math.floor(abs % 3600000 / 60000), s = Math.floor(abs % 60000 / 1000);
  const str = (h ? h + ':' : '') + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  el.textContent = (left < 0 ? '−' : '') + str;
  el.classList.toggle('overtime', left < 0);
  el.classList.toggle('lastmins', left >= 0 && left < 5 * 60000);
  if (left < 0 && $('#time-up-banner').hidden) {
    $('#time-up-banner').hidden = false;
    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
  }
}

/* ---------------- Tabs ---------------- */

function switchTab(tab) {
  $$('.navbtn').forEach(b => b.classList.toggle('sel', b.dataset.tab === tab));
  $$('.tab').forEach(t => t.classList.toggle('active', t.id === 'tab-' + tab));
  if (tab === 'map') {
    if (typeof L === 'undefined') {
      $('#map').innerHTML = '<div class="map-fail">🗺️ Karte konnte nicht geladen werden.<br>Nutzt die Google-Maps-Buttons in den Aufgaben!</div>';
      return;
    }
    initMap(S.theme);
    setTimeout(() => {
      map.invalidateSize();
      renderTaskMarkers(gameTasks(), S.game.completed, openTask);
      fitToGame(gameTasks());
    }, 60);
  }
  if (tab === 'crew') renderCrew();
}

/* ---------------- Aufgabenliste ---------------- */

function renderTaskList() {
  const g = S.game;
  const list = $('#task-list');
  list.innerHTML = '';
  gameTasks().forEach((t, i) => {
    const done = g.completed[t.id];
    const card = document.createElement('button');
    card.className = `ticket cat-${t.cat} ${done ? 'done' : ''}`;
    card.dataset.task = t.id;
    const dist = (!t.free && t.lat != null && lastPos) ? fmtDist(distMeters(lastPos, t)) : '';
    card.innerHTML = `
      <div class="ticket-side"><span class="ticket-num">${String(i + 1).padStart(2, '0')}</span></div>
      <div class="ticket-body">
        <div class="ticket-top">
          <span class="badge">${CATS[t.cat].icon} ${CATS[t.cat].label}</span>
          ${t.complicated ? '<span class="badge hard">★ knifflig</span>' : ''}
        </div>
        <h3>${t.title}</h3>
        <div class="ticket-meta">
          ${t.place ? `<span class="place">📍 ${t.place}</span>` : '<span class="place">🃏 überall lösbar</span>'}
          ${dist ? `<span class="dist">${dist}</span>` : ''}
        </div>
      </div>
      <div class="ticket-pts">
        <span class="pts">${t.points}</span><span class="pts-label">Pkt</span>
      </div>
      ${done ? `<div class="stamp">ERLEDIGT<span>${stampTime(done.at)}</span></div><div class="punch"></div>` : ''}`;
    card.onclick = () => openTask(t.id);
    list.appendChild(card);
  });
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
  const inDeck = new Set(g.taskIds);
  const candidates = TASKS.filter(t =>
    !inDeck.has(t.id) && (!t.minMin || t.minMin <= g.durationMin) && t.cat !== 'pause');
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
  alert(`🃏 „${oldTask.title}" fliegt raus.\nNeue Aufgabe: „${replacement.title}"`);
}

/* ---------------- Aufgaben-Detail ---------------- */

function openTask(id) {
  currentTaskId = id;
  const t = TASKS.find(x => x.id === id);
  const g = S.game;
  const done = g.completed[id];
  const ov = $('#ov-task');
  const dist = (!t.free && t.lat != null && lastPos) ? distMeters(lastPos, t) : null;

  $('#task-badge').innerHTML =
    `<span class="badge">${CATS[t.cat].icon} ${CATS[t.cat].label}</span>` +
    (t.complicated ? '<span class="badge hard">★ knifflig – Bonuswürdig</span>' : '');
  $('#task-title').textContent = t.title;
  $('#task-place').innerHTML = t.place
    ? `📍 ${t.place}${dist != null ? ` · <b>${fmtDist(dist)}</b> entfernt` : ''}`
    : '🃏 Überall lösbar – wo ihr gerade steht.';
  $('#task-desc').textContent = t.desc;
  $('#task-points').textContent = t.points + ' Punkte';

  $('#task-gmaps').hidden = !(t.lat != null && !t.free);
  if (t.lat != null && !t.free) $('#task-gmaps').href = gmapsLink(t);

  const act = $('#task-actions');
  act.innerHTML = '';
  if (done) {
    act.innerHTML = `<div class="done-note">✅ Erledigt um ${stampTime(done.at)}
      ${S.settings.mode === 'versus' ? ' – ' + TEAM_NAMES[done.team] : ''} (+${done.points} Pkt)</div>`;
    if (done.photoId) {
      loadPhoto(done.photoId).then(url => {
        if (url) act.insertAdjacentHTML('beforeend',
          `<img class="proof-thumb" src="${url}" alt="Beweisfoto">`);
      });
    }
    if (done.answer) act.insertAdjacentHTML('beforeend',
      `<div class="answer-note">Eure Antwort: „${escapeHtml(done.answer)}"</div>`);
  } else {
    buildVerifyUI(t, act);
  }
  ov.classList.add('open');
}

function closeTask() { $('#ov-task').classList.remove('open'); currentTaskId = null; }

function buildVerifyUI(t, act) {
  if (t.verify === 'photo') {
    act.innerHTML = `
      <label class="btn primary big">
        📸 Beweisfoto aufnehmen
        <input type="file" accept="image/*" capture="environment" hidden>
      </label>
      <p class="small muted">Das Foto validiert die Aufgabe. Es bleibt nur auf diesem Handy gespeichert.</p>`;
    act.querySelector('input').onchange = async e => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const dataUrl = await shrinkImage(file);
        const photoId = t.id + '_' + Date.now();
        await savePhoto(photoId, dataUrl);
        completeTask(t, { photoId });
      } catch (err) { alert('Foto konnte nicht verarbeitet werden: ' + err.message); }
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
}

function normalize(s) {
  return (s || '').toLowerCase().trim()
    .replace(/[.,!?"'´`]/g, '')
    .replace(/\s+/g, ' ');
}

/* ---------------- Aufgabe abschließen ---------------- */

function completeTask(t, extra) {
  const g = S.game;
  const points = extra.points != null ? extra.points : t.points;

  const finish = team => {
    g.completed[t.id] = { at: Date.now(), points, team, photoId: extra.photoId || null, answer: extra.answer || null };
    g.scores[team] += points;
    saveState();
    closeTask();
    renderTaskList();
    if (map) renderTaskMarkers(gameTasks(), g.completed, openTask);
    if (navigator.vibrate) navigator.vibrate([60, 40, 120]);
    showStampToast(t, points);
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

function showStampToast(t, points) {
  const el = $('#stamp-toast');
  el.innerHTML = `<div class="stamp-inner">ENTWERTET<br><b>+${points} Punkte</b><span>${t.title}</span></div>`;
  el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2200);
}

/* ---------------- Crew-Tab ---------------- */

function renderCrew() {
  const st = S.settings, g = S.game;
  const box = $('#crew-box');
  const done = Object.keys(g.completed).length;
  const elapsed = Math.round((Date.now() - g.startedAt) / 60000);
  let html = `
    <div class="crew-stats">
      <div class="stat"><b>${done}</b><span>erledigt</span></div>
      <div class="stat"><b>${g.taskIds.length - done}</b><span>offen</span></div>
      <div class="stat"><b>${elapsed}′</b><span>unterwegs</span></div>
      <div class="stat"><b>${g.jokersLeft}</b><span>Joker übrig</span></div>
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
  html += `<p class="small muted center">Spielstand wird automatisch gespeichert –
    ihr könnt die App jederzeit schließen und weiterspielen.</p>`;
  box.innerHTML = html;
}

/* ---------------- Finale ---------------- */

function finishGame() {
  S.game.finished = true;
  S.game.finishedAt = Date.now();
  saveState();
  if (tickInterval) clearInterval(tickInterval);
  showFinal();
}

async function showFinal() {
  showScreen('final');
  const g = S.game, st = S.settings;
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
  $('#final-headline').textContent = headline;
  $('#final-sub').textContent = sub;

  const list = $('#final-list');
  list.innerHTML = '';
  gameTasks().forEach(t => {
    const c = g.completed[t.id];
    list.insertAdjacentHTML('beforeend', `
      <div class="final-row ${c ? 'ok' : 'miss'}">
        <span>${CATS[t.cat].icon} ${t.title}</span>
        <b>${c ? '+' + c.points : '–'}</b>
      </div>`);
  });

  const gal = $('#final-gallery');
  gal.innerHTML = '';
  for (const t of gameTasks()) {
    const c = g.completed[t.id];
    if (!c || !c.photoId) continue;
    const url = await loadPhoto(c.photoId);
    if (url) gal.insertAdjacentHTML('beforeend',
      `<figure><img src="${url}" alt="${escapeHtml(t.title)}"><figcaption>${escapeHtml(t.title)}</figcaption></figure>`);
  }
  $('#final-gallery-empty').hidden = gal.children.length > 0;
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
  }

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

/* ---------------- GPS-Update-Hook ---------------- */

function onGeoUpdate() {
  if (S.screen === 'game' && $('#tab-tasks').classList.contains('active')) {
    // Distanzen in der Liste sanft aktualisieren (ohne komplettes Re-Render bei offenem Overlay)
    if (!$('#ov-task').classList.contains('open')) renderTaskList();
  }
}

/* ---------------- Utils ---------------- */

function escapeHtml(s) {
  return (s || '').replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
