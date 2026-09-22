import * as THREE from "three";

/**
 * Creates 3D celestial bodies and orbital reference rings in NASA purple-blue theme:
 * - Moon with 1 Lunar Distance orbit ring (384,400 km)
 * - Geostationary (GEO) satellite ring (35,786 km altitude)
 * - Low Earth Orbit (LEO) ring (400 km altitude - ISS)
 * - Dynamic Starfield with 4,000+ stars
 * - Sun directional lighting & solar glare
 */

export function createStarfield(count = 4500, radius = 800) {
  const group = new THREE.Group();
  group.name = "DeepSpaceStarfield";

  // ── Main starfield ──
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);

  const starColors = [
    new THREE.Color("#ffffff"),
    new THREE.Color("#e0d4ff"), // Lavender white
    new THREE.Color("#c084fc"), // Purple stars
    new THREE.Color("#a855f7"), // Violet stars
    new THREE.Color("#818cf8"), // Indigo stars
    new THREE.Color("#93c5fd"), // Blue stars
    new THREE.Color("#7c3aed"), // Deep violet
    new THREE.Color("#6366f1")  // Electric indigo
  ];

  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = radius + (Math.random() - 0.5) * 200;

    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);

    const col = starColors[Math.floor(Math.random() * starColors.length)];
    colors[i * 3] = col.r;
    colors[i * 3 + 1] = col.g;
    colors[i * 3 + 2] = col.b;
  }

  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: 1.6,
    vertexColors: true,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  const stars = new THREE.Points(geometry, material);
  group.add(stars);

  // ── Bright diamond stars (larger, glowing) ──
  const diamondCount = 120;
  const dGeo = new THREE.BufferGeometry();
  const dPos = new Float32Array(diamondCount * 3);
  const dCol = new Float32Array(diamondCount * 3);

  for (let i = 0; i < diamondCount; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = radius * 0.7 + Math.random() * radius * 0.5;

    dPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    dPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    dPos[i * 3 + 2] = r * Math.cos(phi);

    // Bright blue-violet-white
    const hue = 240 + Math.random() * 40;
    const c = new THREE.Color(`hsl(${hue}, 80%, ${85 + Math.random() * 15}%)`);
    dCol[i * 3] = c.r;
    dCol[i * 3 + 1] = c.g;
    dCol[i * 3 + 2] = c.b;
  }

  dGeo.setAttribute("position", new THREE.BufferAttribute(dPos, 3));
  dGeo.setAttribute("color", new THREE.BufferAttribute(dCol, 3));

  const dMat = new THREE.PointsMaterial({
    size: 3.5,
    vertexColors: true,
    transparent: true,
    opacity: 0.75,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  const diamonds = new THREE.Points(dGeo, dMat);
  diamonds.name = "DiamondStars";
  group.add(diamonds);

  return group;
}

export function createOrbitRing(radius, color = "#6366f1", dashed = false, opacity = 0.45) {
  const segments = 128;
  const geometry = new THREE.BufferGeometry();
  const points = [];

  for (let i = 0; i <= segments; i++) {
    const theta = (i / segments) * Math.PI * 2;
    points.push(new THREE.Vector3(Math.cos(theta) * radius, 0, Math.sin(theta) * radius));
  }
  geometry.setFromPoints(points);

  let material;
  if (dashed) {
    material = new THREE.LineDashedMaterial({
      color: new THREE.Color(color),
      dashSize: radius * 0.08,
      gapSize: radius * 0.04,
      transparent: true,
      opacity: opacity
    });
  } else {
    material = new THREE.LineBasicMaterial({
      color: new THREE.Color(color),
      transparent: true,
      opacity: opacity
    });
  }

  const line = new THREE.Line(geometry, material);
  if (dashed) line.computeLineDistances();
  return line;
}

export function buildMoonSystem(moonOrbitRadius = 28.0) {
  const moonGroup = new THREE.Group();
  moonGroup.name = "MoonSystem";

  // Moon orbit ring (1 Lunar Distance reference) in purple-blue
  const orbitRing = createOrbitRing(moonOrbitRadius, "#818cf8", false, 0.45);
  orbitRing.name = "MoonOrbitRing";
  moonGroup.add(orbitRing);

  // Realistic Moon texture
  const moonGeo = new THREE.SphereGeometry(1.36, 32, 32);
  const textureLoader = new THREE.TextureLoader();
  const moonMat = new THREE.MeshStandardMaterial({
    map: textureLoader.load('/textures/moon.jpg'),
    roughness: 0.9,
    metalness: 0.0
  });

  const moonMesh = new THREE.Mesh(moonGeo, moonMat);
  moonMesh.name = "MoonMesh";
  moonMesh.position.set(moonOrbitRadius, 0, 0);
  moonGroup.add(moonMesh);

  return {
    group: moonGroup,
    mesh: moonMesh,
    update: (angleRad) => {
      moonMesh.position.x = Math.cos(angleRad) * moonOrbitRadius;
      moonMesh.position.z = Math.sin(angleRad) * moonOrbitRadius;
      moonMesh.rotation.y += 0.002;
    }
  };
}

export function buildSatelliteRings(earthRadius = 5.0) {
  const group = new THREE.Group();
  group.name = "SatelliteRings";

  // GEO Ring (35,786 km) in electric blue
  const geoRadius = earthRadius * 1.84;
  const geoRing = createOrbitRing(geoRadius, "#38bdf8", true, 0.4);
  geoRing.name = "GeoRing";
  group.add(geoRing);

  // LEO Ring (ISS at 400 km) in vibrant violet
  const leoRadius = earthRadius * 1.12;
  const leoRing = createOrbitRing(leoRadius, "#a855f7", false, 0.35);
  leoRing.name = "LeoRing";
  group.add(leoRing);

  return group;
}