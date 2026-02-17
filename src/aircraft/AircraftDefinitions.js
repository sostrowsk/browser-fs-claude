/**
 * Aircraft Definitions - Physical parameters for each aircraft type
 */

export const AIRCRAFT = {
  cessna172: {
    id: 'cessna172',
    name: 'Cessna 172',
    category: 'Einmotorig / Propeller',
    categoryEn: 'Single Engine / Propeller',
    icon: '\u2708',
    difficulty: 1,

    // Mass & geometry
    mass: 1111,            // kg (max takeoff)
    wingArea: 16.2,        // m²
    wingspan: 11.0,        // m
    aspectRatio: 7.5,
    oswaldEfficiency: 0.8,

    // Aerodynamics
    liftSlope: 0.1,        // Cl per degree
    maxCl: 1.6,
    cd0: 0.027,            // parasitic drag
    aoaZeroLift: -2,       // degrees
    stallAngle: 16,        // degrees
    flapLiftBonus: 1.5,    // extra Cl per flap setting
    flapDragPenalty: 0.015, // extra Cd per flap setting

    // Engine
    maxThrust: 6000,       // Newtons (roughly 160hp propeller)
    engineSpoolUp: 3.0,
    engineSpoolDown: 2.0,

    // Control authority
    controlSpeed: 30,       // m/s for full authority
    pitchAuthority: 0.15,
    rollAuthority: 0.25,
    yawAuthority: 0.1,
    pitchDamping: 0.3,
    rollDamping: 0.4,
    yawDamping: 0.3,

    // Moments of inertia (simplified)
    momentOfInertia: {
      pitch: 1500,
      roll: 800,
      yaw: 1800,
    },

    // Gear
    gearDrag: 0.02,
    gearRetractable: false,

    // Performance specs (for display)
    specs: {
      maxSpeedKts: 126,
      cruiseSpeedKts: 122,
      stallSpeedKts: 47,
      maxAltitudeFt: 14000,
      climbRateFPM: 730,
      rangeMi: 640,
    },
  },

  boeing737: {
    id: 'boeing737',
    name: 'Boeing 737-800',
    category: 'Verkehrsflugzeug',
    categoryEn: 'Airliner',
    icon: '\u2708',
    difficulty: 2,

    mass: 65000,
    wingArea: 124.6,
    wingspan: 35.8,
    aspectRatio: 9.4,
    oswaldEfficiency: 0.82,

    liftSlope: 0.095,
    maxCl: 2.0,
    cd0: 0.022,
    aoaZeroLift: -1.5,
    stallAngle: 18,
    flapLiftBonus: 2.0,
    flapDragPenalty: 0.025,

    maxThrust: 240000,   // 2x CFM56
    engineSpoolUp: 1.5,
    engineSpoolDown: 1.0,

    controlSpeed: 60,
    pitchAuthority: 0.08,
    rollAuthority: 0.12,
    yawAuthority: 0.06,
    pitchDamping: 0.4,
    rollDamping: 0.5,
    yawDamping: 0.4,

    momentOfInertia: {
      pitch: 500000,
      roll: 300000,
      yaw: 600000,
    },

    gearDrag: 0.03,
    gearRetractable: true,

    specs: {
      maxSpeedKts: 460,
      cruiseSpeedKts: 453,
      stallSpeedKts: 120,
      maxAltitudeFt: 41000,
      climbRateFPM: 3000,
      rangeMi: 3115,
    },
  },

  f16: {
    id: 'f16',
    name: 'F-16 Fighting Falcon',
    category: 'Kampfjet',
    categoryEn: 'Fighter Jet',
    icon: '\u2708',
    difficulty: 3,

    mass: 12000,
    wingArea: 27.87,
    wingspan: 10.0,
    aspectRatio: 3.0,
    oswaldEfficiency: 0.85,

    liftSlope: 0.08,
    maxCl: 1.8,
    cd0: 0.02,
    aoaZeroLift: -1,
    stallAngle: 25,        // high AOA capability
    flapLiftBonus: 1.0,
    flapDragPenalty: 0.01,

    maxThrust: 130000,     // F110-GE with afterburner
    engineSpoolUp: 4.0,
    engineSpoolDown: 2.5,

    controlSpeed: 50,
    pitchAuthority: 0.35,
    rollAuthority: 0.65,
    yawAuthority: 0.2,
    pitchDamping: 0.2,
    rollDamping: 0.15,
    yawDamping: 0.25,

    momentOfInertia: {
      pitch: 15000,
      roll: 6000,
      yaw: 18000,
    },

    gearDrag: 0.03,
    gearRetractable: true,

    specs: {
      maxSpeedKts: 1320,
      cruiseSpeedKts: 530,
      stallSpeedKts: 130,
      maxAltitudeFt: 58000,
      climbRateFPM: 50000,
      rangeMi: 2280,
    },
  },
};

export function getAircraftList() {
  return Object.values(AIRCRAFT);
}

export function getAircraftById(id) {
  return AIRCRAFT[id] || AIRCRAFT.cessna172;
}
