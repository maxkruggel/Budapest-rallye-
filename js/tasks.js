/* =========================================================
   BUDAPEST NACHT-RALLYE – Aufgaben-Datenbank
   Bezirk V (Belváros) + Ausflüge, alles kostenlos & nachts machbar.
   verify: 'photo' | 'quiz' | 'gps' | 'ghost' | 'video'
   free:true  => ortsunabhängig (kein Marker, überall lösbar)
   minMin     => erst ab dieser Spieldauer (Minuten) im Deck
   complicated:true => Bonus-Flag, gibt Extra-Punkte-Badge
   time: 'day' | 'night'  => nur im passenden Spielmodus im Deck;
     bei „Day n Night" zeitgesteuert freigeschaltet:
     night + fromHour (Std., Default 17) => erst ab dieser Uhrzeit
     day + openHours [von, bis] (Default [8,18]) => nur in diesem Fenster
   video:true => Foto-Quest akzeptiert alternativ einen Video-Beweis
   ========================================================= */

const RALLY_CENTER = { lat: 47.4979, lng: 19.0546 }; // Deák Ferenc tér – Fallback-Start

const TASKS = [

  /* ---------- 🏛️ GESCHICHTE & INFOTAFELN ---------- */
  {
    id: 'shoes', cat: 'history', title: 'Schuhe am Donauufer',
    place: 'Donaupromenade, nördlich Richtung Parlament',
    lat: 47.5039, lng: 19.0448, points: 30, verify: 'quiz',
    desc: 'Dutzende eiserne Schuhe stehen am Kai – ein Mahnmal für die Menschen, die 1944/45 von Pfeilkreuzlern hier am Ufer erschossen wurden. Nehmt euch eine ruhige Minute. Dies ist der eine Ort der Rallye ohne Quatsch-Fotos.',
    quiz: {
      q: 'Auf den Gedenktafeln im Boden steht der Text in mehreren Sprachen. In wie vielen?',
      accept: ['3', 'drei'],
      hint: 'Ungarisch, Englisch … und eine dritte.',
      reveal: '3 – Ungarisch, Englisch und Hebräisch.'
    }
  },
  {
    id: 'lions', cat: 'history', title: 'Die Löwen der Kettenbrücke',
    place: 'Kettenbrücke, Pester Brückenkopf',
    lat: 47.4990, lng: 19.0459, points: 25, verify: 'quiz',
    desc: 'Die Legende sagt, der Bildhauer stürzte sich in die Donau, weil er den Löwen die Zungen vergessen hat. Stimmt nicht ganz – aber prüft selbst nach! Leuchtet mit der Handylampe ins Löwenmaul.',
    quiz: {
      q: 'Wie viele steinerne Löwen bewachen die Kettenbrücke insgesamt (beide Ufer)?',
      accept: ['4', 'vier'],
      hint: 'Pro Brückenkopf sitzen zwei.',
      reveal: '4 – je zwei auf der Pester und der Budaer Seite. Zungen haben sie übrigens, man sieht sie nur von unten schlecht.'
    }
  },
  {
    id: 'basilica', cat: 'history', title: 'Das letzte Wort der Basilika',
    place: 'St.-Stephans-Basilika, Hauptportal',
    lat: 47.5008, lng: 19.0534, points: 25, verify: 'quiz',
    desc: 'Die Basilika ist nachts golden angestrahlt. Über dem Hauptportal steht eine lateinische Inschrift – das Motto des Hauses sozusagen.',
    quiz: {
      q: 'Wie lautet das LETZTE Wort der lateinischen Inschrift über dem Hauptportal?',
      accept: ['vita'],
      hint: '„Ich bin der Weg, die Wahrheit und das …" – auf Latein.',
      reveal: 'VITA. („Ego sum via, veritas et vita.")'
    }
  },
  {
    id: 'sovietstar', cat: 'history', title: 'Der letzte Sowjet-Obelisk',
    place: 'Szabadság tér (Freiheitsplatz), Nordseite',
    lat: 47.5046, lng: 19.0503, points: 25, verify: 'quiz',
    desc: 'Auf dem Freiheitsplatz steht das letzte sowjetische Denkmal Budapests – direkt gegenüber der US-Botschaft. Die Nachbarschaft könnte ironischer nicht sein.',
    quiz: {
      q: 'Welches Symbol thront ganz oben auf dem Obelisken?',
      accept: ['stern', 'sowjetstern', 'roter stern', 'star', 'ein stern'],
      hint: 'Fünf Zacken, sehr sozialistisch.',
      reveal: 'Ein goldener Sowjetstern.'
    }
  },
  {
    id: 'reagan', cat: 'history', title: 'Spaziergang mit dem Präsidenten',
    place: 'Szabadság tér, Nordteil (Promenade Richtung US-Botschaft)',
    lat: 47.5049, lng: 19.0499, points: 20, verify: 'photo',
    desc: 'Ein US-Präsident spaziert seit 2011 in Lebensgröße über den Freiheitsplatz: Ronald Reagan, als Danke für sein Mitwirken am Ende des Kalten Kriegs. Foto-Beweis: Geht neben ihm her, als wärt ihr mitten im hochbrisanten Staatsgespräch. Mindestens eine Person gestikuliert wild.'
  },
  {
    id: 'bullets', cat: 'history', title: 'Kugeln in der Fassade',
    place: 'Landwirtschaftsministerium, Kossuth tér (Ostseite)',
    lat: 47.5065, lng: 19.0481, points: 30, verify: 'quiz',
    desc: 'An der Arkaden-Fassade gegenüber dem Parlament stecken eiserne Kugeln in der Wand. Jede markiert ein Einschussloch eines Massakers an Demonstranten. Sucht die Kugeln und die Gedenktafel dazu.',
    quiz: {
      q: 'In welchem Jahr geschah das, woran die Eisenkugeln erinnern?',
      accept: ['1956'],
      hint: 'Der berühmte ungarische Volksaufstand.',
      reveal: '1956 – am 25. Oktober, dem „Blutigen Donnerstag", schossen Sicherheitskräfte auf dem Kossuth tér in die Menge.'
    }
  },
  {
    id: 'parliament', cat: 'foto', title: 'Levitation vor dem Parlament', complicated: true,
    place: 'Kossuth Lajos tér',
    lat: 47.5069, lng: 19.0472, points: 40, verify: 'photo',
    desc: 'Das drittgrößte Parlamentsgebäude der Welt, nachts komplett in Gold. Eure Aufgabe: ein Levitationsfoto! Eine Person „schwebt" waagerecht in der Luft (Springen + perfektes Timing, oder kreativ aufstützen und Stützen verstecken). Die anderen drei schauen möglichst unbeeindruckt.'
  },
  {
    id: 'jozsef', cat: 'foto', title: 'Melancholie mit Attila',
    place: 'Attila-József-Statue, Donauseite am Parlament',
    lat: 47.5051, lng: 19.0449, points: 20, verify: 'photo',
    desc: 'Ungarns großer Dichter Attila József sitzt als Statue an der Donautreppe, Hut neben sich, Blick ins Wasser – wie in seinem Gedicht „An der Donau". Setzt euch alle zu ihm und schaut GENAUSO melancholisch. Wer lacht, schuldet eine Runde.'
  },
  {
    id: 'princess', cat: 'foto', title: 'Die kleine Prinzessin',
    place: 'Donaukorzó beim Vigadó',
    lat: 47.4959, lng: 19.0482, points: 25, verify: 'photo',
    desc: 'Auf dem Geländer der Promenade sitzt die „Kiskirálylány", die kleine Prinzessin mit Narrenkappe – eines der meistfotografierten Dinger der Stadt. Ihre Knie sind blank gerieben (soll Glück bringen). Kopiert ihre exakte Sitzpose auf dem Geländer daneben. Ohne. In. Die. Donau. Zu. Fallen.'
  },
  {
    id: 'policeman', cat: 'foto', title: 'Der dicke Polizist',
    place: 'Zrínyi utca / Ecke Október 6. utca',
    lat: 47.5006, lng: 19.0510, points: 20, verify: 'photo',
    desc: 'Der gemütlichste Polizist der Stadt steht seit Jahren auf der Zrínyi utca. Sein Bauch glänzt golden, weil Reiben angeblich Glück bringt (und dafür sorgt, dass man wiederkommt … zum Essen). Alle vier reiben den Bauch, eine Person stellt seine Pose nach – improvisierter Schnurrbart Pflicht (Finger, Schal, Pommes, egal).'
  },
  {
    id: 'gerbeaud', cat: 'history', title: 'Süße Jahreszahl',
    place: 'Café Gerbeaud, Vörösmarty tér',
    lat: 47.4967, lng: 19.0503, points: 25, verify: 'quiz',
    desc: 'Am Vörösmarty tér residiert eines der berühmtesten Kaffeehäuser Europas. Kaiserin Sisi ließ sich die Süßigkeiten von hier kommen. Sucht an Fassade, Schildern oder Schaufenstern nach der Gründungs-Jahreszahl.',
    quiz: {
      q: 'Seit welchem Jahr gibt es die Konditorei?',
      accept: ['1858'],
      hint: 'Mitte des 19. Jahrhunderts, 18…',
      reveal: '1858 – gegründet von Henrik Kugler, übernommen von Emil Gerbeaud.'
    }
  },
  {
    id: 'sisibridge', cat: 'history', title: 'Sisis weiße Brücke', minMin: 60,
    place: 'Elisabethbrücke, Pester Seite',
    lat: 47.4916, lng: 19.0512, points: 20, verify: 'photo',
    desc: 'Die schneeweiße Elisabethbrücke ist nach Kaiserin Elisabeth benannt – „Sisi", die die Ungarn bis heute verehren, weil sie Ungarisch lernte und Wien regelmäßig für Budapest sitzen ließ. Foto-Beweis: eure allervornehmste kaiserliche Pose, Brücke im Hintergrund. Kinn hoch!'
  },
  {
    id: 'parishchurch', cat: 'history', title: 'Das älteste Gebäude von Pest', minMin: 60,
    place: 'Innerstädtische Pfarrkirche, Március 15. tér',
    lat: 47.4921, lng: 19.0522, points: 20, verify: 'photo',
    desc: 'An der Elisabethbrücke steht die Innerstädtische Pfarrkirche – das älteste Gebäude von Pest, auf römischen Fundamenten. Davor liegen tatsächlich Ruinen des Römerkastells Contra-Aquincum offen herum. Foto: ihr vier als dramatische Ausgrabungs-Archäologen an den Römersteinen.'
  },

  /* ---------- 📸 FOTO-CHALLENGES ---------- */
  {
    id: 'eye', cat: 'foto', title: 'Abheben am Riesenrad',
    place: 'Budapest Eye, Erzsébet tér',
    lat: 47.4981, lng: 19.0520, points: 25, verify: 'photo',
    desc: 'Das beleuchtete Riesenrad dreht sich bis tief in die Nacht. Aufgabe: ALLE gleichzeitig in der Luft, Riesenrad im Hintergrund. Klingt einfach. Ist es mit vier Leuten und einem Auslöser nicht. Selbstauslöser + Geduld + ein Passant eurer Wahl sind erlaubt.'
  },
  {
    id: 'tram2', cat: 'foto', title: 'Tram-2-Photobomb',
    place: 'Vigadó tér, Haltestelle der Linie 2',
    lat: 47.4962, lng: 19.0484, points: 30, verify: 'photo',
    desc: 'Die Linie 2 am Donauufer gilt als eine der schönsten Straßenbahnstrecken der Welt. Fangt ein Gruppenfoto, während im Hintergrund eine Tram durchfährt. Gelbe Retro-Tram = Ehrenpunkte. Die letzte fährt gegen 23:30 – tickt die Uhr schon?'
  },
  {
    id: 'panorama', cat: 'foto', title: 'Postkarte mit Silhouetten',
    place: 'Donaukorzó', time: 'night', fromHour: 18,
    lat: 47.4972, lng: 19.0478, points: 25, verify: 'photo',
    desc: 'Von der Promenade seht ihr die beleuchtete Burg und die Brücken. Baut die perfekte Nacht-Postkarte: Burg UND eine Brücke im Bild, davor eure vier Silhouetten als Scherenschnitt (Gegenlicht, keine Blitze!). Ordentliche Posen – ihr werdet gedruckt.'
  },
  {
    id: 'vaci', cat: 'foto', title: 'Schaufensterpuppen der Váci utca',
    place: 'Váci utca', time: 'night', fromHour: 18,
    lat: 47.4948, lng: 19.0511, points: 15, verify: 'photo',
    desc: 'Die Váci utca ist nachts leer und die Schaufenster hell. Sucht das schrägste Schaufenster und imitiert als Gruppe exakt die Posen der Schaufensterpuppen davor. Einer fotografiert so, dass man Puppen UND Kopien sieht.'
  },
  {
    id: 'neon', cat: 'foto', title: 'Neon-Porträt', free: true,
    time: 'night', fromHour: 19,
    points: 20, verify: 'photo',
    desc: 'Findet das schrillste Neon- oder Leuchtschild in eurer Nähe und macht ein Porträt von einem von euch, das NUR vom Schild beleuchtet wird. Kein Blitz, keine Handylampe. Kunst!'
  },

  /* ---------- 🛒 KIOSK & LOKALE PRODUKTE ---------- */
  {
    id: 'turorudi', cat: 'kiosk', title: 'Mission Túró Rudi', free: true,
    points: 25, verify: 'photo',
    desc: 'Ungarns Kult-Snack Nr. 1: Túró Rudi – ein Quark-Riegel in Schokolade, Verpackung rot gepunktet. Findet ihn im Kühlregal eines Nachtshops (Ungarn nennen die kleinen Läden „ABC" oder „Non-Stop"). Jeder probiert ein Stück. Beweisfoto: eure vier Gesichter beim ERSTEN Biss. Ungestellte Reaktionen geben die Punkte.'
  },
  {
    id: 'unicum', cat: 'kiosk', title: 'Die Unicum-Detektive', free: true,
    points: 30, verify: 'quiz',
    desc: 'Unicum ist Ungarns bittersüßer National-Kräuterlikör in der runden schwarzen Flasche mit goldenem Kreuz. Findet eine Flasche in einem Shop oder einer Bar und studiert das Etikett.',
    quiz: {
      q: 'Aus wie vielen Kräutern wird Unicum laut Etikett/Legende gebraut?',
      accept: ['40', 'vierzig', 'über 40', 'mehr als 40'],
      hint: 'Eine sehr runde Zahl.',
      reveal: 'Über 40 Kräuter – das genaue Rezept kennt nur die Familie Zwack.'
    }
  },
  {
    id: 'paprika', cat: 'kiosk', title: 'Scharfer Stephan', free: true,
    points: 20, verify: 'photo',
    desc: 'Findet in einem Laden ein Glas „Erős Pista" („Scharfer Stephan" – Ungarns liebste Paprikapaste) oder irgendein anderes Paprika-Produkt. Lasst euch vom Personal die korrekte Aussprache beibringen und sprecht sie im Chor nach. Beweisfoto: Produkt + eure ernsthaften Sprachschüler-Gesichter.'
  },
  {
    id: 'forint', cat: 'kiosk', title: 'Forint-Kopfrechnen', free: true, complicated: true,
    points: 30, verify: 'photo',
    desc: 'Findet eine Wechselstube (in der Innenstadt leuchten sie überall) und fotografiert die Kurstafel. Dann rechnet OHNE Handy-Taschenrechner aus, was 2.500 Forint in Euro sind. Jeder tippt einzeln, dann wird aufgelöst. Wer am weitesten daneben liegt, zahlt den nächsten Kaffee. Beweisfoto: die Kurstafel.'
  },

  /* ---------- ☕ PAUSEN ---------- */
  {
    id: 'toast', cat: 'pause', title: 'Anstoß-Pause', free: true, pause: true,
    points: 15, verify: 'photo',
    desc: 'Verordnete Pause! Bar, Kiosk-Bier oder Parkbank – egal. Stoßt an! Aber Achtung, Landeskunde: Mit Bier anstoßen und dabei klirren war in Ungarn 150 Jahre verpönt (die Habsburger sollen 1849 die Hinrichtung ungarischer Generäle mit Bierkrügen gefeiert haben). Also: Blickkontakt, „Egészségedre!", KEIN Klirren beim Bier. Beweisfoto vom Anstoßen.'
  },
  {
    id: 'coffee', cat: 'pause', title: 'Koffein-Boxenstopp', free: true, pause: true,
    points: 15, verify: 'photo',
    desc: 'Budapest war um 1900 die Stadt mit über 500 Kaffeehäusern – Zeit, die Tradition zu ehren. Kaffee, Tee oder heiße Schoko für alle, die müde werden. Beweisfoto: Becher in der Hand, Budapest-Kulisse im Hintergrund.'
  },
  {
    id: 'snack', cat: 'pause', title: 'Street-Snack-Teilung', free: true, pause: true,
    points: 15, verify: 'photo',
    desc: 'Besorgt EINEN ungarischen Snack – Lángos, Kürtőskalács (Baumstriezel), Pogácsa oder was der Nachtshop hergibt – und teilt ihn mathematisch exakt durch vier. Beweisfoto: der Moment der feierlichen Teilung. Streit über Stückgrößen gibt Punktabzug (Ehrensache).'
  },

  /* ---------- 🎭 GRUPPEN- & FUN-AUFGABEN ---------- */
  {
    id: 'cheers', cat: 'fun', title: 'Egészségedre!', free: true, complicated: true,
    video: true,
    points: 35, verify: 'photo',
    desc: 'Das gefürchtetste Wort Ungarns: „Egészségedre!" (Prost / Gesundheit; ungefähr: Ägg-esch-ehh-gedre). Findet einen local aussehenden Menschen, der es euch beibringt, und sprecht es im Chor, bis euer Lehrer zufrieden nickt. Beweisfoto mit Lehrer (vorher freundlich fragen!).'
  },
  {
    id: 'spellbuda', cat: 'fun', title: 'Körper-Buchstaben: B-U-D-A', free: true, complicated: true,
    points: 40, verify: 'photo',
    desc: 'Formt mit euren Körpern nacheinander die Buchstaben B, U, D und A. Pro Buchstabe dürfen alle vier mitbauen (liegen, stehen, klettern – alles erlaubt). Beweisfoto ist der beste Buchstabe. Ein unbeteiligter Passant muss ihn erraten können.'
  },
  {
    id: 'statue', cat: 'fun', title: 'Das Statuen-Double', free: true,
    points: 15, verify: 'photo',
    desc: 'Budapest ist voll mit Bronzefiguren. Sucht IRGENDEINE Statue in eurer Nähe. Eine Person stellt sie exakt nach (Faltenwurf! Blick!), die anderen raten, wie lange sie regungslos bleibt. Beweisfoto: Original und Double nebeneinander.'
  },
  {
    id: 'choir', cat: 'fun', title: 'Mitternachtschor an der Donau', free: true,
    time: 'night', fromHour: 18, video: true,
    points: 25, verify: 'photo',
    desc: 'Stellt euch ans Donauufer und singt 30 Sekunden lang gemeinsam ein Lied eurer Wahl – laut genug, dass die Burg drüben es hören könnte. Beweis: Foto mitten im Refrain (Münder weit offen) oder gleich ein Video eures Auftritts. Applaus von Fremden = Ehrenrunde.'
  },
  {
    id: 'columbo', cat: 'fun', title: 'Übrigens … noch eine Frage', minMin: 90,
    place: 'Columbo-Statue, Falk Miksa utca / Ecke Szent István körút',
    lat: 47.5126, lng: 19.0489, points: 25, verify: 'photo',
    desc: 'Ja, wirklich: In Budapest steht eine Bronzestatue von Inspektor Columbo samt Hund (die Straße ist nach Miksa Falk benannt – und Peter Falk hieß nun mal Falk). Stellt die Szene nach: Einer ist Columbo in Trenchcoat-Pose, einer der ertappte Mörder, der Rest ist entsetzt. Der Hund spielt sich selbst.'
  },
  {
    id: 'zerostone', cat: 'fun', title: 'Expedition: Kilometer Null', minMin: 180, complicated: true,
    place: 'Clark Ádám tér, Budaer Seite der Kettenbrücke',
    lat: 47.4980, lng: 19.0401, points: 50, verify: 'photo',
    desc: 'Großes Finale für Ausdauernde: Überquert die Kettenbrücke ZU FUSS (nachts ein Gänsehaut-Moment). Drüben am Kreisverkehr steht der „0 km"-Stein – der Nullpunkt, von dem aus alle ungarischen Fernstraßen gemessen werden. Beweisfoto: ihr vier als dramatische Polar-Expedition, die endlich den Nullpunkt erreicht.'
  },
  {
    id: 'gozsdu', cat: 'foto', title: 'Ausflug: Gozsdu-Passage', minMin: 150,
    time: 'night', fromHour: 17,
    place: 'Gozsdu Udvar, Bezirk VII',
    lat: 47.4987, lng: 19.0588, points: 20, verify: 'photo',
    desc: 'Kurzer Grenzübertritt ins Jüdische Viertel: Die Gozsdu-Passage ist eine 200 Meter lange Schlucht aus Bars, Lichterketten und Lärm. Aufgabe: ein Gruppenfoto MITTEN im Getümmel, auf dem alle vier ernst wie ein Beerdigungsinstitut schauen. Umgebung: Party. Ihr: Steuerprüfung.'
  },
  {
    id: 'synagogue', cat: 'history', title: 'Ausflug: Die große Synagoge', minMin: 150,
    place: 'Große Synagoge, Dohány utca',
    lat: 47.4959, lng: 19.0607, points: 25, verify: 'quiz',
    desc: 'Die Synagoge in der Dohány utca ist die größte Europas (Platz für 3.000 Menschen) und nachts wunderschön angestrahlt. Betrachtet die Fassade von außen.',
    quiz: {
      q: 'Wie viele Zwiebelturm-Spitzen krönen die Fassade?',
      accept: ['2', 'zwei'],
      hint: 'Symmetrie – links und rechts.',
      reveal: '2 Zwiebeltürme, je 43 Meter hoch.'
    }
  },
  {
    id: 'ruinpub', cat: 'pause', title: 'Ausflug: Ruinenbar-Pause', minMin: 150, pause: true,
    time: 'night', fromHour: 16,
    place: 'Szimpla Kert, Kazinczy utca',
    lat: 47.4970, lng: 19.0633, points: 25, verify: 'photo',
    desc: 'Die Mutter aller Ruinenbars – kein Eintritt, einfach reingehen und staunen: ein verfallenes Haus voller Trabant-Hälften, Badewannen-Sofas und Glühbirnen-Wäldern. Ein Getränk, dann Beweisfoto im absurdesten Winkel, den ihr findet.'
  },

  /* ---------- ☀️ TAG-AUFGABEN (Daygame / Day n Night) ---------- */
  {
    id: 'day-markthalle', cat: 'kiosk', title: 'Bauch der Stadt: Große Markthalle',
    time: 'day', openHours: [6, 18],
    place: 'Große Markthalle, Fővám tér (Mo–Sa)',
    lat: 47.4870, lng: 19.0589, points: 25, verify: 'photo',
    desc: 'Tagsüber ist die Große Markthalle offen – drei Etagen unter dem bunten Zsolnay-Keramikdach, Paprikagirlanden bis zur Decke, oben brutzelt Lángos. Eintritt: null Forint. Aufgabe: Findet das absurdeste Souvenir der Halle (Paprika-Boxershorts? Salami-Plüschtier?) und macht ein Beweisfoto damit – kaufen müsst ihr nichts.'
  },
  {
    id: 'day-bees', cat: 'history', title: 'Die Bienen des Sparkassen-Palasts',
    time: 'day', openHours: [7, 19],
    place: 'Ehem. Postsparkasse, Hold utca 4',
    lat: 47.5042, lng: 19.0522, points: 30, verify: 'quiz',
    desc: 'Hinter dem Freiheitsplatz steht Ödön Lechners Jugendstil-Meisterwerk von 1901: die ehemalige Postsparkasse mit einem Märchendach aus grün-gelber Zsolnay-Keramik. Nur bei Tageslicht erkennt man die Details – schaut ganz nach oben an die Dachkanten und Giebel!',
    quiz: {
      q: 'Welche Tiere klettern an den Giebeln zum Dach hinauf?',
      accept: ['bienen', 'biene', 'bees'],
      hint: 'Sie sammeln, was man zur Sparkasse trägt – fleißig zum Bienenstock.',
      reveal: 'Bienen! Sie krabbeln zu keramischen Bienenstöcken hinauf – Lechners Symbol fürs fleißige Sparen.'
    }
  },
  {
    id: 'day-parisi', cat: 'foto', title: 'Kaleidoskop: Párisi Udvar',
    time: 'day', openHours: [8, 20],
    place: 'Párisi Udvar, Ferenciek tere',
    lat: 47.4932, lng: 19.0548, points: 20, verify: 'photo',
    desc: 'Die Párisi Udvar ist Budapests prunkvollste Passage – ein Glasdom aus 1913, halb maurisch, halb gotisch, komplett größenwahnsinnig. Tagsüber darf man frei hinein (heute Hotel-Lobby, freundlich gucken kostet nichts). Aufgabe: Legt euch in die Mitte auf den Rücken und fotografiert das Kuppeldach so, dass es wie ein Kaleidoskop aussieht.'
  },
  {
    id: 'day-foldalatti', cat: 'history', title: 'Die Ur-U-Bahn',
    time: 'day', openHours: [6, 22],
    place: 'M1-Station Vörösmarty tér (Zugang)',
    lat: 47.4966, lng: 19.0504, points: 25, verify: 'quiz',
    desc: 'Unter euren Füßen fährt die „Földalatti" – die älteste U-Bahn Kontinentaleuropas, gebaut für die Millenniumsfeier Ungarns. Die gusseisernen Jugendstil-Eingänge mit den gelben Schildern stehen unter UNESCO-Schutz. Sucht am Eingang oder auf den Schildern nach der Jahreszahl der Eröffnung.',
    quiz: {
      q: 'In welchem Jahr eröffnete die Földalatti?',
      accept: ['1896'],
      hint: '1.000 Jahre nach der ungarischen Landnahme von 896.',
      reveal: '1896 – pünktlich zur Millenniumsfeier, noch vor Paris und Berlin.'
    }
  },
  {
    id: 'day-rose', cat: 'kiosk', title: 'Die essbare Rose',
    time: 'day', openHours: [10, 21],
    place: 'Gelarto Rosa, Szent István tér',
    lat: 47.5011, lng: 19.0529, points: 20, verify: 'photo',
    desc: 'Direkt an der Basilika formt Gelarto Rosa Eiskugeln zu Rosenblüten – Blatt für Blatt mit dem Spatel. Eine Rose für die Gruppe reicht. Beweisfoto: die Eisrose im Vordergrund, dahinter eure allervornehmsten „Oh, wie reizend!"-Gesichter, Basilika im Hintergrund gibt Stilpunkte.'
  },
  {
    id: 'day-shadow', cat: 'foto', title: 'Schatten-Theater', free: true, complicated: true,
    time: 'day', openHours: [9, 17],
    points: 30, verify: 'photo',
    desc: 'Nur mit Sonne lösbar: Stellt euch so auf, dass eure vier Schatten zusammen ein TIER formen (Elefant, Vogel, Krokodil – Rüssel und Flügel aus Armen bauen). Fotografiert NUR die Schatten auf dem Pflaster. Ein Passant muss das Tier erraten können.'
  },

  /* ---------- 🏰 BUDA-SEITE (links der Donau) ---------- */
  {
    id: 'buda-bastion', cat: 'history', title: 'Die sieben Türme', minMin: 120,
    place: 'Fischerbastei, Burgviertel (Buda)',
    lat: 47.5022, lng: 19.0347, points: 35, verify: 'quiz',
    desc: 'Über die Kettenbrücke und hinauf ins Burgviertel: Die Fischerbastei ist nachts frei zugänglich und märchenhaft beleuchtet. Ihre Türme sind kein Zufall – zählt sie und überlegt, wofür sie stehen (die Infotafeln vor Ort verraten es).',
    quiz: {
      q: 'Wie viele Türme hat die Fischerbastei – und damit: für wie viele Magyarenstämme stehen sie?',
      accept: ['7', 'sieben'],
      hint: 'So viele Stämme nahmen 896 das Land in Besitz.',
      reveal: '7 Türme – einer für jeden der sieben ungarischen Stämme der Landnahme.'
    }
  },
  {
    id: 'buda-matthias', cat: 'history', title: 'Der Vogel auf der Spitze', minMin: 120,
    place: 'Matthiaskirche, Szentháromság tér (Buda)',
    lat: 47.5019, lng: 19.0342, points: 30, verify: 'quiz',
    desc: 'Direkt neben der Fischerbastei glänzt die Matthiaskirche mit ihrem bunten Zsolnay-Keramikdach. Schaut ganz hinauf zur höchsten Turmspitze: Dort sitzt ein Tier mit einem goldenen Ring im Schnabel – das Wappentier von König Matthias Corvinus.',
    quiz: {
      q: 'Welches Tier sitzt mit dem Ring im Schnabel auf der Turmspitze?',
      accept: ['rabe', 'ein rabe', 'der rabe', 'corvus'],
      hint: 'Corvinus kommt von „corvus" – Latein für diesen schwarzen Vogel.',
      reveal: 'Ein Rabe mit goldenem Ring – daher „Corvinus": der Rabenkönig Matthias.'
    }
  },
  {
    id: 'buda-turul', cat: 'history', title: 'Der Sagenvogel der Magyaren', minMin: 120,
    place: 'Burgpalast, Habsburg-Treppe (Buda)',
    lat: 47.4977, lng: 19.0398, points: 30, verify: 'quiz',
    desc: 'Am Aufgang zum Burgpalast breitet ein gewaltiger Bronzevogel mit Schwert in den Krallen die Flügel aus. Er ist DER Sagenvogel der ungarischen Mythologie – sein Name steht auf dem Sockel.',
    quiz: {
      q: 'Wie heißt der mythische Vogel am Burgaufgang?',
      accept: ['turul', 'turulvogel', 'turul vogel'],
      hint: 'Beginnt mit T, klingt türkisch – ist er auch.',
      reveal: 'Der Turul – laut Sage führte er die Magyaren ins Karpatenbecken.'
    }
  },
  {
    id: 'buda-batthyany', cat: 'foto', title: 'Parlament in Gold', minMin: 120,
    place: 'Batthyány tér, Donauufer (Buda)',
    lat: 47.5061, lng: 19.0392, points: 25, verify: 'photo',
    desc: 'Vom Batthyány tér habt ihr DEN Blick: das golden angestrahlte Parlament direkt gegenüber, gespiegelt in der Donau. Foto-Beweis: das Parlament im Hintergrund, ihr vier davor in eurer besten „Wir regieren jetzt"-Pose.'
  },
  {
    id: 'buda-gellert', cat: 'foto', title: 'Expedition: Der Bischof über der Stadt', minMin: 240, complicated: true,
    place: 'Gellért-Denkmal, Fuß des Gellértbergs (Buda)',
    lat: 47.4893, lng: 19.0464, points: 45, verify: 'photo',
    desc: 'Für Ausdauernde: Über die Elisabethbrücke zum Fuß des Gellértbergs. Oben segnet Bischof Gellért mit erhobenem Kreuz die Stadt – der Legende nach wurde er 1046 genau hier in einem Fass den Berg hinuntergestürzt. Foto: einer segnet in Gellért-Pose, die anderen stellen das entsetzte Publikum. Der Aufstieg zur Statue lohnt, das Foto geht aber auch von unten mit Zoom.'
  },

  /* ---------- 🌇 OST-PEST (rechts vom Zentrum) ---------- */
  {
    id: 'pest-opera', cat: 'history', title: 'Die Wächter der Oper', minMin: 120,
    place: 'Ungarische Staatsoper, Andrássy út 22',
    lat: 47.5027, lng: 19.0583, points: 30, verify: 'quiz',
    desc: 'Die Staatsoper an der Prachtstraße Andrássy út ist nachts hell angestrahlt. Links und rechts des Haupteingangs sitzen zwei ungarische Komponisten als Marmorstatuen – die Namen stehen an den Sockeln. Lest nach!',
    quiz: {
      q: 'Welche zwei Komponisten flankieren den Eingang? (Ein Nachname reicht.)',
      accept: ['liszt', 'erkel', 'franz liszt', 'ferenc erkel', 'liszt und erkel'],
      hint: 'Einer schrieb die Ungarischen Rhapsodien, der andere die Nationalhymne.',
      reveal: 'Franz Liszt und Ferenc Erkel – Letzterer komponierte die ungarische Hymne und war erster Direktor der Oper.'
    }
  },
  {
    id: 'pest-liszt', cat: 'foto', title: 'Der wilde Maestro', minMin: 150,
    place: 'Liszt-Ferenc-Statue, Liszt Ferenc tér',
    lat: 47.5039, lng: 19.0634, points: 20, verify: 'photo',
    desc: 'Auf dem Kneipenplatz Liszt Ferenc tér sitzt Franz Liszt als Statue – wilde Mähne, dramatisch aufgerissene Klavierhände, mitten im unsichtbaren Fortissimo. Stellt euch dazu und dirigiert/klimpert GENAUSO dramatisch. Beweisfoto im Moment der größten Ekstase.'
  },
  {
    id: 'pest-newyork', cat: 'foto', title: 'Das schönste Café der Welt', minMin: 180,
    place: 'New York Café, Erzsébet körút',
    lat: 47.4985, lng: 19.0706, points: 25, verify: 'photo',
    desc: 'Das New York Café wird gern „das schönste Café der Welt" genannt – Marmor, Gold und Fresken wie in einem Opernhaus. Der Blick durch die großen Fenster oder ein Schritt ins Foyer kostet nichts. Beweisfoto: eure allerfeinste Adelspose vor oder im Eingang. Monokel aus Daumen und Zeigefinger: Pflicht.'
  },
  {
    id: 'pest-heroes', cat: 'history', title: 'Expedition: Der Erzengel', minMin: 240, complicated: true,
    place: 'Heldenplatz (Hősök tere)',
    lat: 47.5150, lng: 19.0779, points: 45, verify: 'quiz',
    desc: 'Die Königsetappe Richtung Osten: Der Heldenplatz am Ende der Andrássy út – mit der M1, der ältesten U-Bahn des Kontinents, seid ihr in Minuten dort. In der Mitte ragt eine 36-Meter-Säule auf, ganz oben steht eine geflügelte Gestalt mit Krone und Kreuz. Die Infotafeln am Platz verraten, wer das ist.',
    quiz: {
      q: 'Welcher Erzengel steht auf der Mittelsäule des Heldenplatzes?',
      accept: ['gabriel', 'erzengel gabriel'],
      hint: 'Derselbe, der Maria die frohe Botschaft brachte.',
      reveal: 'Erzengel Gabriel – der Sage nach bot er König Stephan die Krone Ungarns an.'
    }
  },
  {
    id: 'pest-karavan', cat: 'kiosk', title: 'Street-Food-Basar', minMin: 150,
    time: 'night', fromHour: 16,
    place: 'Karavan Street Food, Kazinczy utca',
    lat: 47.4971, lng: 19.0630, points: 25, verify: 'photo',
    desc: 'Direkt neben der Ruinenbar Szimpla liegt der Karavan-Hof: Foodtrucks unter Lichterketten, vom Lángos-Burger bis Kürtőskalács-Eis. Auftrag: EIN Gericht, das keiner von euch kennt, gemeinsam bestellen und probieren. Beweisfoto: das Gericht + eure ersten Probier-Gesichter.'
  },

  /* ---------- 🏝️ MARGARETENINSEL (die erste kleine Insel) ---------- */
  {
    id: 'margit-fountain', cat: 'gps', title: 'Insel-Etappe: Der singende Brunnen', minMin: 240,
    place: 'Musikbrunnen, Margareteninsel (Südspitze)',
    lat: 47.5187, lng: 19.0449, points: 30, verify: 'gps',
    desc: 'Ab auf die Margareteninsel! Über die Margaretenbrücke (Tram 4/6 hält mitten auf der Brücke) erreicht ihr die Südspitze mit dem Musikbrunnen – er spielt tagsüber stündlich Musik, abends leuchtet er. Check-in per GPS am Brunnenrand.'
  },
  {
    id: 'margit-ruins', cat: 'history', title: 'Insel-Etappe: Die Königstochter', minMin: 240,
    place: 'Klosterruinen, Margareteninsel (Nordhälfte)',
    lat: 47.5290, lng: 19.0511, points: 35, verify: 'quiz',
    desc: 'In der Nordhälfte der Insel liegen die Ruinen eines Dominikanerinnenklosters. Hier lebte im 13. Jahrhundert eine Königstochter, die ihr Vater Béla IV. als Dank für die Rettung des Landes vor den Mongolen Gott versprach – die Insel trägt heute ihren Namen. Die Infotafeln an den Ruinen erzählen ihre Geschichte.',
    quiz: {
      q: 'Wie hieß die Königstochter, nach der die Insel benannt ist?',
      accept: ['margit', 'margarete', 'margaret', 'margareta', 'sankt margit'],
      hint: 'Der Inselname ist der Vorname.',
      reveal: 'Margit (Margarete) – sie lebte hier ab ihrem 9. Lebensjahr im Kloster und wurde heiliggesprochen.'
    }
  },
  {
    id: 'margit-watertower', cat: 'foto', title: 'Insel-Etappe: Der Wasserturm', minMin: 240,
    place: 'Wasserturm, Margareteninsel (Nordteil)',
    lat: 47.5302, lng: 19.0501, points: 30, verify: 'photo',
    desc: 'Der 57 Meter hohe Jugendstil-Wasserturm von 1911 ist das Wahrzeichen der Insel und UNESCO-geschützt. Beweisfoto: Ihr vier baut den Turm nach – einer ist das Fundament, die anderen staffeln sich dahinter der Größe nach zur „Turmspitze". Der echte Turm muss mit aufs Bild.'
  },
  {
    id: 'margit-track', cat: 'fun', title: 'Insel-Etappe: Die Gummibahn', minMin: 240,
    video: true,
    place: 'Laufbahn, Margareteninsel (Westufer)',
    lat: 47.5220, lng: 19.0425, points: 30, verify: 'photo',
    desc: 'Rund um die Insel führt die berühmte 5,35 km lange Gummi-Laufbahn – der Lieblingsort aller Budapester Läufer. Auftrag: eine 20-Meter-Staffel, jeder läuft eine Etappe, Übergabe-Objekt ist irgendwas Absurdes (Kürtőskalács? Bierdose? Schuh?). Beweis: Foto vom Zieleinlauf oder gleich ein Video der Staffel.'
  },

  /* ---------- 🔎 LESE-QUESTS IM ZENTRUM ---------- */
  {
    id: 'quiz-chainbridge', cat: 'history', title: 'Der Name auf der Tafel', minMin: 60,
    place: 'Kettenbrücke, Pester Widerlager',
    lat: 47.4989, lng: 19.0458, points: 30, verify: 'quiz',
    desc: 'Am Pester Brückenkopf der Kettenbrücke sind Gedenktafeln eingelassen. Eine nennt den englischen Ingenieur, der die Brücke entworfen hat (sein Namensvetter Adam Clark hat sie gebaut – der Platz drüben heißt nach ihm). Lest die Tafel!',
    quiz: {
      q: 'Wie lautet der Nachname des englischen Ingenieurs, der die Kettenbrücke entwarf?',
      accept: ['clark', 'william tierney clark', 'tierney clark'],
      hint: 'Gleicher Nachname wie der schottische Erbauer – aber nicht verwandt.',
      reveal: 'William Tierney Clark – gebaut hat sie Adam Clark, nicht verwandt, nur namensgleich.'
    }
  },
  {
    id: 'quiz-danubius', cat: 'history', title: 'Die Flüsse im Brunnen', minMin: 30,
    place: 'Danubius-Brunnen, Erzsébet tér',
    lat: 47.4982, lng: 19.0516, points: 25, verify: 'quiz',
    desc: 'Mitten auf dem Erzsébet tér steht der Danubius-Brunnen: Oben thront Vater Donau – und um den Fuß sitzen Frauenfiguren, die seine großen Nebenflüsse verkörpern. Geht einmal drumherum und zählt die Damen.',
    quiz: {
      q: 'Wie viele Frauenfiguren (Nebenflüsse) sitzen am Fuß des Brunnens?',
      accept: ['3', 'drei'],
      hint: 'Theiß, Drau und … zählt nach!',
      reveal: '3 – sie stehen für Theiß, Drau und Save.'
    }
  },

  /* ---------- 🎥 VIDEO-QUEST ---------- */
  {
    id: 'video-spot', cat: 'fun', title: 'Der Budapest-Werbespot', free: true, complicated: true,
    points: 35, verify: 'video',
    desc: 'Dreht einen 30-Sekunden-Werbespot für Budapest – so übertrieben wie ein Teleshopping-Kanal. Regeln: Jede Person ist mindestens einmal im Bild, mindestens ein ungarisches Wort fällt („Egészségedre!" zählt), und der Spot endet mit einem gemeinsamen Slogan in die Kamera. Der Beweis ist das Video selbst.'
  },

  /* ---------- 🕵️ AGENTENMISSION (Ketten-Aufgaben) ---------- */
  {
    id: 'spy1', cat: 'fun', title: 'Agentenmission 1/3: Das Briefing',
    chain: 'spy', step: 1,
    place: 'Szabadság tér (Nordteil), beim spazierenden Präsidenten',
    lat: 47.5049, lng: 19.0499, points: 20, verify: 'photo',
    desc: 'Budapest war im Kalten Krieg DIE Spionage-Hauptstadt Europas – zwischen US-Botschaft und Sowjet-Denkmal liegen hier 50 Meter. Eure Mission beginnt: Trefft euch mit „Agent R." (der Bronzeherr, der über den Platz spaziert) zum geheimen Briefing. Beweisfoto: konspiratives Gespräch, alle mit hochgeschlagenem Kragen.\n\n🎯 MERKT EUCH FÜR TEIL 2: Das Codewort ist der VORNAME des Präsidenten.'
  },
  {
    id: 'spy2', cat: 'fun', title: 'Agentenmission 2/3: Der tote Briefkasten',
    chain: 'spy', step: 2, requires: 'spy1',
    place: 'Beim dicken Polizisten, Zrínyi utca',
    lat: 47.5006, lng: 19.0510, points: 25, verify: 'quiz',
    desc: 'Der dickste Informant der Stadt wartet auf der Zrínyi utca. Er rückt seine Information nur raus, wenn ihr das Losungswort aus dem Briefing kennt. Flüstert es ihm zu (wirklich! Passanten-Irritation ist Teil der Mission) und gebt es dann hier ein.',
    quiz: {
      q: 'Wie lautet das Losungswort? (Teil 1 der Mission verrät es.)',
      accept: ['ronald'],
      hint: 'Der Vorname des Präsidenten vom Freiheitsplatz. R…',
      reveal: 'RONALD – wie Ronald Reagan, der 50 Meter vom letzten Sowjet-Denkmal entfernt spaziert.'
    }
  },
  {
    id: 'spy3', cat: 'fun', title: 'Agentenmission 3/3: Die Übergabe', complicated: true,
    chain: 'spy', step: 3, requires: 'spy2',
    place: 'Unterm Löwen der Kettenbrücke, Pester Seite',
    lat: 47.4990, lng: 19.0459, points: 45, verify: 'photo',
    desc: 'Finale der Mission: die Übergabe. Unterm steinernen Löwen wechselt ein unauffälliges Päckchen (Snack, Zettel, was auch immer) den Besitzer. Beweisfoto: der Übergabemoment – zwei tauschen das Päckchen mit todernster Miene, die anderen sichern in VERSCHIEDENE Richtungen wie sehr, sehr schlechte Spione. Zeitungsloch zum Durchgucken gibt Stilpunkte.'
  },

  /* ---------- 🥚 EASTER EGGS: Die Mini-Statuen & Co. ---------- */
  {
    id: 'egg-squirrel', cat: 'egg', title: 'Kolodko-Mini: Das tote Eichhörnchen', minMin: 90,
    place: 'Falk Miksa utca / Szent István körút, bei der Columbo-Statue',
    lat: 47.5126, lng: 19.0488, points: 35, verify: 'photo',
    desc: 'Der Guerilla-Bildhauer Mihály Kolodko versteckt seit Jahren winzige Bronze-Figuren in der Stadt – ohne Genehmigung, über Nacht montiert. Am Nordende der Falk Miksa utca liegt sein berüchtigtstes Werk: ein totes Eichhörnchen mit Revolver samt Kreide-Umriss – ein inszenierter Tatort, direkt vor den Füßen von Inspektor Columbo. Es ist ~10 cm klein – Handylampe an, tief bücken, suchen! Beweisfoto: das Eichhörnchen in Großaufnahme.'
  },
  {
    id: 'egg-kermit', cat: 'egg', title: 'Kolodko-Mini: Der Frosch',
    place: 'Szabadság tér, am Geländer Richtung Park',
    lat: 47.5041, lng: 19.0506, points: 35, verify: 'photo',
    desc: 'Noch ein Kolodko: Ein sehr bekannter grüner Frosch (ihr kennt ihn aus dem Fernsehen) sitzt in Miniatur auf einem Geländer am Freiheitsplatz und schaut melancholisch ins Grüne. Findet ihn und macht ein Foto, auf dem einer von euch GENAU seinen Gesichtsausdruck imitiert.'
  },
  {
    id: 'egg-rubik', cat: 'egg', title: 'Kolodko-Mini: Der schmelzende Würfel', minMin: 60,
    place: 'Unteres Donauufer (Buda), Bem rakpart beim Batthyány tér',
    lat: 47.5048, lng: 19.0396, points: 35, verify: 'photo',
    desc: 'Der Zauberwürfel ist eine ungarische Erfindung (Ernő Rubik, 1974!) – und Kolodko hat ihm ein Denkmal gesetzt: ein kleiner Würfel, der wie Dalís Uhren von der Kaimauer schmilzt – auf der BUDAER Seite, am Bem rakpart nahe Batthyány tér. Die Treppe zum unteren Kai nehmen und die Mauer absuchen. Beweisfoto: der Würfel + im Hintergrund das beleuchtete Parlament. Vorsicht an der Kante!'
  },
  {
    id: 'egg-peacock', cat: 'egg', title: 'Die Pfauen im Tor', minMin: 60,
    place: 'Gresham-Palast, Széchenyi tér',
    lat: 47.4997, lng: 19.0477, points: 25, verify: 'quiz',
    desc: 'Der Gresham-Palast ist Budapests Jugendstil-Juwel. Kaum jemand schaut genau hin: In den schmiedeeisernen Toren stecken kunstvolle Pfauen – das heimliche Wahrzeichen des Hauses. Findet die Tore und zählt genau.',
    quiz: {
      q: 'Wie viele Pfauen stecken in EINEM der schmiedeeisernen Torflügel-Paare? (Zählt an einem Tor!)',
      accept: ['2', 'zwei', '1', 'ein', 'einen', '4', 'vier'],
      hint: 'Symmetrie ist die halbe Antwort – Hauptsache, ihr habt wirklich hingeschaut und euch geeinigt.',
      reveal: 'Je nach Zählweise 1 Pfau pro Flügel bzw. 2 pro Tor – die Diskussion darüber IST die Aufgabe.'
    }
  },
  {
    id: 'egg-radar', cat: 'egg', title: 'Kolodko-Radar', free: true, complicated: true, minMin: 90,
    points: 40, verify: 'photo',
    desc: 'Die Königsdisziplin für Nischen-Nerds: Findet auf eurem Weg IRGENDEINE Mini-Bronze oder ein verstecktes Kunstwerk, das NICHT in dieser Rallye vorkommt und in keinem Standard-Reiseführer steht (Mini-Statue, seltsame Plakette, Straßenkunst mit Geschichte). Beweisfoto + einer von euch erklärt den anderen in 20 Sekunden eine frei erfundene, aber überzeugende Entstehungsgeschichte.'
  },
  {
    id: 'secret-oath', cat: 'egg', title: '⭐ Geheimauftrag: Der Budapester Schwur',
    free: true, secret: true, complicated: true,
    points: 50, verify: 'photo',
    desc: 'Ihr habt das versteckte Easter Egg gefunden – respekt! Der Geheimauftrag: Geht ans Donauufer, legt alle eine Hand aufs Geländer, blickt zur Burg und schwört feierlich im Chor den Budapester Schwur: „Wir schwören bei Sisi, beim Paprika und beim heiligen Túró Rudi: Wir kommen wieder!" Beweisfoto vom Schwur-Moment. Niemand darf dabei lachen. (Unmöglich.)'
  },

  /* ---------- 📍 GPS-CHECKPOINTS ---------- */
  {
    id: 'cp-vorosmarty', cat: 'gps', title: 'Checkpoint: Vörösmarty tér',
    place: 'Vörösmarty tér', lat: 47.4961, lng: 19.0506, points: 15, verify: 'gps',
    desc: 'Erreicht den Platz des Nationaldichters Mihály Vörösmarty. Sein weißes Marmordenkmal ist im Winter eingehaust, er selbst angeblich empfindlich gegen Kälte. Check-in per GPS, sobald ihr auf dem Platz steht.'
  },
  {
    id: 'cp-szechenyi', cat: 'gps', title: 'Checkpoint: Széchenyi tér',
    place: 'Széchenyi István tér', lat: 47.4990, lng: 19.0466, points: 15, verify: 'gps',
    desc: 'Der Platz zwischen Kettenbrücke und dem Jugendstil-Märchenpalast Gresham (heute Luxushotel – Blick durch die Glastür ist gratis). Check-in per GPS.'
  },
  {
    id: 'cp-fovam', cat: 'gps', title: 'Checkpoint: Große Markthalle', minMin: 120,
    place: 'Fővám tér', lat: 47.4876, lng: 19.0584, points: 20, verify: 'gps',
    desc: 'Am südlichen Ende der Váci utca steht die Große Markthalle mit ihrem Dach aus bunten Zsolnay-Keramikziegeln – nachts schön angestrahlt, innen leider zu (kein Eintritt nötig, war eh nicht drin). Check-in per GPS auf dem Vorplatz.'
  },

  /* ---------- 👻 AR: ZEITFENSTER ---------- */
  {
    id: 'ar-sisi', cat: 'ar', title: 'Zeitfenster: Die Kaiserin',
    place: 'Széchenyi tér, Blick zur Kettenbrücke',
    lat: 47.4990, lng: 19.0465, points: 35, verify: 'ghost',
    ghost: 'sisi',
    story: 'Kaiserin Elisabeth – „Sisi" – war Österreichs Kaiserin, aber Ungarns Königin der Herzen. Sie lernte fließend Ungarisch, setzte sich für den Ausgleich von 1867 ein und wurde in der Matthiaskirche gegenüber zur Königin von Ungarn gekrönt. Wien fand sie steif – Budapest liebte sie.',
    desc: 'Öffnet an diesem Ort das Zeitfenster: Eine gewisse Kaiserin erscheint im Kamerabild. Macht ein Geisterfoto mit ihr – Knicks oder Verbeugung nicht vergessen.'
  },
  {
    id: 'ar-szechenyi', cat: 'ar', title: 'Zeitfenster: Der größte Ungar',
    place: 'Széchenyi István tér, vor dem Gresham-Palast',
    lat: 47.4996, lng: 19.0477, points: 35, verify: 'ghost',
    ghost: 'szechenyi',
    story: 'Graf István Széchenyi – „der größte Ungar" – stiftete ein Jahreseinkommen für die Akademie der Wissenschaften und trieb den Bau der Kettenbrücke voran: die erste feste Brücke zwischen Buda und Pest (1849). Der Platz hier und die Brücke tragen seinen Namen.',
    desc: 'Öffnet das Zeitfenster: Der Graf persönlich inspiziert nachts seine Brücke. Geisterfoto mit ehrfürchtigem Nicken.'
  },
  {
    id: 'ar-1956', cat: 'ar', title: 'Zeitfenster: Oktober 1956',
    place: 'Kossuth tér, vor dem Parlament',
    lat: 47.5070, lng: 19.0465, points: 35, verify: 'ghost',
    ghost: 'revolutionar',
    story: 'Im Oktober 1956 erhoben sich die Ungarn gegen die sowjetische Herrschaft. Ihr Symbol: die ungarische Fahne mit herausgeschnittenem kommunistischem Wappen – ein Loch in der Mitte. Der Aufstand wurde niedergeschlagen, aber nie vergessen; hier auf dem Kossuth tér erinnert vieles daran.',
    desc: 'Öffnet das Zeitfenster: Ein Freiheitskämpfer mit der Lochfahne erscheint. Macht das Geisterfoto mit angemessenem Respekt – dieses Zeitfenster ist ein ernstes.'
  },
  {
    id: 'ar-tram', cat: 'ar', title: 'Zeitfenster: Die Ur-Tram',
    place: 'Vigadó tér, an den Gleisen der Linie 2',
    lat: 47.4961, lng: 19.0486, points: 35, verify: 'ghost',
    ghost: 'tram',
    story: 'Budapest war Straßenbahn-Pionier: Schon 1887 ratterte hier eine der ersten elektrischen Straßenbahnen Europas, und 1896 eröffnete auf der anderen Seite die erste U-Bahn Kontinentaleuropas. Die heutige Linie 2 am Ufer fährt eine der schönsten Strecken der Welt.',
    desc: 'Öffnet das Zeitfenster: Die Ur-Tram von 1887 rollt noch einmal über den Korzó. Geisterfoto – aber bitte nicht auf den echten Gleisen stehen bleiben.'
  },
  {
    id: 'ar-literat', cat: 'ar', title: 'Zeitfenster: Das Kaffeehaus um 1900',
    place: 'Vörösmarty tér, vor dem Gerbeaud',
    lat: 47.4966, lng: 19.0505, points: 35, verify: 'ghost',
    ghost: 'literat',
    story: 'Um 1900 hatte Budapest über 500 Kaffeehäuser – Schriftsteller wohnten praktisch darin, Kellner liehen ihnen Geld und Papier („Hundeblatt" hieß das Gratis-Schreibpapier). Ganze Zeitungen wurden an Marmortischen wie diesen erfunden.',
    desc: 'Öffnet das Zeitfenster: Ein Kaffeehaus-Literat von 1900 erscheint mit Zeitung und Espresso. Geisterfoto: Setzt euch dazu, diskutiert stumm über Literatur.'
  }
];

