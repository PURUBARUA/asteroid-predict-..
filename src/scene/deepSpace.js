import * as THREE from "three";

/**
 * Deep Space Environment: Nearby galaxies, nebulae, cosmic dust clouds
 * All procedurally generated with Canvas textures for zero external dependencies.
 */

// ─── PROCEDURAL GALAXY SPRITE TEXTURE ─────────────────────────────────────────
function createGalaxyTexture(type = "spiral", hueShift = 0) {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  const cx = size / 2;
  const cy = size / 2;

  // Background transparent
  ctx.clearRect(0, 0, size, size);

  if (type === "spiral") {
    // Draw spiral arms
    const arms = 2 + Math.floor(Math.random() * 2);
    for (let arm = 0; arm < arms; arm++) {
      const armAngle = (arm / arms) * Math.PI * 2;
      for (let i = 0; i < 800; i++) {
        const t = i / 800;
        const r = t * cx * 0.85;
        const theta = armAngle + t * 4.5 + (Math.random() - 0.5) * 0.6;
        const spread = (1 - t) * 12 + 2;
        const px = cx + Math.cos(theta) * r + (Math.random() - 0.5) * spread;
        const py = cy + Math.sin(theta) * r * 0.55 + (Math.random() - 0.5) * spread * 0.55;

        const brightness = (1 - t) * 0.8 + 0.2;
        const hue = (260 + hueShift + t * 30) % 360;
        ctx.fillStyle = `hsla(${hue}, 70%, ${55 + brightness * 35}%, ${brightness * 0.6})`;
        ctx.beginPath();
        ctx.arc(px, py, 0.4 + (1 - t) * 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Bright galactic core
    const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 22);
    coreGrad.addColorStop(0, `hsla(${270 + hueShift}, 80%, 95%, 0.95)`);
    coreGrad.addColorStop(0.3, `hsla(${260 + hueShift}, 75%, 75%, 0.6)`);
    coreGrad.addColorStop(0.7, `hsla(${250 + hueShift}, 60%, 50%, 0.15)`);
    coreGrad.addColorStop(1, "transparent");
    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, 22, 0, Math.PI * 2);
    ctx.fill();

  } else if (type === "elliptical") {
    // Elliptical galaxy (soft glowing oval)
    for (let i = 0; i < 1200; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.pow(Math.random(), 0.6) * cx * 0.7;
      const px = cx + Math.cos(angle) * dist;
      const py = cy + Math.sin(angle) * dist * 0.6;
      const brightness = 1 - (dist / (cx * 0.7));
      const hue = (280 + hueShift) % 360;
      ctx.fillStyle = `hsla(${hue}, 55%, ${50 + brightness * 45}%, ${brightness * 0.45})`;
      ctx.beginPath();
      ctx.arc(px, py, 0.5 + brightness * 1.0, 0, Math.PI * 2);
      ctx.fill();
    }

    const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 30);
    coreGrad.addColorStop(0, `hsla(${275 + hueShift}, 70%, 90%, 0.8)`);
    coreGrad.addColorStop(0.5, `hsla(${265 + hueShift}, 60%, 60%, 0.2)`);
    coreGrad.addColorStop(1, "transparent");
    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, 30, 0, Math.PI * 2);
    ctx.fill();

  } else if (type === "irregular") {
    // Irregular / dwarf galaxy (clumpy star clusters)
    const clusters = 3 + Math.floor(Math.random() * 4);
    for (let c = 0; c < clusters; c++) {
      const ccx = cx + (Math.random() - 0.5) * 60;
      const ccy = cy + (Math.random() - 0.5) * 40;
      const clusterSize = 15 + Math.random() * 25;

      for (let i = 0; i < 200; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.pow(Math.random(), 0.5) * clusterSize;
        const px = ccx + Math.cos(angle) * dist;
        const py = ccy + Math.sin(angle) * dist;
        const brightness = 1 - dist / clusterSize;
        const hue = (240 + hueShift + Math.random() * 40) % 360;
        ctx.fillStyle = `hsla(${hue}, 65%, ${55 + brightness * 40}%, ${brightness * 0.55})`;
        ctx.beginPath();
        ctx.arc(px, py, 0.4 + brightness * 0.8, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  return new THREE.CanvasTexture(canvas);
}

// ─── PROCEDURAL NEBULA TEXTURE ────────────────────────────────────────────────
function createNebulaTexture(baseHue = 270) {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  const cx = size / 2;
  const cy = size / 2;

  ctx.clearRect(0, 0, size, size);

  // Multi-layered nebula clouds
  for (let layer = 0; layer < 5; layer++) {
    const layerHue = (baseHue + layer * 18) % 360;
    const offsetX = (Math.random() - 0.5) * 80;
    const offsetY = (Math.random() - 0.5) * 80;
    const radius = 100 + Math.random() * 120;

    const grad = ctx.createRadialGradient(
      cx + offsetX, cy + offsetY, radius * 0.1,
      cx + offsetX, cy + offsetY, radius
    );
    grad.addColorStop(0, `hsla(${layerHue}, 85%, 65%, 0.25)`);
    grad.addColorStop(0.4, `hsla(${layerHue + 10}, 70%, 45%, 0.12)`);
    grad.addColorStop(0.8, `hsla(${layerHue + 20}, 50%, 30%, 0.04)`);
    grad.addColorStop(1, "transparent");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx + offsetX, cy + offsetY, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  // Embedded bright young stars
  for (let i = 0; i < 60; i++) {
    const sx = cx + (Math.random() - 0.5) * size * 0.7;
    const sy = cy + (Math.random() - 0.5) * size * 0.7;
    const starSize = 0.5 + Math.random() * 2.0;
    const starHue = Math.random() > 0.6 ? 220 : 300;
    ctx.fillStyle = `hsla(${starHue}, 80%, 90%, ${0.4 + Math.random() * 0.5})`;
    ctx.beginPath();
    ctx.arc(sx, sy, starSize, 0, Math.PI * 2);
    ctx.fill();
  }

  return new THREE.CanvasTexture(canvas);
}

// ─── GALAXY CATALOG (NEARBY OBSERVABLE GALAXIES) ──────────────────────────────
const GALAXY_CATALOG = [
  { name: "Andromeda (M31)",       type: "spiral",    pos: [650, 120, -500],  scale: 95,  tilt: -0.3,  hue: 0 },
  { name: "Triangulum (M33)",      type: "spiral",    pos: [-580, 180, -650], scale: 55,  tilt: 0.4,   hue: 20 },
  { name: "Large Magellanic Cloud",type: "irregular",  pos: [200, -350, 700],  scale: 70,  tilt: -0.1,  hue: 30 },
  { name: "Small Magellanic Cloud",type: "irregular",  pos: [280, -280, 780],  scale: 40,  tilt: 0.2,   hue: 40 },
  { name: "Centaurus A (NGC 5128)",type: "elliptical", pos: [-700, -200, 400], scale: 60,  tilt: 0.6,   hue: 10 },
  { name: "Bode's Galaxy (M81)",   type: "spiral",    pos: [500, 350, 600],   scale: 50,  tilt: -0.5,  hue: -10 },
  { name: "Cigar Galaxy (M82)",    type: "irregular",  pos: [530, 370, 590],   scale: 35,  tilt: 1.2,   hue: -20 },
  { name: "Whirlpool (M51)",       type: "spiral",    pos: [-400, 400, -550], scale: 48,  tilt: 0.15,  hue: 15 },
  { name: "Sombrero (M104)",       type: "spiral",    pos: [750, -150, -300], scale: 42,  tilt: 1.35,  hue: -5 },
  { name: "Pinwheel (M101)",       type: "spiral",    pos: [-300, 500, 400],  scale: 52,  tilt: -0.05, hue: 25 },
  { name: "NGC 6822 (Barnard's)",  type: "irregular",  pos: [-250, -400, -700],scale: 30,  tilt: 0.3,   hue: 35 },
  { name: "IC 10 (Starburst)",     type: "irregular",  pos: [400, 250, -750],  scale: 28,  tilt: -0.7,  hue: 50 }
];

// ─── NEBULA CATALOG ──────────────────────────────────────────────────────────
const NEBULA_CATALOG = [
  { name: "Orion Nebula",     pos: [380, 60, -320],   scale: 75,  hue: 270 },
  { name: "Eagle Nebula",     pos: [-420, 140, 280],  scale: 60,  hue: 285 },
  { name: "Carina Nebula",    pos: [200, -220, 500],  scale: 85,  hue: 260 },
  { name: "Lagoon Nebula",    pos: [-300, -100, -450], scale: 55,  hue: 250 },
  { name: "Rosette Nebula",   pos: [550, 200, 150],   scale: 65,  hue: 295 },
  { name: "Veil Nebula",      pos: [-500, 300, -200], scale: 80,  hue: 240 }
];

// ─── COSMIC DUST LANE (MILKY WAY BAND) ───────────────────────────────────────
function createMilkyWayBand(count = 6000) {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    // Distribute along a wide band (the galactic plane)
    const angle = Math.random() * Math.PI * 2;
    const radius = 500 + Math.random() * 800;
    const bandWidth = 35 + Math.random() * 50;
    const ySpread = (Math.random() - 0.5) * bandWidth;

    positions[i * 3]     = Math.cos(angle) * radius;
    positions[i * 3 + 1] = ySpread;
    positions[i * 3 + 2] = Math.sin(angle) * radius;

    // Purple-blue-violet hues
    const hue = 240 + Math.random() * 60;
    const sat = 40 + Math.random() * 40;
    const light = 50 + Math.random() * 40;
    const c = new THREE.Color(`hsl(${hue}, ${sat}%, ${light}%)`);
    colors[i * 3]     = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;

    sizes[i] = 1.0 + Math.random() * 2.5;
  }

  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

  // Soft glow point material
  const material = new THREE.PointsMaterial({
    size: 2.0,
    vertexColors: true,
    transparent: true,
    opacity: 0.35,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true
  });

  const band = new THREE.Points(geometry, material);
  band.name = "MilkyWayBand";
  return band;
}

// ─── AMBIENT COSMIC DUST PARTICLES (PURPLE-BLUE SHIMMER) ─────────────────────
function createCosmicDust(count = 2500) {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    // Scattered throughout the entire scene volume
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = 100 + Math.random() * 600;

    positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);

    const hue = 250 + Math.random() * 50;
    const c = new THREE.Color(`hsl(${hue}, 70%, ${60 + Math.random() * 30}%)`);
    colors[i * 3]     = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }

  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: 1.4,
    vertexColors: true,
    transparent: true,
    opacity: 0.22,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  const dust = new THREE.Points(geometry, material);
  dust.name = "CosmicDust";
  return dust;
}

// ─── BUILD FULL DEEP SPACE ENVIRONMENT ────────────────────────────────────────
export function buildDeepSpaceEnvironment() {
  const group = new THREE.Group();
  group.name = "DeepSpaceEnvironment";

  const labelsList = [];

  // 1) Milky Way galactic band
  const milkyWay = createMilkyWayBand(7000);
  group.add(milkyWay);

  // 2) Cosmic purple-blue shimmer dust
  const dust = createCosmicDust(3000);
  group.add(dust);

  // 3) Galaxy sprites
  GALAXY_CATALOG.forEach(gal => {
    const texture = createGalaxyTexture(gal.type, gal.hue);
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const sprite = new THREE.Sprite(material);
    sprite.position.set(gal.pos[0], gal.pos[1], gal.pos[2]);
    sprite.scale.set(gal.scale, gal.scale * 0.55, 1);
    sprite.name = `Galaxy_${gal.name}`;
    group.add(sprite);

    labelsList.push({
      id: `gal_${gal.name.replace(/[^a-zA-Z0-9]/g, "_")}`,
      name: gal.name,
      mesh: sprite,
      type: "galaxy"
    });
  });

  // 4) Nebula sprites
  NEBULA_CATALOG.forEach(neb => {
    const texture = createNebulaTexture(neb.hue);
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const sprite = new THREE.Sprite(material);
    sprite.position.set(neb.pos[0], neb.pos[1], neb.pos[2]);
    sprite.scale.set(neb.scale, neb.scale, 1);
    sprite.name = `Nebula_${neb.name}`;
    group.add(sprite);

    labelsList.push({
      id: `neb_${neb.name.replace(/[^a-zA-Z0-9]/g, "_")}`,
      name: neb.name,
      mesh: sprite,
      type: "nebula"
    });
  });

  return {
    group,
    labelsList,
    milkyWay,
    dust,
    update: (deltaSec) => {
      // Very slow rotation of the milky way band
      milkyWay.rotation.y += 0.00004 * deltaSec;
      // Gentle shimmer oscillation on cosmic dust
      dust.rotation.y += 0.00006 * deltaSec;
      dust.rotation.x += 0.00002 * deltaSec;
    }
  };
}