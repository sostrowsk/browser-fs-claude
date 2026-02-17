/**
 * PhysicsEngine - Simplified aerodynamic flight physics
 *
 * Models: Lift, Drag, Thrust, Weight, Stall, Ground contact
 */

const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;
const GRAVITY = 9.81; // m/s²
const AIR_DENSITY_SEA = 1.225; // kg/m³
const FEET_PER_METER = 3.28084;
const KNOTS_PER_MS = 1.94384;
const FPM_PER_MS = 196.85;

export class PhysicsEngine {
  constructor() {
    this.state = {
      // Position (meters, world space)
      x: 0, y: 100, z: 0,

      // Velocity (m/s, body frame)
      vx: 0, vy: 0, vz: 0,

      // Euler angles (radians)
      pitch: 0,   // nose up positive
      roll: 0,    // right wing down positive
      yaw: 0,     // clockwise from north positive

      // Angular velocities (rad/s)
      pitchRate: 0,
      rollRate: 0,
      yawRate: 0,

      // Engine
      throttle: 0,       // 0-1
      engineRPM: 0,      // normalized 0-1

      // Controls
      elevator: 0,       // -1 to 1 (pitch)
      aileron: 0,        // -1 to 1 (roll)
      rudder: 0,         // -1 to 1 (yaw)

      // Systems
      gear: true,
      flaps: 0,          // 0, 1, 2, 3 (degrees: 0, 10, 20, 40)
      brakes: false,

      // Computed
      airspeed: 0,       // m/s
      groundSpeed: 0,    // m/s
      altitude: 100,     // meters
      altitudeAGL: 100,  // above ground level
      verticalSpeed: 0,  // m/s
      heading: 0,        // degrees
      aoa: 0,            // angle of attack (degrees)
      gForce: 1,
      onGround: false,
      isStalling: false,
      stallWarning: false,

      // Wind
      windX: 0, windZ: 0, windGust: 0,
    };

    this.aircraft = null;
    this.terrainHeightFn = () => 0;
  }

  setAircraft(aircraftDef) {
    this.aircraft = aircraftDef;
  }

  setTerrainHeightFunction(fn) {
    this.terrainHeightFn = fn;
  }

  reset(x, y, z, heading) {
    const s = this.state;
    s.x = x; s.y = y; s.z = z;
    s.vx = 0; s.vy = 0; s.vz = 0;
    s.pitch = 0; s.roll = 0; s.yaw = heading * DEG2RAD;
    s.pitchRate = 0; s.rollRate = 0; s.yawRate = 0;
    s.throttle = 0; s.engineRPM = 0;
    s.elevator = 0; s.aileron = 0; s.rudder = 0;
    s.gear = true; s.flaps = 0; s.brakes = false;
    s.airspeed = 0; s.groundSpeed = 0;
    s.altitude = y; s.altitudeAGL = y - this.terrainHeightFn(x, z);
    s.verticalSpeed = 0; s.heading = heading;
    s.aoa = 0; s.gForce = 1; s.onGround = false;
    s.isStalling = false; s.stallWarning = false;
  }

  getAirDensity(altitude) {
    // Simple ISA model
    return AIR_DENSITY_SEA * Math.exp(-altitude / 8500);
  }

  update(dt) {
    if (!this.aircraft) return;
    const ac = this.aircraft;
    const s = this.state;

    // Clamp dt to prevent physics explosion
    dt = Math.min(dt, 0.05);

    // Sub-stepping for stability
    const steps = 4;
    const subDt = dt / steps;

    for (let step = 0; step < steps; step++) {
      this._physicsStep(subDt, ac, s);
    }

    // Update computed values
    const groundH = this.terrainHeightFn(s.x, s.z);
    s.altitude = s.y;
    s.altitudeAGL = s.y - groundH;
    s.heading = ((s.yaw * RAD2DEG) % 360 + 360) % 360;

    // Airspeed in various units
    const vTotal = Math.sqrt(s.vx * s.vx + s.vy * s.vy + s.vz * s.vz);
    s.airspeed = vTotal;
    s.groundSpeed = Math.sqrt(s.vx * s.vx + s.vz * s.vz);
  }

