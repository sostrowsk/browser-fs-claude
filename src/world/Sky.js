/**
 * Sky - Day/night cycle with sun, moon, stars and atmospheric rendering
 */
import * as THREE from 'three';

export class Sky {
  constructor(scene) {
    this.scene = scene;
    this.timeOfDay = 0.3; // 0-1 (0=midnight, 0.25=sunrise, 0.5=noon, 0.75=sunset)
    this.cycleSpeed = 0.002; // full day-night in ~8 minutes

    // Sky dome
    this.skyGeo = new THREE.SphereGeometry(20000, 32, 32);
    this.skyMat = new THREE.ShaderMaterial({
      uniforms: {
        sunPosition: { value: new THREE.Vector3(0, 1, 0) },
        timeOfDay: { value: 0.5 },
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPos.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 sunPosition;
        uniform float timeOfDay;
        varying vec3 vWorldPosition;

        vec3 dayTop = vec3(0.2, 0.5, 0.9);
        vec3 dayHorizon = vec3(0.6, 0.8, 1.0);
        vec3 sunsetTop = vec3(0.1, 0.1, 0.3);
        vec3 sunsetHorizon = vec3(0.9, 0.4, 0.1);
        vec3 nightTop = vec3(0.01, 0.01, 0.05);
        vec3 nightHorizon = vec3(0.02, 0.02, 0.08);

        void main() {
          vec3 dir = normalize(vWorldPosition);
          float y = dir.y;
          float horizonFactor = 1.0 - abs(y);

          // Time blending
          float dayFactor = smoothstep(0.2, 0.35, timeOfDay) * (1.0 - smoothstep(0.65, 0.8, timeOfDay));
          float sunsetFactor = smoothstep(0.15, 0.25, timeOfDay) * (1.0 - smoothstep(0.25, 0.35, timeOfDay))
                             + smoothstep(0.65, 0.75, timeOfDay) * (1.0 - smoothstep(0.75, 0.85, timeOfDay));
          float nightFactor = 1.0 - dayFactor - sunsetFactor;
          nightFactor = max(0.0, nightFactor);

          vec3 skyColor = mix(
            mix(dayTop, dayHorizon, horizonFactor * horizonFactor),
            mix(nightTop, nightHorizon, horizonFactor * horizonFactor),
            1.0 - dayFactor
          );

          // Sunset glow
          skyColor = mix(skyColor, mix(sunsetTop, sunsetHorizon, horizonFactor), sunsetFactor);

          // Sun glow
          float sunDot = max(0.0, dot(dir, normalize(sunPosition)));
          float sunGlow = pow(sunDot, 64.0) * dayFactor;
          float sunHalo = pow(sunDot, 8.0) * 0.3 * dayFactor;
          float sunsetGlow = pow(sunDot, 4.0) * sunsetFactor * 0.5;

          skyColor += vec3(1.0, 0.95, 0.8) * sunGlow;
          skyColor += vec3(1.0, 0.85, 0.6) * sunHalo;
          skyColor += vec3(1.0, 0.5, 0.2) * sunsetGlow;

          gl_FragColor = vec4(skyColor, 1.0);
        }
      `,
      side: THREE.BackSide,
    });

    this.skyMesh = new THREE.Mesh(this.skyGeo, this.skyMat);
    scene.add(this.skyMesh);

    // Sun light
    this.sunLight = new THREE.DirectionalLight(0xfff5e0, 1.0);
    this.sunLight.castShadow = false; // Performance: skip shadows for now
    scene.add(this.sunLight);

    // Ambient light
    this.ambientLight = new THREE.AmbientLight(0x404060, 0.3);
    scene.add(this.ambientLight);

    // Hemisphere light for nice sky/ground coloring
    this.hemiLight = new THREE.HemisphereLight(0x87ceeb, 0x362d1e, 0.4);
    scene.add(this.hemiLight);

    // Sun mesh (visual)
    this.sunMesh = new THREE.Mesh(
      new THREE.SphereGeometry(200, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0xffee88 })
    );
    scene.add(this.sunMesh);

    // Moon
    this.moonMesh = new THREE.Mesh(
      new THREE.SphereGeometry(120, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0xddeeff })
    );
    scene.add(this.moonMesh);

    // Stars
    this._createStars();

    // Fog
    this.fog = new THREE.FogExp2(0x87ceeb, 0.00004);
    scene.fog = this.fog;
  }

  _createStars() {
    const starCount = 2000;
    const positions = new Float32Array(starCount * 3);
    const sizes = new Float32Array(starCount);

    for (let i = 0; i < starCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 18000;

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = Math.abs(r * Math.cos(phi)); // Only upper hemisphere
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
      sizes[i] = Math.random() * 3 + 1;
    }

    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starGeo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    this.starMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 15,
      transparent: true,
      opacity: 0,
      sizeAttenuation: true,
    });

    this.stars = new THREE.Points(starGeo, this.starMaterial);
    this.scene.add(this.stars);
  }

  update(dt, playerX, playerZ) {
    this.timeOfDay = (this.timeOfDay + this.cycleSpeed * dt) % 1.0;

    const sunAngle = this.timeOfDay * Math.PI * 2 - Math.PI / 2;
    const sunX = Math.cos(sunAngle) * 15000;
    const sunY = Math.sin(sunAngle) * 15000;
    const sunZ = 3000;

    const sunPos = new THREE.Vector3(sunX, sunY, sunZ);
    sunPos.x += playerX;
    sunPos.z += playerZ;

    this.sunMesh.position.copy(sunPos);
    this.moonMesh.position.set(
      playerX - sunX,
      -sunY,
      playerZ - sunZ
    );

    // Update sun direction
    this.sunLight.position.copy(sunPos);
    this.sunLight.target.position.set(playerX, 0, playerZ);

    // Sky shader
    this.skyMat.uniforms.sunPosition.value.set(
      Math.cos(sunAngle),
      Math.sin(sunAngle),
      0.2
    );
    this.skyMat.uniforms.timeOfDay.value = this.timeOfDay;

    // Lighting intensity based on time
    const dayFactor = Math.max(0, Math.sin(this.timeOfDay * Math.PI * 2 - Math.PI / 2));
    const smoothDay = dayFactor * dayFactor;

    this.sunLight.intensity = smoothDay * 1.2;
    this.ambientLight.intensity = 0.1 + smoothDay * 0.4;
    this.hemiLight.intensity = 0.1 + smoothDay * 0.5;

    // Sun color shifts at sunset/sunrise
    const sunHeight = Math.sin(sunAngle);
    if (sunHeight > -0.1 && sunHeight < 0.3) {
      const t = (sunHeight + 0.1) / 0.4;
      this.sunLight.color.setHex(0xfff5e0).lerp(new THREE.Color(0xff8844), 1 - t);
    } else {
      this.sunLight.color.setHex(0xfff5e0);
    }

    // Stars visibility
    const starOpacity = Math.max(0, 1 - smoothDay * 3);
    this.starMaterial.opacity = starOpacity;

    // Moon visibility
    this.moonMesh.visible = starOpacity > 0.1;

    // Fog color and density
    const fogDay = new THREE.Color(0x87ceeb);
    const fogNight = new THREE.Color(0x0a0a1a);
    const fogSunset = new THREE.Color(0x664422);
    this.fog.color.copy(fogDay).lerp(fogNight, 1 - smoothDay);

    // Move sky dome with player
    this.skyMesh.position.set(playerX, 0, playerZ);
    this.stars.position.set(playerX, 0, playerZ);
  }

  setTimeOfDay(t) {
    this.timeOfDay = t;
  }
}
