# GPS-Validierung der Quest-Punkte

**Stand: 2026-07-20** – vollständige Neu-Validierung aller Koordinaten in `js/tasks.js`
gegen externe Quellen (Wikidata/Wikipedia, Mapcarta, latlong.net, offizielle Seiten,
GPS-getaggte Guides). Auslöser: Spielerbericht, dass Margareteninsel-Quests
(u. a. Wasserturm) an einem ganz anderen Ort lagen als der Marker.

## Warum das wichtig ist

- GPS-Check-in (`verify: 'gps'`) zählt nur bei **≤ 50 m** Entfernung (`js/app.js`).
- AR-Zeitfenster (`verify: 'ghost'`) öffnen nur bei **≤ 70 m**.
- Auch Foto-/Quiz-Quests leiden: Marker, Navigation und Routenplanung führen
  die Gruppe sonst an den falschen Ort.

## Regeln (siehe auch CLAUDE.md)

1. Koordinaten nie schätzen – immer gegen mindestens eine externe Quelle prüfen.
2. Auf das konkrete Objekt zielen (Statue, Portal, Brunnen), nicht auf den Platz.
3. Bei Änderungen diese Tabelle aktualisieren (Datum + Quelle).
4. Anker zur Plausibilität: Margareteninsel 47.516–47.537; Bezirk V
   47.487–47.513 / 19.040–19.062; Burgviertel 47.496–47.503 / 19.032–19.041.

## Validierte Punkte (2026-07-20)

Δ = Abstand alter Marker → verifizierter Punkt. „✓" = alter Wert war korrekt (≤ ~30 m), unverändert oder nur minimal nachjustiert.