/* ---------- Tipps (günstige Stufe vor dem Joker, −5 XP) ---------- */
const TASK_TIPS = {
  reagan:      'Er „läuft" auf der Promenade im Nordteil des Platzes, zwischen Sowjet-Obelisk und US-Botschaft. Stellt euch neben ihn, gleiche Schrittstellung, und diskutiert mit den Händen.',
  parliament:  'Serienbild-Modus + im Moment des Auslösens springen. Oder: auf einen Poller stützen und die Stütze hinter dem Körper verstecken.',
  jozsef:      'Er sitzt auf der Treppenstufe zur Donau, südlich vom Parlament am Ufer. Hut liegt links neben ihm.',
  princess:    'Sie sitzt auf dem Geländer direkt an der Tramlinie beim Vigadó. Ein Bein angewinkelt, Hände neben den Hüften.',
  policeman:   'Zrínyi utca, die Fußgängerstraße von der Basilika Richtung Donau – er steht nach ca. 100 m rechts.',
  eye:         'Selbstauslöser mit 10 s + Handy auf einen Mülleimer legen. Auf „drei" springen ALLE – Übung macht den Blitz-Bonus.',
  tram2:       'Fahrplan-Trick: Die Tram kommt ca. alle 10–12 min. Stellt euch schon mal in Position und wartet posierend.',
  panorama:    'Bestes Gegenlicht: direkt am Geländer, Kamera auf Burg-Beleuchtung belichten (auf die Burg tippen), dann rückt ihr ins Bild.',
  vaci:        'Die großen Modeketten-Fenster nahe Vörösmarty tér sind hell genug für scharfe Fotos.',
  neon:        'Casino- und Wechselstuben-Schilder leuchten am hellsten. Gesicht nah ans Schild, Kamera gegen das Licht.',
  turorudi:    'Sucht ein „ABC" oder „Non-Stop"-Schild. Túró Rudi liegt IMMER im Kühlregal, rote Punkte, bei den Joghurts.',
  paprika:     '„Erős Pista" spricht sich ungefähr „Ärrosch Pischta". Steht meist beim Senf/Ketchup-Regal.',
  forint:      'Grobe Eselsbrücke: 400 Forint ≈ 1 Euro. 2.500 HUF sind also etwas mehr als 6 Euro.',
  toast:       'Ihr müsst nicht einkehren – ein Kiosk-Getränk auf einer Donau-Bank zählt voll.',
  coffee:      'Nachts haben die Cafés an der Váci utca und rund um den Deák tér am längsten offen.',
  snack:       'Kürtőskalács-Stände am Vörösmarty tér haben oft bis Mitternacht offen. Notfall-Lösung: Pogácsa ausm Non-Stop.',
  cheers:      'Barpersonal ist der beste Lehrer – die freuen sich. „Ägg-esch-scheh-gedre" – das „scheh" lang ziehen.',
  spellbuda:   'B = einer steht, einer macht die zwei Bäuche. U = zwei Personen als Schalen. Teamwork!',
  statue:      'Rund um den Vörösmarty tér und die Promenade steht alle 50 m Bronze. Faltenwurf mit Jacke imitieren!',
  choir:       'An der Promenade zwischen Vigadó und Kettenbrücke hört euch niemand böse zu – nur die Burg.',
  columbo:     'Ganz am Nordende der Falk Miksa utca, Ecke Szent István körút (nahe Jászai Mari tér). Er steht mitten auf dem Gehweg – die Tram 4/6 hält gleich um die Ecke.',
  zerostone:   'Der Stein steht im Kreisverkehr-Park direkt am Budaer Brückenkopf, eine große „0" aus Stein.',
  gozsdu:      'Eingang Király utca 13 – die Passage zieht sich bis zur Dob utca durch.',
  ruinpub:     'Kazinczy utca 14. Kein Dresscode, kein Eintritt. Im Innenhof ist der berühmte Trabant.',
  'cp-vorosmarty': 'Der Platz mit dem großen weißen Marmordenkmal am nördlichen Ende der Váci utca.',
  'cp-szechenyi':  'Direkt am Pester Ende der Kettenbrücke, vor dem beleuchteten Jugendstil-Palast.',
  'cp-fovam':      'Immer die Váci utca Richtung Süden bis zum Ende durchlaufen – die Markthalle ist unübersehbar.',
  spy1:        'Der Bronze-Reagan „geht" auf der Promenade im Nordteil des Platzes – zwischen Sowjet-Obelisk und US-Botschaft.',
  spy3:        'Der Pester Löwe auf der Nordseite der Brücke hat den besten Schatten für konspirative Übergaben.',
  'egg-squirrel': 'Direkt bei der Columbo-Statue: Auf einem niedrigen Poller liegt das Eichhörnchen samt Kreide-Umriss – der Fall, den der Inspektor gerade löst. Wirklich winzig!',
  'egg-kermit':   'Am Geländer der kleinen Parkanlage, Südseite des Platzes. Auf Kniehöhe schauen!',
  'egg-rubik':    'Budaer Seite! Am Bem rakpart (zwischen Batthyány tér und Margaretenbrücke) die Treppe zum unteren Kai nehmen – der Würfel „tropft" aus einer Nische der Ufermauer, gegenüber vom Parlament.',
  'egg-peacock':  'Das große schmiedeeiserne Haupttor in der Mitte der Fassade – die Pfauen sind im Torbogen-Gitter versteckt.',
  'egg-radar':    'Geheimtipp: Auch an Hauswänden und Fenstersimsen sitzen Minis. Augen auf Bauch- und Kniehöhe!',
  'secret-oath':  'Wortlaut vergessen? „Wir schwören bei Sisi, beim Paprika und beim heiligen Túró Rudi: Wir kommen wieder!"',
  'ar-sisi':      'Stellt euch mit Blick zur Kettenbrücke – die Kaiserin erscheint in Richtung der Brücke.',
  'ar-szechenyi': 'Vor dem Gresham-Palast Richtung Brücke schauen – der Graf inspiziert sein Lebenswerk.',
  'ar-1956':      'Mit dem Rücken zum Parlament Richtung Platz schauen und langsam drehen.',
  'ar-tram':      'An den Gleisen Richtung Süden blicken – die Ur-Tram kommt aus Richtung Vigadó.',
  'ar-literat':   'Vor dem Gerbeaud Richtung Osten drehen – der Literat sitzt an seinem unsichtbaren Marmortisch.',
  'day-markthalle': 'Souvenir-Stände sind auf der Galerie im 1. Stock – die Rolltreppe hoch und einmal die Runde machen.',
  'day-bees':     'Stellt euch auf die gegenüberliegende Straßenseite der Hold utca und zoomt ans Dach – die Bienen sitzen an den geschwungenen Giebelkanten.',
  'day-parisi':   'Haupteingang am Ferenciek tere. Mitte der Passage, Kamera senkrecht nach oben, Weitwinkel an.',
  'day-foldalatti': 'Die Jahreszahl steht auf den historischen Emailschildern an den gelben Eingangshäuschen.',
  'day-rose':     'Der Laden liegt an der linken Seite des Basilika-Vorplatzes. Die Rose formt das Personal – ihr müsst nur nett gucken.',
  'day-shadow':   'Tiefe Nachmittagssonne macht die längsten Schatten. Elefant geht am leichtesten: ein Arm = Rüssel.',
  'video-spot':   'Hochformat, eine Person filmt und dreht sich langsam. Slogan-Klassiker: „Budapest – kein Eintritt, keine Gnade!"',
  'buda-bastion': 'Über die Kettenbrücke, dann die Treppen oder den Burgberg-Weg hoch – nachts sind die Bastei-Terrassen frei zugänglich.',
  'buda-matthias': 'Stellt euch ein Stück zurück auf den Platz und zoomt auf die höchste, schlanke Turmspitze – der Vogel glänzt golden.',
  'buda-turul':   'Vom Clark Ádám tér die große Treppe Richtung Palast – der Vogel thront auf dem Sockel an der Balustrade.',
  'buda-batthyany': 'M2 oder Tram 19/41 bis Batthyány tér – direkt am Ufer stehen, Parlament füllt das ganze Bild.',
  'buda-gellert': 'Das Denkmal mit der Säulen-Kolonnade seht ihr von der Elisabethbrücke aus am Hang. Zoom-Foto von unten zählt voll.',
  'pest-opera':   'Die Statuen sitzen in Nischen links und rechts vom Haupteingang, die Namen stehen unten am Sockel.',
  'pest-liszt':   'Der Platz geht von der Andrássy út ab, die Statue sitzt mittendrin zwischen den Café-Terrassen.',
  'pest-newyork': 'Tram 4/6 bis Wesselényi utca – das Café liegt im Boscolo-Palast, das Foyer ist frei zugänglich.',
  'pest-heroes':  'Nehmt die M1 ab Vörösmarty tér oder Oktogon – Endstation Hősök tere, die Säule ist unübersehbar.',
  'pest-karavan': 'Kazinczy utca 18, direkt neben dem Szimpla – die Lichterketten weisen den Weg.',
  'margit-fountain': 'Tram 4/6 bis Margitsziget (Haltestelle mitten auf der Brücke), dann 5 min zu Fuß auf die Südspitze.',
  'margit-ruins': 'Vom Musikbrunnen dem Hauptweg ~1,2 km nach Norden folgen – die Ruinen liegen rechts vom Weg, kurz vor dem Wasserturm.',
  'margit-watertower': 'Der Turm ragt über die Bäume – Richtung Inselmitte/Norden laufen, beim Freilichttheater steht er.',
  'margit-track': 'Die rote Gummibahn läuft direkt am Wasser entlang – Staffel-Übergabe klappt am besten auf einer Geraden.',
  'quiz-chainbridge': 'Die Tafeln sind in die Steinpfeiler am Pester Brückenkopf eingelassen – Handylampe hilft.',
  'quiz-danubius': 'Der Brunnen steht mittig auf dem Platz beim Riesenrad – einmal langsam drumherum gehen und zählen.'
};

