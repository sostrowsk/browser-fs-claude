# FS-PRD: SkyLine – Browser Flight Simulator

**Product Requirements Document (As-Built, v1.0)**

| | |
|---|---|
| **Produktname** | SkyLine |
| **Typ** | Browser-basierter Flugsimulator (Singleplayer) |
| **Technologie** | HTML5, WebGL 2.0, Three.js, Vanilla JavaScript (ES Modules), Vite |
| **Zielplattform** | Moderne Desktop-Browser (Chrome, Firefox, Edge, Safari), Tablets (Touch) |
| **Status** | MVP v1.0 implementiert |
| **Repository** | `browser-fs-claude`, Branch `claude/flight-simulator-prd-bqVFO` |

---

## 1. Vision

SkyLine ist ein leichtgewichtiger, aber immersiver Flugsimulator, der direkt im Browser ohne Installation spielbar ist. Der Fokus liegt auf zugänglichem Gameplay mit glaubwürdiger Flugphysik, prozedural generierter offener Spielwelt und einem Missions-/Challenge-System.

---

## 2. Zielgruppe

| Segment | Beschreibung |
|---|---|
| **Casual Gamer** | Spieler, die ohne Installation schnell ein Flugerlebnis suchen |
| **Luftfahrt-Enthusiasten** | Hobbyisten, die grundlegende Flugmechaniken erleben wollen |
| **Bildungsbereich** | Schulen/Unis, die Physik und Aerodynamik veranschaulichen möchten |
| **Tablet-Nutzer** | Spielen ohne Softwareinstallation via Touch-Steuerung |

---

## 3. Implementierte Features (MVP v1.0)

### 3.1 Flugphysik-Engine ✅

Implementiert in `src/engine/PhysicsEngine.js`:

- **Aerodynamisches Modell:** Auftrieb (Cl über Anstellwinkel), induzierter + parasitärer Widerstand, Schub, Gewicht
- **Steuerungsflächen:** Querruder (Roll), Höhenruder (Pitch), Seitenruder (Yaw) mit geschwindigkeitsabhängiger Ruderwirksamkeit
- **Motormanagement:** Schubkontrolle mit Spool-Up/Spool-Down-Kurven pro Flugzeugtyp
- **Stall-Simulation:** Überziehwarnung (3° vor Stall), Strömungsabriss mit Auftriebsverlust, Nase-runter-Tendenz und zufälligem Rollen
- **Klappen & Fahrwerk:** 4 Klappenstufen (0/10/20/40°) mit Auftriebs-/Widerstandseffekt, einziehbares Fahrwerk (737, F-16)
- **Wind & Turbulenz:** Wetterabhängige Windkomponenten mit variablen Böen
- **Bodenphysik:** Bodenkontakt, Rollreibung, Bremsen, Detektion harter Landungen
- **Atmosphärenmodell:** Höhenabhängige Luftdichte (vereinfachte ISA)
- **Stabilität:** Sub-Stepping (4 Schritte/Frame), dt-Clamping

**Koordinatenkonvention:** Modell zeigt bei `yaw=0` in +X-Richtung; forward = `(cos yaw, 0, sin yaw)`. *(Korrigiert in cd34e09 – Sin/Cos-Vertauschung führte zu Seitwärtsflug.)*

### 3.2 Flugzeuge ✅

3 Flugzeugtypen mit individuellen Parametern (`src/aircraft/AircraftDefinitions.js`) und prozeduralen 3D-Modellen (`src/aircraft/AircraftModels.js`):

| Flugzeug | Kategorie | Eigenschaften | Schwierigkeit |
|---|---|---|---|
| **Cessna 172** | Einmotorig / Propeller | Anfängerfreundlich, animierter Propeller, festes Fahrwerk | ★☆☆ |
| **Boeing 737-800** | Verkehrsflugzeug | Träge Steuerung, hohe Masse (65 t), Triebwerksgondeln | ★★☆ |
| **F-16 Fighting Falcon** | Kampfjet | Agil, hoher Anstellwinkel (25°), Nachbrenner-Glow ab 80 % Schub | ★★★ |

