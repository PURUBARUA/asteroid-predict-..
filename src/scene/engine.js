import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { buildEarth } from "./earth.js";
import { createStarfield, buildMoonSystem, buildSatelliteRings } from "./celestial.js";
import { createAsteroidMesh, createTrajectoryLine, createPerigeeVector } from "./asteroidModel.js";
import { buildSolarSystem } from "./solarSystem.js";
import { buildDeepSpaceEnvironment } from "./deepSpace.js";
import { propagateGeocentricFlyby, generateOrbitPath, propagateKeplerian } from "../physics/kepler.js";

export class SceneEngine {
  constructor(canvasContainer, onLabelUpdate) {
    this.container = canvasContainer;
    this.onLabelUpdate = onLabelUpdate;
    this.viewMode = "heliocentric"; // default to solar system view
    this.currentNeo = null;
    this.deltaHours = 0;
    this.focusedObject = null;
    this.orbitRingVisible = true;
    this.satellitesVisible = true;
    this.moonVisible = true;
    this.lastFrameTime = performance.now();

    this.initThree();
    this.initSceneObjects();
    this.initControls();
    this.bindEvents();
    this.animate();
  }

  initThree() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color("#02030b");

    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 8000);
    this.camera.position.set(0, 160, 220); // heliocentric default position

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance"
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.3;

    this.container.appendChild(this.renderer.domElement);

    // ─── BLOOM POST-PROCESSING ────────────────────────────────────────────────
    this.composer = new EffectComposer(this.renderer);
    const renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass);

    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(width, height),
      0.65,   // bloom strength
      0.5,    // bloom radius
      0.7     // bloom threshold
    );
    this.composer.addPass(this.bloomPass);

    const outputPass = new OutputPass();
    this.composer.addPass(outputPass);
  }

  initSceneObjects() {
    // Starfield
    this.starfield = createStarfield(4500, 1400);
    this.scene.add(this.starfield);

    // Directional Sunlight for Geocentric mode
    this.sunLight = new THREE.DirectionalLight(0xffffff, 2.3);
    this.sunLight.position.set(70, 25, 90);
    this.scene.add(this.sunLight);

    // Ambient space light
    this.ambientLight = new THREE.AmbientLight(0x312e81, 0.45);
    this.scene.add(this.ambientLight);

    // Earth System (for Geocentric Close-Encounter Watch)
    this.earthRadius = 5.0;
    this.earth = buildEarth(this.earthRadius);
    this.earth.visible = false;
    this.scene.add(this.earth);

    // Moon System (Geocentric 1 LD)
    this.moonSystem = buildMoonSystem(28.0);
    this.moonSystem.group.visible = false;
    this.scene.add(this.moonSystem.group);

    // Satellites (GEO & LEO rings)
    this.satelliteRings = buildSatelliteRings(this.earthRadius);
    this.satelliteRings.visible = false;
    this.scene.add(this.satelliteRings);

    // Asteroid Mesh
    this.asteroidMesh = createAsteroidMesh(0.75);
    this.scene.add(this.asteroidMesh);

    // Trajectory container group
    this.trajectoryGroup = new THREE.Group();
    this.scene.add(this.trajectoryGroup);

    // Full Solar System with 8 planets, Pluto, and 20+ moons
    this.solarSystem = buildSolarSystem();
    this.solarSystem.group.visible = true;
    this.scene.add(this.solarSystem.group);

    // Deep Space: Galaxies, Nebulae, Milky Way Band, Cosmic Dust
    this.deepSpace = buildDeepSpaceEnvironment();
    this.scene.add(this.deepSpace.group);

    // Subtle cosmic purple-blue fog for depth atmosphere
    this.scene.fog = new THREE.FogExp2(0x0a0818, 0.00065);
  }

  initControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.035;
    this.controls.rotateSpeed = 0.6;
    this.controls.zoomSpeed = 0.8;
    this.controls.minDistance = 2.0;
    this.controls.maxDistance = 2000.0;
    this.controls.maxPolarAngle = Math.PI - 0.05;
    // Smooth auto-rotate when idle
    this.controls.autoRotate = true;
    this.controls.autoRotateSpeed = 0.15;
  }

  bindEvents() {
    window.addEventListener("resize", () => {
      const w = this.container.clientWidth || window.innerWidth;
      const h = this.container.clientHeight || window.innerHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
      this.composer.setSize(w, h);
      this.bloomPass.resolution.set(w, h);
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
      this.solarSystem.group.visible = false;
      this.camera.position.set(0, 24, 48);
      this.controls.target.set(0, 0, 0);
    } else {
      // Heliocentric Solar System Mode
      this.earth.visible = false;
      this.moonSystem.group.visible = false;
      this.satelliteRings.visible = false;
      this.solarSystem.group.visible = true;
      this.camera.position.set(0, 160, 220);
      this.controls.target.set(0, 0, 0);
    }
    this.rebuildTrajectory();
    this.controls.update();
  }

  rebuildTrajectory() {
    while (this.trajectoryGroup.children.length > 0) {
      const obj = this.trajectoryGroup.children[0];
      if (obj.geometry) obj.geometry.dispose();
      this.trajectoryGroup.remove(obj);
    }

    if (!this.currentNeo) return;

    if (this.viewMode === "geocentric") {
      const points = [];
      const numSteps = 120;
      const spanHours = 48;
      for (let i = 0; i <= numSteps; i++) {
        const tHours = -spanHours / 2 + (i / numSteps) * spanHours;
        const pos = propagateGeocentricFlyby(this.currentNeo, tHours);
        const scale = 5.0 / 6371.0;
        points.push(new THREE.Vector3(pos.x * scale, pos.y * scale, pos.z * scale));
      }

      const trajectoryLine = createTrajectoryLine(points, 0x8b5cf6, 0x38bdf8);
      this.trajectoryGroup.add(trajectoryLine);

      const closest = propagateGeocentricFlyby(this.currentNeo, 0);
      const scale = 5.0 / 6371.0;
      const perigeeLine = createPerigeeVector({
        x: closest.x * scale,
        y: closest.y * scale,
        z: closest.z * scale
      }, 0xf43f5e);
      this.trajectoryGroup.add(perigeeLine);

    } else {
      const elements = this.currentNeo.orbital_elements;
      if (elements) {
        const orbitPoints = generateOrbitPath(elements, 200);
        // Earth orbit in solar system is radius 42
        const auScale = 42.0;
        const scaledPts = orbitPoints.map(p => new THREE.Vector3(p.x * auScale, p.z * auScale, p.y * auScale));
        const orbitLine = createTrajectoryLine(scaledPts, 0xec4899, 0x8b5cf6);
        this.trajectoryGroup.add(orbitLine);
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
      const deltaDays = deltaHours / 24.0;
      const elements = this.currentNeo.orbital_elements;
      if (elements) {
        const astPos = propagateKeplerian(elements, deltaDays);
        const auScale = 42.0;
        this.asteroidMesh.position.set(astPos.x * auScale, astPos.z * auScale, astPos.y * auScale);
      }
    }
  }

  focusObject(targetMesh, offsetDist = 8.0) {
    if (!targetMesh) return;
    const worldPos = new THREE.Vector3();
    targetMesh.getWorldPosition(worldPos);

    this.controls.target.copy(worldPos);
    this.camera.position.set(
      worldPos.x + offsetDist * 0.7,
      worldPos.y + offsetDist * 0.5,
      worldPos.z + offsetDist
    );
    this.controls.update();
  }

  focusPlanet(planetKey) {
    if (planetKey === "sun") {
      this.focusObject(this.solarSystem.sun, 25.0);
    } else if (this.solarSystem.planets[planetKey]) {
      const p = this.solarSystem.planets[planetKey];
      this.focusObject(p.mesh, p.data.radius * 3.5 + 4.0);
    }
  }

  focusMoon(planetKey, moonName) {
    const p = this.solarSystem.planets[planetKey];
    if (p) {
      const m = p.moons.find(item => item.name.toLowerCase() === moonName.toLowerCase());
      if (m) {
        this.focusObject(m.mesh, 3.5);
      }
    }
  }

  focusAsteroid() {
    this.focusObject(this.asteroidMesh, 4.0);
  }

  focusEarth() {
    if (this.viewMode === "geocentric") {
      this.camera.position.set(0, 24, 48);
      this.controls.target.set(0, 0, 0);
      this.controls.update();
    } else {
      this.focusPlanet("earth");
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

  toScreenPosition(obj3D) {
    const vector = new THREE.Vector3();
    const widthHalf = 0.5 * this.renderer.domElement.clientWidth;
    const heightHalf = 0.5 * this.renderer.domElement.clientHeight;

    obj3D.updateMatrixWorld();
    vector.setFromMatrixPosition(obj3D.matrixWorld);
    
    const behind = vector.clone().applyMatrix4(this.camera.matrixWorldInverse).z > 0;
    vector.project(this.camera);

    return {
      x: (vector.x * widthHalf) + widthHalf,
      y: -(vector.y * heightHalf) + heightHalf,
      visible: !behind && vector.z < 1.0
    };
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const now = performance.now();
    const deltaSec = Math.min((now - this.lastFrameTime) / 1000, 0.1); // clamp for tab-away
    this.lastFrameTime = now;

    // Update solar system revolution and rotation
    if (this.solarSystem && this.solarSystem.group.visible) {
      this.solarSystem.update(deltaSec);
    }

    // Update deep space objects (slow galactic rotation, dust shimmer)
    if (this.deepSpace) {
      this.deepSpace.update(deltaSec);
    }

    // Smooth framerate-independent Earth rotation
    if (this.earth && this.earth.visible) {
      const mesh = this.earth.getObjectByName("EarthMesh");
      if (mesh) mesh.rotation.y += 0.0012 * deltaSec * 60;
    }

    // Smooth asteroid tumble + reticle face camera
    if (this.asteroidMesh) {
      this.asteroidMesh.rotation.x += 0.006 * deltaSec * 60;
      this.asteroidMesh.rotation.y += 0.009 * deltaSec * 60;
      const reticle = this.asteroidMesh.getObjectByName("TargetReticle");
      if (reticle) reticle.lookAt(this.camera.position);
    }

    if (this.moonSystem && this.moonSystem.group.visible) {
      const angle = (Date.now() * 0.0001) % (Math.PI * 2);
      this.moonSystem.update(angle);
    }

    // Slow starfield drift for parallax depth
    if (this.starfield) {
      this.starfield.rotation.y += 0.00003 * deltaSec * 60;
    }

    this.controls.update();

    // Render through bloom composer for cinematic glow
    this.composer.render();

    // Update 3D projected screen labels
    if (this.onLabelUpdate) {
      if (this.viewMode === "geocentric") {
        const earthScr = this.toScreenPosition(this.earth);
        const astScr = this.toScreenPosition(this.asteroidMesh);
        const moonScr = this.moonSystem?.mesh ? this.toScreenPosition(this.moonSystem.mesh) : null;
        this.onLabelUpdate({
          viewMode: "geocentric",
          labels: [
            { id: "earth", name: "Earth", pos: earthScr, type: "planet" },
            { id: "asteroid", name: this.currentNeo?.name || "2026 RZ1", pos: astScr, type: "asteroid" },
            { id: "moon", name: "Moon (1 LD)", pos: moonScr, type: "moon" }
          ]
        });
      } else {
        // Heliocentric / Solar System Mode labels
        const activeLabels = [];
        // Asteroid
        const astScr = this.toScreenPosition(this.asteroidMesh);
        activeLabels.push({ id: "asteroid", name: this.currentNeo?.name || "2026 RZ1", pos: astScr, type: "asteroid" });
        // Sun
        const sunScr = this.toScreenPosition(this.solarSystem.sun);
        activeLabels.push({ id: "sun", name: "Sun", pos: sunScr, type: "star" });

        // Major planets
        Object.entries(this.solarSystem.planets).forEach(([key, p]) => {
          const scr = this.toScreenPosition(p.mesh);
          activeLabels.push({ id: key, name: p.data.name, pos: scr, type: "planet" });

          // Also major moons if camera is close enough (< 120 units)
          const distToCam = this.camera.position.distanceTo(p.group.position);
          if (distToCam < 90) {
            p.moons.forEach(m => {
              const mScr = this.toScreenPosition(m.mesh);
              activeLabels.push({
                id: `moon_${m.name.toLowerCase()}`,
                name: m.name,
                pos: mScr,
                type: "moon"
              });
            });
          }
        });

        // Galaxy & Nebula labels (visible when zoomed out)
        if (this.deepSpace) {
          this.deepSpace.labelsList.forEach(dl => {
            const scr = this.toScreenPosition(dl.mesh);
            if (scr.visible) {
              activeLabels.push({
                id: dl.id,
                name: dl.name,
                pos: scr,
                type: dl.type
              });
            }
          });
        }

        this.onLabelUpdate({
          viewMode: "heliocentric",
          labels: activeLabels
        });
      }
    }
  }
}