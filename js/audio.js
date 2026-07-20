/* =========================================================
   Sound-Effekte (WebAudio, synthetisiert – keine Dateien)
   + Die magische Erzählerstimme (Web Speech API, Deutsch)
   ========================================================= */

let _actx = null;

function audioCtx() {
  if (!S.sound) return null;
  try {
    if (!_actx) _actx = new (window.AudioContext || window.webkitAudioContext)();
    if (_actx.state === 'suspended') _actx.resume();
    return _actx;
  } catch (e) { return null; }
}

/* Einzelton mit Hüllkurve; glide = Zielfrequenz für Gleiten */
function tone(freqStart, startIn, dur, opts = {}) {
  const ctx = audioCtx();
  if (!ctx) return;
  const { type = 'sine', gain = 0.12, glide = null, detune = 0 } = opts;
  const t0 = ctx.currentTime + startIn;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freqStart, t0);
  if (glide) osc.frequency.exponentialRampToValueAtTime(glide, t0 + dur);
  osc.detune.value = detune;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(ctx.destination);
  osc.start(t0); osc.stop(t0 + dur + 0.05);
}

const SFX = {
  /* Harfen-Arpeggio – Spielstart & Willkommen */
  chime() {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) =>
      tone(f, i * 0.09, 0.5, { gain: 0.1 }));
  },
  /* Quest öffnen – aufsteigendes magisches Wuschhh */
  quest() {
    tone(220, 0, 0.28, { glide: 880, gain: 0.07, type: 'triangle' });
    tone(1318.5, 0.16, 0.35, { gain: 0.06 });
  },
  /* Stempel/Entwerter – Thunk + Glitzer */
  stamp() {
    tone(140, 0, 0.12, { type: 'square', gain: 0.14 });
    tone(90, 0.02, 0.16, { type: 'sine', gain: 0.16 });
    [1567.98, 2093].forEach((f, i) => tone(f, 0.1 + i * 0.06, 0.25, { gain: 0.05 }));
  },
  /* Münz-Jingle – Punkte */
  coins() {
    [987.77, 1318.5, 1567.98].forEach((f, i) =>
      tone(f, i * 0.07, 0.18, { type: 'triangle', gain: 0.08 }));
  },
  /* Geheimnis freigeschaltet */
  unlock() {
    [392, 523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) =>
      tone(f, i * 0.08, 0.6, { gain: 0.09 }));
    tone(2093, 0.5, 0.8, { gain: 0.04 });
  },
  /* Geist erscheint – schwebendes Flirren */
  ghost() {
    tone(440, 0, 1.2, { gain: 0.05, detune: -8 });
    tone(443, 0, 1.2, { gain: 0.05, detune: 8 });
    tone(880, 0.3, 0.9, { glide: 660, gain: 0.04 });
  },
  /* Gong – Zeitwarnung */
  gong() {
    tone(196, 0, 1.6, { gain: 0.14 });
    tone(392.5, 0, 1.2, { gain: 0.05 });
    tone(587, 0.02, 0.8, { gain: 0.03 });
  },
  /* Fanfare – Rangaufstieg & Finale */
  fanfare() {
    [[523.25, 0], [523.25, 0.14], [523.25, 0.28], [659.25, 0.42], [783.99, 0.62], [1046.5, 0.86]]
      .forEach(([f, t]) => tone(f, t, 0.4, { type: 'triangle', gain: 0.1 }));
    tone(1318.5, 1.1, 0.9, { gain: 0.06 });
  },
  /* Näherungs-Alarm: helles Doppel-Klingeln, zweimal */
  ring() {
    [0, 0.5].forEach(off => {
      tone(1567.98, off, 0.35, { gain: 0.16 });
      tone(1975.53, off + 0.18, 0.45, { gain: 0.14 });
      tone(2637, off + 0.18, 0.3, { gain: 0.06 });
    });
  },
  /* Fehlversuch beim Quiz */
  nope() {
    tone(233, 0, 0.18, { type: 'sawtooth', gain: 0.06 });
    tone(174, 0.15, 0.25, { type: 'sawtooth', gain: 0.06 });
  },
  /* Leiser Tap – Tab-Wechsel & kleine Interaktionen */
  tap() {
    tone(920, 0, 0.05, { type: 'triangle', gain: 0.035 });
  },
  /* Wuschhh – Screen-Übergänge */
  whoosh() {
    tone(280, 0, 0.26, { glide: 980, gain: 0.045 });
    tone(190, 0.05, 0.3, { glide: 640, gain: 0.03, type: 'triangle' });
  },
  /* Feenstaub – Tipp-Enthüllung */
  sparkle() {
    [1567.98, 2093, 2637, 3135.96].forEach((f, i) => tone(f, i * 0.05, 0.22, { gain: 0.05 }));
  },
  /* Karten-Riffeln – Joker */
  shuffle() {
    [0, 0.055, 0.11, 0.165, 0.22].forEach((t, i) =>
      tone(360 + i * 140, t, 0.045, { type: 'square', gain: 0.05 }));
  },
  /* Kamera-Verschluss – Geisterfoto */
  shutter() {
    tone(1250, 0, 0.03, { type: 'square', gain: 0.12 });
    tone(620, 0.045, 0.05, { type: 'square', gain: 0.09 });
  }
};