Parameter pro Flugzeug: Masse, Flügelfläche/-spannweite, Auftriebskennlinie, Stall-Winkel, max. Schub, Ruderwirksamkeit, Trägheitsmomente, Anzeige-Specs (Max-/Reisegeschwindigkeit, Stall-Speed, Dienstgipfelhöhe, Steigrate, Reichweite).

### 3.3 Spielwelt / Terrain ✅

Implementiert in `src/world/Terrain.js` (Simplex-Noise in `src/utils/Noise.js`):

- **Prozedurales Terrain:** Multi-Oktaven-FBM + Ridged Noise (Berge, Täler, Hügel, Küstenlinie)
- **Chunk-Streaming:** 500 m-Chunks (64×64 Segmente), Sichtweite 5 Chunks, automatisches Laden/Entladen um die Flugzeugposition
- **Höhenbasierte Einfärbung:** Strand → Gras → Wald → Fels → Schnee, hangabhängig (Vertex Colors)
- **Wasser:** Transparente Meeresfläche auf Seehöhe
- **2 Flughäfen:**
  - Flughafen 1 am Ursprung (2000 m Piste, Heading 0°)
  - Flughafen 2 bei (15 km, 10 km) (2500 m Piste, Heading 90°)
  - Mittellinien-Markierungen, Schwellenmarkierungen, Randbefeuerung (grün/weiß/rot), PAPI-Lichter
  - Terrain wird im Flughafenumkreis (2 km) automatisch eingeebnet

### 3.4 Himmel, Tag/Nacht & Wetter ✅

`src/world/Sky.js` und `src/world/Weather.js`:

- **Tag-/Nacht-Zyklus:** Shader-basierte Himmelskuppel (Tag/Sonnenuntergang/Nacht-Blending), Sonne, Mond, 2000 Sterne, dynamische Licht-Intensität und -Farbe
- **Wetter-System:** 4 Typen mit visuellen und physikalischen Effekten:

| Wetter | Wind | Sicht | Effekte |
|---|---|---|---|
| Klar | 2–7 m/s | 100 % | – |
| Bewölkt | 5–15 m/s | 80 % | Dichtere Wolken |
| Regen | 8–23 m/s | 50 % | 5000 Regenpartikel mit Winddrift |
| Nebel | 1–4 m/s | 15 % | Exponentieller Nebel |

- **Wolken:** 40 prozedurale Wolkencluster, winddriftend, um den Spieler wrappend

### 3.5 Cockpit-Instrumente & HUD ✅

`src/ui/HUD.js` – Canvas-gerenderte Analoginstrumente:

- **Künstlicher Horizont:** Pitch-Leiter, Roll-Skala mit Bank-Zeiger, Flugzeugreferenz
- **Kompass:** Rotierende Rose (N/E/S/W), digitale Heading-Anzeige
- **Höhenmesser:** Zwei Zeiger (100er/1000er ft), digitale Anzeige
- **Variometer (VSI):** ±2000 fpm Skala, farbcodiert (steigen blau, sinken rot)
- **HUD-Overlay:** Geschwindigkeit (kt), Heading, Höhe (ft), Vertikalgeschwindigkeit, Schubbalken, Fahrwerk-/Klappenstatus
- **Warnsystem:** STALL (Vollbild), STALL WARNING, PULL UP, GEAR, OVERSPEED

### 3.6 Kameras ✅

`src/cameras/CameraManager.js` – 4 Modi, umschaltbar mit **C**:

1. **Cockpit** (Standard) – flugzeugspezifischer Augpunkt
2. **Verfolgung** – geglättete Chase-Cam, Abstand per Mausrad
3. **Freie Kamera (Orbit)** – Auto-Orbit, Rechtsklick-Drag + Mausrad
4. **Flyby** – Kamera positioniert sich vor der Flugbahn

### 3.7 Steuerung ✅

`src/engine/InputManager.js` – Priorität: Gamepad > Touch > Maus > Tastatur:

| Eingabe | Belegung |
|---|---|
| **Tastatur** | W/S bzw. ↑/↓ Pitch · A/D bzw. ←/→ Roll · Q/E Yaw · Shift/Ctrl Schub +/− · G Fahrwerk · F Klappen · B Bremsen · C Kamera · P/Esc Pause |
| **Maus** | Optionale Pitch/Roll-Steuerung (in Einstellungen aktivierbar) |
| **Gamepad** | Gamepad API: linker Stick Pitch/Roll, rechter Stick Yaw, Trigger Schub, Deadzone-Filterung |
| **Touch** | Virtueller Joystick (links) + Schubregler (rechts), Multi-Touch |

