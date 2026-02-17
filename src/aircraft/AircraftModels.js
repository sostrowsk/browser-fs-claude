/**
 * AircraftModels - Procedural 3D aircraft models using Three.js geometry
 */
import * as THREE from 'three';

const mat = (color, emissive = 0x000000) => new THREE.MeshPhongMaterial({
  color, emissive, flatShading: false, side: THREE.DoubleSide,
});

export function createAircraftModel(aircraftId) {
  switch (aircraftId) {
    case 'cessna172': return createCessna();
    case 'boeing737': return createBoeing737();
    case 'f16': return createF16();
    default: return createCessna();
  }
}

function createCessna() {
  const group = new THREE.Group();
  const body = mat(0xeeeeee);
  const accent = mat(0x1565c0);
  const dark = mat(0x333333);
  const glass = new THREE.MeshPhongMaterial({ color: 0x88ccff, transparent: true, opacity: 0.4 });

  // Fuselage
  const fuselage = new THREE.Mesh(
    new THREE.CylinderGeometry(0.5, 0.35, 5, 8),
    body
  );
  fuselage.rotation.z = Math.PI / 2;
  group.add(fuselage);

  // Nose cone
  const nose = new THREE.Mesh(
    new THREE.ConeGeometry(0.5, 1.2, 8),
    body
  );
  nose.rotation.z = -Math.PI / 2;
  nose.position.x = 3.1;
  group.add(nose);

  // Tail cone
  const tailCone = new THREE.Mesh(
    new THREE.ConeGeometry(0.35, 1.5, 8),
    body
  );
  tailCone.rotation.z = Math.PI / 2;
  tailCone.position.x = -3.0;
  group.add(tailCone);

  // Wings
  const wingGeo = new THREE.BoxGeometry(1.2, 0.06, 10);
  const wing = new THREE.Mesh(wingGeo, accent);
  wing.position.set(0.2, 0.3, 0);
  group.add(wing);

  // Horizontal stabilizer
  const hStab = new THREE.Mesh(
    new THREE.BoxGeometry(0.6, 0.04, 3.5),
    accent
  );
  hStab.position.set(-3.2, 0, 0);
  group.add(hStab);

  // Vertical stabilizer
  const vStab = new THREE.Mesh(
    new THREE.BoxGeometry(1.0, 1.5, 0.05),
    accent
  );
  vStab.position.set(-3.0, 0.75, 0);
  group.add(vStab);

  // Cockpit glass
  const cockpit = new THREE.Mesh(
    new THREE.SphereGeometry(0.48, 8, 6, 0, Math.PI),
    glass
  );
  cockpit.rotation.z = -Math.PI / 2;
  cockpit.position.set(1.2, 0.3, 0);
  group.add(cockpit);

  // Landing gear struts
  const strutGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.8);
  const wheelGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.06, 12);

  // Nose gear
  const noseStrut = new THREE.Mesh(strutGeo, dark);
  noseStrut.position.set(2.0, -0.7, 0);
  group.add(noseStrut);
  const noseWheel = new THREE.Mesh(wheelGeo, dark);
  noseWheel.rotation.x = Math.PI / 2;
  noseWheel.position.set(2.0, -1.1, 0);
  group.add(noseWheel);

  // Main gear
  [-1.2, 1.2].forEach(z => {
    const strut = new THREE.Mesh(strutGeo, dark);
    strut.position.set(0, -0.7, z);
    group.add(strut);
    const wheel = new THREE.Mesh(wheelGeo, dark);
    wheel.rotation.x = Math.PI / 2;
    wheel.position.set(0, -1.1, z);
    group.add(wheel);
  });

  // Propeller
  const propGroup = new THREE.Group();
  const propBlade = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 1.5, 0.15),
    dark
  );
  propGroup.add(propBlade);
  const propBlade2 = propBlade.clone();
  propBlade2.rotation.x = Math.PI / 2;
  propGroup.add(propBlade2);
  propGroup.position.set(3.7, 0, 0);
  propGroup.name = 'propeller';
  group.add(propGroup);

  // Stripe
  const stripe = new THREE.Mesh(
    new THREE.BoxGeometry(4, 0.01, 0.3),
    mat(0xff1744)
  );
  stripe.position.set(0, 0.51, 0);
  group.add(stripe);

  group.scale.set(0.8, 0.8, 0.8);
  return group;
}

