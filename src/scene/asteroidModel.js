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

  function pseudoNoise(x, y, z) {
    return Math.sin(x * 3.1 + seed) * Math.cos(y * 2.7) * Math.sin(z * 4.3);
  }

  for (let i = 0; i < posAttr.count; i++) {
    vertex.fromBufferAttribute(posAttr, i);
    const len = vertex.length();
    const deformation = 1.0 + 0.25 * pseudoNoise(vertex.x, vertex.y, vertex.z);
    const micro = 0.05 * Math.sin(vertex.x * 12.0) * Math.cos(vertex.z * 12.0);
    vertex.normalize().multiplyScalar(len * deformation + micro);
    posAttr.setXYZ(i, vertex.x, vertex.y, vertex.z);
  }

  geometry.computeVertexNormals();

  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#474b54";
  ctx.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 400; i++) {
    ctx.fillStyle = Math.random() > 0.5 ? "#2e313b" : "#6c7280";
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

  // NASA Eyes target reticle in purple-blue
  const reticleGeo = new THREE.RingGeometry(size * 1.6, size * 1.85, 32);
  const reticleMat = new THREE.MeshBasicMaterial({
    color: 0x8b5cf6, // Vibrant purple-blue
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.75
  });
  const reticle = new THREE.Mesh(reticleGeo, reticleMat);
  reticle.name = "TargetReticle";
  mesh.add(reticle);

  return mesh;
}

/**
 * Creates dynamic trajectory line with glowing purple-to-blue gradient
 */
export function createTrajectoryLine(points, startColorHex = 0x8b5cf6, endColorHex = 0x38bdf8) {
  const geometry = new THREE.BufferGeometry();
  const positions = [];
  const colors = [];
  const startCol = new THREE.Color(startColorHex);
  const endCol = new THREE.Color(endColorHex);

  const n = points.length;
  for (let i = 0; i < n; i++) {
    const pt = points[i];
    positions.push(pt.x, pt.y, pt.z);

    const t = i / (n - 1);
    const interpCol = startCol.clone().lerp(endCol, t);
    const glow = Math.sin(t * Math.PI) * 0.7 + 0.3;
    colors.push(interpCol.r * glow, interpCol.g * glow, interpCol.b * glow);
  }

  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));

  const material = new THREE.LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.9,
    linewidth: 2
  });

  const line = new THREE.Line(geometry, material);
  line.name = "TrajectoryPath";
  return line;
}

export function createPerigeeVector(targetPos, colorHex = 0xf43f5e) {
  const geometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(targetPos.x, targetPos.y, targetPos.z)
  ]);

  const material = new THREE.LineDashedMaterial({
    color: colorHex,
    dashSize: 0.8,
    gapSize: 0.4,
    transparent: true,
    opacity: 0.85
  });

  const line = new THREE.Line(geometry, material);
  line.computeLineDistances();
  line.name = "PerigeeVectorLine";
  return line;
}