Einstellbar: Sensitivität (0.1–2.0), Pitch-Invertierung.

### 3.8 Spielmodi & Missionen ✅

`src/missions/MissionManager.js` – 5 Missionen + Freier Flug:

| Mission | Typ | Beschreibung | Limit |
|---|---|---|---|
| Navigationstraining | Navigation | 5 Wegpunkte in Reihenfolge (Ring-Gates) | 300 s |
| Präzisionslandung | Landung | Landung auf Zielflughafen, Score nach Sinkrate + Position | 180 s |
| Tiefflug-Slalom | Slalom | 8 Checkpoints, enge Radien (100 m) | 120 s |
| Notlandung | Emergency | Triebwerksausfall nach 10 s, Gleitflug zur Piste | – |
| Geschwindigkeitsrekord | Speed | Fliegender Start (80 m/s), Checkpoints auf Zeit | – |

- **Scoring:** 0–100 Punkte, Zeitbonus, Noten S/A/B/C/D
- **Missions-HUD:** Ziel, Timer (m:ss.cc), Live-Score
- **Checkpoint-Visualisierung:** Torus-Gates (aktiv grün, ausstehend orange, passiert grau)

### 3.9 Audio ✅

`src/engine/AudioEngine.js` – Web Audio API, vollständig synthetisiert (keine Asset-Dateien):

- **Motorsound:** Sawtooth + Square-Harmonische, Frequenz/Lautstärke/Filter an Drehzahl gekoppelt
- **Wind:** Bandpass-gefiltertes Rauschen, proportional zur Geschwindigkeit
- **Cockpit:** Stall-Warnton (600 Hz Square), Fahrwerks-Sound, Klick-Sounds
- **4 Lautstärkekanäle:** Master, Motor, Wind, Cockpit
- Autoplay-Policy-konform (Init bei erster Nutzerinteraktion)

### 3.10 UI & Einstellungen ✅

`src/ui/Menu.js`:

- **Hauptmenü:** Freier Flug, Missionen, Challenges, Einstellungen, Sprachwahl
- **Flugzeugauswahl:** Karten mit Schwierigkeitssternen + 8 Spezifikationen
- **Einstellungen (4 Tabs):**
  - *Grafik:* Qualität (Niedrig/Mittel/Hoch), Sichtweite
  - *Steuerung:* Sensitivität, Pitch-Invertierung, Maussteuerung
  - *Audio:* 4 Lautstärkeregler
  - *Gameplay:* Schwierigkeit (Arcade/Realistisch), Einheiten (Imperial/Metrisch), Wetter
- **Persistenz:** LocalStorage (`skyline-settings`)
- **Pausenmenü:** Fortsetzen / Neustart / Hauptmenü
- **Missionsabschluss:** Note, Punktzahl, Zeit, Retry

### 3.11 Lokalisierung ✅

`src/i18n/translations.js` – vollständig Deutsch + Englisch, `data-i18n`-Attribute, Live-Umschaltung im Hauptmenü, erweiterbare Architektur.

---

## 4. Technische Architektur (As-Built)

```
index.html                  UI-Markup (Menüs, HUD, Panels)
src/
├── main.js                 Game-Klasse: Init, Game Loop, Systemverdrahtung
├── styles.css              Komplettes UI-Styling
├── engine/
│   ├── PhysicsEngine.js    Flugphysik (Kräfte, Momente, Bodenkontakt)
│   ├── InputManager.js     Tastatur / Maus / Gamepad / Touch
│   └── AudioEngine.js      Web-Audio-Synthese
├── aircraft/
│   ├── AircraftDefinitions.js   Physik-Parameter + Specs (3 Flugzeuge)
│   └── AircraftModels.js        Prozedurale Three.js-Modelle
├── world/
│   ├── Terrain.js          Chunk-Streaming, Flughäfen, Wasser
│   ├── Sky.js              Himmels-Shader, Tag/Nacht, Sterne
│   └── Weather.js          Wolken, Regen, Wind, Nebel
├── cameras/
│   └── CameraManager.js    4 Kameramodi
├── ui/
│   ├── HUD.js              HUD + Canvas-Instrumente
│   └── Menu.js             Menüs, Einstellungen, Persistenz
├── missions/
│   └── MissionManager.js   5 Missionen, Checkpoints, Scoring
├── i18n/
│   └── translations.js     DE/EN
└── utils/
    └── Noise.js            Simplex Noise, FBM, Ridged Noise
```

