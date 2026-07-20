# 🌃 Budapest Nacht-Rallye

Eine mobile Schnitzeljagd-Web-App für 1–8 Personen durch Budapests Bezirk V (Belváros) –
gebaut für Nachtschwärmer: alle Aufgaben sind kostenlos, draußen und nach Einbruch der Dunkelheit lösbar.

## Features

- **38 Aufgaben** in 7 Kategorien: Geschichte & Infotafeln, Foto-Challenges, Kiosk-Specials
  (Túró Rudi! Unicum!), Drink-/Kaffee-/Snackpausen, Gruppen-Gaudi, GPS-Checkpoints und
  **AR-Zeitfenster** 👻
- **AR-Zeitfenster**: An historischen Orten öffnet die Kamera ein Fenster in die Vergangenheit –
  Sisi, Graf Széchenyi, ein 1956er-Freiheitskämpfer, die Ur-Tram von 1887 und ein
  Kaffeehaus-Literat erscheinen als Geister im Kamerabild. Geisterfoto inklusive.
- **Foto-Validierung**: Beweisfotos entwerten die Aufgaben-Tickets wie am alten Tram-Entwerter.
  Fotos bleiben ausschließlich auf dem Gerät (IndexedDB).
- **🎩 Frag Friedrich**: Der Erzähler beantwortet in jeder Quest Rückfragen zur Geschichte
  („Warum war das Anstoßen mit Bier verpönt?") – als Chat mit Sprachausgabe und, wo der
  Browser es kann, Mikrofon-Eingabe. Braucht denselben API-Key wie der Magische Prüfmeister.
  Ungelöste Quiz-Antworten verrät er nicht.
- **Validierte GPS-Punkte**: Alle Quest-Koordinaten sind gegen externe Kartenquellen
  verifiziert – Prozess und Referenztabelle in `docs/gps-validierung.md`.
- **Flexible Spieldauer**: 30 Minuten bis 4 Stunden – die App stellt passend viele Aufgaben
  zusammen und plant die Route per GPS vom aktuellen Standort aus (Nearest-Neighbor).
- **Zwei Modi**: Kooperativ (alle zusammen) oder Versus (🏮 Team Laterne vs. 🌶️ Team Paprika).
- **Interaktive Karte** (Leaflet, self-hosted) mit Live-Position, Aufgaben-Pins und
  Google-Maps-Navigation je Aufgabe.
- **Tag-/Nachtmodus** (Nacht ist Default) und automatischer Spielstand-Speicher –
  App schließen, Bier holen, weiterspielen.
- 2 Joker zum Tauschen ungeliebter Aufgaben, Countdown mit +15-min-Verlängerung,
  Siegerehrung mit Foto-Galerie.

## Spielen

Die App braucht **HTTPS** (für GPS + Kamera). Einfachster Weg: **GitHub Pages**

1. Repo → **Settings → Pages**
2. Source: **Deploy from a branch**, Branch: `claude/budapest-night-rally-app-miey1g`, Ordner `/ (root)`
3. Nach ~1 Minute läuft die App unter `https://<user>.github.io/Budapest-rallye-/`
4. URL auf allen Handys öffnen, Standort + Kamera erlauben, losziehen.

Lokal testen: `python3 -m http.server` im Repo-Ordner (GPS/Kamera funktionieren nur auf
`localhost` oder HTTPS).

## Technik

Kein Framework, kein Build-Schritt: Vanilla HTML/CSS/JS.
`js/tasks.js` ist die Aufgaben-Datenbank – neue Aufgaben einfach dort ergänzen.
Leaflet 1.9.4 liegt in `vendor/`, Karten-Tiles von CARTO (dark/light), Fonts von Google Fonts.
Spielstand in `localStorage`, Fotos in IndexedDB. AR-Modus: `getUserMedia` + Kompass
(DeviceOrientation) mit Drag-Fallback – läuft auch auf iOS Safari, wo es kein WebXR gibt.
