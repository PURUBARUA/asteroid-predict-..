import * as THREE from "three";

/**
 * Creates the atmospheric halo shader
 */
function createAtmosphereMaterial() {
  const vertexShader = `
    varying vec3 vNormal;
    varying vec3 vPosition;
    void main() {
      vNormal = normalize(normalMatrix * normal);
      vec4 viewPos = modelViewMatrix * vec4(position, 1.0);
      vPosition = viewPos.xyz;
      gl_Position = projectionMatrix * viewPos;
    }
  `;

  const fragmentShader = `
    varying vec3 vNormal;
    varying vec3 vPosition;
    void main() {
      vec3 viewDir = normalize(-vPosition);
      float intensity = pow(1.0 - dot(vNormal, viewDir), 2.6);
      vec3 atmosphereColor = vec3(0.38, 0.48, 0.98);
      gl_FragColor = vec4(atmosphereColor, intensity * 0.9);
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
 * Builds the complete Earth entity with realistic textures and atmosphere
 */
export function buildEarth(radius = 5.0) {
  const earthGroup = new THREE.Group();
  earthGroup.name = "EarthSystem";

  // Earth axial tilt: 23.44 degrees
  earthGroup.rotation.z = (23.44 * Math.PI) / 180;

  const textureLoader = new THREE.TextureLoader();

  // 1) Earth Globe
  const earthGeo = new THREE.SphereGeometry(radius, 64, 64);
  const earthMat = new THREE.MeshStandardMaterial({
    map: textureLoader.load('/textures/earth.jpg'),
    roughness: 0.6,
    metalness: 0.1
  });
  const earthMesh = new THREE.Mesh(earthGeo, earthMat);
  earthMesh.name = "EarthMesh";
  earthGroup.add(earthMesh);

  // 2) Clouds Layer (slightly larger radius)
  const cloudGeo = new THREE.SphereGeometry(radius * 1.012, 64, 64);
  const cloudMat = new THREE.MeshStandardMaterial({
    map: textureLoader.load('/textures/earth_clouds.jpg'),
    transparent: true,
    opacity: 0.55,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide
  });
  const cloudMesh = new THREE.Mesh(cloudGeo, cloudMat);
  cloudMesh.name = "EarthClouds";
  earthMesh.add(cloudMesh); // Attach to earthMesh so it rotates with it

  // 3) Atmospheric Halo Shell
  const atmosGeo = new THREE.SphereGeometry(radius * 1.15, 64, 64);
  const atmosMat = createAtmosphereMaterial();
  const atmosMesh = new THREE.Mesh(atmosGeo, atmosMat);
  atmosMesh.name = "AtmosphereGlow";
  earthGroup.add(atmosMesh);

  return earthGroup;
}