/* ---------- Die Erzählerstimme ---------- */

const QUEST_INTROS = {
  history: 'Hört, Abenteurer! Eine Prüfung der alten Chroniken erwartet euch.',
  foto:    'Die Nacht verlangt einen Beweis aus Licht und Schatten.',
  kiosk:   'Eine Beschaffungsmission ruft, tapfere Sammler.',
  pause:   'Die Prophezeiung befiehlt: Rast, Trank und Wegzehrung!',
  fun:     'Eine Prüfung des Mutes und der edlen Albernheit beginnt.',
  gps:     'Begebt euch zum verwunschenen Ort, den die Karte weist.',
  ar:      'Der Schleier zwischen den Zeiten ist heute Nacht dünn.',
  egg:     'Nur die Würdigsten finden, was die Stadt verborgen hält.'
};

const PRAISE = [
  'Quest erfüllt! Ruhm und Ehre!',
  'Glorreich! Die Chronisten werden davon singen.',
  'Die Nacht verneigt sich vor euch.',
  'Meisterhaft, Gefährten der Dunkelheit!',
  'So steht es geschrieben, so ward es vollbracht.'
];

/* Stimmlagen: Die Erzählerstimme hat Charakter. Default: der alte, weise
   Zauberer – tief und bedächtig (Pitch/Rate wirken als Multiplikator auf
   jede Gerätestimme, auch auf installierte Siri-/Premium-Stimmen). */
const VOICE_STYLES = {
  wizard:  { label: '🧙 Dumbledore', desc: 'tief, warm, weise',      pitch: 0.72, rate: 0.88 },
  fee:     { label: '🧚 Nachtfee',   desc: 'hell und verspielt',     pitch: 1.18, rate: 1.02 },
  neutral: { label: '🎙️ Chronist',  desc: 'klar und unaufgeregt',   pitch: 1.0,  rate: 1.0 }
};

function voiceStyle() {
  return VOICE_STYLES[S.voiceStyle] || VOICE_STYLES.wizard;
}

