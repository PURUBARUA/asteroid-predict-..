import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { buildEarth } from "./earth.js";
import { createStarfield, buildMoonSystem, buildSatelliteRings, createOrbitRing } from "./celestial.js";
import { createAsteroidMesh, createTrajectoryLine, createPerigeeVector } from "./asteroidModel.js";
import { propagateGeocentricFlyby, generateOrbitPath, propagateKeplerian, LUNAR_DISTANCE_KM } from "../physics/kepler.js";

export class SceneEngine {
  constructor(canvasContainer) {
    this.container = canvasContainer;
    this.viewMode = "geocentric"; // "geocentric" or "heliocentric"
    this.currentNeo = null;
    this.deltaHours = 0; // Relative to closest approach (t=0)
    this.orbitRingVisible = true;
    this.satellitesVisible = true;
    this.moonVisible = true;

    this.initThree();
    this.initSceneObjects();
    this.initControls();
    this.bindEvents();
    this.animate();
  }

  initThree() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color("#02040a"); // Deep space black

    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 3000);
    this.camera.position.set(0, 22, 50);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance"
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;

    this.container.appendChild(this.renderer.domElement);
  }

  initSceneObjects() {
    // Starfield
    this.starfield = createStarfield(4500, 900);
    this.scene.add(this.starfield);

    // Directional Sunlight
    this.sunLight = new THREE.DirectionalLight(0xffffff, 2.2);
    this.sunLight.position.set(60, 20, 80);
    this.scene.add(this.sunLight);

    // Ambient space light
    this.ambientLight = new THREE.AmbientLight(0x2a3b5c, 0.45);
    this.scene.add(this.ambientLight);

    // Earth System
    this.earthRadius = 5.0;
    this.earth = buildEarth(this.earthRadius);
    this.scene.add(this.earth);

    // Moon System (1 Lunar Distance ~ 28 units visual)
    this.moonSystem = buildMoonSystem(28.0);
    this.scene.add(this.moonSystem.group);

    // Satellites (GEO & LEO rings)
    this.satelliteRings = buildSatelliteRings(this.earthRadius);
    this.scene.add(this.satelliteRings);

    // Asteroid Mesh
    this.asteroidMesh = createAsteroidMesh(0.75);
    this.scene.add(this.asteroidMesh);

    // Trajectory container group
    this.trajectoryGroup = new THREE.Group();
    this.scene.add(this.trajectoryGroup);

    // Sun for heliocentric mode
    const sunGeo = new THREE.SphereGeometry(6, 32, 32);
    const sunMat = new THREE.MeshBasicMaterial({ color: 0xffd700 });
    this.heliocenterSun = new THREE.Mesh(sunGeo, sunMat);
    this.heliocenterSun.visible = false;
    this.scene.add(this.heliocenterSun);
  }

  initControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 6.0;
    this.controls.maxDistance = 600.0;
    this.controls.maxPolarAngle = Math.PI - 0.05;
  }

  bindEvents() {
    window.addEventListener("resize", () => {
      const w = this.container.clientWidth || window.innerWidth;
      const h = this.container.clientHeight || window.innerHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    });
  }

  setTargetNeo(neo) {
    this.currentNeo = neo;
    this.rebuildTrajectory();
    this.updateAsteroidPosition(this.deltaHours);
  }

  setViewMode(mode) {
    this.viewMode = mode;
    if (mode === "geocentric") {
      this.earth.visible = true;
      this.moonSystem.group.visible = this.moonVisible;
      this.satelliteRings.visible = this.satellitesVisible;
      this.heliocenterSun.visible = false;
      this.camera.position.set(0, 25, 48);
      this.controls.target.set(0, 0, 0);
    } else {
      // Heliocentric Solar System Mode
      this.earth.visible = true;
      this.moonSystem.group.visible = false;
      this.satelliteRings.visible = false;
      this.heliocenterSun.visible = true;
      this.camera.position.set(0, 140, 160);
      this.controls.target.set(0, 0, 0);
    }
    this.rebuildTrajectory();
    this.controls.update();
  }

  rebuildTrajectory() {
    // Clear old trajectory lines
    while (this.trajectoryGroup.children.length > 0) {
      const obj = this.trajectoryGroup.children[0];
      if (obj.geometry) obj.geometry.dispose();
      this.trajectoryGroup.remove(obj);
    }

    if (!this.currentNeo) return;

    if (this.viewMode === "geocentric") {
      // Build flyby arc relative to Earth
      const points = [];
      const numSteps = 120;
      const spanHours = 48; // -24h to +24h
      for (let i = 0; i <= numSteps; i++) {
        const tHours = -spanHours / 2 + (i / numSteps) * spanHours;
        const pos = propagateGeocentricFlyby(this.currentNeo, tHours);
        // Scale km to Three.js world units: Earth radius (6,371 km) = 5 units
        const scale = 5.0 / 6371.0;
        // Limit visual bounds for hyperbolic asymptote
        points.push(new THREE.Vector3(pos.x * scale, pos.y * scale, pos.z * scale));
      }

      const trajectoryLine = createTrajectoryLine(points, 0x00e5ff);
      this.trajectoryGroup.add(trajectoryLine);

      // Add closest approach perigee vector
      const closest = propagateGeocentricFlyby(this.currentNeo, 0);
      const scale = 5.0 / 6371.0;
      const perigeeLine = createPerigeeVector({
        x: closest.x * scale,
        y: closest.y * scale,
        z: closest.z * scale
      }, 0xff3b30);
      this.trajectoryGroup.add(perigeeLine);

    } else {
      // Heliocentric orbit path
      const elements = this.currentNeo.orbital_elements;
      if (elements) {
        const orbitPoints = generateOrbitPath(elements, 200);
        // Scale 1 AU = 60 Three.js units
        const auScale = 60.0;
        const scaledPts = orbitPoints.map(p => new THREE.Vector3(p.x * auScale, p.z * auScale, p.y * auScale));
        const orbitLine = createTrajectoryLine(scaledPts, 0xff9900);
        this.trajectoryGroup.add(orbitLine);

        // Earth orbit line (1 AU circle)
        const earthOrbit = createOrbitRing(60.0, "#00e5ff", false, 0.35);
        this.trajectoryGroup.add(earthOrbit);
      }
    }
  }

  updateAsteroidPosition(deltaHours) {
    this.deltaHours = deltaHours;
    if (!this.currentNeo) return;

    if (this.viewMode === "geocentric") {
      const pos = propagateGeocentricFlyby(this.currentNeo, deltaHours);
      const scale = 5.0 / 6371.0;
      this.asteroidMesh.position.set(pos.x * scale, pos.y * scale, pos.z * scale);
      this.earth.position.set(0, 0, 0);
    } else {
      // Heliocentric positioning
      const deltaDays = deltaHours / 24.0;
      const elements = this.currentNeo.orbital_elements;
      if (elements) {
        const astPos = propagateKeplerian(elements, deltaDays);
        const auScale = 60.0;
        this.asteroidMesh.position.set(astPos.x * auScale, astPos.z * auScale, astPos.y * auScale);

        // Earth circular position for heliocentric reference
        const earthAngle = (deltaDays / 365.25) * 2 * Math.PI;
        this.earth.position.set(Math.cos(earthAngle) * auScale, 0, Math.sin(earthAngle) * auScale);
      }
    }
  }

  toggleOrbits(visible) {
    this.orbitRingVisible = visible;
    this.trajectoryGroup.visible = visible;
  }

  toggleSatellites(visible) {
    this.satellitesVisible = visible;
    this.satelliteRings.visible = visible;
  }

  toggleMoon(visible) {
    this.moonVisible = visible;
    this.moonSystem.group.visible = visible;
  }

  focusAsteroid() {
    const pos = this.asteroidMesh.position;
    this.camera.position.set(pos.x + 3, pos.y + 2, pos.z + 4);
    this.controls.target.copy(pos);
    this.controls.update();
  }

  focusEarth() {
    this.camera.position.set(0, 22, 48);
    this.controls.target.set(0, 0, 0);
    this.controls.update();
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    // Earth axial spin
    if (this.earth) {
      const mesh = this.earth.getObjectByName("EarthMesh");
      if (mesh) mesh.rotation.y += 0.001;
    }

    // Asteroid tumbling rotation
    if (this.asteroidMesh) {
      this.asteroidMesh.rotation.x += 0.008;
      this.asteroidMesh.rotation.y += 0.012;
      const reticle = this.asteroidMesh.getObjectByName("TargetReticle");
      if (reticle) reticle.lookAt(this.camera.position);
    }

    // Moon revolution
    if (this.moonSystem) {
      const angle = (Date.now() * 0.0001) % (Math.PI * 2);
      this.moonSystem.update(angle);
    }

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}