- **Game Loop:** `requestAnimationFrame`, Physik mit Sub-Stepping
- **Rendering:** Three.js WebGL, ACES-Tone-Mapping, sRGB, Pixel-Ratio-Cap 2
- **Build:** Vite, Bundle ~149 KB gzipped (Ziel < 5 MB ✅)
- **Kein Backend:** vollständig clientseitig, statisches Hosting genügt

### Build & Start

```bash
npm install
npm run dev      # Entwicklungsserver (öffnet Browser)
npm run build    # Produktions-Build nach dist/
```

---

## 5. Abweichungen vom ursprünglichen PRD

| PRD-Anforderung | Status | Anmerkung |
|---|---|---|
| Urbane Gebiete mit Gebäuden | ⏳ Offen | Terrain ohne Gebäude im MVP |
| Taxiways | ⏳ Offen | Nur Runways mit Markierung/Befeuerung |
| Geschwindigkeitsanzeige als Analoginstrument | Teilweise | Im HUD digital; 4 Analoginstrumente vorhanden |
| Freies Key-Rebinding | ⏳ Offen | Sensitivität + Invertierung vorhanden, Rebinding nicht |
| Leaderboard (Online) | ⏳ Offen | Lokales Scoring vorhanden; Backend nicht im MVP |
| Metrische Einheiten im HUD | Teilweise | Einstellung vorhanden, HUD zeigt aktuell Imperial |
| Schatten | Bewusst deaktiviert | Performance-Entscheidung |
| Ultra-Grafikstufe | Reduziert | 3 Stufen (Niedrig/Mittel/Hoch) |

---

## 6. Bekannte Einschränkungen

- Kollisionserkennung nur gegen Terrain (keine Gebäude/Objekte)
- Crash führt zu Geschwindigkeitsverlust statt Spielende (außer in Landemissionen)
- Touch-Steuerung primär für Tablets ausgelegt, Smartphones ungetestet
- Challenges nutzen derzeit die Missionsliste (kein separates Leaderboard)

---

## 7. Roadmap

### Phase 2 – Erweiterung (v1.5)
- Weitere Flugzeuge (Helikopter, Ultraleicht)
- Gebäude/Städte, Taxiways, weitere Flughäfen
- Multiplayer (gemeinsamer Luftraum via WebRTC/WebSocket)
- ATC-System mit einfacher KI
- Erweiterte Wetter-Simulation (Gewitter, Vereisung)
- Replay-System, Online-Leaderboard
- Vollständiges Key-Rebinding, metrisches HUD

### Phase 3 – Community (v2.0)
- Modding-Support (eigene Flugzeuge via glTF)
- Missionseditor
- VR-Unterstützung (WebXR)
- Realistischere Avionik (FMS, Autopilot)

---

## 8. Erfolgskriterien (KPIs)

| KPI | Zielwert | Status MVP |
|---|---|---|
| Framerate | 60 FPS Mid-Range | Erreichbar (LOD-Streaming, keine Schatten) |
| Initiale Ladezeit | < 10 s | ✅ (~149 KB gzipped) |
| Bundle-Größe | < 5 MB | ✅ |
| Monatlich aktive Spieler | > 10.000 (6 Monate) | Nach Launch messbar |
| Retention Day 7 | > 25 % | Nach Launch messbar |

---

## 9. Changelog

| Commit | Beschreibung |
|---|---|
| `9356e16` | PRD erstellt |
| `c62ce91` | MVP v1.0 vollständig implementiert (21 Dateien, ~6300 LOC) |
| `cd34e09` | Physik-Fix: Sin/Cos-Vertauschung in Frame-Transformation (Flugzeug bewegte sich seitwärts) |
