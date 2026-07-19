/* =========================================================
   Spielstand: localStorage (State) + IndexedDB (Beweisfotos)
   ========================================================= */

const STATE_KEY = 'br_state_v1';

const DEFAULT_STATE = () => ({
  version: 1,
  theme: 'night',
  screen: 'splash',
  secretUnlocked: false,
  sound: true,   // Soundeffekte
  voice: true,   // magische Erzählerstimme
  settings: {
    players: ['', '', '', ''],
    mode: 'coop',            // 'coop' | 'versus'
    teams: [[], []],         // Spieler-Indizes bei versus
    durationMin: 120
  },
  game: null                 // siehe newGame() in app.js
});

let S = loadState();

function loadState() {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (raw) {
      const s = JSON.parse(raw);
      if (s && s.version === 1) {
        // Migration: neue Audio-Flags für ältere Spielstände
        if (s.sound === undefined) s.sound = true;
        if (s.voice === undefined) s.voice = true;
        return s;
      }
    }
  } catch (e) { console.warn('State kaputt, starte frisch', e); }
  return DEFAULT_STATE();
}

function saveState() {
  try { localStorage.setItem(STATE_KEY, JSON.stringify(S)); }
  catch (e) { console.warn('Speichern fehlgeschlagen', e); }
}

function resetState(keepTheme = true) {
  const theme = S.theme;
  S = DEFAULT_STATE();
  if (keepTheme) S.theme = theme;
  saveState();
}

/* ---------- IndexedDB für Fotos ---------- */

const DB_NAME = 'br_photos';
let _dbPromise = null;

function photoDB() {
  if (_dbPromise) return _dbPromise;
  _dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore('photos');
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return _dbPromise;
}

async function savePhoto(id, dataUrl) {
  try {
    const db = await photoDB();
    await new Promise((res, rej) => {
      const tx = db.transaction('photos', 'readwrite');
      tx.objectStore('photos').put(dataUrl, id);
      tx.oncomplete = res; tx.onerror = () => rej(tx.error);
    });
    return true;
  } catch (e) {
    // Fallback: localStorage (knapper Platz, aber besser als nichts)
    try { localStorage.setItem('br_photo_' + id, dataUrl); return true; }
    catch (e2) { console.warn('Foto konnte nicht gespeichert werden', e2); return false; }
  }
}

async function loadPhoto(id) {
  try {
    const db = await photoDB();
    const val = await new Promise((res, rej) => {
      const tx = db.transaction('photos', 'readonly');
      const rq = tx.objectStore('photos').get(id);
      rq.onsuccess = () => res(rq.result); rq.onerror = () => rej(rq.error);
    });
    if (val) return val;
  } catch (e) { /* fällt durch zum Fallback */ }
  return localStorage.getItem('br_photo_' + id) || null;
}

async function clearPhotos() {
  try {
    const db = await photoDB();
    await new Promise((res, rej) => {
      const tx = db.transaction('photos', 'readwrite');
      tx.objectStore('photos').clear();
      tx.oncomplete = res; tx.onerror = () => rej(tx.error);
    });
  } catch (e) { /* egal */ }
  Object.keys(localStorage)
    .filter(k => k.startsWith('br_photo_'))
    .forEach(k => localStorage.removeItem(k));
}

/* Bild verkleinern: File/Blob -> JPEG-DataURL (max. Kantenlänge) */
function shrinkImage(file, maxEdge = 900, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxEdge / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale), h = Math.round(img.height * scale);
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      c.getContext('2d').drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Bild unlesbar')); };
    img.src = url;
  });
}