function createBoeing737() {
  const group = new THREE.Group();
  const body = mat(0xfafafa);
  const accent = mat(0x0d47a1);
  const dark = mat(0x444444);
  const glass = new THREE.MeshPhongMaterial({ color: 0x88ccff, transparent: true, opacity: 0.3 });
  const engineMat = mat(0x666666);

  // Fuselage
  const fuselage = new THREE.Mesh(
    new THREE.CylinderGeometry(1.5, 1.5, 25, 12),
    body
  );
  fuselage.rotation.z = Math.PI / 2;
  group.add(fuselage);

  // Nose
  const nose = new THREE.Mesh(
    new THREE.SphereGeometry(1.5, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2),
    body
  );
  nose.rotation.z = -Math.PI / 2;
  nose.position.x = 12.5;
  group.add(nose);

  // Cockpit windows
  const cockpitGlass = new THREE.Mesh(
    new THREE.SphereGeometry(1.48, 8, 6, -0.3, 0.6, 0, 0.5),
    glass
  );
  cockpitGlass.rotation.z = -Math.PI / 2;
  cockpitGlass.position.set(12.5, 0.2, 0);
  group.add(cockpitGlass);

  // Tail cone
  const tailCone = new THREE.Mesh(
    new THREE.ConeGeometry(1.5, 5, 12),
    body
  );
  tailCone.rotation.z = Math.PI / 2;
  tailCone.position.x = -15;
  group.add(tailCone);

  // Wings (swept)
  const wingShape = new THREE.Shape();
  wingShape.moveTo(0, 0);
  wingShape.lineTo(3, 0);
  wingShape.lineTo(1, 14);
  wingShape.lineTo(-1, 14);
  wingShape.lineTo(-1, 0);

  const wingGeo = new THREE.ExtrudeGeometry(wingShape, { depth: 0.3, bevelEnabled: false });
  const wingL = new THREE.Mesh(wingGeo, accent);
  wingL.rotation.set(Math.PI / 2, 0, 0);
  wingL.position.set(-1, -0.5, 0.15);
  group.add(wingL);

  const wingR = wingL.clone();
  wingR.rotation.set(-Math.PI / 2, 0, 0);
  wingR.position.set(-1, -0.5, -0.15);
  group.add(wingR);

  // Horizontal stabilizer
  const hStabShape = new THREE.Shape();
  hStabShape.moveTo(0, 0);
  hStabShape.lineTo(1.5, 0);
  hStabShape.lineTo(0.5, 5);
  hStabShape.lineTo(-0.5, 5);
  hStabShape.lineTo(-0.5, 0);

  const hStabGeo = new THREE.ExtrudeGeometry(hStabShape, { depth: 0.15, bevelEnabled: false });
  const hStabL = new THREE.Mesh(hStabGeo, accent);
  hStabL.rotation.set(Math.PI / 2, 0, 0);
  hStabL.position.set(-14, 0.5, 0.075);
  group.add(hStabL);
  const hStabR = hStabL.clone();
  hStabR.rotation.set(-Math.PI / 2, 0, 0);
  hStabR.position.set(-14, 0.5, -0.075);
  group.add(hStabR);

  // Vertical stabilizer
  const vStab = new THREE.Mesh(
    new THREE.BoxGeometry(4, 5, 0.15),
    accent
  );
  vStab.position.set(-14, 3.5, 0);
  group.add(vStab);

  // Engines (under wings)
  [-5, 5].forEach(z => {
    const nacelle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.7, 0.8, 3.5, 10),
      engineMat
    );
    nacelle.rotation.z = Math.PI / 2;
    nacelle.position.set(1, -1.8, z);
    group.add(nacelle);

    // Engine intake
    const intake = new THREE.Mesh(
      new THREE.RingGeometry(0.3, 0.8, 10),
      dark
    );
    intake.rotation.y = Math.PI / 2;
    intake.position.set(2.8, -1.8, z);
    group.add(intake);
  });

  // Window line (decorative stripe)
  const windowLine = new THREE.Mesh(
    new THREE.BoxGeometry(22, 0.01, 0.2),
    accent
  );
  windowLine.position.set(-0.5, 0.8, 1.5);
  group.add(windowLine);
  const windowLine2 = windowLine.clone();
  windowLine2.position.z = -1.5;
  group.add(windowLine2);

  group.scale.set(0.35, 0.35, 0.35);
  return group;
}