| id | Quest-Ort | alt (lat, lng) | neu (lat, lng) | Δ | Quelle |
|---|---|---|---|---|---|
| shoes | Schuhe am Donauufer | 47.5039, 19.0446 | 47.5039, 19.0448 | ✓ ~15 m | Wikipedia „Shoes on the Danube Bank", latlong.net |
| lions / spy3 | Kettenbrücke, Pester Löwen | 47.4989, 19.0455 | 47.4990, 19.0459 | ~30 m (alter Punkt im Fluss) | Wikipedia Széchenyi Chain Bridge (Widerlager) |
| quiz-chainbridge | Kettenbrücke, Tafel Pester Widerlager | 47.4988, 19.0450 | 47.4989, 19.0458 | ~65 m | dito |
| basilica | Basilika, Hauptportal | 47.5009, 19.0540 | 47.5008, 19.0534 | ~45 m (Portal statt Gebäudemitte) | Wikipedia St. Stephen's Basilica |
| sovietstar | Sowjet-Obelisk, Szabadság tér | 47.5049, 19.0503 | 47.5046, 19.0503 | ~33 m | TracesOfWar |
| reagan / spy1 | Reagan-Statue | 47.5041, 19.0500 | 47.5049, 19.0499 | **~86 m** – steht im NORDteil, nicht Südseite; Ort/Tipps korrigiert | Wikidata Q107536682 |
| bullets | 1956-Denkmal Landwirtschaftsministerium | 47.5068, 19.0478 | 47.5065, 19.0481 | ~44 m | Waymarking WMB7NX |
| parliament | Kossuth tér (Foto-Spot) | 47.5076, 19.0460 | 47.5069, 19.0472 | **~117 m** – alter Punkt lag im Parlamentsgebäude | Wikipedia Kossuth Square |
| jozsef | Attila-József-Statue | 47.5063, 19.0450 | 47.5051, 19.0449 | **~134 m** – Statue seit 2013 unten an der Donautreppe | GPS-getaggte Tour, Wikipedia |
| columbo | Columbo-Statue | 47.5104, 19.0474 | 47.5126, 19.0489 | **~273 m** – Nordende Falk Miksa / Ecke Szent István krt; Ort/Tipp korrigiert | Wikipedia „Columbo statue" |
| egg-squirrel | Kolodko: totes Eichhörnchen | 47.5048, 19.0508 | 47.5126, 19.0488 | **~870 m – lag am falschen Ort!** Liegt als „Tatort" bei der Columbo-Statue, nicht am Szabadság tér; Text/Tipp neu, minMin 90 | budapestflow.com, TripAdvisor, rexby.com |
| egg-kermit | Kolodko: Frosch | 47.5040, 19.0506 | 47.5041, 19.0506 | ✓ ~12 m | Mapcarta N6761017413 |
| egg-rubik | Kolodko: schmelzender Würfel | 47.5008, 19.0450 | 47.5048, 19.0396 | **~600 m – falsche Flussseite!** Real: Budaer Ufer, Bem rakpart bei Batthyány tér; Text/Tipp neu | rcube.hu, buddypest.com |
| egg-peacock | Gresham-Palast, Pfauentore | 47.4993, 19.0477 | 47.4997, 19.0477 | ~40 m (Haupttor) | Wikipedia Gresham Palace |
| princess | Kleine Prinzessin | 47.4954, 19.0490 | 47.4959, 19.0482 | **~85 m** – sitzt am Korzó-Geländer, nicht am Vigadó-Gebäude | evendo, audiala |
| policeman / spy2 | Dicker Polizist | 47.5006, 19.0510 | unverändert | ✓ ~7 m | budapest.city |
| gerbeaud | Café Gerbeaud | 47.4964, 19.0502 | 47.4967, 19.0503 | ~35 m | Wikidata Q464845 |
| sisibridge | Elisabethbrücke, Pester Seite | 47.4910, 19.0500 | 47.4916, 19.0512 | **~110 m** – alter Punkt am Kai/Fluss | Wikipedia Elisabeth Bridge |
| parishchurch | Innerstädtische Pfarrkirche | 47.4919, 19.0505 | 47.4921, 19.0522 | **~130 m** – alter Punkt im Fluss | Wikipedia Inner City Parish Church |
| eye | Budapest Eye | 47.4983, 19.0525 | 47.4981, 19.0520 | ~42 m | Wikidata Q16522986 |
| tram2 | Tram-2-Haltestelle Vigadó tér | 47.4959, 19.0488 | 47.4962, 19.0484 | ~45 m (auch TRANSIT_STOPS) | Gleislage Korzó / Wikipedia Vigadó |
| panorama | Donaukorzó-Aussicht | 47.4950, 19.0487 | 47.4972, 19.0478 | **~250 m** – jetzt wie beschrieben zwischen Vigadó und Kettenbrücke | Beschreibungstreue |
| vaci | Váci utca | 47.4945, 19.0512 | 47.4948, 19.0511 | ✓ ~35 m | Straßenverlauf |
| cp-vorosmarty | Vörösmarty tér | 47.4964, 19.0504 | 47.4961, 19.0506 | ~40 m (Platzmitte/Denkmal) | Wikidata Q1029092 |
| day-foldalatti | M1-Eingang Vörösmarty tér | 47.4962, 19.0508 | 47.4966, 19.0504 | ~50 m (Nordteil des Platzes) | Wikipedia M1-Station |
| quiz-danubius | Danubius-Brunnen | 47.4980, 19.0521 | 47.4982, 19.0516 | ~48 m | virtualglobetrotting |
| day-parisi | Párisi Udvar | 47.4931, 19.0546 | 47.4932, 19.0548 | ✓ ~20 m | Wikidata Q850156 |
| day-bees | Postsparkasse Hold utca | 47.5030, 19.0508 | 47.5042, 19.0522 | **~170 m** – alter Punkt lag auf dem Szabadság tér | Wikipedia Hungarian Postal Savings Bank |
| day-rose | Gelarto Rosa | 47.5004, 19.0536 | 47.5011, 19.0529 | ~95 m (NW-Zeile des Platzes; mittlere Konfidenz – vor Ort gegenprüfen) | Adresse Szent István tér 3 |
| day-markthalle | Große Markthalle | 47.4871, 19.0587 | 47.4870, 19.0589 | ✓ ~15 m | Wikipedia Great Market Hall |
| cp-fovam | Fővám tér | 47.4870, 19.0587 | 47.4876, 19.0584 | ~55 m – entzerrt vom Markthallen-Punkt (Kreise überlappten) | Platzgeometrie |
| cp-szechenyi | Széchenyi István tér | 47.4990, 19.0470 | 47.4990, 19.0466 | ✓ ~30 m | Wikidata Q755089 |
| gozsdu | Gozsdu Udvar | 47.4987, 19.0587 | 47.4987, 19.0588 | ✓ ~12 m | gozsduudvar.hu |
| synagogue | Große Synagoge | 47.4959, 19.0607 | unverändert | ✓ ~5 m | Wikipedia |
| ruinpub | Szimpla Kert | 47.4972, 19.0631 | 47.4970, 19.0633 | ✓ ~30 m | latlong.net |
| pest-karavan | Karavan | 47.4971, 19.0628 | 47.4971, 19.0630 | ✓ ~20 m | maplogs |
| zerostone | 0-km-Stein | 47.4979, 19.0399 | 47.4980, 19.0401 | ✓ ~15 m | Wikipedia Zero Kilometre Stone |
| buda-bastion | Fischerbastei | 47.5022, 19.0347 | unverändert | ✓ ~5 m | Wikidata Q493117 |
| buda-matthias | Matthiaskirche | 47.5019, 19.0339 | 47.5019, 19.0342 | ✓ ~25 m | Wikipedia |
| buda-turul | Turul-Statue | 47.4962, 19.0398 | 47.4977, 19.0398 | **~165 m** – alter Punkt war die Palastmitte, Turul sitzt oben an der Habsburg-Treppe/Standseilbahn | Wikipedia Castle Hill Funicular |
| buda-batthyany | Batthyány tér | 47.5059, 19.0392 | 47.5061, 19.0392 | ✓ ~20 m | latitude.to |
| buda-gellert | Gellért-Denkmal | 47.4893, 19.0464 | unverändert | ✓ ~10 m | aviewoncities |
| pest-opera | Staatsoper | 47.5030, 19.0585 | 47.5027, 19.0583 | ✓ ~35 m | Mapcarta |
| pest-liszt | Liszt-Statue | 47.5046, 19.0644 | 47.5039, 19.0634 | **~110 m** – alter Punkt lag im Häuserblock neben dem Platz | trek.zone + Platzgeometrie |
| pest-newyork | New York Café | 47.4985, 19.0706 | unverändert | ✓ ~15 m | Wikipedia |
| pest-heroes | Heldenplatz | 47.5150, 19.0779 | unverändert | ✓ ~10 m | Wikidata Q299973 |
| margit-fountain | Musikbrunnen (Südeingang) | 47.5170, 19.0455 | 47.5187, 19.0449 | **~195 m** – alter Punkt an der Inselspitze/Wellenbrecher | visitcity.travel |
| margit-ruins | Dominikanerinnen-Klosterruinen | 47.5243, 19.0468 | 47.5290, 19.0511 | **~615 m – lag bei den Franziskaner-Ruinen!** Real: Nordhälfte, ~160 m SO vom Wasserturm; Ort/Tipp korrigiert | Mapcarta W369978616 |
| margit-watertower | Wasserturm | 47.5262, 19.0480 | 47.5302, 19.0501 | **~475 m** – steht beim Freilichttheater im Nordteil | Mapcarta W135302046, termeszetjaro.hu |
| margit-track | Laufbahn Westufer | 47.5200, 19.0440 | 47.5220, 19.0425 | ~120 m – jetzt auf dem Uferweg westlich des Hajós-Bads | Anker: Alfréd-Hajós-Schwimmstadion (Wikipedia) |
| ar-sisi | Zeitfenster Kaiserin (Széchenyi tér) | 47.4990, 19.0465 | unverändert | ✓ (Radius 70 m) | – |
| ar-szechenyi | Zeitfenster Graf (vor Gresham) | 47.4993, 19.0477 | 47.4996, 19.0477 | ✓ ~40 m | Wikipedia Gresham Palace |
| ar-1956 | Zeitfenster 1956 (Kossuth tér) | 47.5070, 19.0465 | unverändert | ✓ | – |
| ar-tram | Zeitfenster Ur-Tram (Vigadó) | 47.4959, 19.0490 | 47.4961, 19.0486 | ✓ ~35 m | Gleislage |
| ar-literat | Zeitfenster Literat (vor Gerbeaud) | 47.4963, 19.0506 | 47.4966, 19.0505 | ✓ ~35 m | Wikidata Q464845 |

Ortsungebundene Quests (`free: true`) haben keine Koordinaten und sind nicht betroffen.
TRANSIT_STOPS und COZY_SPOTS dienen nur als Hinweise (keine 50-m-Logik); Vigadó tér
wurde mitkorrigiert, der Rest ist plausibel.

## Offene Rest-Risiken

- **day-rose** (Gelarto Rosa): nur mittlere Konfidenz – beim nächsten Besuch
  vor Ort verifizieren.
- **margit-track**: die Laufbahn ist ein Ring; der Punkt ist ein sinnvoller
  Westufer-Abschnitt, kein „exakter" Ort (Foto-Quest, unkritisch).
- **panorama**: bewusst auf die Beschreibung („zwischen Vigadó und
  Kettenbrücke") gelegt; jeder Korzó-Punkt mit Burgblick funktioniert.
