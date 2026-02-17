/**
 * SkyLine Flight Simulator - Main Entry Point
 */
import * as THREE from 'three';
import { PhysicsEngine } from './engine/PhysicsEngine.js';
import { InputManager } from './engine/InputManager.js';
import { AudioEngine } from './engine/AudioEngine.js';
import { getAircraftById } from './aircraft/AircraftDefinitions.js';
import { createAircraftModel } from './aircraft/AircraftModels.js';
import { Terrain } from './world/Terrain.js';
import { Sky } from './world/Sky.js';
import { Weather, WEATHER_TYPES } from './world/Weather.js';
import { CameraManager, CAMERA_MODES } from './cameras/CameraManager.js';
import { HUD } from './ui/HUD.js';
import { Menu } from './ui/Menu.js';
import { MissionManager } from './missions/MissionManager.js';
import { I18n } from './i18n/translations.js';

class Game {
  constructor() {
    this.isRunning = false;
    this.isPaused = false;
    this.lastTime = 0;

    // Core systems
    this.i18n = new I18n();
    this.physics = new PhysicsEngine();
    this.input = new InputManager();
    this.audio = new AudioEngine();

    // Three.js
    this.renderer = null;
    this.scene = null;
    this.camera = null;

    // Game objects
    this.terrain = null;
    this.sky = null;
    this.weather = null;
    this.cameraManager = null;
    this.hud = null;
    this.menu = null;
    this.missionManager = null;

    // Aircraft
    this.aircraftModel = null;
    this.aircraftId = 'cessna172';
    this.aircraftGroup = new THREE.Group();

    this._init();
  }

  async _init() {
    this.menu = new Menu(this.i18n);

    // Loading progress
    this.menu.setLoadingProgress(10, 'Initialisiere Renderer...');

    // Setup Three.js
    this._initRenderer();
    this.menu.setLoadingProgress(30, 'Erstelle Welt...');

    // Setup scene
    this._initScene();
    this.menu.setLoadingProgress(50, 'Lade Terrain...');

    // Initialize terrain (this triggers initial chunk generation)
    this.terrain = new Terrain(this.scene);
    this.menu.setLoadingProgress(70, 'Initialisiere Systeme...');

    // Set terrain height function for physics
    this.physics.setTerrainHeightFunction((x, z) => this.terrain.getHeight(x, z));

    // UI
    this.hud = new HUD();
    this.missionManager = new MissionManager(this.scene, this.i18n);

    this.menu.setLoadingProgress(85, 'Lade Audio...');

    // Setup events
    this._initControls();
    this._initMenuCallbacks();

    this.menu.setLoadingProgress(100, 'Bereit!');

    // Start render loop (for menu background)
    this._startRenderLoop();

    // Transition to menu
    await new Promise(r => setTimeout(r, 500));
    this.menu.hideLoading();
    this.menu.showMainMenu();

    // Localization
    this.i18n.updateDOM();
  }

  _initRenderer() {
    const canvas = document.getElementById('game-canvas');
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  _initScene() {
    this.scene = new THREE.Scene();

    // Camera
    this.camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.5,
      50000
    );
    this.camera.position.set(0, 200, 0);

    // Camera manager
    this.cameraManager = new CameraManager(this.camera);

    // Sky
    this.sky = new Sky(this.scene);

    // Weather
    this.weather = new Weather(this.scene);
    this.weather.setWeather(WEATHER_TYPES.CLEAR);

    // Aircraft group (added to scene later)
    this.scene.add(this.aircraftGroup);

    // Crosshair in HUD center
    const hudCenter = document.getElementById('hud-center');
    if (hudCenter) {
      hudCenter.innerHTML = '<div class="crosshair"></div>';
    }
  }