/* ---------- Prüfkriterien für den Magischen Prüfmeister (KI-Fotoprüfung) ---------- */
const PHOTO_CHECKS = {
  reagan:      'Foto zeigt Personen neben der bronzenen, lebensgroßen Ronald-Reagan-Statue (gehender Mann in Anzug) – Nachtaufnahme auf einem Stadtplatz.',
  parliament:  'Foto zeigt einen Levitations-/Sprung-Trick: Eine Person scheint zu schweben, im Hintergrund das beleuchtete ungarische Parlament (neugotisch, Kuppel) oder dessen Umgebung bei Nacht.',
  jozsef:      'Foto zeigt Personen neben einer sitzenden Bronzestatue (Attila József) auf Stufen am Wasser.',
  princess:    'Foto zeigt eine Person, die auf einem Geländer sitzt und die Pose der kleinen Prinzessinnen-Statue (kleine Bronzefigur mit Zipfelkappe) nachahmt, idealerweise ist die Statue zu sehen.',
  policeman:   'Foto zeigt die dicke Polizisten-Bronzestatue mit rundem Bauch und/oder Personen, die ihre Pose mit improvisiertem Schnurrbart nachstellen.',
  eye:         'Foto zeigt Personen beim Springen (in der Luft), im Hintergrund ein beleuchtetes Riesenrad bei Nacht.',
  tram2:       'Foto zeigt eine Gruppe, im Hintergrund eine Straßenbahn (idealerweise gelb).',
  panorama:    'Nachtfoto: beleuchtete Burg/Palast und/oder Brücke über einem Fluss, davor Personen-Silhouetten.',
  vaci:        'Foto zeigt Personen, die Posen von Schaufensterpuppen vor/neben einem Schaufenster imitieren.',
  neon:        'Porträt einer Person, beleuchtet von einem Neon-/Leuchtschild bei Nacht.',
  turorudi:    'Foto zeigt Personen beim Probieren eines Snacks und/oder eine rot-gepunktete Túró-Rudi-Verpackung.',
  paprika:     'Foto zeigt ein Paprika-Produkt (z. B. Erős Pista Glas oder Paprikapulver) mit Personen, vermutlich in einem Laden.',
  forint:      'Foto zeigt eine Wechselkurs-Anzeigetafel einer Wechselstube (Währungscodes wie EUR/USD/HUF mit Zahlen).',
  toast:       'Foto zeigt Personen beim Anstoßen mit Getränken.',
  coffee:      'Foto zeigt Personen mit Heißgetränken/Bechern, Stadt bei Nacht.',
  snack:       'Foto zeigt das Teilen eines Snacks (z. B. Lángos, Baumstriezel, Gebäck) in einer Gruppe.',
  cheers:      'Foto zeigt die Gruppe mit einer weiteren (fremden) Person zusammen, Stimmung: Sprachunterricht/Prost-Situation.',
  spellbuda:   'Foto zeigt Personen, die mit ihren Körpern einen Buchstaben formen.',
  statue:      'Foto zeigt eine Statue UND eine Person, die deren Pose imitiert.',
  choir:       'Foto zeigt eine singende Gruppe (offene Münder) am Wasser bei Nacht.',
  columbo:     'Foto zeigt die Columbo-Bronzestatue (Mann im Trenchcoat, kleiner Hund) und Personen, die eine Krimi-Szene nachstellen.',
  zerostone:   'Foto zeigt das Kilometer-Null-Denkmal (große steinerne 0) mit Personen in Expeditions-Pose.',
  gozsdu:      'Foto zeigt eine Gruppe mit ernsten Gesichtern in einer belebten, beleuchteten Passage/Barmeile.',
  ruinpub:     'Foto aus dem Inneren einer Ruinenbar: schräge Deko, alte Möbel, Lichterketten o. ä.',
  'spy1':      'Foto zeigt Personen in konspirativer Pose (hochgeschlagene Kragen, Geheimgespräch) neben der gehenden Reagan-Bronzestatue.',
  'spy3':      'Foto zeigt eine Übergabe-Szene zwischen Personen, im Hintergrund/Umfeld eine steinerne Löwenstatue oder Brücke.',
  'egg-squirrel': 'Nahaufnahme einer winzigen Bronze-Miniatur: liegendes Eichhörnchen (ggf. mit Revolver) auf einem Poller.',
  'egg-kermit':   'Nahaufnahme einer winzigen grünen/bronzenen Frosch-Miniatur auf einem Geländer, ggf. mit Person, die den Gesichtsausdruck imitiert.',
  'egg-rubik':    'Nahaufnahme einer kleinen Bronze-Skulptur eines schmelzenden Zauberwürfels an/auf einer Steinmauer.',
  'egg-radar':    'Nahaufnahme irgendeiner Mini-Bronzefigur oder eines versteckten kleinen Kunstwerks im Stadtraum.',
  'secret-oath':  'Foto zeigt eine Gruppe am Flussgeländer bei Nacht, Hände auf dem Geländer, feierliche/alberne Schwur-Pose.',
  sisibridge:  'Foto zeigt Personen in vornehmer/kaiserlicher Pose, im Hintergrund eine weiße Hängebrücke bei Nacht.',
  parishchurch:'Foto zeigt Personen in Archäologen-Pose bei alten Steinen/Ruinen vor einer Kirche.',
  'buda-batthyany': 'Foto zeigt Personen, im Hintergrund das beleuchtete ungarische Parlament (neugotisch, Kuppel) über einem Fluss.',
  'buda-gellert': 'Foto zeigt eine segnende Pose mit erhobenem Arm, im Hintergrund ein Denkmal/Hang oder eine Brücke.',
  'pest-liszt': 'Foto zeigt Personen in dramatischer Dirigier-/Klavierpose neben einer sitzenden Bronzestatue.',
  'pest-newyork': 'Foto zeigt Personen in vornehmer Pose vor/in einem prunkvollen Gebäudeeingang oder Café-Interieur.',
  'pest-karavan': 'Foto zeigt Street-Food (Gericht) mit Personen, Umgebung: Foodtrucks/Lichterketten.',
  'margit-watertower': 'Foto zeigt Personen in gestaffelter Turm-Pose, im Hintergrund ein hoher historischer Wasserturm.',
  'margit-track': 'Foto/Szene zeigt rennende Personen oder Staffel-Übergabe auf einer Laufbahn im Grünen.',
  'day-markthalle': 'Foto zeigt ein kurioses Souvenir/Produkt in einer Markthalle (Stände, Paprika, Marktatmosphäre).',
  'day-parisi': 'Foto zeigt eine prunkvolle Glas-/Kuppeldecke einer historischen Passage von unten fotografiert.',
  'day-rose': 'Foto zeigt ein Eis in Rosenform (Eiskugel als Blütenblätter), ggf. mit Personen.',
  'day-shadow': 'Foto zeigt Schatten von Personen auf dem Boden, die zusammen eine Figur/ein Tier formen.'
};

