import { soundFX } from "../audio/soundFX.js";
import { propagateGeocentricFlyby, LUNAR_DISTANCE_KM } from "../physics/kepler.js";

export class HudController {
  constructor(callbacks = {}) {
    this.callbacks = callbacks;
    this.currentNeo = null;
    this.unitSystem = "metric"; // "metric", "imperial", "astronomical"
    this.initDOM();
    this.startClock();
  }

  initDOM() {
    // Buttons and inputs
    this.targetSelect = document.getElementById("neo-target-select");
    this.btnGeo = document.getElementById("btn-view-geo");
    this.btnHelio = document.getElementById("btn-view-helio");
    this.btnFocusAsteroid = document.getElementById("btn-focus-asteroid");
    this.btnFocusEarth = document.getElementById("btn-focus-earth");
    this.btnSound = document.getElementById("btn-sound-toggle");

    // Telemetry fields
    this.clockUTC = document.getElementById("hud-utc-clock");
    this.clockJD = document.getElementById("hud-jd-clock");
    this.targetName = document.getElementById("hud-target-name");
    this.targetType = document.getElementById("hud-target-type");
    this.targetDiameter = document.getElementById("hud-target-diameter");
    this.targetComparison = document.getElementById("hud-target-comparison");
    this.targetDistance = document.getElementById("hud-target-distance");
    this.targetVelocity = document.getElementById("hud-target-velocity");
    this.targetPhaBadge = document.getElementById("hud-pha-badge");
    this.targetEnergy = document.getElementById("hud-target-energy");
    this.targetNarrative = document.getElementById("hud-target-narrative");

    // Layers
    this.toggleOrbits = document.getElementById("toggle-orbits");
    this.toggleMoon = document.getElementById("toggle-moon");
    this.toggleSatellites = document.getElementById("toggle-satellites");

    this.bindEvents();
  }