  _initControls() {
    // Camera switch
    this.input.onAction('KeyC', () => {
      if (!this.isRunning) return;
      const mode = this.cameraManager.nextMode();
      this.hud.setCameraMode(this.cameraManager.getModeName(this.i18n.language));
    });

    // Gear toggle
    this.input.onAction('KeyG', () => {
      if (!this.isRunning) return;
      const ac = getAircraftById(this.aircraftId);
      if (ac.gearRetractable) {
        this.physics.state.gear = !this.physics.state.gear;
        this.audio.playGearSound();
      }
    });

    // Flaps
    this.input.onAction('KeyF', () => {
      if (!this.isRunning) return;
      this.physics.state.flaps = (this.physics.state.flaps + 1) % 4;
      this.audio.playClickSound();
    });

    // Pause
    this.input.onAction('KeyP', () => {
      if (!this.isRunning) return;
      this.togglePause();
    });

    this.input.onAction('Escape', () => {
      if (this.isRunning) {
        this.togglePause();
      }
    });

    // Mouse wheel for camera zoom
    window.addEventListener('wheel', (e) => {
      if (!this.isRunning) return;
      this.cameraManager.handleMouseWheel(e.deltaY);
    });

    // Right-click orbit
    let isRightDrag = false;
    window.addEventListener('mousedown', (e) => {
      if (e.button === 2) isRightDrag = true;
      // Init audio on first interaction
      if (!this.audio.initialized) this.audio.init();
    });
    window.addEventListener('mouseup', (e) => {
      if (e.button === 2) isRightDrag = false;
    });
    window.addEventListener('mousemove', (e) => {
      if (isRightDrag && this.isRunning) {
        this.cameraManager.handleMouseOrbit(e.movementX, e.movementY);
      }
    });
    window.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  _initMenuCallbacks() {
    this.menu.callbacks.onStartFlight = (aircraftId, gameMode) => {
      this.aircraftId = aircraftId;
      this._startGame(gameMode);
    };

    this.menu.callbacks.onResume = () => {
      this.isPaused = false;
      document.getElementById('hud')?.classList.remove('hidden');
    };

    this.menu.callbacks.onRestart = () => {
      this._restartGame();
    };

    this.menu.callbacks.onQuit = () => {
      this._stopGame();
    };
  }

  _startGame(gameMode) {
    // Load aircraft
    this._loadAircraft(this.aircraftId);

    // Apply settings
    const settings = this.menu.settings;
    this.input.sensitivity.pitch = settings.controls.sensitivity;
    this.input.sensitivity.roll = settings.controls.sensitivity;
    this.input.sensitivity.yaw = settings.controls.sensitivity;
    this.input.invertPitch = settings.controls.invertPitch;
    this.input.mouseEnabled = settings.controls.mouseControl;

    // Audio settings
    if (this.audio.initialized) {
      this.audio.setVolume('master', settings.audio.master);
      this.audio.volumes.engine = settings.audio.engine;
      this.audio.volumes.wind = settings.audio.wind;
      this.audio.volumes.cockpit = settings.audio.cockpit;
    }

    // Weather from settings (if set)
    const weatherSelect = document.getElementById('set-weather');
    if (weatherSelect) {
      this.weather.setWeather(weatherSelect.value || WEATHER_TYPES.CLEAR);
    }

    // Start position (on runway)
    if (gameMode === 'free') {
      this.physics.reset(0, 50, -800, 0);
      // Give a starting speed for takeoff readiness
      this.physics.state.throttle = 0;
    } else if (gameMode === 'mission' && this.menu.selectedMission) {
      this.missionManager.startMission(this.menu.selectedMission, this.physics);
    } else {
      this.physics.reset(0, 50, -800, 0);
    }

    // Show HUD
    document.getElementById('hud')?.classList.remove('hidden');
    this.hud.setCameraMode(this.cameraManager.getModeName(this.i18n.language));

    this.isRunning = true;
    this.isPaused = false;
  }

  _loadAircraft(id) {
    // Remove old model
    while (this.aircraftGroup.children.length) {
      this.aircraftGroup.remove(this.aircraftGroup.children[0]);
    }

    // Load aircraft definition
    const acDef = getAircraftById(id);
    this.physics.setAircraft(acDef);

    // Create 3D model
    this.aircraftModel = createAircraftModel(id);
    this.aircraftGroup.add(this.aircraftModel);

    // Set cockpit offset based on aircraft
    switch (id) {
      case 'cessna172':
        this.cameraManager.setCockpitOffset(new THREE.Vector3(1.2, 0.6, 0));
        break;
      case 'boeing737':
        this.cameraManager.setCockpitOffset(new THREE.Vector3(4, 1.0, 0));
        break;
      case 'f16':
        this.cameraManager.setCockpitOffset(new THREE.Vector3(2.5, 0.8, 0));
        break;
    }
  }

  _stopGame() {
    this.isRunning = false;
    this.isPaused = false;
    document.getElementById('hud')?.classList.add('hidden');
    document.getElementById('mission-hud')?.classList.add('hidden');
    this.missionManager.stopMission();
  }

  _restartGame() {
    const gameMode = this.menu.gameMode;
    document.getElementById('mission-complete')?.classList.add('hidden');
    this._startGame(gameMode);
  }

  togglePause() {
    this.isPaused = !this.isPaused;
    if (this.isPaused) {
      this.menu.showPause();
      document.getElementById('hud')?.classList.add('hidden');
    } else {
      this.menu.hidePause();
      document.getElementById('hud')?.classList.remove('hidden');
    }
  }

  _startRenderLoop() {
    const loop = (time) => {
      requestAnimationFrame(loop);
      const dt = Math.min((time - this.lastTime) / 1000, 0.1);
      this.lastTime = time;

      if (this.isRunning && !this.isPaused) {
        this._update(dt);
      }

      // Always update sky for menu background
      const px = this.physics.state.x;
      const pz = this.physics.state.z;
      this.sky.update(dt * 0.1, px, pz);

      this._render();
    };

    requestAnimationFrame(loop);
  }

  _update(dt) {
    const state = this.physics.state;

    // Poll gamepad
    this.input.pollGamepad();

    // Apply inputs to physics
    state.elevator = this.input.getAxis('pitch');
    state.aileron = this.input.getAxis('roll');
    state.rudder = this.input.getAxis('yaw');
    state.throttle = this.input.getThrottle(state.throttle);
    state.brakes = this.input.getBrakes();

    // Wind from weather
    const wind = this.weather.getWindComponents();
    state.windX = wind.x;
    state.windZ = wind.z;
    state.windGust = wind.gust;

    // Update physics
    this.physics.update(dt);

    // Update aircraft model position/rotation
    this.aircraftGroup.position.set(state.x, state.y, state.z);

    const euler = new THREE.Euler(state.pitch, -state.yaw, -state.roll, 'YXZ');
    this.aircraftGroup.quaternion.setFromEuler(euler);

    // Propeller animation (Cessna)
    const propeller = this.aircraftGroup.getObjectByName('propeller');
    if (propeller) {
      propeller.rotation.x += state.engineRPM * 60 * dt;
    }

    // Afterburner glow (F-16)
    const afterburner = this.aircraftGroup.getObjectByName('afterburner');
    if (afterburner) {
      afterburner.material.opacity = state.throttle > 0.8 ? (state.throttle - 0.8) * 5 : 0;
    }

    // Update camera
    const velocity = new THREE.Vector3(state.vx, state.vy, state.vz);
    this.cameraManager.update(
      dt,
      this.aircraftGroup.position,
      this.aircraftGroup.quaternion,
      velocity
    );

    // Update terrain streaming
    this.terrain.update(state.x, state.z);

    // Update sky
    this.sky.update(dt, state.x, state.z);

    // Update weather
    this.weather.update(dt, state.x, state.y, state.z, this.scene.fog);

    // Update audio
    this.audio.update(state);

    // Update HUD
    this.hud.update(this.physics);

    // Update missions
    if (this.missionManager.activeMission) {
      const result = this.missionManager.update(dt, state);
      if (result) {
        this.isPaused = true;
        this.menu.showMissionComplete(result);
      }
    }
  }

  _render() {
    this.renderer.render(this.scene, this.camera);
  }
}

// Boot the game
const game = new Game();
