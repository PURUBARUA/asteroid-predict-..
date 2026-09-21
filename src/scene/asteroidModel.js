import * as THREE from "three";

/**
 * Creates realistic procedural 3D asteroid geometry with craters and boulder deformations
 * @param {number} size - Visual size
 * @param {number} seed - Random seed for shape
 * @returns {THREE.Mesh}
 */
export function createAsteroidMesh(size = 0.8, seed = 42) {
  const geometry = new THREE.IcosahedronGeometry(size, 4);
  const posAttr = geometry.attributes.position;
  const vertex = new THREE.Vector3();

  // Pseudo-random noise displacement to generate irregular asteroid topography
  function pseudoNoise(x, y, z) {
    return Math.sin(x * 3.1 + seed) * Math.cos(y * 2.7) * Math.sin(z * 4.3);
  }

  for (let i = 0; i < posAttr.count; i++) {
    vertex.fromBufferAttribute(posAttr, i);
    const len = vertex.length();
    
    // Low frequency deformation (elongated/bumpy potato shape)
    const deformation = 1.0 + 0.25 * pseudoNoise(vertex.x, vertex.y, vertex.z);
    
    // High frequency micro-craters
    const micro = 0.05 * Math.sin(vertex.x * 12.0) * Math.cos(vertex.z * 12.0);
    
    vertex.normalize().multiplyScalar(len * deformation + micro);
    posAttr.setXYZ(i, vertex.x, vertex.y, vertex.z);
  }

  geometry.computeVertexNormals();

  // Procedural rock texture
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#4a4d52"; // Chondrite dark grey
  ctx.fillRect(0, 0, 512, 512);

  // Surface flecks and regolith grain
  for (let i = 0; i < 400; i++) {
    ctx.fillStyle = Math.random() > 0.5 ? "#2f3136" : "#6e727a";
    ctx.beginPath();
    ctx.arc(Math.random() * 512, Math.random() * 512, 1 + Math.random() * 3, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);

  const material = new THREE.MeshStandardMaterial({
    map: texture,
    roughness: 0.88,
    metalness: 0.12,
    flatShading: true
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = "AsteroidMesh";
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  // Add target reticle ring around asteroid for NASA HUD tracking
  const reticleGeo = new THREE.RingGeometry(size * 1.6, size * 1.8, 32);
  const reticleMat = new THREE.MeshBasicMaterial({
    color: 0x00e5ff,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.65
  });
  const reticle = new THREE.Mesh(reticleGeo, reticleMat);
  reticle.name = "TargetReticle";
  mesh.add(reticle);

  return mesh;
}

/**
 * Creates dynamic trajectory line with custom glowing gradient
 * @param {Array<{x: number, y: number, z: number}>} points
 * @param {number} colorHex
 * @returns {THREE.Line}
 */
export function createTrajectoryLine(points, colorHex = 0x00e5ff) {
  const geometry = new THREE.BufferGeometry();
  const positions = [];
  const colors = [];
  const baseCol = new THREE.Color(colorHex);

  const n = points.length;
  for (let i = 0; i < n; i++) {
    const pt = points[i];
    positions.push(pt.x, pt.y, pt.z);

    // Gradient opacity / brightness towards closest approach (middle)
    const t = i / (n - 1);
    const intensity = Math.sin(t * Math.PI) * 0.8 + 0.2;
    colors.push(baseCol.r * intensity, baseCol.g * intensity, baseCol.b * intensity);
  }

  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));

  const material = new THREE.LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.85,
    linewidth: 2
  });

  const line = new THREE.Line(geometry, material);
  line.name = "TrajectoryPath";
  return line;
}

/**
 * Creates closest-approach indicator vector (Perigee Line from Earth to Closest Point)
 */
export function createPerigeeVector(targetPos, colorHex = 0xff3b30) {
  const geometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(targetPos.x, targetPos.y, targetPos.z)
  ]);

  const material = new THREE.LineDashedMaterial({
    color: colorHex,
    dashSize: 0.8,
    gapSize: 0.4,
    transparent: true,
    opacity: 0.75
  });

  const line = new THREE.Line(geometry, material);
  line.computeLineDistances();
  line.name = "PerigeeVectorLine";
  return line;
}
