/* =========================================================
   Karte (Leaflet) + GPS-Tracking + Distanz-Helfer
   ========================================================= */

let map = null;
let userMarker = null;
let userAccCircle = null;
let taskMarkers = {};
let lastPos = null;          // {lat, lng, acc, at}
let geoWatchId = null;
let routeLine = null;
let followMe = false;

const TILE_NIGHT = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
const TILE_DAY   = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
const TILE_ATTR  = '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>';
let tileLayer = null;

/* Haversine-Distanz in Metern */
function distMeters(a, b) {
  const R = 6371000, rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad, dLng = (b.lng - a.lng) * rad;
  const s = Math.sin(dLat / 2) ** 2 +
    Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

function fmtDist(m) {
  if (m == null) return '';
  return m < 950 ? Math.round(m / 10) * 10 + ' m' : (m / 1000).toFixed(1) + ' km';
}

function startGeo(onUpdate) {
  if (!('geolocation' in navigator)) return;
  if (geoWatchId != null) return;
  geoWatchId = navigator.geolocation.watchPosition(pos => {
    lastPos = {
      lat: pos.coords.latitude, lng: pos.coords.longitude,
      acc: pos.coords.accuracy, at: Date.now()
    };
    updateUserMarker();
    if (onUpdate) onUpdate(lastPos);
  }, err => {
    console.warn('GPS:', err.message);
  }, { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 });
}

/* GPS-Frische: sofort eine AKTUELLE Position erzwingen (maximumAge: 0) –
   beim Öffnen der Karte, beim Spielstart und wenn die App aus dem
   Hintergrund zurückkommt. Kein Recovern alter Punkte. */
function refreshPosition(onUpdate) {
  if (!('geolocation' in navigator)) return;
  navigator.geolocation.getCurrentPosition(pos => {
    lastPos = {
      lat: pos.coords.latitude, lng: pos.coords.longitude,
      acc: pos.coords.accuracy, at: Date.now()
    };
    updateUserMarker();
    if (onUpdate) onUpdate(lastPos);
  }, err => {
    console.warn('GPS-Refresh:', err.message);
  }, { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 });
}

/* watchPosition neu aufsetzen (iOS legt den Watch im Hintergrund schlafen) */
function restartGeoWatch(onUpdate) {
  if (!('geolocation' in navigator)) return;
  if (geoWatchId != null) {
    try { navigator.geolocation.clearWatch(geoWatchId); } catch (e) {}
    geoWatchId = null;
  }
  startGeo(onUpdate);
}

function gpsAgeSec() {
  return lastPos ? Math.round((Date.now() - lastPos.at) / 1000) : null;
}

function initMap(theme) {
  if (map) return map;
  map = L.map('map', { zoomControl: false, attributionControl: true });
  L.control.zoom({ position: 'bottomright' }).addTo(map);

  // „Folge mir"-Button: zentriert auf die eigene Position und bleibt dran
  const Locate = L.Control.extend({
    options: { position: 'bottomright' },
    onAdd() {
      const btn = L.DomUtil.create('button', 'locate-btn');
      btn.innerHTML = '🧭';
      btn.title = 'Meiner Position folgen';
      L.DomEvent.on(btn, 'click', e => {
        L.DomEvent.stop(e);
        followMe = !followMe;
        btn.classList.toggle('on', followMe);
        if (followMe && lastPos) map.setView([lastPos.lat, lastPos.lng], Math.max(map.getZoom(), 16));
      });
      return btn;
    }
  });
  map.addControl(new Locate());
  map.on('dragstart', () => {
    followMe = false;
    const b = document.querySelector('.locate-btn');
    if (b) b.classList.remove('on');
  });

  // Tap auf die freie Karte schließt Mini-Popup UND Legende
  // (marker-gebundene Popups über die Marker schließen – map.closePopup()
  //  räumt sie in dieser Leaflet-Version nicht zuverlässig auf)
  map.on('click', () => {
    map.closePopup();
    Object.values(taskMarkers).forEach(m => { try { m.closePopup(); } catch (e) {} });
    const lg = document.querySelector('#map-legend');
    if (lg && !lg.hidden) {
      lg.hidden = true;
      const t = document.querySelector('#legend-toggle');
      if (t) t.textContent = '❔ Legende';
    }
  });

  setMapTheme(theme);
  const c = lastPos || RALLY_CENTER;
  map.setView([c.lat, c.lng], 15);
  return map;
}

function setMapTheme(theme) {
  if (!map) return;
  if (tileLayer) map.removeLayer(tileLayer);
  tileLayer = L.tileLayer(theme === 'day' ? TILE_DAY : TILE_NIGHT,
    { attribution: TILE_ATTR, maxZoom: 19 }).addTo(map);
}

function updateUserMarker() {
  if (!map || !lastPos) return;
  const ll = [lastPos.lat, lastPos.lng];
  if (!userMarker) {
    userMarker = L.marker(ll, {
      icon: L.divIcon({ className: 'user-dot-wrap', html: '<div class="user-dot"></div>', iconSize: [18, 18] })
    }).addTo(map);
    userAccCircle = L.circle(ll, { radius: lastPos.acc || 30, className: 'user-acc' }).addTo(map);
  } else {
    userMarker.setLatLng(ll);
    userAccCircle.setLatLng(ll).setRadius(lastPos.acc || 30);
  }
  if (followMe) map.panTo(ll, { animate: true });
}

/* Koordinaten einer Quest auf der Karte: echter Ort oder virtueller
   Routen-Punkt (freie „überall lösbar"-Quests, gesetzt in refreshMapLayers) */
function taskLatLng(t) {
  if (!t.free && t.lat != null) return [t.lat, t.lng];
  if (t._vlat != null) return [t._vlat, t._vlng];
  return null;
}

/* Gestrichelte Gold-Route: eigene Position → ALLE offenen Quests
   in Live-Reihenfolge (inkl. virtueller Punkte der freien Quests) */
function updateRouteLine(orderedTasks) {
  if (!map) return;
  const pts = [];
  if (lastPos) pts.push([lastPos.lat, lastPos.lng]);
  orderedTasks.forEach(t => { const ll = taskLatLng(t); if (ll) pts.push(ll); });
  if (routeLine) { map.removeLayer(routeLine); routeLine = null; }
  if (pts.length >= 2) {
    routeLine = L.polyline(pts, {
      color: '#ffc145', weight: 3, opacity: .75, dashArray: '6 8', lineJoin: 'round'
    }).addTo(map);
  }
}

/* Marker werden IN-PLACE aktualisiert (kein Zerstören/Neubauen) –
   dadurch überlebt ein offenes Popup jeden GPS-/Render-Zyklus. */
function renderTaskMarkers(tasks, completedMap, onOpen, activeId) {
  if (!map) return;
  const seen = new Set();
  tasks.forEach((t, i) => {
    const ll = taskLatLng(t);
    if (!ll) return;
    seen.add(t.id);
    const done = !!completedMap[t.id];
    const isFree = t.free || t.lat == null;
    const timeClass = t.time === 'day' ? 'tday' : t.time === 'night' ? 'tnight' : '';
    const timeDot = t.time === 'day' ? '<span class="pin-time">☀️</span>'
                  : t.time === 'night' ? '<span class="pin-time">🌙</span>' : '';
    const html = `<div class="task-pin ${done ? 'done' : ''} cat-${t.cat} ${timeClass} ${t.id === activeId ? 'pulse' : ''} ${isFree ? 'free' : ''}">
               <span class="pin-num">${done ? '✓' : i + 1}</span>${timeDot}
             </div>`;
    const icon = () => L.divIcon({
      className: 'task-pin-wrap', html,
      iconSize: [34, 40], iconAnchor: [17, 38], popupAnchor: [0, -36]
    });
    let mk = taskMarkers[t.id];
    if (!mk) {
      mk = L.marker(ll, { icon: icon() }).addTo(map);
      const timeLine = t.time === 'day'
        ? `<div class="pin-timeinfo day">☀️ Tag-Quest · ${(t.openHours || [8, 18])[0]}–${(t.openHours || [8, 18])[1]} Uhr lösbar</div>`
        : t.time === 'night'
          ? `<div class="pin-timeinfo night">🌙 Nacht-Quest · lösbar ab ${t.fromHour != null ? t.fromHour : 17} Uhr</div>`
          : '';
      mk.bindPopup(
        `<div class="pin-pop">
           <strong>${CATS[t.cat].icon} ${t.title}</strong>
           <div class="pin-place">${isFree ? '🃏 überall lösbar – der Punkt liegt auf eurer Route' : (t.place || '')}</div>
           ${timeLine}
           <button class="pin-open" data-task="${t.id}">Aufgabe öffnen</button>
         </div>`, { autoClose: true, closeOnClick: true });
      mk.on('popupopen', e => {
        const btn = e.popup.getElement().querySelector('.pin-open');
        if (btn) btn.onclick = () => { map.closePopup(); onOpen(t.id); };
      });
      mk._iconHtml = html;
      taskMarkers[t.id] = mk;
    } else {
      // Marker mit offenem Popup NICHT anfassen – sonst verschwindet das Popup
      const popupOpen = map._popup && map._popup._source === mk;
      if (!popupOpen) {
        const cur = mk.getLatLng();
        if (Math.abs(cur.lat - ll[0]) > 1e-9 || Math.abs(cur.lng - ll[1]) > 1e-9) mk.setLatLng(ll);
        if (mk._iconHtml !== html) { mk.setIcon(icon()); mk._iconHtml = html; }
      }
    }
  });
  // Quests, die das Deck verlassen haben (Joker), aufräumen
  Object.keys(taskMarkers).forEach(id => {
    if (!seen.has(id)) { map.removeLayer(taskMarkers[id]); delete taskMarkers[id]; }
  });
}

function fitToGame(tasks) {
  if (!map) return;
  const pts = tasks.filter(t => !t.free && t.lat != null).map(t => [t.lat, t.lng]);
  if (lastPos) pts.push([lastPos.lat, lastPos.lng]);
  if (pts.length) map.fitBounds(L.latLngBounds(pts).pad(0.15));
}

function gmapsLink(t) {
  return `https://www.google.com/maps/dir/?api=1&destination=${t.lat},${t.lng}&travelmode=walking`;
}
