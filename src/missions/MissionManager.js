/**
 * MissionManager - Handles mission logic, checkpoints, scoring
 */
import * as THREE from 'three';

export class MissionManager {
  constructor(scene, i18n) {
    this.scene = scene;
    this.i18n = i18n;
    this.activeMission = null;
    this.missionState = null;
    this.checkpoints = [];
    this.checkpointMeshes = [];
    this.currentCheckpoint = 0;
    this.missionTimer = 0;
    this.score = 0;
    this.isComplete = false;

    this.hudElements = {
      objective: document.getElementById('mission-objective'),
      timer: document.getElementById('mission-timer'),
      score: document.getElementById('mission-score'),
    };
  }

  getMissionDefinitions() {
    return {
      nav1: {
        id: 'nav1',
        type: 'navigation',
        checkpoints: [
          { x: 2000, y: 300, z: 2000 },
          { x: 5000, y: 400, z: -1000 },
          { x: 8000, y: 350, z: 3000 },
          { x: 12000, y: 300, z: 1000 },
          { x: 15000, y: 200, z: 10000 },
        ],
        checkpointRadius: 200,
        timeLimit: 300,
        startPos: { x: 0, y: 150, z: 0, heading: 45 },
      },
      landing1: {
        id: 'landing1',
        type: 'landing',
        targetRunway: { x: 15000, z: 10000 },
        timeLimit: 180,
        startPos: { x: 13000, y: 600, z: 8000, heading: 90 },
      },
      slalom1: {
        id: 'slalom1',
        type: 'slalom',
        checkpoints: [
          { x: 1000, y: 100, z: 0 },
          { x: 2000, y: 120, z: 500 },
          { x: 3000, y: 80, z: -300 },
          { x: 4000, y: 150, z: 400 },
          { x: 5000, y: 100, z: -200 },
          { x: 6000, y: 130, z: 300 },
          { x: 7000, y: 90, z: -100 },
          { x: 8000, y: 110, z: 200 },
        ],
        checkpointRadius: 100,
        timeLimit: 120,
        startPos: { x: -500, y: 100, z: 0, heading: 90 },
      },
      emergency1: {
        id: 'emergency1',
        type: 'emergency',
        engineFailureTime: 10, // seconds after start
        targetRunway: { x: 0, z: 0 },
        startPos: { x: -5000, y: 800, z: -2000, heading: 45 },
      },
      speed1: {
        id: 'speed1',
        type: 'speed',
        checkpoints: [
          { x: 3000, y: 200, z: 0 },
          { x: 10000, y: 200, z: 0 },
        ],
        checkpointRadius: 200,
        startPos: { x: 0, y: 200, z: 0, heading: 90 },
      },
    };
  }

  startMission(missionId, physicsEngine) {
    const def = this.getMissionDefinitions()[missionId];
    if (!def) return false;

    this.activeMission = def;
    this.missionState = { phase: 'active' };
    this.currentCheckpoint = 0;
    this.missionTimer = 0;
    this.score = 100;
    this.isComplete = false;

    // Reset aircraft to start position
    physicsEngine.reset(
      def.startPos.x,
      def.startPos.y,
      def.startPos.z,
      def.startPos.heading || 0
    );

    // If it's a speed run, give initial velocity
    if (def.type === 'speed') {
      const heading = (def.startPos.heading || 0) * Math.PI / 180;
      physicsEngine.state.vx = Math.sin(heading) * 80;
      physicsEngine.state.vz = Math.cos(heading) * 80;
      physicsEngine.state.throttle = 0.8;
    }

    // Create checkpoint visuals
    this._clearCheckpoints();
    if (def.checkpoints) {
      this._createCheckpointVisuals(def.checkpoints, def.checkpointRadius || 150);
    }

    // Show mission HUD
    document.getElementById('mission-hud')?.classList.remove('hidden');

    return true;
  }

