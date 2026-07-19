/* =========================================================
   BUDAPEST NACHT-RALLYE – Aufgaben-Datenbank
   Bezirk V (Belváros) + Ausflüge, alles kostenlos & nachts machbar.
   verify: 'photo' | 'quiz' | 'gps' | 'ghost'
   free:true  => ortsunabhängig (kein Marker, überall lösbar)
   minMin     => erst ab dieser Spieldauer (Minuten) im Deck
   complicated:true => Bonus-Flag, gibt Extra-Punkte-Badge
   ========================================================= */

const RALLY_CENTER = { lat: 47.4979, lng: 19.0546 }; // Deák Ferenc tér – Fallback-Start

const TASKS = [

  /* ---------- 🏛️ GESCHICHTE & INFOTAFELN ---------- */
  {
    id: 'shoes', cat: 'history', title: 'Schuhe am Donauufer',
    place: 'Donaupromenade, nördlich Richtung Parlament',
    lat: 47.5039, lng: 19.0446, points: 30, verify: 'quiz',
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
    lat: 47.4989, lng: 19.0455, points: 25, verify: 'quiz',
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
    lat: 47.5009, lng: 19.0540, points: 25, verify: 'quiz',
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
    lat: 47.5049, lng: 19.0503, points: 25, verify: 'quiz',
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
    place: 'Szabadság tér, Südseite',
    lat: 47.5041, lng: 19.0500, points: 20, verify: 'photo',
    desc: 'Ein US-Präsident spaziert seit 2011 in Lebensgröße über den Freiheitsplatz: Ronald Reagan, als Danke für sein Mitwirken am Ende des Kalten Kriegs. Foto-Beweis: Geht neben ihm her, als wärt ihr mitten im hochbrisanten Staatsgespräch. Mindestens eine Person gestikuliert wild.'
  },
  {
    id: 'bullets', cat: 'history', title: 'Kugeln in der Fassade',
    place: 'Landwirtschaftsministerium, Kossuth tér (Ostseite)',
    lat: 47.5068, lng: 19.0478, points: 30, verify: 'quiz',
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
    lat: 47.5076, lng: 19.0460, points: 40, verify: 'photo',
    desc: 'Das drittgrößte Parlamentsgebäude der Welt, nachts komplett in Gold. Eure Aufgabe: ein Levitationsfoto! Eine Person „schwebt" waagerecht in der Luft (Springen + perfektes Timing, oder kreativ aufstützen und Stützen verstecken). Die anderen drei schauen möglichst unbeeindruckt.'
  },
  {
    id: 'jozsef', cat: 'foto', title: 'Melancholie mit Attila',
    place: 'Attila-József-Statue, Donauseite am Parlament',
    lat: 47.5063, lng: 19.0450, points: 20, verify: 'photo',
    desc: 'Ungarns großer Dichter Attila József sitzt als Statue an der Donautreppe, Hut neben sich, Blick ins Wasser – wie in seinem Gedicht „An der Donau". Setzt euch alle zu ihm und schaut GENAUSO melancholisch. Wer lacht, schuldet eine Runde.'
  },
  {
    id: 'princess', cat: 'foto', title: 'Die kleine Prinzessin',
    place: 'Donaukorzó beim Vigadó',
    lat: 47.4954, lng: 19.0490, points: 25, verify: 'photo',
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
    lat: 47.4964, lng: 19.0502, points: 25, verify: 'quiz',
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
    lat: 47.4910, lng: 19.0500, points: 20, verify: 'photo',
    desc: 'Die schneeweiße Elisabethbrücke ist nach Kaiserin Elisabeth benannt – „Sisi", die die Ungarn bis heute verehren, weil sie Ungarisch lernte und Wien regelmäßig für Budapest sitzen ließ. Foto-Beweis: eure allervornehmste kaiserliche Pose, Brücke im Hintergrund. Kinn hoch!'
  },
  {
    id: 'parishchurch', cat: 'history', title: 'Das älteste Gebäude von Pest', minMin: 60,
    place: 'Innerstädtische Pfarrkirche, Március 15. tér',
    lat: 47.4919, lng: 19.0505, points: 20, verify: 'photo',
    desc: 'An der Elisabethbrücke steht die Innerstädtische Pfarrkirche – das älteste Gebäude von Pest, auf römischen Fundamenten. Davor liegen tatsächlich Ruinen des Römerkastells Contra-Aquincum offen herum. Foto: ihr vier als dramatische Ausgrabungs-Archäologen an den Römersteinen.'
  },

  /* ---------- 📸 FOTO-CHALLENGES ---------- */
  {
    id: 'eye', cat: 'foto', title: 'Abheben am Riesenrad',
    place: 'Budapest Eye, Erzsébet tér',
    lat: 47.4983, lng: 19.0525, points: 25, verify: 'photo',
    desc: 'Das beleuchtete Riesenrad dreht sich bis tief in die Nacht. Aufgabe: ALLE gleichzeitig in der Luft, Riesenrad im Hintergrund. Klingt einfach. Ist es mit vier Leuten und einem Auslöser nicht. Selbstauslöser + Geduld + ein Passant eurer Wahl sind erlaubt.'
  },
  {
    id: 'tram2', cat: 'foto', title: 'Tram-2-Photobomb',
    place: 'Vigadó tér, Haltestelle der Linie 2',
    lat: 47.4959, lng: 19.0488, points: 30, verify: 'photo',
    desc: 'Die Linie 2 am Donauufer gilt als eine der schönsten Straßenbahnstrecken der Welt. Fangt ein Gruppenfoto, während im Hintergrund eine Tram durchfährt. Gelbe Retro-Tram = Ehrenpunkte. Die letzte fährt gegen 23:30 – tickt die Uhr schon?'
  },
  {
    id: 'panorama', cat: 'foto', title: 'Postkarte mit Silhouetten',
    place: 'Donaukorzó',
    lat: 47.4950, lng: 19.0487, points: 25, verify: 'photo',
    desc: 'Von der Promenade seht ihr die beleuchtete Burg und die Brücken. Baut die perfekte Nacht-Postkarte: Burg UND eine Brücke im Bild, davor eure vier Silhouetten als Scherenschnitt (Gegenlicht, keine Blitze!). Ordentliche Posen – ihr werdet gedruckt.'
  },
  {
    id: 'vaci', cat: 'foto', title: 'Schaufensterpuppen der Váci utca',
    place: 'Váci utca',
    lat: 47.4945, lng: 19.0512, points: 15, verify: 'photo',
    desc: 'Die Váci utca ist nachts leer und die Schaufenster hell. Sucht das schrägste Schaufenster und imitiert als Gruppe exakt die Posen der Schaufensterpuppen davor. Einer fotografiert so, dass man Puppen UND Kopien sieht.'
  },
  {
    id: 'neon', cat: 'foto', title: 'Neon-Porträt', free: true,
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
    points: 25, verify: 'photo',
    desc: 'Stellt euch ans Donauufer und singt 30 Sekunden lang gemeinsam ein Lied eurer Wahl – laut genug, dass die Burg drüben es hören könnte. Beweisfoto: mitten im Refrain, Münder weit offen. Applaus von Fremden = Ehrenrunde.'
  },
  {
    id: 'columbo', cat: 'fun', title: 'Übrigens … noch eine Frage', minMin: 90,
    place: 'Columbo-Statue, Falk Miksa utca',
    lat: 47.5104, lng: 19.0474, points: 25, verify: 'photo',
    desc: 'Ja, wirklich: In Budapest steht eine Bronzestatue von Inspektor Columbo samt Hund (die Straße ist nach Miksa Falk benannt – und Peter Falk hieß nun mal Falk). Stellt die Szene nach: Einer ist Columbo in Trenchcoat-Pose, einer der ertappte Mörder, der Rest ist entsetzt. Der Hund spielt sich selbst.'
  },
  {
    id: 'zerostone', cat: 'fun', title: 'Expedition: Kilometer Null', minMin: 180, complicated: true,
    place: 'Clark Ádám tér, Budaer Seite der Kettenbrücke',
    lat: 47.4979, lng: 19.0399, points: 50, verify: 'photo',
    desc: 'Großes Finale für Ausdauernde: Überquert die Kettenbrücke ZU FUSS (nachts ein Gänsehaut-Moment). Drüben am Kreisverkehr steht der „0 km"-Stein – der Nullpunkt, von dem aus alle ungarischen Fernstraßen gemessen werden. Beweisfoto: ihr vier als dramatische Polar-Expedition, die endlich den Nullpunkt erreicht.'
  },
  {
    id: 'gozsdu', cat: 'foto', title: 'Ausflug: Gozsdu-Passage', minMin: 150,
    place: 'Gozsdu Udvar, Bezirk VII',
    lat: 47.4987, lng: 19.0587, points: 20, verify: 'photo',
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
    place: 'Szimpla Kert, Kazinczy utca',
    lat: 47.4972, lng: 19.0631, points: 25, verify: 'photo',
    desc: 'Die Mutter aller Ruinenbars – kein Eintritt, einfach reingehen und staunen: ein verfallenes Haus voller Trabant-Hälften, Badewannen-Sofas und Glühbirnen-Wäldern. Ein Getränk, dann Beweisfoto im absurdesten Winkel, den ihr findet.'
  },

  /* ---------- 🕵️ AGENTENMISSION (Ketten-Aufgaben) ---------- */
  {
    id: 'spy1', cat: 'fun', title: 'Agentenmission 1/3: Das Briefing',
    chain: 'spy', step: 1,
    place: 'Szabadság tér, beim spazierenden Präsidenten',
    lat: 47.5041, lng: 19.0500, points: 20, verify: 'photo',
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
    lat: 47.4989, lng: 19.0455, points: 45, verify: 'photo',
    desc: 'Finale der Mission: die Übergabe. Unterm steinernen Löwen wechselt ein unauffälliges Päckchen (Snack, Zettel, was auch immer) den Besitzer. Beweisfoto: der Übergabemoment – zwei tauschen das Päckchen mit todernster Miene, die anderen sichern in VERSCHIEDENE Richtungen wie sehr, sehr schlechte Spione. Zeitungsloch zum Durchgucken gibt Stilpunkte.'
  },

  /* ---------- 🥚 EASTER EGGS: Die Mini-Statuen & Co. ---------- */
  {
    id: 'egg-squirrel', cat: 'egg', title: 'Kolodko-Mini: Das tote Eichhörnchen',
    place: 'Szabadság tér, Nähe US-Botschaft (niedrig suchen!)',
    lat: 47.5048, lng: 19.0508, points: 35, verify: 'photo',
    desc: 'Der Guerilla-Bildhauer Mihály Kolodko versteckt seit Jahren winzige Bronze-Figuren in der Stadt – ohne Genehmigung, über Nacht montiert. Auf dem Freiheitsplatz liegt sein berüchtigtstes Werk: ein totes Eichhörnchen mit Revolver (eine Anspielung auf einen absurden US-Diplomaten-Witz). Es ist ~10 cm klein und sitzt auf einem Poller – Handylampe an, tief bücken, suchen! Beweisfoto: das Eichhörnchen in Großaufnahme.'
  },
  {
    id: 'egg-kermit', cat: 'egg', title: 'Kolodko-Mini: Der Frosch',
    place: 'Szabadság tér, am Geländer Richtung Park',
    lat: 47.5040, lng: 19.0506, points: 35, verify: 'photo',
    desc: 'Noch ein Kolodko: Ein sehr bekannter grüner Frosch (ihr kennt ihn aus dem Fernsehen) sitzt in Miniatur auf einem Geländer am Freiheitsplatz und schaut melancholisch ins Grüne. Findet ihn und macht ein Foto, auf dem einer von euch GENAU seinen Gesichtsausdruck imitiert.'
  },
  {
    id: 'egg-rubik', cat: 'egg', title: 'Kolodko-Mini: Der schmelzende Würfel', minMin: 60,
    place: 'Unteres Donauufer bei der Akademie der Wissenschaften',
    lat: 47.5008, lng: 19.0450, points: 35, verify: 'photo',
    desc: 'Der Zauberwürfel ist eine ungarische Erfindung (Ernő Rubik, 1974!) – und Kolodko hat ihm ein Denkmal gesetzt: ein kleiner Würfel, der wie Dalís Uhren über die Kaimauer am unteren Donauufer schmilzt. Runter zur Wasserkante (Treppen bei der Akademie), Mauer absuchen. Beweisfoto: der Würfel + im Hintergrund die beleuchtete Kettenbrücke. Vorsicht an der Kante!'
  },
  {
    id: 'egg-peacock', cat: 'egg', title: 'Die Pfauen im Tor', minMin: 60,
    place: 'Gresham-Palast, Széchenyi tér',
    lat: 47.4993, lng: 19.0477, points: 25, verify: 'quiz',
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
    place: 'Vörösmarty tér', lat: 47.4964, lng: 19.0504, points: 15, verify: 'gps',
    desc: 'Erreicht den Platz des Nationaldichters Mihály Vörösmarty. Sein weißes Marmordenkmal ist im Winter eingehaust, er selbst angeblich empfindlich gegen Kälte. Check-in per GPS, sobald ihr auf dem Platz steht.'
  },
  {
    id: 'cp-szechenyi', cat: 'gps', title: 'Checkpoint: Széchenyi tér',
    place: 'Széchenyi István tér', lat: 47.4990, lng: 19.0470, points: 15, verify: 'gps',
    desc: 'Der Platz zwischen Kettenbrücke und dem Jugendstil-Märchenpalast Gresham (heute Luxushotel – Blick durch die Glastür ist gratis). Check-in per GPS.'
  },
  {
    id: 'cp-fovam', cat: 'gps', title: 'Checkpoint: Große Markthalle', minMin: 120,
    place: 'Fővám tér', lat: 47.4870, lng: 19.0587, points: 20, verify: 'gps',
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
    lat: 47.4993, lng: 19.0477, points: 35, verify: 'ghost',
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
    lat: 47.4959, lng: 19.0490, points: 35, verify: 'ghost',
    ghost: 'tram',
    story: 'Budapest war Straßenbahn-Pionier: Schon 1887 ratterte hier eine der ersten elektrischen Straßenbahnen Europas, und 1896 eröffnete auf der anderen Seite die erste U-Bahn Kontinentaleuropas. Die heutige Linie 2 am Ufer fährt eine der schönsten Strecken der Welt.',
    desc: 'Öffnet das Zeitfenster: Die Ur-Tram von 1887 rollt noch einmal über den Korzó. Geisterfoto – aber bitte nicht auf den echten Gleisen stehen bleiben.'
  },
  {
    id: 'ar-literat', cat: 'ar', title: 'Zeitfenster: Das Kaffeehaus um 1900',
    place: 'Vörösmarty tér, vor dem Gerbeaud',
    lat: 47.4963, lng: 19.0506, points: 35, verify: 'ghost',
    ghost: 'literat',
    story: 'Um 1900 hatte Budapest über 500 Kaffeehäuser – Schriftsteller wohnten praktisch darin, Kellner liehen ihnen Geld und Papier („Hundeblatt" hieß das Gratis-Schreibpapier). Ganze Zeitungen wurden an Marmortischen wie diesen erfunden.',
    desc: 'Öffnet das Zeitfenster: Ein Kaffeehaus-Literat von 1900 erscheint mit Zeitung und Espresso. Geisterfoto: Setzt euch dazu, diskutiert stumm über Literatur.'
  }
];

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

/* AR-Geister: Bilddatei + Blickrichtung (Kompass-Grad, in die man das Handy drehen soll) */
const GHOSTS = {
  sisi:        { img: 'assets/ar/sisi.svg',        name: 'Kaiserin Elisabeth „Sisi"', heading: 250 },
  szechenyi:   { img: 'assets/ar/szechenyi.svg',   name: 'Graf István Széchenyi',     heading: 270 },
  revolutionar:{ img: 'assets/ar/revolutionar.svg',name: 'Freiheitskämpfer 1956',     heading: 300 },
  tram:        { img: 'assets/ar/tram.svg',        name: 'Die Ur-Tram von 1887',      heading: 180 },
  literat:     { img: 'assets/ar/literat.svg',     name: 'Kaffeehaus-Literat, ca. 1900', heading: 90 }
};
