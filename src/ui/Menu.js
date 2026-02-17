/**
 * Menu - Main menu, aircraft selection, mission selection, settings
 */
import { getAircraftList } from '../aircraft/AircraftDefinitions.js';
import { WEATHER_TYPES } from '../world/Weather.js';

export class Menu {
  constructor(i18n) {
    this.i18n = i18n;
    this.selectedAircraft = 'cessna172';
    this.selectedMission = null;
    this.gameMode = null; // 'free', 'mission', 'challenge'

    this.callbacks = {
      onStartFlight: null,
      onStartMission: null,
    };

    this.settings = this._loadSettings();
    this._initElements();
    this._initEvents();
  }

  _loadSettings() {
    const defaults = {
      graphics: { quality: 'medium', viewDistance: 5, shadows: false, postProcessing: false },
      controls: { sensitivity: 1.0, invertPitch: false, mouseControl: false },
      audio: { master: 0.5, engine: 0.7, wind: 0.5, cockpit: 0.6 },
      gameplay: { difficulty: 'arcade', units: 'imperial' },
    };

    try {
      const saved = localStorage.getItem('skyline-settings');
      if (saved) return { ...defaults, ...JSON.parse(saved) };
    } catch {}

    return defaults;
  }

  _saveSettings() {
    try {
      localStorage.setItem('skyline-settings', JSON.stringify(this.settings));
    } catch {}
  }

  _initElements() {
    this.screens = {
      loading: document.getElementById('loading-screen'),
      mainMenu: document.getElementById('main-menu'),
      aircraftSelect: document.getElementById('aircraft-select'),
      missionSelect: document.getElementById('mission-select'),
      settingsPanel: document.getElementById('settings-panel'),
      pauseMenu: document.getElementById('pause-menu'),
      missionComplete: document.getElementById('mission-complete'),
    };
  }