  _createCheckpointVisuals(checkpoints, radius) {
    checkpoints.forEach((cp, i) => {
      // Ring gate
      const ringGeo = new THREE.TorusGeometry(radius * 0.3, 3, 8, 24);
      const ringMat = new THREE.MeshBasicMaterial({
        color: i === 0 ? 0x00ff88 : 0xffaa00,
        transparent: true,
        opacity: 0.7,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.set(cp.x, cp.y, cp.z);
      ring.rotation.y = Math.PI / 2;

      // Arrow beam pointing to next
      const beamGeo = new THREE.CylinderGeometry(1, 1, radius * 0.6, 4);
      const beamMat = new THREE.MeshBasicMaterial({
        color: 0x4fc3f7,
        transparent: true,
        opacity: 0.3,
      });
      const beam = new THREE.Mesh(beamGeo, beamMat);
      beam.position.set(cp.x, cp.y, cp.z);
      ring.add(beam);

      this.scene.add(ring);
      this.checkpointMeshes.push(ring);
    });
  }

  _clearCheckpoints() {
    for (const mesh of this.checkpointMeshes) {
      this.scene.remove(mesh);
      mesh.geometry.dispose();
    }
    this.checkpointMeshes = [];
  }

  update(dt, physicsState) {
    if (!this.activeMission || this.isComplete) return null;

    this.missionTimer += dt;
    const def = this.activeMission;

    // Time limit check
    if (def.timeLimit && this.missionTimer > def.timeLimit) {
      this.score = Math.max(0, this.score - 30);
      return this._completeMission('timeout');
    }

    // Mission type-specific logic
    switch (def.type) {
      case 'navigation':
      case 'slalom':
      case 'speed':
        return this._updateCheckpointMission(dt, physicsState);

      case 'landing':
        return this._updateLandingMission(dt, physicsState);

      case 'emergency':
        return this._updateEmergencyMission(dt, physicsState);
    }

    // Update HUD
    this._updateMissionHUD();

    return null;
  }

  _updateCheckpointMission(dt, state) {
    const def = this.activeMission;
    const checkpoints = def.checkpoints;
    if (this.currentCheckpoint >= checkpoints.length) {
      return this._completeMission('success');
    }

    const cp = checkpoints[this.currentCheckpoint];
    const dx = state.x - cp.x;
    const dy = state.y - cp.y;
    const dz = state.z - cp.z;
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

    // Check if player reached checkpoint
    const radius = def.checkpointRadius || 150;
    if (dist < radius) {
      // Hit checkpoint!
      if (this.checkpointMeshes[this.currentCheckpoint]) {
        this.checkpointMeshes[this.currentCheckpoint].material.color.setHex(0x00ff00);
        this.checkpointMeshes[this.currentCheckpoint].material.opacity = 0.3;
      }

      this.currentCheckpoint++;

      // Highlight next
      if (this.currentCheckpoint < this.checkpointMeshes.length) {
        this.checkpointMeshes[this.currentCheckpoint].material.color.setHex(0x00ff88);
      }

      // Bonus for speed
      if (def.type === 'speed') {
        this.score += 10;
      }
    }

    this._updateMissionHUD();

    if (this.currentCheckpoint >= checkpoints.length) {
      return this._completeMission('success');
    }

    return null;
  }

  _updateLandingMission(dt, state) {
    const def = this.activeMission;

    // Check if aircraft has landed near target runway
    if (state.onGround) {
      const dx = state.x - def.targetRunway.x;
      const dz = state.z - def.targetRunway.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist < 2000) {
        // Calculate landing score based on vertical speed and position
        const vsFPM = Math.abs(state.verticalSpeed * 196.85);
        let landingScore = 100;
        if (vsFPM > 300) landingScore -= 20;
        if (vsFPM > 500) landingScore -= 30;
        if (dist > 500) landingScore -= 15;
        if (dist > 1000) landingScore -= 20;

        this.score = Math.max(0, Math.min(100, landingScore));
        return this._completeMission('success');
      }
    }

    // Crash detection
    if (state.onGround && Math.abs(state.verticalSpeed) > 8) {
      this.score = 0;
      return this._completeMission('crash');
    }

    this._updateMissionHUD();
    return null;
  }

  _updateEmergencyMission(dt, state) {
    const def = this.activeMission;

    // Engine failure after specified time
    if (this.missionTimer > def.engineFailureTime && this.missionState.phase === 'active') {
      this.missionState.phase = 'engine_out';
      state.throttle = 0;
      // Engine will not respond
    }

    if (this.missionState.phase === 'engine_out') {
      state.throttle = 0;
      state.engineRPM *= 0.98; // Engine spooling down
    }

    // Check for successful landing
    if (state.onGround) {
      const dx = state.x - def.targetRunway.x;
      const dz = state.z - def.targetRunway.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist < 2000 && Math.abs(state.verticalSpeed) < 5) {
        return this._completeMission('success');
      } else {
        this.score = Math.max(0, this.score - 50);
        return this._completeMission('crash');
      }
    }

    this._updateMissionHUD();
    return null;
  }

  _completeMission(reason) {
    this.isComplete = true;

    // Time bonus
    if (this.activeMission.timeLimit) {
      const timeRatio = this.missionTimer / this.activeMission.timeLimit;
      if (timeRatio < 0.5) this.score += 20;
      else if (timeRatio < 0.75) this.score += 10;
    }

    this.score = Math.max(0, Math.min(100, Math.round(this.score)));

    const minutes = Math.floor(this.missionTimer / 60);
    const seconds = Math.floor(this.missionTimer % 60);

    const result = {
      reason,
      score: this.score,
      time: `${minutes}:${String(seconds).padStart(2, '0')}`,
      missionId: this.activeMission.id,
    };

    document.getElementById('mission-hud')?.classList.add('hidden');
    this._clearCheckpoints();

    return result;
  }

  _updateMissionHUD() {
    const t = this.i18n.t.bind(this.i18n);

    // Objective
    if (this.hudElements.objective) {
      const def = this.activeMission;
      let text = '';

      switch (def.type) {
        case 'navigation':
        case 'slalom':
        case 'speed':
          text = `${t('mission.checkpoint')} ${this.currentCheckpoint + 1}/${def.checkpoints.length}`;
          break;
        case 'landing':
          text = t('mission.landAtRunway');
          break;
        case 'emergency':
          text = this.missionState.phase === 'engine_out'
            ? t('mission.engineOut')
            : t('mission.flyNormally');
          break;
      }

      this.hudElements.objective.textContent = text;
    }

    // Timer
    if (this.hudElements.timer) {
      const minutes = Math.floor(this.missionTimer / 60);
      const seconds = Math.floor(this.missionTimer % 60);
      const ms = Math.floor((this.missionTimer % 1) * 100);
      this.hudElements.timer.textContent = `${minutes}:${String(seconds).padStart(2, '0')}.${String(ms).padStart(2, '0')}`;
    }

    // Score
    if (this.hudElements.score) {
      this.hudElements.score.textContent = `Score: ${this.score}`;
    }
  }

  stopMission() {
    this.activeMission = null;
    this.isComplete = false;
    this._clearCheckpoints();
    document.getElementById('mission-hud')?.classList.add('hidden');
  }
}
