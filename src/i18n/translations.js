/**
 * i18n - Localization system (DE/EN)
 */

const translations = {
  de: {
    // Menu
    'menu.subtitle': 'Flugsimulator',
    'menu.freeFlight': 'Freier Flug',
    'menu.missions': 'Missionen',
    'menu.challenges': 'Challenges',
    'menu.settings': 'Einstellungen',

    // Common
    'common.back': 'Zurück',
    'common.start': 'Starten',
    'common.yes': 'Ja',
    'common.no': 'Nein',

    // Aircraft
    'aircraft.title': 'Flugzeugauswahl',
    'aircraft.maxSpeed': 'Max. Geschwindigkeit',
    'aircraft.cruiseSpeed': 'Reisegeschwindigkeit',
    'aircraft.stallSpeed': 'Überziehgeschw.',
    'aircraft.maxAltitude': 'Max. Flughöhe',
    'aircraft.climbRate': 'Steigrate',
    'aircraft.range': 'Reichweite',
    'aircraft.weight': 'Gewicht',
    'aircraft.wingspan': 'Spannweite',

    // HUD
    'hud.speed': 'SPD',
    'hud.heading': 'HDG',
    'hud.altitude': 'ALT',
    'hud.vspeed': 'VS',
    'hud.throttle': 'THR',
    'hud.gear': 'GEAR',
    'hud.flaps': 'FLAPS',
    'hud.controlsHint': 'WASD: Steuerung | Shift/Ctrl: Schub | C: Kamera | G: Fahrwerk | F: Klappen | P: Pause',

    // Settings
    'settings.title': 'Einstellungen',
    'settings.graphics': 'Grafik',
    'settings.controls': 'Steuerung',
    'settings.audio': 'Audio',
    'settings.gameplay': 'Gameplay',
    'settings.quality': 'Qualität',
    'settings.low': 'Niedrig',
    'settings.medium': 'Mittel',
    'settings.high': 'Hoch',
    'settings.viewDistance': 'Sichtweite',
    'settings.sensitivity': 'Empfindlichkeit',
    'settings.invertPitch': 'Pitch invertieren',
    'settings.mouseControl': 'Maussteuerung',
    'settings.masterVol': 'Gesamtlautstärke',
    'settings.engineVol': 'Motor',
    'settings.windVol': 'Wind',
    'settings.cockpitVol': 'Cockpit',
    'settings.difficulty': 'Schwierigkeit',
    'settings.realistic': 'Realistisch',
    'settings.units': 'Einheiten',
    'settings.metric': 'Metrisch',
    'settings.weather': 'Wetter',
    'settings.save': 'Speichern',

    // Weather
    'weather.clear': 'Klar',
    'weather.cloudy': 'Bewölkt',
    'weather.rain': 'Regen',
    'weather.fog': 'Nebel',

    // Pause
    'pause.title': 'Pause',
    'pause.resume': 'Fortsetzen',
    'pause.restart': 'Neustart',
    'pause.quit': 'Hauptmenü',

    // Missions
    'missions.title': 'Missionen',
    'missions.difficulty': 'Schwierigkeit',
    'missions.nav1.name': 'Navigationstraining',
    'missions.nav1.desc': 'Fliege durch 5 Wegpunkte in der vorgegebenen Reihenfolge.',
    'missions.landing1.name': 'Präzisionslandung',
    'missions.landing1.desc': 'Lande sicher auf dem Zielflughafen.',
    'missions.slalom1.name': 'Tiefflug-Slalom',
    'missions.slalom1.desc': 'Fliege so schnell wie möglich durch alle Checkpoints.',
    'missions.emergency1.name': 'Notlandung',
    'missions.emergency1.desc': 'Dein Triebwerk fällt aus! Lande sicher auf der Piste.',
    'missions.speed1.name': 'Geschwindigkeitsrekord',
    'missions.speed1.desc': 'Erreiche die Zielpunkte in Rekordzeit.',

    // Mission HUD
    'mission.checkpoint': 'Checkpoint',
    'mission.landAtRunway': 'Lande auf der Zielpiste',
    'mission.engineOut': 'TRIEBWERKSAUSFALL - Notlandung!',
    'mission.flyNormally': 'Fliege normal weiter...',
    'mission.complete': 'Mission abgeschlossen!',
    'mission.score': 'Punktzahl',
    'mission.time': 'Zeit',
    'mission.landing': 'Landung',
    'mission.retry': 'Nochmal',
  },

  en: {
    'menu.subtitle': 'Flight Simulator',
    'menu.freeFlight': 'Free Flight',
    'menu.missions': 'Missions',
    'menu.challenges': 'Challenges',
    'menu.settings': 'Settings',

    'common.back': 'Back',
    'common.start': 'Start',
    'common.yes': 'Yes',
    'common.no': 'No',

    'aircraft.title': 'Aircraft Selection',
    'aircraft.maxSpeed': 'Max Speed',
    'aircraft.cruiseSpeed': 'Cruise Speed',
    'aircraft.stallSpeed': 'Stall Speed',
    'aircraft.maxAltitude': 'Max Altitude',
    'aircraft.climbRate': 'Climb Rate',
    'aircraft.range': 'Range',
    'aircraft.weight': 'Weight',
    'aircraft.wingspan': 'Wingspan',

    'hud.speed': 'SPD',
    'hud.heading': 'HDG',
    'hud.altitude': 'ALT',
    'hud.vspeed': 'VS',
    'hud.throttle': 'THR',
    'hud.gear': 'GEAR',
    'hud.flaps': 'FLAPS',
    'hud.controlsHint': 'WASD: Control | Shift/Ctrl: Throttle | C: Camera | G: Gear | F: Flaps | P: Pause',

    'settings.title': 'Settings',
    'settings.graphics': 'Graphics',
    'settings.controls': 'Controls',
    'settings.audio': 'Audio',
    'settings.gameplay': 'Gameplay',
    'settings.quality': 'Quality',
    'settings.low': 'Low',
    'settings.medium': 'Medium',
    'settings.high': 'High',
    'settings.viewDistance': 'View Distance',
    'settings.sensitivity': 'Sensitivity',
    'settings.invertPitch': 'Invert Pitch',
    'settings.mouseControl': 'Mouse Control',
    'settings.masterVol': 'Master Volume',
    'settings.engineVol': 'Engine',
    'settings.windVol': 'Wind',
    'settings.cockpitVol': 'Cockpit',
    'settings.difficulty': 'Difficulty',
    'settings.realistic': 'Realistic',
    'settings.units': 'Units',
    'settings.metric': 'Metric',
    'settings.weather': 'Weather',
    'settings.save': 'Save',

    'weather.clear': 'Clear',
    'weather.cloudy': 'Cloudy',
    'weather.rain': 'Rain',
    'weather.fog': 'Fog',

    'pause.title': 'Paused',
    'pause.resume': 'Resume',
    'pause.restart': 'Restart',
    'pause.quit': 'Main Menu',

    'missions.title': 'Missions',
    'missions.difficulty': 'Difficulty',
    'missions.nav1.name': 'Navigation Training',
    'missions.nav1.desc': 'Fly through 5 waypoints in the given order.',
    'missions.landing1.name': 'Precision Landing',
    'missions.landing1.desc': 'Land safely at the target airport.',
    'missions.slalom1.name': 'Low-Level Slalom',
    'missions.slalom1.desc': 'Fly through all checkpoints as fast as possible.',
    'missions.emergency1.name': 'Emergency Landing',
    'missions.emergency1.desc': 'Your engine fails! Land safely on the runway.',
    'missions.speed1.name': 'Speed Record',
    'missions.speed1.desc': 'Reach the target points in record time.',

    'mission.checkpoint': 'Checkpoint',
    'mission.landAtRunway': 'Land on the target runway',
    'mission.engineOut': 'ENGINE FAILURE - Emergency landing!',
    'mission.flyNormally': 'Continue flying normally...',
    'mission.complete': 'Mission Complete!',
    'mission.score': 'Score',
    'mission.time': 'Time',
    'mission.landing': 'Landing',
    'mission.retry': 'Retry',
  },
};

export class I18n {
  constructor() {
    this.language = 'de';
    this.strings = translations;
  }

  setLanguage(lang) {
    if (this.strings[lang]) {
      this.language = lang;
    }
  }

  t(key) {
    return this.strings[this.language]?.[key] || this.strings['de']?.[key] || key;
  }

  updateDOM() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const text = this.t(key);
      if (text !== key) {
        el.textContent = text;
      }
    });
  }
}