  _initEvents() {
    // Main menu buttons
    document.getElementById('btn-free-flight')?.addEventListener('click', () => {
      this.gameMode = 'free';
      this._showAircraftSelect();
    });

    document.getElementById('btn-missions')?.addEventListener('click', () => {
      this.gameMode = 'mission';
      this._showMissionSelect();
    });

    document.getElementById('btn-challenges')?.addEventListener('click', () => {
      this.gameMode = 'challenge';
      this._showMissionSelect();
    });

    document.getElementById('btn-settings')?.addEventListener('click', () => {
      this._showSettings();
    });

    // Aircraft selection
    document.getElementById('btn-aircraft-back')?.addEventListener('click', () => {
      this._hideAll();
      this._show('mainMenu');
    });

    document.getElementById('btn-aircraft-confirm')?.addEventListener('click', () => {
      this._hideAll();
      if (this.callbacks.onStartFlight) {
        this.callbacks.onStartFlight(this.selectedAircraft, this.gameMode);
      }
    });

    // Mission selection
    document.getElementById('btn-mission-back')?.addEventListener('click', () => {
      this._hideAll();
      this._show('mainMenu');
    });

    document.getElementById('btn-mission-start')?.addEventListener('click', () => {
      if (!this.selectedMission) return;
      this._showAircraftSelect();
    });

    // Settings
    document.getElementById('btn-settings-back')?.addEventListener('click', () => {
      this._hideAll();
      this._show('mainMenu');
    });

    document.getElementById('btn-settings-save')?.addEventListener('click', () => {
      this._saveSettings();
      this._hideAll();
      this._show('mainMenu');
    });

    // Settings tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this._renderSettingsTab(btn.dataset.tab);
      });
    });

    // Pause menu
    document.getElementById('btn-resume')?.addEventListener('click', () => {
      this._hideAll();
      if (this.callbacks.onResume) this.callbacks.onResume();
    });

    document.getElementById('btn-restart')?.addEventListener('click', () => {
      this._hideAll();
      if (this.callbacks.onRestart) this.callbacks.onRestart();
    });

    document.getElementById('btn-quit')?.addEventListener('click', () => {
      this._hideAll();
      this._show('mainMenu');
      if (this.callbacks.onQuit) this.callbacks.onQuit();
    });

    // Mission complete
    document.getElementById('btn-mission-menu')?.addEventListener('click', () => {
      this._hideAll();
      this._show('mainMenu');
      if (this.callbacks.onQuit) this.callbacks.onQuit();
    });

    document.getElementById('btn-mission-retry')?.addEventListener('click', () => {
      this._hideAll();
      if (this.callbacks.onRestart) this.callbacks.onRestart();
    });

    // Language select
    document.getElementById('language-select')?.addEventListener('change', (e) => {
      this.i18n.setLanguage(e.target.value);
      this.i18n.updateDOM();
    });
  }

  _show(screen) {
    if (this.screens[screen]) {
      this.screens[screen].classList.remove('hidden');
    }
  }

  _hide(screen) {
    if (this.screens[screen]) {
      this.screens[screen].classList.add('hidden');
    }
  }

  _hideAll() {
    Object.values(this.screens).forEach(el => {
      if (el) el.classList.add('hidden');
    });
  }

  _showAircraftSelect() {
    this._hideAll();
    this._show('aircraftSelect');
    this._renderAircraftGrid();
  }

  _renderAircraftGrid() {
    const grid = document.getElementById('aircraft-grid');
    if (!grid) return;

    const aircraft = getAircraftList();
    const lang = this.i18n.language;

    grid.innerHTML = aircraft.map(ac => `
      <div class="aircraft-card ${ac.id === this.selectedAircraft ? 'selected' : ''}" data-id="${ac.id}">
        <div class="aircraft-icon">${ac.icon}</div>
        <div class="aircraft-name">${ac.name}</div>
        <div class="aircraft-type">${lang === 'en' ? ac.categoryEn : ac.category}</div>
        <div class="aircraft-difficulty">${'★'.repeat(ac.difficulty)}${'☆'.repeat(3 - ac.difficulty)}</div>
      </div>
    `).join('');

    grid.querySelectorAll('.aircraft-card').forEach(card => {
      card.addEventListener('click', () => {
        grid.querySelectorAll('.aircraft-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        this.selectedAircraft = card.dataset.id;
        this._renderAircraftSpecs();
      });
    });

    this._renderAircraftSpecs();
  }

  _renderAircraftSpecs() {
    const specsEl = document.getElementById('aircraft-specs');
    if (!specsEl) return;

    const aircraft = getAircraftList().find(a => a.id === this.selectedAircraft);
    if (!aircraft) return;

    const t = this.i18n.t.bind(this.i18n);
    const specs = aircraft.specs;

    specsEl.innerHTML = `
      <div class="spec-item">
        <span class="spec-label">${t('aircraft.maxSpeed')}</span>
        <span class="spec-value">${specs.maxSpeedKts} kt</span>
      </div>
      <div class="spec-item">
        <span class="spec-label">${t('aircraft.cruiseSpeed')}</span>
        <span class="spec-value">${specs.cruiseSpeedKts} kt</span>
      </div>
      <div class="spec-item">
        <span class="spec-label">${t('aircraft.stallSpeed')}</span>
        <span class="spec-value">${specs.stallSpeedKts} kt</span>
      </div>
      <div class="spec-item">
        <span class="spec-label">${t('aircraft.maxAltitude')}</span>
        <span class="spec-value">${specs.maxAltitudeFt.toLocaleString()} ft</span>
      </div>
      <div class="spec-item">
        <span class="spec-label">${t('aircraft.climbRate')}</span>
        <span class="spec-value">${specs.climbRateFPM.toLocaleString()} fpm</span>
      </div>
      <div class="spec-item">
        <span class="spec-label">${t('aircraft.range')}</span>
        <span class="spec-value">${specs.rangeMi} mi</span>
      </div>
      <div class="spec-item">
        <span class="spec-label">${t('aircraft.weight')}</span>
        <span class="spec-value">${aircraft.mass.toLocaleString()} kg</span>
      </div>
      <div class="spec-item">
        <span class="spec-label">${t('aircraft.wingspan')}</span>
        <span class="spec-value">${aircraft.wingspan} m</span>
      </div>
    `;
  }

  _showMissionSelect() {
    this._hideAll();
    this._show('missionSelect');
    this._renderMissionList();
  }

  _renderMissionList() {
    const list = document.getElementById('mission-list');
    if (!list) return;

    const t = this.i18n.t.bind(this.i18n);
    const missions = this._getMissions();

    list.innerHTML = missions.map((m, i) => `
      <div class="mission-item ${this.selectedMission === m.id ? 'selected' : ''}" data-id="${m.id}">
        <div class="mission-name">${t(m.nameKey)}</div>
        <div class="mission-desc">${t(m.descKey)}</div>
        <div class="mission-difficulty">${t('missions.difficulty')}: ${m.difficulty}</div>
      </div>
    `).join('');

    list.querySelectorAll('.mission-item').forEach(item => {
      item.addEventListener('click', () => {
        list.querySelectorAll('.mission-item').forEach(i => i.classList.remove('selected'));
        item.classList.add('selected');
        this.selectedMission = item.dataset.id;
      });
    });
  }

  _getMissions() {
    return [
      { id: 'nav1', nameKey: 'missions.nav1.name', descKey: 'missions.nav1.desc', difficulty: '★★☆' },
      { id: 'landing1', nameKey: 'missions.landing1.name', descKey: 'missions.landing1.desc', difficulty: '★★☆' },
      { id: 'slalom1', nameKey: 'missions.slalom1.name', descKey: 'missions.slalom1.desc', difficulty: '★★★' },
      { id: 'emergency1', nameKey: 'missions.emergency1.name', descKey: 'missions.emergency1.desc', difficulty: '★★★' },
      { id: 'speed1', nameKey: 'missions.speed1.name', descKey: 'missions.speed1.desc', difficulty: '★☆☆' },
    ];
  }

  _showSettings() {
    this._hideAll();
    this._show('settingsPanel');
    this._renderSettingsTab('graphics');
  }

  _renderSettingsTab(tab) {
    const content = document.getElementById('settings-content');
    if (!content) return;

    const t = this.i18n.t.bind(this.i18n);

    switch (tab) {
      case 'graphics':
        content.innerHTML = `
          <div class="setting-row">
            <span class="setting-label">${t('settings.quality')}</span>
            <div class="setting-control">
              <select id="set-quality">
                <option value="low" ${this.settings.graphics.quality === 'low' ? 'selected' : ''}>${t('settings.low')}</option>
                <option value="medium" ${this.settings.graphics.quality === 'medium' ? 'selected' : ''}>${t('settings.medium')}</option>
                <option value="high" ${this.settings.graphics.quality === 'high' ? 'selected' : ''}>${t('settings.high')}</option>
              </select>
            </div>
          </div>
          <div class="setting-row">
            <span class="setting-label">${t('settings.viewDistance')}</span>
            <div class="setting-control">
              <input type="range" id="set-viewdist" min="3" max="8" value="${this.settings.graphics.viewDistance}" />
            </div>
          </div>
        `;
        document.getElementById('set-quality')?.addEventListener('change', (e) => {
          this.settings.graphics.quality = e.target.value;
        });
        document.getElementById('set-viewdist')?.addEventListener('input', (e) => {
          this.settings.graphics.viewDistance = parseInt(e.target.value);
        });
        break;

      case 'controls':
        content.innerHTML = `
          <div class="setting-row">
            <span class="setting-label">${t('settings.sensitivity')}</span>
            <div class="setting-control">
              <input type="range" id="set-sensitivity" min="0.1" max="2" step="0.1" value="${this.settings.controls.sensitivity}" />
            </div>
          </div>
          <div class="setting-row">
            <span class="setting-label">${t('settings.invertPitch')}</span>
            <div class="setting-control">
              <select id="set-invert">
                <option value="false" ${!this.settings.controls.invertPitch ? 'selected' : ''}>${t('common.no')}</option>
                <option value="true" ${this.settings.controls.invertPitch ? 'selected' : ''}>${t('common.yes')}</option>
              </select>
            </div>
          </div>
          <div class="setting-row">
            <span class="setting-label">${t('settings.mouseControl')}</span>
            <div class="setting-control">
              <select id="set-mouse">
                <option value="false" ${!this.settings.controls.mouseControl ? 'selected' : ''}>${t('common.no')}</option>
                <option value="true" ${this.settings.controls.mouseControl ? 'selected' : ''}>${t('common.yes')}</option>
              </select>
            </div>
          </div>
        `;
        document.getElementById('set-sensitivity')?.addEventListener('input', (e) => {
          this.settings.controls.sensitivity = parseFloat(e.target.value);
        });
        document.getElementById('set-invert')?.addEventListener('change', (e) => {
          this.settings.controls.invertPitch = e.target.value === 'true';
        });
        document.getElementById('set-mouse')?.addEventListener('change', (e) => {
          this.settings.controls.mouseControl = e.target.value === 'true';
        });
        break;

      case 'audio':
        content.innerHTML = `
          <div class="setting-row">
            <span class="setting-label">${t('settings.masterVol')}</span>
            <div class="setting-control">
              <input type="range" id="set-vol-master" min="0" max="1" step="0.05" value="${this.settings.audio.master}" />
            </div>
          </div>
          <div class="setting-row">
            <span class="setting-label">${t('settings.engineVol')}</span>
            <div class="setting-control">
              <input type="range" id="set-vol-engine" min="0" max="1" step="0.05" value="${this.settings.audio.engine}" />
            </div>
          </div>
          <div class="setting-row">
            <span class="setting-label">${t('settings.windVol')}</span>
            <div class="setting-control">
              <input type="range" id="set-vol-wind" min="0" max="1" step="0.05" value="${this.settings.audio.wind}" />
            </div>
          </div>
          <div class="setting-row">
            <span class="setting-label">${t('settings.cockpitVol')}</span>
            <div class="setting-control">
              <input type="range" id="set-vol-cockpit" min="0" max="1" step="0.05" value="${this.settings.audio.cockpit}" />
            </div>
          </div>
        `;
        ['master', 'engine', 'wind', 'cockpit'].forEach(ch => {
          document.getElementById(`set-vol-${ch}`)?.addEventListener('input', (e) => {
            this.settings.audio[ch] = parseFloat(e.target.value);
          });
        });
        break;

      case 'gameplay':
        content.innerHTML = `
          <div class="setting-row">
            <span class="setting-label">${t('settings.difficulty')}</span>
            <div class="setting-control">
              <select id="set-difficulty">
                <option value="arcade" ${this.settings.gameplay.difficulty === 'arcade' ? 'selected' : ''}>Arcade</option>
                <option value="realistic" ${this.settings.gameplay.difficulty === 'realistic' ? 'selected' : ''}>${t('settings.realistic')}</option>
              </select>
            </div>
          </div>
          <div class="setting-row">
            <span class="setting-label">${t('settings.units')}</span>
            <div class="setting-control">
              <select id="set-units">
                <option value="imperial" ${this.settings.gameplay.units === 'imperial' ? 'selected' : ''}>Imperial (kt, ft)</option>
                <option value="metric" ${this.settings.gameplay.units === 'metric' ? 'selected' : ''}>${t('settings.metric')} (km/h, m)</option>
              </select>
            </div>
          </div>
          <div class="setting-row">
            <span class="setting-label">${t('settings.weather')}</span>
            <div class="setting-control">
              <select id="set-weather">
                <option value="clear">${t('weather.clear')}</option>
                <option value="cloudy">${t('weather.cloudy')}</option>
                <option value="rain">${t('weather.rain')}</option>
                <option value="fog">${t('weather.fog')}</option>
              </select>
            </div>
          </div>
        `;
        document.getElementById('set-difficulty')?.addEventListener('change', (e) => {
          this.settings.gameplay.difficulty = e.target.value;
        });
        document.getElementById('set-units')?.addEventListener('change', (e) => {
          this.settings.gameplay.units = e.target.value;
        });
        break;
    }
  }

  showMainMenu() {
    this._hideAll();
    this._show('mainMenu');
  }

  showPause() {
    this._show('pauseMenu');
  }

  hidePause() {
    this._hide('pauseMenu');
  }

  showMissionComplete(results) {
    this._show('missionComplete');
    const el = document.getElementById('mission-results');
    if (!el) return;

    const t = this.i18n.t.bind(this.i18n);
    const grade = results.score >= 90 ? 'S' :
                  results.score >= 80 ? 'A' :
                  results.score >= 60 ? 'B' :
                  results.score >= 40 ? 'C' : 'D';

    el.innerHTML = `
      <div class="result-grade">${grade}</div>
      <div class="result-stats">
        <div class="result-stat">
          <span class="result-stat-label">${t('mission.score')}</span>
          <span class="result-stat-value">${results.score}</span>
        </div>
        <div class="result-stat">
          <span class="result-stat-label">${t('mission.time')}</span>
          <span class="result-stat-value">${results.time}</span>
        </div>
        ${results.landingScore !== undefined ? `
        <div class="result-stat">
          <span class="result-stat-label">${t('mission.landing')}</span>
          <span class="result-stat-value">${results.landingScore}</span>
        </div>` : ''}
      </div>
    `;
  }

  hideLoading() {
    const loading = this.screens.loading;
    if (loading) {
      loading.style.transition = 'opacity 0.5s';
      loading.style.opacity = '0';
      setTimeout(() => loading.classList.add('hidden'), 500);
    }
  }

  setLoadingProgress(progress, text) {
    const bar = document.getElementById('loading-bar');
    const label = document.getElementById('loading-text');
    if (bar) bar.style.width = `${progress}%`;
    if (label) label.textContent = text;
  }
}
