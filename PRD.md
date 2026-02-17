# Product Requirements Document: SkyLine – Browser Flight Simulator

## 1. Überblick

**Produktname:** SkyLine
**Typ:** Browser-basierter Flugsimulator (Singleplayer)
**Technologie:** HTML5, WebGL (Three.js / Babylon.js), JavaScript/TypeScript
**Zielplattform:** Moderne Desktop-Browser (Chrome, Firefox, Edge, Safari)
**Version:** 1.0 MVP

### Vision

SkyLine ist ein leichtgewichtiger, aber immersiver Flugsimulator, der direkt im Browser ohne Installation spielbar ist. Der Fokus liegt auf zugänglichem Gameplay mit realistischer Flugphysik-Simulation, beeindruckender 3D-Grafik und einer offenen Spielwelt, die zum Erkunden einlädt.

---

## 2. Zielgruppe

| Segment | Beschreibung |
|---|---|
| **Casual Gamer** | Spieler, die ohne Installation schnell ein Flugerlebnis suchen |
| **Luftfahrt-Enthusiasten** | Hobbyisten, die grundlegende Flugmechaniken erleben wollen |
| **Bildungsbereich** | Schulen/Unis, die Physik und Aerodynamik veranschaulichen möchten |
| **Mobile Professionals** | Nutzer, die auf verschiedenen Geräten ohne Softwareinstallation spielen wollen |

---

## 3. Kernfeatures (MVP – v1.0)

### 3.1 Flugphysik-Engine

- **Aerodynamisches Modell:** Vereinfachte, aber glaubwürdige Simulation von Auftrieb, Widerstand, Schub und Gewicht
- **Steuerungsflächen:** Querruder (Roll), Höhenruder (Pitch), Seitenruder (Yaw)
- **Motormanagement:** Schubkontrolle mit realistischer Beschleunigungs-/Verzögerungskurve
- **Stall-Simulation:** Überzugwarnung und realistisches Strömungsabriss-Verhalten
- **Wind & Turbulenz:** Grundlegende Windeffekte mit variablen Böen
- **Kollisionserkennung:** Boden, Gebäude und Terrain

### 3.2 Flugzeuge

Zum MVP-Launch mindestens **3 Flugzeugtypen:**

| Flugzeug | Kategorie | Eigenschaften |
|---|---|---|
| **Cessna 172** | Einmotorig / Propeller | Anfängerfreundlich, stabile Flugeigenschaften |
| **Boeing 737** | Verkehrsflugzeug | Mittlerer Schwierigkeitsgrad, Düsentriebwerk |
| **F-16 Fighting Falcon** | Kampfjet | Hohe Geschwindigkeit, agiles Handling |

Jedes Flugzeug hat individuelle Parameter: Gewicht, Flügelspannweite, max. Geschwindigkeit, Stall-Speed, Steigrate und Triebwerksleistung.

### 3.3 Spielwelt / Terrain

- **Prozedural generiertes Terrain** auf Basis realer Höhendaten (Heightmaps)
- **Mindestens 1 Kartenregion** (ca. 50×50 km) mit abwechslungsreichem Terrain:
  - Berge, Täler, Küstenlinien, Seen
  - Urbane Gebiete mit vereinfachten Gebäudestrukturen
- **2 Flughäfen** mit Start- und Landebahnen, Taxiways und Markierungen
- **Tag-/Nacht-Zyklus** mit dynamischer Beleuchtung
- **Wetter-System:** Klar, bewölkt, Regen, Nebel (visuell + physikalischer Effekt)

### 3.4 Cockpit & HUD

- **3D-Cockpit-Ansicht** (First-Person) mit funktionalen Instrumenten:
  - Künstlicher Horizont (Attitude Indicator)
  - Höhenmesser (Altimeter)
  - Geschwindigkeitsanzeige (Airspeed Indicator)
  - Variometer (Vertical Speed Indicator)
  - Kompass / Heading Indicator
  - Drehzahlmesser (RPM/N1)
- **HUD-Overlay:** Minimalistische Anzeige für Geschwindigkeit, Höhe, Heading
- **Freie Kameraansichten:**
  - Cockpit (Standard)
  - Externe Verfolgungskamera
  - Freie Kamera (Orbit)
  - Flyby-Kamera

### 3.5 Steuerung