function createF16() {
  const group = new THREE.Group();
  const body = mat(0x8899aa);
  const accent = mat(0x556677);
  const dark = mat(0x333333);
  const glass = new THREE.MeshPhongMaterial({ color: 0x77bbee, transparent: true, opacity: 0.35 });

  // Fuselage
  const fuselage = new THREE.Mesh(
    new THREE.CylinderGeometry(0.6, 0.45, 10, 8),
    body
  );
  fuselage.rotation.z = Math.PI / 2;
  group.add(fuselage);

  // Nose cone (pointed)
  const noseCone = new THREE.Mesh(
    new THREE.ConeGeometry(0.45, 3.5, 8),
    accent
  );
  noseCone.rotation.z = -Math.PI / 2;
  noseCone.position.x = 6.5;
  group.add(noseCone);

  // Intake (under nose)
  const intake = new THREE.Mesh(
    new THREE.BoxGeometry(2, 0.5, 0.8),
    dark
  );
  intake.position.set(3, -0.5, 0);
  group.add(intake);

  // Canopy
  const canopy = new THREE.Mesh(
    new THREE.SphereGeometry(0.45, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.6),
    glass
  );
  canopy.position.set(3, 0.35, 0);
  canopy.scale.set(2, 1, 1);
  group.add(canopy);

  // Delta wings
  const wingShape = new THREE.Shape();
  wingShape.moveTo(0, 0);
  wingShape.lineTo(3, 0);
  wingShape.lineTo(-1, 5);
  wingShape.lineTo(-2, 5);
  wingShape.lineTo(-2, 0);

  const wingGeo = new THREE.ExtrudeGeometry(wingShape, { depth: 0.1, bevelEnabled: false });
  const wingL = new THREE.Mesh(wingGeo, body);
  wingL.rotation.set(Math.PI / 2, 0, 0);
  wingL.position.set(-1, -0.2, 0.05);
  group.add(wingL);

  const wingR = wingL.clone();
  wingR.rotation.set(-Math.PI / 2, 0, 0);
  wingR.position.set(-1, -0.2, -0.05);
  group.add(wingR);

  // Horizontal stabilizers
  const hStabShape = new THREE.Shape();
  hStabShape.moveTo(0, 0);
  hStabShape.lineTo(1.5, 0);
  hStabShape.lineTo(0, 2.5);
  hStabShape.lineTo(-0.5, 2.5);
  hStabShape.lineTo(-0.5, 0);

  const hStabGeo = new THREE.ExtrudeGeometry(hStabShape, { depth: 0.06, bevelEnabled: false });
  const hStabL = new THREE.Mesh(hStabGeo, accent);
  hStabL.rotation.set(Math.PI / 2, 0, 0);
  hStabL.position.set(-4.5, 0, 0.03);
  group.add(hStabL);
  const hStabR = hStabL.clone();
  hStabR.rotation.set(-Math.PI / 2, 0, 0);
  hStabR.position.set(-4.5, 0, -0.03);
  group.add(hStabR);

  // Vertical stabilizer
  const vStab = new THREE.Mesh(
    new THREE.BoxGeometry(2.5, 2.5, 0.06),
    accent
  );
  vStab.position.set(-3.5, 1.5, 0);
  vStab.rotation.z = 0.15;
  group.add(vStab);

  // Engine nozzle
  const nozzle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.4, 0.35, 1.5, 8),
    dark
  );
  nozzle.rotation.z = Math.PI / 2;
  nozzle.position.x = -5.5;
  group.add(nozzle);

  // Afterburner glow
  const abGlow = new THREE.Mesh(
    new THREE.ConeGeometry(0.3, 2, 8),
    new THREE.MeshBasicMaterial({ color: 0xff6600, transparent: true, opacity: 0 })
  );
  abGlow.rotation.z = Math.PI / 2;
  abGlow.position.x = -7;
  abGlow.name = 'afterburner';
  group.add(abGlow);

  // Wingtip missiles (decorative)
  [-5.2, 5.2].forEach(z => {
    const missile = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 1.5, 6),
      mat(0xcccccc)
    );
    missile.rotation.z = Math.PI / 2;
    missile.position.set(-0.5, -0.15, z);
    group.add(missile);
  });

  group.scale.set(0.9, 0.9, 0.9);
  return group;
}

/**
 * Create a mini preview model for menu display
 */
export function createPreviewModel(aircraftId) {
  const model = createAircraftModel(aircraftId);
  model.scale.multiplyScalar(0.4);
  return model;
}
