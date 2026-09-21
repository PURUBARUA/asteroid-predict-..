import * as THREE from "three";
import { createOrbitRing } from "./celestial.js";

/**
 * Creates procedural texture for planets and moons
 */
function createPlanetTexture(type, baseColor, detailColor, bands = false) {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (bands) {
    // Gas giant atmospheric bands (Jupiter/Saturn)
    for (let y = 0; y < canvas.height; y += 4) {
      const noise = Math.sin(y * 0.05) * Math.cos(y * 0.02);
      ctx.fillStyle = noise > 0 ? detailColor : baseColor;
      ctx.globalAlpha = 0.35 + Math.sin(y * 0.1) * 0.25;
      ctx.fillRect(0, y, canvas.width, 4);
    }
    // Great red spot for Jupiter
    if (type === "jupiter") {
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = "#c2410c";
      ctx.beginPath();
      ctx.ellipse(650, 320, 60, 35, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    // Terrestrial / cratered noise
    ctx.fillStyle = detailColor;
    for (let i = 0; i < 300; i++) {
      ctx.globalAlpha = 0.2 + Math.random() * 0.5;
      ctx.beginPath();
      ctx.arc(
        Math.random() * canvas.width,
        Math.random() * canvas.height,
        2 + Math.random() * 25,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  return texture;
}

/**
 * Planetary & Moon Data with realistic proportional hierarchy
 */
export const SOLAR_BODIES_DATA = {
  mercury: {
    name: "Mercury",
    orbitRadius: 18,
    radius: 1.1,
    speed: 0.024,
    color: "#9ca3af",
    detail: "#6b7280",
    bands: false,
    moons: []
  },
  venus: {
    name: "Venus",
    orbitRadius: 28,
    radius: 2.2,
    speed: 0.018,
    color: "#fde047",
    detail: "#ca8a04",
    bands: false,
    moons: []
  },
  earth: {
    name: "Earth",
    orbitRadius: 42,
    radius: 2.5,
    speed: 0.014,
    color: "#0284c7",
    detail: "#15803d",
    bands: false,
    moons: [
      { name: "Moon (Luna)", dist: 4.8, radius: 0.68, speed: 0.045, color: "#cbd5e1" }
    ]
  },
  mars: {
    name: "Mars",
    orbitRadius: 56,
    radius: 1.6,
    speed: 0.011,
    color: "#ef4444",
    detail: "#991b1b",
    bands: false,
    moons: [
      { name: "Phobos", dist: 2.8, radius: 0.35, speed: 0.07, color: "#94a3b8" },
      { name: "Deimos", dist: 4.2, radius: 0.28, speed: 0.05, color: "#64748b" }
    ]
  },
  jupiter: {
    name: "Jupiter",
    orbitRadius: 82,
    radius: 5.5,
    speed: 0.007,
    color: "#d97706",
    detail: "#fef3c7",
    bands: true,
    moons: [
      { name: "Io", dist: 7.8, radius: 0.58, speed: 0.065, color: "#facc15" },
      { name: "Europa", dist: 10.2, radius: 0.52, speed: 0.052, color: "#bae6fd" },
      { name: "Ganymede", dist: 13.5, radius: 0.85, speed: 0.041, color: "#cbd5e1" },
      { name: "Callisto", dist: 17.0, radius: 0.78, speed: 0.032, color: "#94a3b8" }
    ]
  },
  saturn: {
    name: "Saturn",
    orbitRadius: 114,
    radius: 4.6,
    speed: 0.005,
    color: "#fde68a",
    detail: "#d97706",
    bands: true,
    hasRings: true,
    moons: [
      { name: "Titan", dist: 15.0, radius: 0.82, speed: 0.045, color: "#fb923c" },
      { name: "Enceladus", dist: 7.2, radius: 0.32, speed: 0.075, color: "#f8fafc" },
      { name: "Mimas", dist: 6.2, radius: 0.26, speed: 0.09, color: "#cbd5e1" },
      { name: "Rhea", dist: 10.5, radius: 0.44, speed: 0.055, color: "#94a3b8" },
      { name: "Iapetus", dist: 19.5, radius: 0.42, speed: 0.025, color: "#64748b" },
      { name: "Dione", dist: 8.8, radius: 0.36, speed: 0.062, color: "#cbd5e1" },
      { name: "Tethys", dist: 7.8, radius: 0.34, speed: 0.068, color: "#e2e8f0" }
    ]
  },
  uranus: {
    name: "Uranus",
    orbitRadius: 146,
    radius: 3.4,
    speed: 0.0035,
    color: "#38bdf8",
    detail: "#0284c7",
    bands: false,
    hasRings: true,
    moons: [
      { name: "Miranda", dist: 5.5, radius: 0.26, speed: 0.08, color: "#e2e8f0" },
      { name: "Ariel", dist: 7.5, radius: 0.38, speed: 0.06, color: "#f1f5f9" },
      { name: "Umbriel", dist: 9.8, radius: 0.36, speed: 0.048, color: "#94a3b8" },
      { name: "Titania", dist: 12.8, radius: 0.46, speed: 0.038, color: "#cbd5e1" },
      { name: "Oberon", dist: 15.8, radius: 0.44, speed: 0.03, color: "#94a3b8" }
    ]
  },
  neptune: {
    name: "Neptune",
    orbitRadius: 178,
    radius: 3.3,
    speed: 0.0028,
    color: "#2563eb",
    detail: "#1d4ed8",
    bands: false,
    moons: [
      { name: "Triton", dist: 8.2, radius: 0.54, speed: -0.05, color: "#e0e7ff" }, // Retrograde
      { name: "Proteus", dist: 5.4, radius: 0.28, speed: 0.075, color: "#94a3b8" }
    ]
  },
  pluto: {
    name: "Pluto (Dwarf)",
    orbitRadius: 206,
    radius: 0.9,
    speed: 0.0022,
    color: "#cbd5e1",
    detail: "#78716c",
    bands: false,
    moons: [
      { name: "Charon", dist: 3.2, radius: 0.45, speed: 0.06, color: "#a8a29e" }
    ]
  }
};

/**
 * Creates Saturn/Uranus planetary rings
 */
function createPlanetaryRings(innerRadius, outerRadius, color = "#fde68a") {
  const geometry = new THREE.RingGeometry(innerRadius, outerRadius, 64);
  geometry.rotateX(Math.PI / 2);

  const material = new THREE.MeshBasicMaterial({
    color: new THREE.Color(color),
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.55
  });

  return new THREE.Mesh(geometry, material);
}

/**
 * Asteroid Belt between Mars and Jupiter (58 - 72 units)
 */
export function createAsteroidBelt(count = 1200) {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);

  const beltInner = 60;
  const beltOuter = 72;

  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = beltInner + Math.random() * (beltOuter - beltInner);
    const yOffset = (Math.random() - 0.5) * 4.5;

    positions[i * 3] = Math.cos(angle) * dist;
    positions[i * 3 + 1] = yOffset;
    positions[i * 3 + 2] = Math.sin(angle) * dist;

    // Subtle stone & ice colors
    const brightness = 0.5 + Math.random() * 0.4;
    colors[i * 3] = 0.7 * brightness;
    colors[i * 3 + 1] = 0.75 * brightness;
    colors[i * 3 + 2] = 0.9 * brightness;
  }

  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: 1.2,
    vertexColors: true,
    transparent: true,
    opacity: 0.75
  });

  const belt = new THREE.Points(geometry, material);
  belt.name = "MainAsteroidBelt";
  return belt;
}

/**
 * Builds the complete Solar System entity: Sun, 8 planets + Pluto, and 20+ moons
 */
export function buildSolarSystem() {
  const systemGroup = new THREE.Group();
  systemGroup.name = "FullSolarSystem";

  // Glowing Sun at center
  const sunGeo = new THREE.SphereGeometry(7.5, 48, 48);
  const sunMat = new THREE.MeshBasicMaterial({ color: 0xfffbeb });
  const sunMesh = new THREE.Mesh(sunGeo, sunMat);
  sunMesh.name = "TheSun";
  systemGroup.add(sunMesh);

  // Sun Corona Glow
  const coronaGeo = new THREE.SphereGeometry(9.5, 32, 32);
  const coronaMat = new THREE.MeshBasicMaterial({
    color: 0xf59e0b,
    transparent: true,
    opacity: 0.28,
    side: THREE.BackSide
  });
  const coronaMesh = new THREE.Mesh(coronaGeo, coronaMat);
  systemGroup.add(coronaMesh);

  // Main Asteroid Belt
  const asteroidBelt = createAsteroidBelt(1400);
  systemGroup.add(asteroidBelt);

  const planetsMap = {};
  const allLabelsList = [{ id: "sun", name: "The Sun", mesh: sunMesh, type: "star" }];

  // Build each planet and its moon system
  Object.entries(SOLAR_BODIES_DATA).forEach(([key, data]) => {
    const planetGroup = new THREE.Group();
    planetGroup.name = `Group_${data.name}`;

    // Planet Orbit Path Ring around Sun
    const orbitRing = createOrbitRing(data.orbitRadius, "#6366f1", false, 0.25);
    systemGroup.add(orbitRing);

    // Planet Mesh
    const texture = createPlanetTexture(key, data.color, data.detail, data.bands);
    const planetGeo = new THREE.SphereGeometry(data.radius, 32, 32);
    const planetMat = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.8,
      metalness: 0.1
    });
    const planetMesh = new THREE.Mesh(planetGeo, planetMat);
    planetMesh.name = `Mesh_${data.name}`;
    planetGroup.add(planetMesh);

    // Rings if applicable (Saturn & Uranus)
    if (data.hasRings) {
      if (key === "saturn") {
        const rings = createPlanetaryRings(data.radius * 1.35, data.radius * 2.3, "#fde68a");
        planetGroup.add(rings);
      } else if (key === "uranus") {
        const rings = createPlanetaryRings(data.radius * 1.3, data.radius * 1.8, "#38bdf8");
        rings.rotation.z = Math.PI / 4;
        planetGroup.add(rings);
      }
    }

    allLabelsList.push({
      id: key,
      name: data.name,
      mesh: planetMesh,
      type: "planet",
      orbitRadius: data.orbitRadius
    });

    // Build Moons
    const moonsList = [];
    if (data.moons && data.moons.length > 0) {
      data.moons.forEach(m => {
        const moonGroup = new THREE.Group();

        // Moon Orbit Ring around planet
        const moonOrbit = createOrbitRing(m.dist, "#818cf8", true, 0.25);
        planetGroup.add(moonOrbit);

        // Moon Mesh
        const moonGeo = new THREE.SphereGeometry(m.radius, 24, 24);
        const moonMat = new THREE.MeshStandardMaterial({
          color: new THREE.Color(m.color),
          roughness: 0.85
        });
        const moonMesh = new THREE.Mesh(moonGeo, moonMat);
        moonMesh.name = `Moon_${m.name}`;
        moonMesh.position.set(m.dist, 0, 0);
        moonGroup.add(moonMesh);
        planetGroup.add(moonGroup);

        moonsList.push({
          mesh: moonMesh,
          group: moonGroup,
          dist: m.dist,
          speed: m.speed,
          angle: Math.random() * Math.PI * 2,
          name: m.name
        });

        allLabelsList.push({
          id: `moon_${m.name.toLowerCase().replace(/[^a-z0-9]/g, "_")}`,
          name: m.name,
          mesh: moonMesh,
          type: "moon",
          parentPlanet: key
        });
      });
    }

    systemGroup.add(planetGroup);

    planetsMap[key] = {
      data,
      group: planetGroup,
      mesh: planetMesh,
      angle: Math.random() * Math.PI * 2,
      moons: moonsList
    };
  });

  return {
    group: systemGroup,
    planets: planetsMap,
    sun: sunMesh,
    labelsList: allLabelsList,
    update: (deltaSimSec) => {
      // Rotate Asteroid Belt
      asteroidBelt.rotation.y += 0.0003;

      // Update Planet and Moon positions
      Object.entries(planetsMap).forEach(([key, p]) => {
        p.angle += p.data.speed * deltaSimSec * 0.05;
        const x = Math.cos(p.angle) * p.data.orbitRadius;
        const z = Math.sin(p.angle) * p.data.orbitRadius;
        p.group.position.set(x, 0, z);

        // Planet axial spin
        p.mesh.rotation.y += 0.01;

        // Moons revolution around planet
        p.moons.forEach(m => {
          m.angle += m.speed * deltaSimSec * 0.2;
          m.mesh.position.x = Math.cos(m.angle) * m.dist;
          m.mesh.position.z = Math.sin(m.angle) * m.dist;
        });
      });
    }
  };
}