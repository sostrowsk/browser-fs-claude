/**
 * Weather - Dynamic weather system with visual and physics effects
 */
import * as THREE from 'three';

export const WEATHER_TYPES = {
  CLEAR: 'clear',
  CLOUDY: 'cloudy',
  RAIN: 'rain',
  FOG: 'fog',
};

export class Weather {
  constructor(scene) {
    this.scene = scene;
    this.type = WEATHER_TYPES.CLEAR;
    this.intensity = 0; // 0-1
    this.windSpeed = 0; // m/s
    this.windDirection = 0; // radians
    this.gustIntensity = 0;
    this.visibility = 1; // 0-1

    // Cloud system
    this.clouds = [];
    this._createClouds();

    // Rain particles
    this.rainGroup = new THREE.Group();
    this.scene.add(this.rainGroup);
    this.rainParticles = null;
  }

  _createClouds() {
    const cloudGeo = new THREE.SphereGeometry(1, 8, 6);
    const cloudMat = new THREE.MeshPhongMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.8,
      emissive: 0x333333,
    });
    this.cloudMaterial = cloudMat;

    // Create cloud cluster templates
    for (let i = 0; i < 40; i++) {
      const cloud = this._createCloudCluster(cloudGeo, cloudMat);
      const angle = Math.random() * Math.PI * 2;
      const dist = 2000 + Math.random() * 15000;
      cloud.position.set(
        Math.cos(angle) * dist,
        600 + Math.random() * 800,
        Math.sin(angle) * dist
      );
      cloud.userData.baseY = cloud.position.y;
      cloud.userData.speed = 5 + Math.random() * 10;
      cloud.userData.angle = angle;
      this.scene.add(cloud);
      this.clouds.push(cloud);
    }
  }

  _createCloudCluster(geo, mat) {
    const group = new THREE.Group();
    const count = 5 + Math.floor(Math.random() * 8);

    for (let i = 0; i < count; i++) {
      const puff = new THREE.Mesh(geo, mat);
      puff.position.set(
        (Math.random() - 0.5) * 200,
        (Math.random() - 0.5) * 40,
        (Math.random() - 0.5) * 200
      );
      const s = 50 + Math.random() * 100;
      puff.scale.set(s, s * 0.4, s);
      group.add(puff);
    }

    return group;
  }

  _createRain() {
    if (this.rainParticles) return;

    const count = 5000;
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 500;
      positions[i * 3 + 1] = Math.random() * 300;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 500;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.PointsMaterial({
      color: 0xaaaacc,
      size: 1.5,
      transparent: true,
      opacity: 0.6,
    });

    this.rainParticles = new THREE.Points(geo, mat);
    this.rainGroup.add(this.rainParticles);
  }

  _removeRain() {
    if (this.rainParticles) {
      this.rainGroup.remove(this.rainParticles);
      this.rainParticles.geometry.dispose();
      this.rainParticles = null;
    }
  }

  setWeather(type, intensity = 0.5) {
    this.type = type;
    this.intensity = intensity;

    switch (type) {
      case WEATHER_TYPES.CLEAR:
        this.windSpeed = 2 + Math.random() * 5;
        this.gustIntensity = 0.5;
        this.visibility = 1;
        this._removeRain();
        break;

      case WEATHER_TYPES.CLOUDY:
        this.windSpeed = 5 + Math.random() * 10;
        this.gustIntensity = 2;
        this.visibility = 0.8;
        this._removeRain();
        break;

      case WEATHER_TYPES.RAIN:
        this.windSpeed = 8 + Math.random() * 15;
        this.gustIntensity = 5;
        this.visibility = 0.5;
        this._createRain();
        break;

      case WEATHER_TYPES.FOG:
        this.windSpeed = 1 + Math.random() * 3;
        this.gustIntensity = 0.3;
        this.visibility = 0.15;
        this._removeRain();
        break;
    }

    this.windDirection = Math.random() * Math.PI * 2;
  }

  update(dt, playerX, playerY, playerZ, fogRef) {
    // Update clouds
    for (const cloud of this.clouds) {
      cloud.position.x += Math.cos(this.windDirection) * cloud.userData.speed * dt;
      cloud.position.z += Math.sin(this.windDirection) * cloud.userData.speed * dt;

      // Wrap clouds around player
      const dx = cloud.position.x - playerX;
      const dz = cloud.position.z - playerZ;
      if (Math.abs(dx) > 15000) cloud.position.x = playerX - Math.sign(dx) * 15000;
      if (Math.abs(dz) > 15000) cloud.position.z = playerZ - Math.sign(dz) * 15000;

      // Bob up and down
      cloud.position.y = cloud.userData.baseY + Math.sin(Date.now() * 0.0002 + cloud.userData.angle) * 10;
    }

    // Cloud density based on weather
    const targetOpacity = this.type === WEATHER_TYPES.CLEAR ? 0.4 :
                          this.type === WEATHER_TYPES.CLOUDY ? 0.85 :
                          this.type === WEATHER_TYPES.RAIN ? 0.9 : 0.6;
    this.cloudMaterial.opacity += (targetOpacity - this.cloudMaterial.opacity) * dt * 2;

    // Rain
    if (this.rainParticles) {
      const positions = this.rainParticles.geometry.attributes.position;
      for (let i = 0; i < positions.count; i++) {
        let y = positions.getY(i);
        y -= (20 + this.intensity * 30) * dt * 60;
        if (y < -50) y = 300;
        positions.setY(i, y);

        // Wind drift
        let x = positions.getX(i);
        let z = positions.getZ(i);
        x += Math.cos(this.windDirection) * this.windSpeed * dt * 3;
        z += Math.sin(this.windDirection) * this.windSpeed * dt * 3;
        positions.setX(i, x);
        positions.setZ(i, z);
      }
      positions.needsUpdate = true;

      this.rainGroup.position.set(playerX, playerY, playerZ);
    }

    // Fog density
    if (fogRef) {
      const baseDensity = 0.00004;
      const targetDensity = this.type === WEATHER_TYPES.FOG ? 0.002 :
                            this.type === WEATHER_TYPES.RAIN ? 0.0003 :
                            this.type === WEATHER_TYPES.CLOUDY ? 0.00008 : baseDensity;
      fogRef.density += (targetDensity - fogRef.density) * dt * 0.5;
    }

    // Update wind physics values
    this.gustIntensity = this.windSpeed * 0.3 * (0.5 + 0.5 * Math.sin(Date.now() * 0.001));
  }

  getWindComponents() {
    const gust = this.gustIntensity * Math.sin(Date.now() * 0.002);
    return {
      x: Math.cos(this.windDirection) * (this.windSpeed + gust),
      z: Math.sin(this.windDirection) * (this.windSpeed + gust),
      gust: this.gustIntensity,
    };
  }
}
