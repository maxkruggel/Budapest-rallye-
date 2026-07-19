/* =========================================================
   Karte (Leaflet) + GPS-Tracking + Distanz-Helfer
   ========================================================= */

let map = null;
let userMarker = null;
let userAccCircle = null;
let taskMarkers = {};
let lastPos = null;          // {lat, lng, acc, at}
let geoWatchId = null;

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
      acc: pos.coords.accuracy, at: pos.timestamp
    };
    updateUserMarker();
    if (onUpdate) onUpdate(lastPos);
  }, err => {
    console.warn('GPS:', err.message);
  }, { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 });
}

function initMap(theme) {
  if (map) return map;
  map = L.map('map', { zoomControl: false, attributionControl: true });
  L.control.zoom({ position: 'bottomright' }).addTo(map);
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
}

function renderTaskMarkers(tasks, completedMap, onOpen) {
  if (!map) return;
  Object.values(taskMarkers).forEach(m => map.removeLayer(m));
  taskMarkers = {};
  tasks.forEach((t, i) => {
    if (t.free || t.lat == null) return;
    const done = !!completedMap[t.id];
    const icon = L.divIcon({
      className: 'task-pin-wrap',
      html: `<div class="task-pin ${done ? 'done' : ''} cat-${t.cat}">
               <span class="pin-num">${done ? '✓' : i + 1}</span>
             </div>`,
      iconSize: [34, 40], iconAnchor: [17, 38], popupAnchor: [0, -36]
    });
    const mk = L.marker([t.lat, t.lng], { icon }).addTo(map);
    mk.bindPopup(
      `<div class="pin-pop">
         <strong>${CATS[t.cat].icon} ${t.title}</strong>
         <div class="pin-place">${t.place || ''}</div>
         <button class="pin-open" data-task="${t.id}">Aufgabe öffnen</button>
       </div>`);
    mk.on('popupopen', e => {
      const btn = e.popup.getElement().querySelector('.pin-open');
      if (btn) btn.onclick = () => { map.closePopup(); onOpen(t.id); };
    });
    taskMarkers[t.id] = mk;
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