  bindEvents() {
    if (this.targetSelect) {
      this.targetSelect.addEventListener("change", (e) => {
        soundFX.playRadarPing();
        if (this.callbacks.onSelectNeo) {
          this.callbacks.onSelectNeo(e.target.value);
        }
      });
    }

    if (this.btnGeo) {
      this.btnGeo.addEventListener("click", () => {
        soundFX.playTelemetryClick();
        this.setActiveViewBtn(this.btnGeo);
        if (this.callbacks.onViewChange) this.callbacks.onViewChange("geocentric");
      });
    }

    if (this.btnHelio) {
      this.btnHelio.addEventListener("click", () => {
        soundFX.playTelemetryClick();
        this.setActiveViewBtn(this.btnHelio);
        if (this.callbacks.onViewChange) this.callbacks.onViewChange("heliocentric");
      });
    }

    if (this.btnFocusAsteroid) {
      this.btnFocusAsteroid.addEventListener("click", () => {
        soundFX.playTelemetryClick();
        if (this.callbacks.onFocusAsteroid) this.callbacks.onFocusAsteroid();
      });
    }

    if (this.btnFocusEarth) {
      this.btnFocusEarth.addEventListener("click", () => {
        soundFX.playTelemetryClick();
        if (this.callbacks.onFocusEarth) this.callbacks.onFocusEarth();
      });
    }

    if (this.btnSound) {
      this.btnSound.addEventListener("click", () => {
        const isMuted = soundFX.toggleMute();
        this.btnSound.classList.toggle("muted", isMuted);
        this.btnSound.title = isMuted ? "Audio Muted" : "Audio Active";
      });
    }

    // Layer checkboxes
    if (this.toggleOrbits) {
      this.toggleOrbits.addEventListener("change", (e) => {
        if (this.callbacks.onToggleOrbits) this.callbacks.onToggleOrbits(e.target.checked);
      });
    }
    if (this.toggleMoon) {
      this.toggleMoon.addEventListener("change", (e) => {
        if (this.callbacks.onToggleMoon) this.callbacks.onToggleMoon(e.target.checked);
      });
    }
    if (this.toggleSatellites) {
      this.toggleSatellites.addEventListener("change", (e) => {
        if (this.callbacks.onToggleSatellites) this.callbacks.onToggleSatellites(e.target.checked);
      });
    }

    // Unit toggle buttons
    const unitMetric = document.getElementById("unit-metric");
    const unitImperial = document.getElementById("unit-imperial");
    const unitAstro = document.getElementById("unit-astro");
    [unitMetric, unitImperial, unitAstro].forEach(btn => {
      if (!btn) return;
      btn.addEventListener("click", () => {
        soundFX.playTelemetryClick();
        document.querySelectorAll(".unit-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        this.unitSystem = btn.dataset.unit;
        this.updateTelemetry(this.lastDeltaHours || 0);
      });
    });
  }

  setActiveViewBtn(activeBtn) {
    [this.btnGeo, this.btnHelio].forEach(b => {
      if (b) b.classList.remove("active");
    });
    if (activeBtn) activeBtn.classList.add("active");
  }

  populateNeoDropdown(neoList) {
    if (!this.targetSelect) return;
    this.targetSelect.innerHTML = "";

    neoList.forEach(neo => {
      const opt = document.createElement("option");
      opt.value = neo.id;
      const isWatch = neo.id === "2026_rz1" ? "★ [WATCH] " : "";
      const missLD = neo.miss_distance_ld ? ` (${neo.miss_distance_ld} LD)` : "";
      opt.textContent = `${isWatch}${neo.name}${missLD}`;
      if (neo.id === "2026_rz1") opt.selected = true;
      this.targetSelect.appendChild(opt);
    });
  }

  setNeo(neo) {
    this.currentNeo = neo;
    if (this.targetName) this.targetName.textContent = neo.name || "Unknown";
    if (this.targetType) this.targetType.textContent = `${neo.orbit_class || "Apollo"} Class Orbit`;

    const avgDiam = Math.round(((neo.estimated_diameter_min_m || 30) + (neo.estimated_diameter_max_m || 60)) / 2);
    if (this.targetDiameter) {
      this.targetDiameter.textContent = `${avgDiam} meters (${(avgDiam * 3.28084).toFixed(0)} ft)`;
    }

    if (this.targetComparison) {
      this.targetComparison.textContent = this.getSizeComparisonText(avgDiam);
    }

    if (this.targetPhaBadge) {
      if (neo.is_potentially_hazardous) {
        this.targetPhaBadge.textContent = "POTENTIALLY HAZARDOUS (PHA)";
        this.targetPhaBadge.className = "badge badge-pha";
      } else {
        this.targetPhaBadge.textContent = "NON-HAZARDOUS";
        this.targetPhaBadge.className = "badge badge-safe";
      }
    }

    if (this.targetNarrative && neo.narrative) {
      this.targetNarrative.textContent = neo.narrative;
    }

    this.updateTelemetry(0);
  }

  getSizeComparisonText(diameterM) {
    if (diameterM < 25) return "Size: ~School Bus (Chelyabinsk class)";
    if (diameterM < 80) return "Size: ~15-Story Building / Boeing 777";
    if (diameterM < 180) return "Size: ~Football Stadium (Dimorphos class)";
    if (diameterM < 400) return "Size: ~Eiffel Tower / Cruise Ship (Apophis class)";
    if (diameterM < 800) return "Size: ~Burj Khalifa / Skyscraper (Bennu class)";
    return "Size: Multi-Kilometer Planetary Impactor";
  }

  updateTelemetry(deltaHours) {
    this.lastDeltaHours = deltaHours;
    if (!this.currentNeo) return;

    // Calculate instantaneous geocentric flyby position and distance
    const flyby = propagateGeocentricFlyby(this.currentNeo, deltaHours);
    const distKm = flyby.distKm;
    const distLD = distKm / LUNAR_DISTANCE_KM;
    const velKms = this.currentNeo.relative_velocity_kms || 14.8;

    if (this.targetDistance) {
      if (this.unitSystem === "astronomical") {
        this.targetDistance.textContent = `${distLD.toFixed(3)} LD (${(distKm / 149597870.7).toFixed(5)} AU)`;
      } else if (this.unitSystem === "imperial") {
        this.targetDistance.textContent = `${(distKm * 0.621371).toLocaleString(undefined, { maximumFractionDigits: 0 })} miles (${distLD.toFixed(2)} Lunar Dist.)`;
      } else {
        this.targetDistance.textContent = `${distKm.toLocaleString(undefined, { maximumFractionDigits: 0 })} km (${distLD.toFixed(2)} LD)`;
      }
    }

    if (this.targetVelocity) {
      if (this.unitSystem === "imperial") {
        this.targetVelocity.textContent = `${(velKms * 2236.94).toLocaleString(undefined, { maximumFractionDigits: 0 })} mph`;
      } else {
        this.targetVelocity.textContent = `${velKms.toFixed(2)} km/s (${(velKms * 3600).toLocaleString(undefined, { maximumFractionDigits: 0 })} km/h)`;
      }
    }
  }

  startClock() {
    const update = () => {
      const now = new Date();
      if (this.clockUTC) {
        this.clockUTC.textContent = now.toISOString().replace("T", " ").substring(0, 19) + " UTC";
      }
      if (this.clockJD) {
        // Julian Date formula
        const time = now.getTime();
        const jd = (time / 86400000.0) + 2440587.5;
        this.clockJD.textContent = `JD ${jd.toFixed(4)}`;
      }
      requestAnimationFrame(update);
    };
    update();
  }
}