/* Tipps + Prüfkriterien in die Aufgaben mergen */
TASKS.forEach(t => {
  if (TASK_TIPS[t.id]) t.tip = TASK_TIPS[t.id];
  if (PHOTO_CHECKS[t.id]) t.photoCheck = PHOTO_CHECKS[t.id];
});

/* Kategorie-Metadaten für UI */
const CATS = {
  history: { label: 'Geschichte', icon: '🏛️' },
  foto:    { label: 'Foto-Challenge', icon: '📸' },
  kiosk:   { label: 'Kiosk-Special', icon: '🛒' },
  pause:   { label: 'Pause', icon: '☕' },
  fun:     { label: 'Gruppen-Gaudi', icon: '🎭' },
  gps:     { label: 'GPS-Checkpoint', icon: '📍' },
  ar:      { label: 'Zeitfenster (AR)', icon: '👻' },
  egg:     { label: 'Easter Egg', icon: '🥚' }
};

/* ÖPNV-Haltestellen rund um Bezirk V (kuratiert) – für Weit-Weg-Quests.
   night: fährt nachts durch (Tram 4/6, Nachtbusse 9xx); Metro bis ca. 23:30. */
const TRANSIT_STOPS = [
  { name: 'Deák Ferenc tér',      lat: 47.4979, lng: 19.0546, lines: 'M1 · M2 · M3 · Nachtbus 914/950', night: true },
  { name: 'Vörösmarty tér',       lat: 47.4962, lng: 19.0510, lines: 'M1', night: false },
  { name: 'Vigadó tér',           lat: 47.4962, lng: 19.0484, lines: 'Tram 2', night: false },
  { name: 'Széchenyi István tér', lat: 47.4993, lng: 19.0464, lines: 'Tram 2 · Bus 16', night: false },
  { name: 'Kossuth Lajos tér',    lat: 47.5073, lng: 19.0455, lines: 'M2 · Tram 2', night: false },
  { name: 'Arany János utca',     lat: 47.5040, lng: 19.0521, lines: 'M3', night: false },
  { name: 'Bajcsy-Zsilinszky út', lat: 47.5007, lng: 19.0555, lines: 'M1 · Nachtbus 914/950', night: true },
  { name: 'Ferenciek tere',       lat: 47.4932, lng: 19.0537, lines: 'M3 · Bus 5/7 · Nachtbus 908/914', night: true },
  { name: 'Astoria',              lat: 47.4924, lng: 19.0598, lines: 'M2 · Tram 47/49 · Nachtbus 908/956', night: true },
  { name: 'Fővám tér',            lat: 47.4877, lng: 19.0589, lines: 'M4 · Tram 2/47/49', night: false },
  { name: 'Jászai Mari tér',      lat: 47.5133, lng: 19.0461, lines: 'Tram 4/6 (fährt die ganze Nacht!)', night: true },
  { name: 'Oktogon',              lat: 47.5052, lng: 19.0629, lines: 'M1 · Tram 4/6 (nachts!)', night: true },
  { name: 'Blaha Lujza tér',      lat: 47.4966, lng: 19.0703, lines: 'M2 · Tram 4/6 (nachts!) · Nachtbusse', night: true }
];

