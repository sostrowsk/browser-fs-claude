/**
 * CameraManager - Multiple camera views for the flight simulator
 */
import * as THREE from 'three';

export const CAMERA_MODES = {
  COCKPIT: 'cockpit',
  CHASE: 'chase',
  ORBIT: 'orbit',
  FLYBY: 'flyby',
};

const MODE_NAMES = {
  cockpit: 'Cockpit',
  chase: 'Verfolgung',
  orbit: 'Freie Kamera',
  flyby: 'Flyby',
};

const MODE_NAMES_EN = {
  cockpit: 'Cockpit',
  chase: 'Chase',
  orbit: 'Free Camera',
  flyby: 'Flyby',
};

export class CameraManager {
  constructor(camera) {
    this.camera = camera;
    this.mode = CAMERA_MODES.COCKPIT;
    this.modes = [CAMERA_MODES.COCKPIT, CAMERA_MODES.CHASE, CAMERA_MODES.ORBIT, CAMERA_MODES.FLYBY];
    this.modeIndex = 0;

    // Chase camera params
    this.chaseDistance = 25;
    this.chaseHeight = 8;
    this.chaseSmoothing = 3;
    this.chasePos = new THREE.Vector3();
    this.chaseLookAt = new THREE.Vector3();

    // Orbit camera
    this.orbitAngle = 0;
    this.orbitPitch = 0.3;
    this.orbitDistance = 40;
    this.orbitTarget = new THREE.Vector3();

    // Flyby camera
    this.flybyPos = new THREE.Vector3();
    this.flybyTimer = 0;
    this.flybyInterval = 5; // seconds between position changes

    // Cockpit offset
    this.cockpitOffset = new THREE.Vector3(2.5, 0.8, 0);

    // Smooth interpolation targets
    this._targetPos = new THREE.Vector3();
    this._targetLookAt = new THREE.Vector3();
    this._currentLookAt = new THREE.Vector3();
  }

  nextMode() {
    this.modeIndex = (this.modeIndex + 1) % this.modes.length;
    this.mode = this.modes[this.modeIndex];
    return this.mode;
  }

  getModeName(lang = 'de') {
    return lang === 'en' ? (MODE_NAMES_EN[this.mode] || this.mode) : (MODE_NAMES[this.mode] || this.mode);
  }

  setCockpitOffset(offset) {
    this.cockpitOffset.copy(offset);
  }

  update(dt, aircraftPosition, aircraftQuaternion, aircraftVelocity) {
    switch (this.mode) {
      case CAMERA_MODES.COCKPIT:
        this._updateCockpit(dt, aircraftPosition, aircraftQuaternion);
        break;
      case CAMERA_MODES.CHASE:
        this._updateChase(dt, aircraftPosition, aircraftQuaternion);
        break;
      case CAMERA_MODES.ORBIT:
        this._updateOrbit(dt, aircraftPosition);
        break;
      case CAMERA_MODES.FLYBY:
        this._updateFlyby(dt, aircraftPosition, aircraftVelocity);
        break;
    }
  }

  _updateCockpit(dt, position, quaternion) {
    // Camera inside cockpit
    const offset = this.cockpitOffset.clone().applyQuaternion(quaternion);
    this.camera.position.copy(position).add(offset);
    this.camera.quaternion.copy(quaternion);
  }

  _updateChase(dt, position, quaternion) {
    // Behind and above the aircraft
    const behind = new THREE.Vector3(-this.chaseDistance, this.chaseHeight, 0);
    behind.applyQuaternion(quaternion);

    this._targetPos.copy(position).add(behind);

    // Smooth follow
    const t = 1 - Math.exp(-this.chaseSmoothing * dt);
    this.camera.position.lerp(this._targetPos, t);

    // Look at aircraft
    this._targetLookAt.copy(position);
    this._currentLookAt.lerp(this._targetLookAt, t);
    this.camera.lookAt(this._currentLookAt);
  }

  _updateOrbit(dt, position) {
    // Auto-orbit around aircraft
    this.orbitAngle += dt * 0.3;

    this.orbitTarget.lerp(position, 0.05);

    const x = Math.cos(this.orbitAngle) * this.orbitDistance;
    const z = Math.sin(this.orbitAngle) * this.orbitDistance;
    const y = Math.sin(this.orbitPitch) * this.orbitDistance;

    this.camera.position.set(
      this.orbitTarget.x + x,
      this.orbitTarget.y + y + 5,
      this.orbitTarget.z + z
    );
    this.camera.lookAt(this.orbitTarget);
  }

  _updateFlyby(dt, position, velocity) {
    this.flybyTimer += dt;

    if (this.flybyTimer > this.flybyInterval || this.flybyPos.distanceTo(position) > 500) {
      this.flybyTimer = 0;

      // Place camera ahead and to the side of aircraft path
      const vel = velocity || new THREE.Vector3(0, 0, 1);
      const dir = vel.clone().normalize();
      const side = new THREE.Vector3(-dir.z, 0, dir.x);

      this.flybyPos.copy(position)
        .add(dir.multiplyScalar(200 + Math.random() * 300))
        .add(side.multiplyScalar((Math.random() - 0.5) * 200));
      this.flybyPos.y = position.y + (Math.random() - 0.3) * 50;
    }

    this.camera.position.copy(this.flybyPos);
    this.camera.lookAt(position);
  }

  handleMouseOrbit(dx, dy) {
    if (this.mode === CAMERA_MODES.ORBIT) {
      this.orbitAngle += dx * 0.005;
      this.orbitPitch = Math.max(-0.5, Math.min(1.2, this.orbitPitch + dy * 0.005));
    }
  }

  handleMouseWheel(delta) {
    if (this.mode === CAMERA_MODES.ORBIT) {
      this.orbitDistance = Math.max(15, Math.min(200, this.orbitDistance + delta * 0.05));
    } else if (this.mode === CAMERA_MODES.CHASE) {
      this.chaseDistance = Math.max(10, Math.min(100, this.chaseDistance + delta * 0.05));
    }
  }
}