  _physicsStep(dt, ac, s) {
    const rho = this.getAirDensity(s.altitude);

    // === Engine ===
    const targetRPM = s.throttle;
    const rpmResponse = s.engineRPM < targetRPM ? ac.engineSpoolUp : ac.engineSpoolDown;
    s.engineRPM += (targetRPM - s.engineRPM) * rpmResponse * dt;

    const thrust = s.engineRPM * ac.maxThrust;

    // === Airspeed (body frame) ===
    // Transform world velocity to body frame
    const cosY = Math.cos(s.yaw), sinY = Math.sin(s.yaw);
    const cosP = Math.cos(s.pitch), sinP = Math.sin(s.pitch);
    const cosR = Math.cos(s.roll), sinR = Math.sin(s.roll);

    // Forward velocity component (body frame)
    const vForward = s.vx * sinY + s.vz * cosY;
    const vUp = s.vy;
    const vSide = s.vx * cosY - s.vz * sinY;

    const speed = Math.sqrt(vForward * vForward + vUp * vUp + vSide * vSide);

    // === Angle of Attack ===
    let aoa = 0;
    if (Math.abs(vForward) > 1) {
      aoa = Math.atan2(vUp, vForward) - s.pitch;
    }
    s.aoa = aoa * RAD2DEG;

    // === Lift ===
    const flapBonus = s.flaps * ac.flapLiftBonus;
    const aoaDeg = aoa * RAD2DEG;
    const clBase = ac.liftSlope * (aoaDeg + ac.aoaZeroLift + flapBonus);

    // Stall model
    const stallAngle = ac.stallAngle + s.flaps * 2;
    const stallWarningAngle = stallAngle - 3;

    s.stallWarning = Math.abs(aoaDeg) > stallWarningAngle && speed > 10;

    let cl;
    if (Math.abs(aoaDeg) > stallAngle) {
      s.isStalling = true;
      // Post-stall: reduced lift, increases drag
      const stallFactor = 1 - Math.min((Math.abs(aoaDeg) - stallAngle) / 15, 0.7);
      cl = clBase * stallFactor;
    } else {
      s.isStalling = false;
      cl = clBase;
    }

    cl = Math.max(-1.5, Math.min(cl, ac.maxCl + flapBonus * 0.1));

    const dynamicPressure = 0.5 * rho * speed * speed;
    const liftForce = cl * dynamicPressure * ac.wingArea;

    // === Drag ===
    const cdInduced = (cl * cl) / (Math.PI * ac.aspectRatio * ac.oswaldEfficiency);
    const cdFlap = s.flaps * ac.flapDragPenalty;
    const cdGear = s.gear ? ac.gearDrag : 0;
    const cd = ac.cd0 + cdInduced + cdFlap + cdGear;
    const dragForce = cd * dynamicPressure * ac.wingArea;

    // === Forces in body frame ===
    // Thrust acts along body forward axis
    let fx = thrust * cosP - dragForce * (vForward / (speed + 0.1));
    let fy = liftForce * cosR - ac.mass * GRAVITY + thrust * sinP;
    let fz = -dragForce * (vSide / (speed + 0.1)) - liftForce * sinR;

    // === Angular dynamics ===
    const controlAuthority = Math.min(speed / ac.controlSpeed, 1.0);
    const qBar = dynamicPressure * ac.wingArea;

    // Pitch
    const pitchMoment = s.elevator * ac.pitchAuthority * controlAuthority * qBar
      - s.pitchRate * ac.pitchDamping * qBar;
    s.pitchRate += (pitchMoment / ac.momentOfInertia.pitch) * dt;

    // Roll
    const rollMoment = s.aileron * ac.rollAuthority * controlAuthority * qBar
      - s.rollRate * ac.rollDamping * qBar;
    s.rollRate += (rollMoment / ac.momentOfInertia.roll) * dt;

    // Yaw
    const yawMoment = s.rudder * ac.yawAuthority * controlAuthority * qBar
      - s.yawRate * ac.yawDamping * qBar
      + s.rollRate * 0.05 * qBar; // adverse yaw coupling
    s.yawRate += (yawMoment / ac.momentOfInertia.yaw) * dt;

    // Stall effects: random roll tendency
    if (s.isStalling) {
      s.rollRate += (Math.random() - 0.5) * 2.0 * dt;
      s.pitchRate += 0.5 * dt; // nose drops in stall
    }

    // Update angles
    s.pitch += s.pitchRate * dt;
    s.roll += s.rollRate * dt;
    s.yaw += s.yawRate * dt;

    // Clamp pitch
    s.pitch = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, s.pitch));

    // === Convert forces to world frame and update velocity ===
    const ax = (fx * sinY + fz * cosY) / ac.mass;
    const ay = fy / ac.mass;
    const az = (fx * cosY - fz * sinY) / ac.mass;

    // Wind
    const windFactor = 0.1;
    const gustX = s.windGust * (Math.sin(Date.now() * 0.001) * 0.5);
    const gustZ = s.windGust * (Math.cos(Date.now() * 0.0013) * 0.5);

    s.vx += (ax + (s.windX + gustX) * windFactor) * dt;
    s.vy += ay * dt;
    s.vz += (az + (s.windZ + gustZ) * windFactor) * dt;

    // G-force (approximate)
    s.gForce = (ay + GRAVITY) / GRAVITY;

    // Update position
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    s.z += s.vz * dt;
    s.verticalSpeed = s.vy;

    // === Ground collision ===
    const groundH = this.terrainHeightFn(s.x, s.z);
    if (s.y <= groundH + 0.5) {
      s.y = groundH + 0.5;
      s.onGround = true;

      // Ground friction / braking
      if (s.vy < 0) {
        s.vy = 0;
      }

      // Hard landing detection
      if (s.verticalSpeed < -5) {
        // Crash - for now just stop
        s.vx *= 0.5;
        s.vz *= 0.5;
      }

      // Ground roll friction
      if (s.gear) {
        const friction = s.brakes ? 0.4 : 0.02;
        const groundSpeed = Math.sqrt(s.vx * s.vx + s.vz * s.vz);
        if (groundSpeed > 0.1) {
          const frictionForce = friction * ac.mass * GRAVITY;
          const decel = frictionForce / ac.mass;
          const ratio = Math.max(0, 1 - (decel * dt) / groundSpeed);
          s.vx *= ratio;
          s.vz *= ratio;
        }
      }

      // Level out on ground
      s.pitch *= 0.95;
      s.roll *= 0.95;
      s.pitchRate *= 0.9;
      s.rollRate *= 0.9;
    } else {
      s.onGround = false;
    }
  }

  // Helper conversions
  getAirspeedKnots() {
    return this.state.airspeed * KNOTS_PER_MS;
  }

  getAltitudeFeet() {
    return this.state.altitude * FEET_PER_METER;
  }

  getAltitudeAGLFeet() {
    return this.state.altitudeAGL * FEET_PER_METER;
  }

  getVerticalSpeedFPM() {
    return this.state.verticalSpeed * FPM_PER_MS;
  }
}
