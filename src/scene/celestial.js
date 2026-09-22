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
/**
 * Procedural Earth Satellite Swarm (Simulating 8,000 active satellites in LEO, MEO, GEO)
 * Realistic orbital planes and speeds.
 */
export function buildEarthSatelliteSwarm(earthRadius = 5.0) {
  const LEO_COUNT = 7000;
  const MEO_COUNT = 400;
  const GEO_COUNT = 600;
  const total = LEO_COUNT + MEO_COUNT + GEO_COUNT;

  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(total * 3);
  const colors = new Float32Array(total * 3);
  const orbitParams = [];

  const addSats = (startIndex, count, altMin, altMax, incMin, incMax, speedMin, speedMax, isGEO) => {
    for (let i = 0; i < count; i++) {
      const idx = startIndex + i;
      
      // Altitude & Radius
      const alt = altMin + Math.random() * (altMax - altMin);
      const radius = earthRadius * (1 + alt / 6371.0); // 6371km is Earth real radius

      // Orbital elements
      const inclination = isGEO ? (Math.random() * 0.1) : (incMin + Math.random() * (incMax - incMin));
      const raan = Math.random() * Math.PI * 2;
      const meanAnomaly = Math.random() * Math.PI * 2;
      const meanMotion = speedMin + Math.random() * (speedMax - speedMin);

      orbitParams.push({ radius, inclination, raan, meanAnomaly, meanMotion });

      // Initial position will be updated in animation loop
      positions[idx * 3] = 0;
      positions[idx * 3 + 1] = 0;
      positions[idx * 3 + 2] = 0;

      // Color (Starlink/LEO = cyan-ish white, GPS/MEO = yellowish, GEO = orange-ish)
      const color = new THREE.Color();
      if (isGEO) {
        color.setHSL(0.1, 0.8, 0.6 + Math.random() * 0.4);
      } else if (count === MEO_COUNT) {
        color.setHSL(0.15, 0.8, 0.7 + Math.random() * 0.3);
      } else {
        color.setHSL(0.55, 0.6, 0.8 + Math.random() * 0.2);
      }
      
      colors[idx * 3] = color.r;
      colors[idx * 3 + 1] = color.g;
      colors[idx * 3 + 2] = color.b;
    }
  };

  // LEO (e.g. Starlink, ISS) - Altitude 400-1200km, High inclination
  addSats(0, LEO_COUNT, 400, 1200, 0.4, 1.7, 0.015, 0.025, false);
  
  // MEO (e.g. GPS) - Altitude ~20,000km
  addSats(LEO_COUNT, MEO_COUNT, 19000, 21000, 0.9, 1.0, 0.005, 0.008, false);

  // GEO - Altitude ~35,786km, Equatorial
  addSats(LEO_COUNT + MEO_COUNT, GEO_COUNT, 35500, 36000, 0, 0, 0.002, 0.003, true);

  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: 0.06,
    vertexColors: true,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  const swarm = new THREE.Points(geometry, material);
  swarm.name = "RealTimeSatelliteSwarm";
  swarm.userData = { orbitParams };

  return swarm;
}

export function updateSatelliteSwarm(swarm, deltaHours) {
  if (!swarm || !swarm.userData.orbitParams) return;
  const positions = swarm.geometry.attributes.position.array;
  const params = swarm.userData.orbitParams;

  for (let i = 0; i < params.length; i++) {
    const p = params[i];
    // Propagate orbit
    p.meanAnomaly += p.meanMotion * deltaHours;
    
    // Keplerian to Cartesian (simplified for circular orbits)
    const u = p.meanAnomaly; // argument of latitude
    const x = p.radius * (Math.cos(p.raan) * Math.cos(u) - Math.sin(p.raan) * Math.sin(u) * Math.cos(p.inclination));
    const z = p.radius * (Math.sin(p.raan) * Math.cos(u) + Math.cos(p.raan) * Math.sin(u) * Math.cos(p.inclination));
    const y = p.radius * (Math.sin(u) * Math.sin(p.inclination));

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
  }
  swarm.geometry.attributes.position.needsUpdate = true;
}