| Eingabemethode | Mapping |
|---|---|
| **Tastatur** | WASD/Pfeiltasten für Pitch/Roll, Q/E Yaw, Shift/Ctrl Schub |
| **Maus** | Optionale Maussteuerung für Pitch/Roll |
| **Gamepad** | Volle Gamepad-Unterstützung via Gamepad API |
| **Touch** | Virtuelle Joystick-Overlays für Tablet-Nutzung |

- Steuerungsbelegung frei konfigurierbar
- Sensitivitätseinstellungen pro Achse

### 3.6 Spielmodi

1. **Freier Flug:** Offenes Erkunden der Spielwelt ohne Ziel
2. **Missionen:**
   - Punkt-zu-Punkt-Navigation (VOR/GPS Waypoints)
   - Präzisionslandungen (Punktesystem basierend auf Aufsetzkraft und Position)
   - Tiefflug-Slalom durch Checkpoints
   - Notlandungs-Szenarien (Triebwerksausfall, schlechtes Wetter)
3. **Challenges:** Zeitbasierte Herausforderungen mit Leaderboard

---

## 4. Technische Architektur

### 4.1 Frontend-Stack

```
┌─────────────────────────────────────────┐
│              Browser (Client)            │
├─────────────────────────────────────────┤
│  UI Layer          │  Rendering Engine   │
│  - HTML/CSS        │  - Three.js/Babylon │
│  - UI Framework    │  - WebGL 2.0        │
│  (Svelte/React)    │  - Shader Pipeline  │
├─────────────────────────────────────────┤
│  Game Engine Core                        │
│  - Game Loop (requestAnimationFrame)     │
│  - Physics Engine (custom/cannon-es)     │
│  - Input Manager (Keyboard/Gamepad/Touch)│
│  - Audio Engine (Web Audio API)          │
│  - Asset Loader & Streaming              │
├─────────────────────────────────────────┤
│  State Management                        │
│  - Aircraft State    - World State       │
│  - Weather System    - Mission State     │
└─────────────────────────────────────────┘
```

### 4.2 Rendering-Pipeline

- **WebGL 2.0** für fortgeschrittene Effekte
- **Level-of-Detail (LOD):** Dynamische Detailstufen für Terrain und Objekte
- **Terrain-Streaming:** Chunked Loading basierend auf Flugzeugposition
- **Atmosphärisches Rendering:** Himmel, Wolken, Nebel, Lichtstreuung
- **Post-Processing:** Bloom, Motion Blur (optional), Tone Mapping

### 4.3 Performance-Ziele

| Metrik | Zielwert |
|---|---|
| Framerate | 60 FPS auf Mid-Range-Hardware |
| Initiale Ladezeit | < 10 Sekunden |
| RAM-Verbrauch | < 512 MB |
| GPU-VRAM | < 1 GB |
| Bundle-Größe (initial) | < 5 MB (komprimiert) |
| Terrain-Streaming | Nahtlos ohne sichtbares Pop-in |

### 4.4 Backend (optional für Leaderboards)

- Leichtgewichtiger REST/WebSocket-Service für Highscores
- Authentifizierung via OAuth (Google, GitHub) oder anonym
- Kein Backend für Kern-Gameplay erforderlich (vollständig clientseitig)

---

## 5. Audio

- **Motor-/Triebwerkssound:** Dynamisch basierend auf Drehzahl und Schub (Web Audio API mit parametrischer Synthese)
- **Windgeräusche:** Proportional zur Geschwindigkeit
- **Cockpit-Sounds:** Warntöne (Stall, Altitude, Gear), Klick-Sounds für Schalter
- **Umgebung:** Ambient-Sounds je nach Höhe und Wetter
- **Lautstärkeregler:** Master, Motor, Cockpit, Umgebung separat

---

## 6. UI/UX Design

### 6.1 Hauptmenü

- Start / Fortsetzen
- Flugzeugauswahl (mit 3D-Preview und Spezifikationen)
- Kartenauswahl / Startposition
- Missionsauswahl
- Einstellungen (Grafik, Audio, Steuerung)
- Leaderboard

### 6.2 In-Game UI

- Minimalistisches HUD, das die Immersion nicht bricht
- Pausenmenü mit Schnelleinstellungen
- Missionsanzeigen kontextabhängig einblenden
- Tooltips/Tutorial-Overlay für Einsteiger (abschaltbar)

