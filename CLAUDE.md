# Budapest Nacht-Rallye – Projektregeln

## GPS-Koordinaten (WICHTIG)

Die App verlangt für GPS-Check-ins **≤ 50 m Entfernung** (`js/app.js`, `d <= 50`)
und für AR-Zeitfenster ≤ 70 m. Ein um 100 m falsch gesetzter Punkt macht eine
Quest praktisch unlösbar – Koordinaten-Sorgfalt ist deshalb Pflicht.

**Regeln für jede Änderung an `js/tasks.js` (TASKS, TRANSIT_STOPS, COZY_SPOTS):**

1. **Nie Koordinaten aus dem Gedächtnis schätzen.** Jede neue oder geänderte
   `lat`/`lng` muss gegen mindestens eine externe Quelle geprüft werden
   (OpenStreetMap/Overpass, Wikidata/Wikipedia-Koordinaten, offizielle Seiten).
   Bei Abweichung zwischen Quellen: zweite Quelle suchen, nicht mitteln.
2. **Auf das konkrete Objekt zielen, nicht auf den Platz.** Beispiel: Nicht
   „Margareteninsel", sondern der Wasserturm selbst. Bei Statuen/Mini-Bronzen
   (Kolodko!) den exakten Standort recherchieren – die sind wenige Zentimeter groß.
3. **Plausibilitäts-Anker nutzen:** Die Margareteninsel reicht von der
   Margaretenbrücke (~47.516) bis zur Árpádbrücke (~47.537). Bezirk V liegt
   grob zwischen 47.487–47.513 / 19.040–19.062. Buda-Burgviertel um 47.496–47.503 /
   19.032–19.041. Punkte außerhalb dieser Anker doppelt prüfen.
4. **Validierungsstand dokumentieren:** Ergebnis jeder Prüfung in
   `docs/gps-validierung.md` eintragen (Datum, Quelle, ggf. Korrektur).
   Diese Datei ist die Referenztabelle – bei Spielerberichten „Quest liegt
   falsch" zuerst dort nachsehen, dann neu verifizieren.
5. Nach Koordinaten-Änderungen `node --check js/tasks.js` laufen lassen.

Bekannter Vorfall (2026-07): Die Margareteninsel-Punkte (Wasserturm,
Klosterruinen u. a.) lagen mehrere hundert Meter zu weit südlich – Spieler
standen bei der Quest an einem ganz anderen Ort als der Marker. Vollständige
Neu-Validierung aller Punkte: siehe `docs/gps-validierung.md`.

## Frag Friedrich (KI-Rückfragen)

Der Erzähler „Friedrich Weber" beantwortet im Aufgaben-Detail Rückfragen zur
Geschichte (Panel `#task-friedrich`, Logik in `js/app.js`, Abschnitt
„Frag Friedrich"). Er nutzt denselben Anthropic-API-Key wie der Magische
Prüfmeister (`S.apiKey`). Verlauf liegt pro Quest in
`S.game.friedrichChats[taskId]` (gekappt auf 16 Nachrichten). Regeln im
System-Prompt: Deutsch, 2–5 gesprochene Sätze, historisch korrekt, keine
Quiz-Spoiler bei ungelösten Quests. Bei Änderungen an Quest-Daten darauf
achten, dass `friedrichContext()` weiterhin `desc`, `story` und den
Quiz-Status korrekt mitgibt.

## Technik-Notizen

- Kein Build-Schritt, Vanilla JS. Syntax-Check: `node --check js/*.js`.
- Service Worker ist network-first – kein Cache-Bump nötig.
- Deployment: GitHub Pages, Branch laut README.