function nearestStop(pos, nightOnly = false) {
  const pool = nightOnly ? TRANSIT_STOPS.filter(s => s.night) : TRANSIT_STOPS;
  let best = null, bestD = Infinity;
  pool.forEach(s => {
    const d = distMeters(pos, s);
    if (d < bestD) { bestD = d; best = s; }
  });
  return best ? { ...best, dist: bestD } : null;
}

/* ---------- ☕ Cozy-Spots: kuratierte Cafés, Bars & Pubs entlang der Route.
   Handverlesen: gemütlich + in Bewertungen konstant ≥ 4,4★ (Google, ca.-Werte). */
const COZY_SPOTS = [
  { name: 'Espresso Embassy',   type: '☕ Café',        lat: 47.5010, lng: 19.0507, rating: 4.6, note: 'Backstein-Gewölbe, einer der besten Kaffees der Stadt' },
  { name: 'Madal Café',         type: '☕ Café',        lat: 47.5008, lng: 19.0489, rating: 4.5, note: 'ruhig, viel Holz, Specialty Coffee nahe der Basilika' },
  { name: 'Kontakt Coffee',     type: '☕ Café',        lat: 47.4998, lng: 19.0538, rating: 4.6, note: 'Puristen-Kaffee im versteckten Hinterhof' },
  { name: 'My Little Melbourne',type: '☕ Café',        lat: 47.4989, lng: 19.0561, rating: 4.4, note: 'winzig & herzlich, australischer Kaffeestil' },
  { name: 'Gerlóczy Café',      type: '☕ Café',        lat: 47.4938, lng: 19.0546, rating: 4.4, note: 'Pariser Flair und warmes Licht am Altstadtplatz' },
  { name: 'Csendes Vintage Bar',type: '🍷 Bar',         lat: 47.4920, lng: 19.0609, rating: 4.5, note: 'schummrige Wohnzimmer-Ruine voller Krimskrams' },
  { name: 'Mazel Tov',          type: '🍸 Bar',         lat: 47.4979, lng: 19.0642, rating: 4.5, note: 'Lichterketten-Innenhof, warm und lebendig' },
  { name: 'Doblo Wine Bar',     type: '🍷 Weinbar',     lat: 47.4990, lng: 19.0616, rating: 4.4, note: 'Kerzenlicht & ungarische Weine im Ziegelgewölbe' },
  { name: 'Léhűtő',             type: '🍺 Craft-Pub',   lat: 47.4986, lng: 19.0611, rating: 4.6, note: 'kleine Craft-Beer-Höhle, sehr herzlich' },
  { name: 'Kisüzem',            type: '🍺 Bar',         lat: 47.4997, lng: 19.0621, rating: 4.5, note: 'entspannte Künstlerkneipe im Jüdischen Viertel' },
  { name: 'Ruszwurm Cukrászda', type: '☕ Konditorei',  lat: 47.5014, lng: 19.0331, rating: 4.4, note: 'älteste Konditorei Budapests (1827), Burgviertel' },
  { name: 'Bambi Eszpresszó',   type: '☕ Retro-Café',  lat: 47.5100, lng: 19.0369, rating: 4.5, note: 'unverändertes 60er-Jahre-Retro auf der Buda-Seite' },
  { name: 'Fekete',             type: '☕ Café',        lat: 47.4913, lng: 19.0570, rating: 4.5, note: 'minimalistisch-gemütliches Innenhof-Café' }
];

function nearestCozy(pos, maxM = 400) {
  let best = null, bd = maxM;
  COZY_SPOTS.forEach(s => {
    const d = distMeters(pos, s);
    if (d < bd) { bd = d; best = { ...s, dist: d }; }
  });
  return best;
}

/* AR-Geister: Bilddatei + Blickrichtung (Kompass-Grad, in die man das Handy drehen soll) */
const GHOSTS = {
  sisi:        { img: 'assets/ar/sisi.svg',        name: 'Kaiserin Elisabeth „Sisi"', heading: 250 },
  szechenyi:   { img: 'assets/ar/szechenyi.svg',   name: 'Graf István Széchenyi',     heading: 270 },
  revolutionar:{ img: 'assets/ar/revolutionar.svg',name: 'Freiheitskämpfer 1956',     heading: 300 },
  tram:        { img: 'assets/ar/tram.svg',        name: 'Die Ur-Tram von 1887',      heading: 180 },
  literat:     { img: 'assets/ar/literat.svg',     name: 'Kaffeehaus-Literat, ca. 1900', heading: 90 }
};
