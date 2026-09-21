import { soundFX } from "../audio/soundFX.js";
import { propagateGeocentricFlyby, LUNAR_DISTANCE_KM } from "../physics/kepler.js";

export class HudController {
  constructor(callbacks = {}) {
    this.callbacks = callbacks;
    this.currentNeo = null;
    this.neoList = [];
    this.currentIndex = 0;
    this.unitSystem = "metric";

    this.initDOM();
    this.startClock();
  }

  initDOM() {
    // Navigation & Buttons
    this.searchInput = document.getElementById("header-search-input");
    this.btnPrev = document.getElementById("btn-prev-neo");
    this.btnNext = document.getElementById("btn-next-neo");
    this.btnGeo = document.getElementById("btn-view-geo");
    this.btnHelio = document.getElementById("btn-view-helio");
    this.btnFocusAsteroid = document.getElementById("btn-focus-asteroid");
    this.btnFocusEarth = document.getElementById("btn-focus-earth");
    this.btnSound = document.getElementById("btn-sound-toggle");

    // Telemetry fields (NASA 4-grid metrics)
    this.clockUTC = document.getElementById("hud-utc-clock");
    this.clockJD = document.getElementById("hud-jd-clock");
    this.targetTitle = document.getElementById("hud-target-title");
    this.targetSubtitle = document.getElementById("hud-target-subtitle");
    
    this.metricNextPass = document.getElementById("metric-next-pass");
    this.metricNextPassSub = document.getElementById("metric-next-pass-sub");
    
    this.metricDistance = document.getElementById("metric-distance");
    this.metricDistanceSub = document.getElementById("metric-distance-sub");
    
    this.metricSpeed = document.getElementById("metric-speed");
    this.metricSpeedSub = document.getElementById("metric-speed-sub");
    
    this.metricSize = document.getElementById("metric-size");
    this.metricSizeSub = document.getElementById("metric-size-sub");

    this.gaugePin = document.getElementById("gauge-asteroid-pin");
    this.narrativeBrief = document.getElementById("hud-narrative-brief");

    // Floating 3D Labels
    this.labelEarth = document.getElementById("label-earth");
    this.labelAsteroid = document.getElementById("label-asteroid");
    this.labelAsteroidText = document.getElementById("label-asteroid-text");
    this.labelMoon = document.getElementById("label-moon");

    // Layer checkboxes
    this.toggleOrbits = document.getElementById("toggle-orbits");
    this.toggleMoon = document.getElementById("toggle-moon");
    this.toggleSatellites = document.getElementById("toggle-satellites");

    this.bindEvents();
  }