const Narrator = {
  voice: null,
  available: 'speechSynthesis' in window,

  /* --- Studio-Stimme: vorproduzierte MP3s (assets/voice/), falls vorhanden --- */
  clips: null,          // Set der Clip-Keys aus assets/voice/manifest.json, sonst null
  player: null,

  async loadClips() {
    try {
      const res = await fetch('assets/voice/manifest.json', { cache: 'force-cache' });
      if (res.ok) this.clips = new Set(await res.json());
    } catch (e) { /* keine Studio-Clips - Geraetestimme uebernimmt */ }
  },

  playClip(key) {
    if (!this.clips || !this.clips.has(key)) return false;
    try {
      if (!this.player) this.player = new Audio();
      this.player.pause();
      this.player.src = 'assets/voice/' + key + '.mp3';
      this.player.play().catch(() => {});
      return true;
    } catch (e) { return false; }
  },

  /* --- Geraetestimme: beste verfuegbare deutsche Stimme waehlen --- */
  allVoices() {
    if (!this.available) return [];
    return speechSynthesis.getVoices() || [];
  },

  germanVoices() {
    return this.allVoices()
      .filter(v => (v.lang || '').toLowerCase().startsWith('de'));
  },

  hasSiriVoice() {
    return this.allVoices().some(v =>
      ((v.name || '') + ' ' + (v.voiceURI || '')).toLowerCase().includes('siri'));
  },

  scoreVoice(v) {
    const s = (v.name + ' ' + (v.voiceURI || '')).toLowerCase();
    let p = 0;
    if (s.includes('siri')) p += 60;      // vom User installierte Siri-Stimme: immer Favorit
    if (s.includes('premium')) p += 40;
    if (s.includes('enhanced') || s.includes('erweitert')) p += 30;
    if (s.includes('natural') || s.includes('neural')) p += 25;
    if (s.includes('eloquence') || s.includes('compact')) p -= 40;  // die Roboter
    if (/anna|petra|helena|katja|vicki|marlene|hedda|viktor|markus/.test(s)) p += 5;
    if (v.localService) p += 3;
    return p;
  },

  pickVoice() {
    // Vom User gewaehlte Stimme darf JEDE Sprache haben (Alle-Stimmen-Picker)
    if (S.voiceURI) {
      const chosen = this.allVoices().find(v => v.voiceURI === S.voiceURI);
      if (chosen) { this.voice = chosen; return; }
    }
    const de = this.germanVoices();
    if (!de.length) { this.voice = null; return; }
    this.voice = de.slice().sort((a, b) => this.scoreVoice(b) - this.scoreVoice(a))[0];
  },

  /* iOS lädt die Stimmenliste träge und oft erst nach einer User-Geste –
     deshalb: hartnäckig nachfragen, bis die guten Stimmen da sind. */
  _warmTries: 0,
  _lastCount: -1,
  warmupVoices() {
    if (!this.available) return;
    const n = (speechSynthesis.getVoices() || []).length;
    if (n !== this._lastCount) {
      this._lastCount = n;
      this.pickVoice();
      document.dispatchEvent(new CustomEvent('br-voices'));
    }
    if (++this._warmTries < 25 && (!n || !this.germanVoices().length)) {
      setTimeout(() => this.warmupVoices(), 400);
    }
  },

  /* Manuell neu laden (Button im Crew-Tab, läuft in der User-Geste) */
  reloadVoices() {
    if (!this.available) return 0;
    const list = speechSynthesis.getVoices() || [];
    this._lastCount = list.length;
    this.pickVoice();
    document.dispatchEvent(new CustomEvent('br-voices'));
    return this.germanVoices().length;
  },

  /* --- Sprechen: MP3 zuerst, sonst Geraetestimme (satzweise = bessere Kadenz) --- */
  say(key, text, opts = {}) {
    if (!S.voice) return;
    this.stop();
    if (key && this.playClip(key)) return;
    if (!this.available) return;
    try {
      const clean = (text || '')
        .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu, ' ')
        .replace(/[\u201E\u201C"\u2033]/g, '')
        .replace(/\s+/g, ' ').trim();
      if (!clean) return;
      if (!this.voice) this.pickVoice();
      const style = voiceStyle();
      const sentences = clean.match(/[^.!?\u2026]+[.!?\u2026]+["']?|[^.!?\u2026]+$/g) || [clean];
      sentences.forEach(sent => {
        const u = new SpeechSynthesisUtterance(sent.trim());
        if (this.voice) u.voice = this.voice;
        // Fremdsprachige Wunsch-Stimme? Dann ihre Sprache setzen, sonst Deutsch
        u.lang = (this.voice && this.voice.lang) || 'de-DE';
        // opts wirken als Multiplikator auf die gewaehlte Stimmlage
        u.rate = Math.min(2, Math.max(0.5, style.rate * (opts.rate != null ? opts.rate : 1)));
        u.pitch = Math.min(2, Math.max(0.1, style.pitch * (opts.pitch != null ? opts.pitch : 1)));
        u.volume = 1;
        speechSynthesis.speak(u);   // Queue: Satz fuer Satz = natuerlichere Pausen
      });
    } catch (e) { /* Stimme ist optional */ }
  },

  speak(text, opts = {}) { this.say(null, text, opts); },

  speakQuest(t) {
    const intro = QUEST_INTROS[t.cat] || 'Eine neue Quest erwartet euch.';
    const where = t.place ? `Euer Ziel: ${t.place}.` : 'Diese Quest koennt ihr ueberall bestehen.';
    this.say('quest_' + t.id,
      `${intro} ${t.title}. ${where} ${t.desc} Belohnung: ${t.points} Erfahrungspunkte.`);
  },

  praise(points) {
    const i = Math.floor(points * 7 + (points % 3) * 13) % PRAISE.length;
    this.say('praise_' + i, `${PRAISE[i]} ${points} Erfahrungspunkte!`, { pitch: 1.2 });
  },

  preview(voiceURI) {
    const v = this.allVoices().find(x => x.voiceURI === voiceURI);
    if (!v) return;
    this.stop();
    try {
      const style = voiceStyle();
      const u = new SpeechSynthesisUtterance('Hoert, Abenteurer der Nacht! So klingt eure Erzaehlerstimme.');
      u.voice = v; u.lang = v.lang || 'de-DE';
      u.pitch = style.pitch; u.rate = style.rate;
      speechSynthesis.speak(u);
    } catch (e) {}
  },

  stop() {
    if (this.player) { try { this.player.pause(); } catch (e) {} }
    if (this.available) { try { speechSynthesis.cancel(); } catch (e) {} }
  }
};

if (Narrator.available) {
  speechSynthesis.onvoiceschanged = () => {
    Narrator._lastCount = -1;      // Liste hat sich geaendert: neu bewerten + UI informieren
    Narrator.warmupVoices();
  };
  Narrator.warmupVoices();
  // iOS gibt die volle Stimmenliste (inkl. installierter Premium-Stimmen)
  // teils erst nach der ersten Beruehrung frei – dann einmal nachladen.
  document.addEventListener('pointerdown', () => Narrator.reloadVoices(), { once: true });
  // App kommt aus dem Hintergrund (z. B. nach Stimmen-Download in den
  // iOS-Einstellungen): Liste erneut abfragen.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') Narrator.reloadVoices();
  });
}
Narrator.loadClips();

/* ---------- Ränge (Quest-Level) ---------- */

const RANKS = [
  { min: 0,   icon: '🕯️', name: 'Novizen der Nacht' },
  { min: 50,  icon: '🏮', name: 'Laternen-Lehrlinge' },
  { min: 110, icon: '⚓', name: 'Donau-Abenteurer' },
  { min: 190, icon: '🛡️', name: 'Ritter von Belváros' },
  { min: 300, icon: '👑', name: 'Legenden von Budapest' }
];

function rankFor(points) {
  let r = RANKS[0];
  RANKS.forEach(x => { if (points >= x.min) r = x; });
  return r;
}

/* ---------- Konfetti & Glühwürmchen ---------- */

const CONFETTI_COLORS = ['#ffc145', '#e84855', '#7bd88f', '#4db8ff', '#fdf3da', '#b98aff'];

function confettiBurst(n = 26) {
  const layer = document.getElementById('confetti');
  if (!layer || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  for (let i = 0; i < n; i++) {
    const p = document.createElement('span');
    p.className = 'confetti-piece';
    const ang = (i / n) * 2 * Math.PI + (i % 5) * 0.13;
    p.style.setProperty('--dx', Math.cos(ang) * (60 + (i % 7) * 22) + 'px');
    p.style.setProperty('--dy', Math.sin(ang) * (40 + (i % 5) * 18) - 90 + 'px');
    p.style.setProperty('--rot', ((i * 137) % 720 - 360) + 'deg');
    p.style.background = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
    p.style.left = '50%'; p.style.top = '42%';
    p.style.animationDelay = (i % 6) * 22 + 'ms';
    layer.appendChild(p);
    setTimeout(() => p.remove(), 1700);
  }
}

function spawnFireflies(n = 12) {
  const box = document.getElementById('fireflies');
  // Achtung: im Container liegen auch die Sternschnuppen – nur auf echte Glühwürmchen prüfen
  if (!box || box.querySelector('.firefly') || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  for (let i = 0; i < n; i++) {
    const f = document.createElement('span');
    f.className = 'firefly';
    f.style.left = ((i * 83) % 100) + '%';
    f.style.top = ((i * 61 + 17) % 90) + '%';
    f.style.animationDuration = 6 + (i % 5) * 2 + 's, ' + (2.2 + (i % 4) * 0.8) + 's';
    f.style.animationDelay = (i % 7) * 0.9 + 's, ' + (i % 5) * 0.5 + 's';
    box.appendChild(f);
  }
}