### 6.3 Einstellungen

- **Grafik:** Qualitätsstufen (Niedrig/Mittel/Hoch/Ultra), Sichtweite, Schatten, Post-Processing
- **Steuerung:** Vollständiges Rebinding, Sensitivität, Invertierung
- **Audio:** Individuelle Lautstärkeregler
- **Gameplay:** Schwierigkeitsgrad (Arcade → Realistisch), Einheitensystem (metrisch/imperial)

---

## 7. Nicht-funktionale Anforderungen

### 7.1 Browser-Kompatibilität

| Browser | Mindestversion |
|---|---|
| Chrome | 100+ |
| Firefox | 100+ |
| Edge | 100+ |
| Safari | 16+ |

### 7.2 Barrierefreiheit

- Vollständige Tastaturnavigation in Menüs
- Farbblinden-Modi für HUD-Elemente
- Konfigurierbare Schriftgrößen in der UI
- Screen-Reader-Unterstützung für Menüs

### 7.3 Lokalisierung

- MVP: Deutsch und Englisch
- i18n-fähige Architektur für spätere Erweiterungen

### 7.4 Datenschutz

- Keine personenbezogenen Daten ohne Einwilligung
- Lokale Speicherung (LocalStorage/IndexedDB) für Einstellungen und Fortschritt
- DSGVO-konform bei Leaderboard-Nutzung

---

## 8. Roadmap

### Phase 1 – MVP (v1.0)

- Flugphysik-Engine mit 3 Flugzeugen
- 1 Kartenregion mit 2 Flughäfen
- Freier Flug + 5 Missionen
- Cockpit-Ansicht + externe Kamera
- Tastatur- und Gamepad-Steuerung
- Tag-/Nacht-Zyklus
- Grundlegendes Wettersystem

### Phase 2 – Erweiterung (v1.5)

- Weitere Flugzeuge (Helikopter, Ultraleicht)
- Zusätzliche Kartenregionen
- Multiplayer (gemeinsamer Luftraum via WebRTC/WebSocket)
- ATC-System (Flugsicherung) mit einfacher KI
- Erweiterte Wetter-Simulation (Gewitter, Vereisung)
- Replay-System

### Phase 3 – Community (v2.0)

- Modding-Support (benutzerdefinierte Flugzeuge via glTF)
- Missionseditor
- Community-Leaderboards & Challenges
- VR-Unterstützung (WebXR)
- Realistischere Avionik (FMS, Autopilot)

---

## 9. Risiken & Mitigationen

| Risiko | Wahrscheinlichkeit | Auswirkung | Mitigation |
|---|---|---|---|
| WebGL-Performance auf schwacher Hardware | Hoch | Mittel | Skalierbare Grafikeinstellungen, LOD-System |
| Hoher Speicherverbrauch durch Terrain | Mittel | Hoch | Streaming-Architektur, Texture Compression |
| Browser-Inkompatibilitäten | Mittel | Mittel | Feature-Detection, Fallbacks, Polyfills |
| Komplexität der Flugphysik | Mittel | Mittel | Iterativer Ansatz: erst Arcade, dann realistischer |
| Große Asset-Dateien / Ladezeiten | Hoch | Hoch | Asset-Streaming, Lazy Loading, Kompression (Draco/KTX2) |

---

## 10. Erfolgskriterien (KPIs)

| KPI | Zielwert (6 Monate nach Launch) |
|---|---|
| Monatlich aktive Spieler | > 10.000 |
| Durchschnittliche Session-Dauer | > 15 Minuten |
| Retention (Day 7) | > 25% |
| Lighthouse Performance Score | > 70 |
| Durchschnittliche Framerate | > 55 FPS |
| Crash-Rate | < 1% der Sessions |

---

## 11. Offene Fragen

- [ ] Lizenzen für reale Flugzeugmodelle klären oder generische Designs nutzen?
- [ ] Reale Geländedaten (z.B. Mapbox, OpenStreetMap) oder vollständig eigenes Terrain?
- [ ] Monetarisierung: Kostenlos mit Ads, Freemium, oder einmaliger Kauf?
- [ ] Hosting-Strategie: Statisches Hosting (CDN) ausreichend oder dedizierter Server nötig?
- [ ] Soll der Simulator auch auf Mobilgeräten (Smartphones) laufen oder nur Desktop/Tablet?
