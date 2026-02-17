/**
 * Terrain - Procedural terrain generation with LOD streaming
 */
import * as THREE from 'three';
import { SimplexNoise, fbm, ridgedNoise } from '../utils/Noise.js';

const CHUNK_SIZE = 500;       // meters per chunk
const CHUNK_SEGMENTS = 64;    // vertices per side
const VIEW_DISTANCE = 5;      // chunks in each direction
const SEA_LEVEL = 0;

export class Terrain {
  constructor(scene) {
    this.scene = scene;
    this.noise = new SimplexNoise(12345);
    this.noise2 = new SimplexNoise(67890);
    this.chunks = new Map();
    this.textureCanvas = this._createTerrainTexture();

    // Materials
    this.material = this._createMaterial();

    // Water plane
    this.water = this._createWater();
    scene.add(this.water);

    // Airport runways
    this.runways = [];
    this._createAirports();
  }

  _createTerrainTexture() {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Gradient texture based on height/slope
    const gradient = ctx.createLinearGradient(0, 0, 0, size);
    gradient.addColorStop(0, '#f5f5f5');  // Snow peaks
    gradient.addColorStop(0.15, '#9e9e9e'); // Rock
    gradient.addColorStop(0.3, '#5d4037');  // Brown rock
    gradient.addColorStop(0.45, '#2e7d32'); // Forest
    gradient.addColorStop(0.6, '#4caf50');  // Grass
    gradient.addColorStop(0.75, '#66bb6a'); // Light grass
    gradient.addColorStop(0.85, '#c8b560'); // Sand
    gradient.addColorStop(1.0, '#1565c0');  // Water

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    // Add noise to texture
    const noise = new SimplexNoise(999);
    const imageData = ctx.getImageData(0, 0, size, size);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const n = noise.noise2D(x * 0.05, y * 0.05) * 10;
        const idx = (y * size + x) * 4;
        imageData.data[idx] = Math.max(0, Math.min(255, imageData.data[idx] + n));
        imageData.data[idx + 1] = Math.max(0, Math.min(255, imageData.data[idx + 1] + n));
        imageData.data[idx + 2] = Math.max(0, Math.min(255, imageData.data[idx + 2] + n));
      }
    }
    ctx.putImageData(imageData, 0, 0);

    return canvas;
  }

  _createMaterial() {
    const texture = new THREE.CanvasTexture(this.textureCanvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;

    return new THREE.MeshPhongMaterial({
      vertexColors: true,
      flatShading: false,
      shininess: 5,
    });
  }

  _createWater() {
    const geometry = new THREE.PlaneGeometry(50000, 50000);
    const material = new THREE.MeshPhongMaterial({
      color: 0x1565c0,
      transparent: true,
      opacity: 0.7,
      shininess: 80,
      specular: 0x4fc3f7,
    });
    const water = new THREE.Mesh(geometry, material);
    water.rotation.x = -Math.PI / 2;
    water.position.y = SEA_LEVEL - 0.5;
    return water;
  }

  getHeight(worldX, worldZ) {
    const scale = 0.0004;
    const scale2 = 0.0015;

    // Base terrain (large features)
    let h = fbm(this.noise, worldX * scale, worldZ * scale, 6) * 300;

    // Mountain ridges
    const ridge = ridgedNoise(this.noise2, worldX * scale * 0.5, worldZ * scale * 0.5, 4);
    h += ridge * 200;

    // Hills (medium features)
    h += fbm(this.noise, worldX * scale2, worldZ * scale2, 4) * 50;

    // Valleys near center (flatten for airports)
    const distFromCenter = Math.sqrt(worldX * worldX + worldZ * worldZ);
    const flattenRadius = 2000;
    if (distFromCenter < flattenRadius) {
      const t = 1 - distFromCenter / flattenRadius;
      h = h * (1 - t * t * 0.95);
      h = Math.max(h, 2); // Ensure above sea level
    }

    // Second airport area
    const ax2 = worldX - 15000;
    const az2 = worldZ - 10000;
    const dist2 = Math.sqrt(ax2 * ax2 + az2 * az2);
    if (dist2 < flattenRadius) {
      const t = 1 - dist2 / flattenRadius;
      h = h * (1 - t * t * 0.95);
      h = Math.max(h, 2);
    }

    // Coastline - lower terrain on one side
    if (worldX > 10000) {
      const coastFactor = Math.min((worldX - 10000) / 5000, 1);
      h -= coastFactor * 150;
    }

    return h;
  }

  _getTerrainColor(height, slope) {
    const r = new THREE.Color();

    if (height < SEA_LEVEL + 1) {
      r.setHex(0xc8b560); // Beach sand
    } else if (height < 30) {
      r.setHex(0x66bb6a); // Grass
      r.lerp(new THREE.Color(0xc8b560), Math.max(0, 1 - height / 30));
    } else if (height < 100) {
      r.setHex(0x4caf50); // Green
      if (slope > 0.6) r.lerp(new THREE.Color(0x795548), slope);
    } else if (height < 200) {
      r.setHex(0x2e7d32); // Dark green / forest
      r.lerp(new THREE.Color(0x795548), Math.min(1, (height - 100) / 100));
    } else if (height < 350) {
      r.setHex(0x795548); // Brown rock
      r.lerp(new THREE.Color(0x9e9e9e), Math.min(1, (height - 200) / 150));
    } else {
      r.setHex(0x9e9e9e); // Rock
      if (height > 450) r.lerp(new THREE.Color(0xeeeeee), Math.min(1, (height - 450) / 100));
    }

    // Add slight random variation
    const variation = (Math.random() - 0.5) * 0.04;
    r.r = Math.max(0, Math.min(1, r.r + variation));
    r.g = Math.max(0, Math.min(1, r.g + variation));
    r.b = Math.max(0, Math.min(1, r.b + variation));

    return r;
  }

  _createChunkMesh(chunkX, chunkZ) {
    const geometry = new THREE.PlaneGeometry(CHUNK_SIZE, CHUNK_SIZE, CHUNK_SEGMENTS, CHUNK_SEGMENTS);
    geometry.rotateX(-Math.PI / 2);

    const positions = geometry.attributes.position;
    const colors = new Float32Array(positions.count * 3);

    const worldOffsetX = chunkX * CHUNK_SIZE;
    const worldOffsetZ = chunkZ * CHUNK_SIZE;

    for (let i = 0; i < positions.count; i++) {
      const lx = positions.getX(i);
      const lz = positions.getZ(i);
      const wx = lx + worldOffsetX;
      const wz = lz + worldOffsetZ;

      const h = this.getHeight(wx, wz);
      positions.setY(i, h);
    }

    // Compute normals for slope calculation
    geometry.computeVertexNormals();
    const normals = geometry.attributes.normal;

    for (let i = 0; i < positions.count; i++) {
      const h = positions.getY(i);
      const ny = normals.getY(i);
      const slope = 1 - ny; // 0 = flat, 1 = vertical

      const color = this._getTerrainColor(h, slope);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.computeVertexNormals(); // Recompute after height changes

    const mesh = new THREE.Mesh(geometry, this.material);
    mesh.position.set(worldOffsetX, 0, worldOffsetZ);
    mesh.receiveShadow = true;
    return mesh;
  }

  _createAirports() {
    // Airport 1: Near origin
    this._createRunway(0, 0, 0, 2000, 45);

    // Airport 2: 15km away
    this._createRunway(15000, 10000, 0, 2500, 90);
  }

  _createRunway(x, z, heading, length, width) {
    const h = this.getHeight(x, z) + 0.2;

    const group = new THREE.Group();

    // Main runway surface
    const runwayGeo = new THREE.PlaneGeometry(length, width);
    const runwayMat = new THREE.MeshPhongMaterial({ color: 0x404040 });
    const runway = new THREE.Mesh(runwayGeo, runwayMat);
    runway.rotation.x = -Math.PI / 2;
    group.add(runway);

    // Center line markings
    const lineGeo = new THREE.PlaneGeometry(30, 1);
    const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    for (let i = -length / 2 + 50; i < length / 2 - 50; i += 60) {
      const line = new THREE.Mesh(lineGeo, lineMat);
      line.rotation.x = -Math.PI / 2;
      line.position.set(i, 0.02, 0);
      group.add(line);
    }

    // Threshold markings
    [-1, 1].forEach(side => {
      for (let j = -15; j <= 15; j += 5) {
        const mark = new THREE.Mesh(
          new THREE.PlaneGeometry(25, 2),
          lineMat
        );
        mark.rotation.x = -Math.PI / 2;
        mark.position.set(side * (length / 2 - 20), 0.02, j);
        group.add(mark);
      }
    });

    // Edge lights
    const lightGeo = new THREE.SphereGeometry(0.3, 4, 4);
    const lightMatW = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const lightMatG = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const lightMatR = new THREE.MeshBasicMaterial({ color: 0xff0000 });

    for (let i = -length / 2; i <= length / 2; i += 50) {
      [-width / 2 - 2, width / 2 + 2].forEach(z => {
        const lm = i < -length / 2 + 100 ? lightMatG :
                   i > length / 2 - 100 ? lightMatR : lightMatW;
        const light = new THREE.Mesh(lightGeo, lm);
        light.position.set(i, 0.3, z);
        group.add(light);
      });
    }

    // PAPI lights (left side, approach end)
    [-1, 1].forEach(end => {
      for (let j = 0; j < 4; j++) {
        const papi = new THREE.Mesh(
          new THREE.BoxGeometry(0.5, 0.5, 0.5),
          new THREE.MeshBasicMaterial({ color: j < 2 ? 0xff0000 : 0xffffff })
        );
        papi.position.set(end * (length / 2 - 300), 0.5, -width / 2 - 8 + j * 2);
        group.add(papi);
      }
    });

    group.position.set(x, h, z);
    group.rotation.y = heading * Math.PI / 180;
    this.scene.add(group);

    this.runways.push({
      x, z, heading, length, width, elevation: h,
      group,
    });
  }

  update(playerX, playerZ) {
    const cx = Math.round(playerX / CHUNK_SIZE);
    const cz = Math.round(playerZ / CHUNK_SIZE);

    // Add new chunks
    for (let dx = -VIEW_DISTANCE; dx <= VIEW_DISTANCE; dx++) {
      for (let dz = -VIEW_DISTANCE; dz <= VIEW_DISTANCE; dz++) {
        const key = `${cx + dx},${cz + dz}`;
        if (!this.chunks.has(key)) {
          const mesh = this._createChunkMesh(cx + dx, cz + dz);
          this.scene.add(mesh);
          this.chunks.set(key, mesh);
        }
      }
    }

    // Remove distant chunks
    for (const [key, mesh] of this.chunks) {
      const [kx, kz] = key.split(',').map(Number);
      if (Math.abs(kx - cx) > VIEW_DISTANCE + 1 || Math.abs(kz - cz) > VIEW_DISTANCE + 1) {
        this.scene.remove(mesh);
        mesh.geometry.dispose();
        this.chunks.delete(key);
      }
    }

    // Update water position to follow player
    this.water.position.x = playerX;
    this.water.position.z = playerZ;
  }

  dispose() {
    for (const [, mesh] of this.chunks) {
      this.scene.remove(mesh);
      mesh.geometry.dispose();
    }
    this.chunks.clear();
    this.scene.remove(this.water);
  }
}