  bindEvents() {
    // Search bar live filtering
    if (this.searchInput) {
      this.searchInput.addEventListener("input", (e) => {
        const query = e.target.value.toLowerCase().trim();
        if (!query) return;
        const found = this.neoList.find(n => 
          n.name.toLowerCase().includes(query) || 
          n.full_name?.toLowerCase().includes(query) ||
          n.id.toLowerCase().includes(query)
        );
        if (found) {
          this.setNeo(found);
          if (this.callbacks.onSelectNeo) this.callbacks.onSelectNeo(found.id);
        }
      });
    }

    // Carousel navigation
    if (this.btnPrev) {
      this.btnPrev.addEventListener("click", () => {
        soundFX.playTelemetryClick();
        this.stepCarousel(-1);
      });
    }
    if (this.btnNext) {
      this.btnNext.addEventListener("click", () => {
        soundFX.playTelemetryClick();
        this.stepCarousel(1);
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

  setNeoList(list) {
    this.neoList = list || [];
  }

  stepCarousel(direction) {
    if (this.neoList.length === 0) return;
    this.currentIndex = (this.currentIndex + direction + this.neoList.length) % this.neoList.length;
    const nextNeo = this.neoList[this.currentIndex];
    this.setNeo(nextNeo);
    if (this.callbacks.onSelectNeo) this.callbacks.onSelectNeo(nextNeo.id);
  }

  setNeo(neo) {
    this.currentNeo = neo;
    this.currentIndex = this.neoList.findIndex(n => n.id === neo.id);
    if (this.currentIndex === -1) this.currentIndex = 0;

    if (this.targetTitle) this.targetTitle.textContent = neo.name || "Unknown";
    if (this.targetSubtitle) {
      const phaText = neo.is_potentially_hazardous ? "Potentially Hazardous Asteroid • " : "";
      this.targetSubtitle.textContent = `${phaText}${neo.orbit_class || "Apollo"} Class`;
    }

    if (this.labelAsteroidText) {
      this.labelAsteroidText.textContent = neo.name;
    }

    // Size Metric
    const avgDiam = Math.round(((neo.estimated_diameter_min_m || 30) + (neo.estimated_diameter_max_m || 60)) / 2);
    if (this.metricSize) {
      this.metricSize.textContent = `~${avgDiam} m`;
    }
    if (this.metricSizeSub) {
      this.metricSizeSub.textContent = this.getSizeComparisonText(avgDiam);
    }

    // Next Pass Metric
    if (this.metricNextPass) {
      this.metricNextPass.textContent = neo.close_approach_date?.split(" ")[0] || "Sep 12, 2026";
    }
    if (this.metricNextPassSub) {
      this.metricNextPassSub.textContent = "Closest Encounter Watch";
    }

    // Narrative
    if (this.narrativeBrief && neo.narrative) {
      this.narrativeBrief.textContent = neo.narrative;
    }

    this.updateTelemetry(0);
  }

  getSizeComparisonText(diameterM) {
    if (diameterM < 25) return "~Bus Size (Chelyabinsk)";
    if (diameterM < 80) return "~Boeing 777 / 15-Story Bldg";
    if (diameterM < 180) return "~Football Stadium (DART)";
    if (diameterM < 400) return "~Eiffel Tower (Apophis)";
    return "~Skyscraper / Mountain";
  }

  updateTelemetry(deltaHours) {
    this.lastDeltaHours = deltaHours;
    if (!this.currentNeo) return;

    const flyby = propagateGeocentricFlyby(this.currentNeo, deltaHours);
    const distKm = flyby.distKm;
    const distLD = distKm / LUNAR_DISTANCE_KM;
    const velKms = this.currentNeo.relative_velocity_kms || 14.8;

    // Distance Metric
    if (this.metricDistance) {
      if (this.unitSystem === "astronomical") {
        this.metricDistance.textContent = `${distLD.toFixed(3)} LD`;
      } else if (this.unitSystem === "imperial") {
        this.metricDistance.textContent = `${(distKm * 0.621371).toLocaleString(undefined, { maximumFractionDigits: 0 })} mi`;
      } else {
        this.metricDistance.textContent = `${distKm.toLocaleString(undefined, { maximumFractionDigits: 0 })} km`;
      }
    }
    if (this.metricDistanceSub) {
      this.metricDistanceSub.textContent = `${distLD.toFixed(2)} Lunar Distances (${distLD < 1.0 ? "Closer than Moon!" : "Outside Moon orbit"})`;
    }

    // Speed Metric
    if (this.metricSpeed) {
      if (this.unitSystem === "imperial") {
        this.metricSpeed.textContent = `${(velKms * 2236.94).toLocaleString(undefined, { maximumFractionDigits: 0 })} mph`;
      } else {
        this.metricSpeed.textContent = `${velKms.toFixed(2)} km/s`;
      }
    }
    if (this.metricSpeedSub) {
      this.metricSpeedSub.textContent = `${(velKms * 3600).toLocaleString(undefined, { maximumFractionDigits: 0 })} km/h relative to Earth`;
    }

    // Update Lunar Distance graphical gauge pin
    if (this.gaugePin) {
      // 0 LD = 0%, 1.0 LD = 70% (Moon marker)
      const pct = Math.max(3, Math.min(97, (distLD / 1.0) * 70));
      this.gaugePin.style.left = `${pct}%`;
    }
  }

  updateLabels(positions) {
    if (positions.earth && this.labelEarth) {
      if (positions.earth.visible) {
        this.labelEarth.style.left = `${positions.earth.x}px`;
        this.labelEarth.style.top = `${positions.earth.y - 12}px`;
        this.labelEarth.classList.add("visible");
      } else {
        this.labelEarth.classList.remove("visible");
      }
    }

    if (positions.asteroid && this.labelAsteroid) {
      if (positions.asteroid.visible) {
        this.labelAsteroid.style.left = `${positions.asteroid.x}px`;
        this.labelAsteroid.style.top = `${positions.asteroid.y - 12}px`;
        this.labelAsteroid.classList.add("visible");
      } else {
        this.labelAsteroid.classList.remove("visible");
      }
    }

    if (positions.moon && this.labelMoon) {
      if (positions.moon.visible) {
        this.labelMoon.style.left = `${positions.moon.x}px`;
        this.labelMoon.style.top = `${positions.moon.y - 10}px`;
        this.labelMoon.classList.add("visible");
      } else {
        this.labelMoon.classList.remove("visible");
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
        const time = now.getTime();
        const jd = (time / 86400000.0) + 2440587.5;
        this.clockJD.textContent = `JD ${jd.toFixed(4)}`;
      }
      requestAnimationFrame(update);
    };
    update();
  }
}