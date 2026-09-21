import { SceneEngine } from "./scene/engine.js";
import { nasaApi } from "./api/nasaApi.js";
import { HudController } from "./ui/hud.js";
import { TimelineController } from "./ui/timeline.js";
import { StudentLabController } from "./ui/studentLab.js";
import { MLModalController } from "./ui/mlModal.js";
import { ComplianceModalController } from "./ui/complianceModal.js";

class PlanetaryDefenseApp {
  constructor() {
    this.container = document.getElementById("canvas-container");
    this.neoList = [];
    this.activeNeo = null;

    this.init();
  }

  async init() {
    // Initialize 3D WebGL Scene
    this.engine = new SceneEngine(this.container);

    // Initialize HUD and UI Controllers
    this.hud = new HudController({
      onSelectNeo: (id) => this.selectNeoById(id),
      onViewChange: (mode) => this.engine.setViewMode(mode),
      onFocusAsteroid: () => this.engine.focusAsteroid(),
      onFocusEarth: () => this.engine.focusEarth(),
      onToggleOrbits: (v) => this.engine.toggleOrbits(v),
      onToggleMoon: (v) => this.engine.toggleMoon(v),
      onToggleSatellites: (v) => this.engine.toggleSatellites(v)
    });

    this.timeline = new TimelineController((deltaHours) => {
      this.engine.updateAsteroidPosition(deltaHours);
      this.hud.updateTelemetry(deltaHours);
    });

    this.studentLab = new StudentLabController((customElements) => {
      // If student adjusts Keplerian elements in the lab:
      if (this.activeNeo) {
        const modified = {
          ...this.activeNeo,
          orbital_elements: {
            ...this.activeNeo.orbital_elements,
            ...customElements
          }
        };
        this.engine.setTargetNeo(modified);
      }
    });

    this.mlModal = new MLModalController();
    this.complianceModal = new ComplianceModalController(() => {
      this.loadNeos();
    });

    // Load Near-Earth Objects
    await this.loadNeos();
  }

  async loadNeos() {
    try {
      this.neoList = await nasaApi.getFeed();
      this.hud.populateNeoDropdown(this.neoList);

      // Default to 2026 RZ1 (or first featured object)
      const defaultObj = this.neoList.find(n => n.id === "2026_rz1") || this.neoList[0];
      if (defaultObj) {
        this.selectNeo(defaultObj);
      }
    } catch (err) {
      console.error("Failed to load NEO data:", err);
    }
  }

  selectNeoById(id) {
    const found = this.neoList.find(n => n.id === id);
    if (found) this.selectNeo(found);
  }

  selectNeo(neo) {
    this.activeNeo = neo;
    this.engine.setTargetNeo(neo);
    this.hud.setNeo(neo);
    this.mlModal.setNeo(neo);
    this.timeline.setTime(0); // reset to closest approach encounter
  }
}

// Bootstrap application on DOM ready
window.addEventListener("DOMContentLoaded", () => {
  new PlanetaryDefenseApp();
});
