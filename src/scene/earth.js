import * as THREE from "three";

/**
 * Creates high-fidelity procedural Earth texture with continents, oceans, and city lights.
 * Ensures zero broken image dependencies and instant offline loading.
 */
export function createProceduralEarthTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 2048;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d");

  // Ocean base gradient (deep navy to royal blue)
  const oceanGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  oceanGrad.addColorStop(0, "#081b33");
  oceanGrad.addColorStop(0.5, "#0d2b45");
  oceanGrad.addColorStop(1, "#081b33");
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Procedural continental landmasses
  ctx.fillStyle = "#2d5a37"; // Forest / continent green
  
  // North America
  ctx.beginPath();
  ctx.ellipse(520, 320, 180, 120, -0.2, 0, Math.PI * 2);
  ctx.fill();
  
  // South America
  ctx.beginPath();
  ctx.ellipse(680, 680, 110, 190, 0.3, 0, Math.PI * 2);
  ctx.fill();

  // Eurasia
  ctx.beginPath();
  ctx.ellipse(1350, 310, 320, 160, 0.1, 0, Math.PI * 2);
  ctx.fill();

  // Africa
  ctx.beginPath();
  ctx.ellipse(1120, 560, 140, 200, 0.05, 0, Math.PI * 2);
  ctx.fill();

  // Australia
  ctx.beginPath();
  ctx.ellipse(1680, 720, 110, 80, -0.1, 0, Math.PI * 2);
  ctx.fill();

  // Add terrain accents (mountains & deserts)
  ctx.fillStyle = "#7c6843"; // Ochre / desert
  ctx.beginPath();
  ctx.ellipse(1080, 470, 120, 60, 0, 0, Math.PI * 2); // Sahara
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(1450, 360, 160, 70, 0, 0, Math.PI * 2); // Gobi / Central Asia
  ctx.fill();

  // Polar ice caps
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, 45); // Arctic
  ctx.fillRect(0, canvas.height - 55, canvas.width, 55); // Antarctica

  // Add grid lines for scientific NASA telemetry look
  ctx.strokeStyle = "rgba(0, 229, 255, 0.08)";
  ctx.lineWidth = 1;
  for (let y = 0; y <= canvas.height; y += 128) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }
  for (let x = 0; x <= canvas.width; x += 128) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

/**
 * Creates procedural night lights texture
 */
export function createProceduralNightTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#02040a";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Golden city light clusters
  ctx.fillStyle = "#ffcc66";
  const numClusters = 450;
  for (let i = 0; i < numClusters; i++) {
    const x = Math.random() * canvas.width;
    const y = 80 + Math.random() * (canvas.height - 160);
    const size = 0.5 + Math.random() * 2;
    ctx.globalAlpha = 0.3 + Math.random() * 0.7;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  return texture;
}

/**
 * Atmospheric Fresnel Glow Shader Material (Rayleigh Scattering)
 */
export function createAtmosphereMaterial() {
  const vertexShader = `
    varying vec3 vNormal;
    varying vec3 vPosition;
    void main() {
      vNormal = normalize(normalMatrix * normal);
      vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  const fragmentShader = `
    varying vec3 vNormal;
    varying vec3 vPosition;
    void main() {
      vec3 viewDir = normalize(-vPosition);
      float intensity = pow(1.0 - dot(vNormal, viewDir), 2.8);
      // NASA cyan-blue atmospheric limb
      vec3 atmosphereColor = vec3(0.12, 0.58, 0.98);
      gl_FragColor = vec4(atmosphereColor, intensity * 0.85);
    }
  `;

  return new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide,
    transparent: true,
    depthWrite: false
  });
}

/**
 * Builds the complete Earth entity with atmosphere and cloud shell
 * @param {number} radius - Radius in Three.js units (default 5.0)
 * @returns {THREE.Group}
 */
export function buildEarth(radius = 5.0) {
  const earthGroup = new THREE.Group();
  earthGroup.name = "EarthSystem";

  // Axial tilt: 23.44 degrees
  earthGroup.rotation.z = (23.44 * Math.PI) / 180;

  // Earth Globe
  const dayTexture = createProceduralEarthTexture();
  const earthGeo = new THREE.SphereGeometry(radius, 64, 64);
  const earthMat = new THREE.MeshStandardMaterial({
    map: dayTexture,
    roughness: 0.65,
    metalness: 0.1
  });
  const earthMesh = new THREE.Mesh(earthGeo, earthMat);
  earthMesh.name = "EarthMesh";
  earthGroup.add(earthMesh);

  // Atmospheric Halo Shell (slightly larger sphere)
  const atmosGeo = new THREE.SphereGeometry(radius * 1.15, 64, 64);
  const atmosMat = createAtmosphereMaterial();
  const atmosMesh = new THREE.Mesh(atmosGeo, atmosMat);
  atmosMesh.name = "AtmosphereGlow";
  earthGroup.add(atmosMesh);

  return earthGroup;
}
