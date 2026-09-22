import { soundFX } from "../audio/soundFX.js";
import { propagateGeocentricFlyby, LUNAR_DISTANCE_KM } from "../physics/kepler.js";

export class HudController {
  constructor(callbacks = {}) {
    this.callbacks = callbacks;
    this.currentNeo = null;
    this.neoList = [];
    this.currentIndex = 0;
    this.unitSystem = "metric";
    this.labelPool = new Map();

    this.initDOM();
    this.startClock();
  }

  initDOM() {
    this.searchInput = document.getElementById("header-search-input");
    this.btnPrev = document.getElementById("btn-prev-neo");
    this.btnNext = document.getElementById("btn-next-neo");
    this.btnGeo = document.getElementById("btn-view-geo");
    this.btnHelio = document.getElementById("btn-view-helio");
    this.btnFocusAsteroid = document.getElementById("btn-focus-asteroid");
    this.btnFocusEarth = document.getElementById("btn-focus-earth");
    this.btnSound = document.getElementById("btn-sound-toggle");
    this.solarBodySelect = document.getElementById("solar-body-select");

    // Telemetry fields
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

    // Dynamic Label Container
    this.labelsContainer = document.getElementById("labels-container");

    // Layer checkboxes
    this.toggleOrbits = document.getElementById("toggle-orbits");
    this.toggleMoon = document.getElementById("toggle-moon");
    this.toggleSatellites = document.getElementById("toggle-satellites");

    this.bindEvents();
  }

  bindEvents() {
    // Theme Selector
    const themeSelect = document.getElementById("theme-select");
    if (themeSelect) {
      themeSelect.addEventListener("change", (e) => {
        document.documentElement.setAttribute("data-theme", e.target.value);
        if (window.soundFX) window.soundFX.playTelemetryClick();
      });
    }

    // Collapse Panels
    const btnLeft = document.getElementById("btn-collapse-left");
    const watchCard = document.querySelector(".asteroid-watch-card");
    if (btnLeft && watchCard) {
      btnLeft.addEventListener("click", () => {
        watchCard.classList.toggle("collapsed");
        if (window.soundFX) window.soundFX.playTelemetryClick();
      });
    }

    const btnRight = document.getElementById("btn-collapse-right");
    const controlsCard = document.querySelector(".controls-card");
    if (btnRight && controlsCard) {
      btnRight.addEventListener("click", () => {
        controlsCard.classList.toggle("collapsed");
        if (window.soundFX) window.soundFX.playTelemetryClick();
      });
    }

    // Zen Mode Toggle
    const btnZen = document.getElementById("btn-zen-mode");
    if (btnZen) {
      btnZen.addEventListener("click", () => {
        document.body.classList.toggle("zen-mode");
        if (window.soundFX) window.soundFX.playTelemetryClick();
      });
    }

    // Solar Body focus selector
    if (this.solarBodySelect) {
      this.solarBodySelect.addEventListener("change", (e) => {
        const val = e.target.value;
        soundFX.playRadarPing();
        if (this.callbacks.onFocusBody) {
          this.callbacks.onFocusBody(val);
        }
      });
    }

    // Live search
    if (this.searchInput) {
      this.searchInput.addEventListener("input", (e) => {
        const query = e.target.value.toLowerCase().trim();
        if (!query) return;

        // Check if searching for a planet
        const planets = ["sun", "mercury", "venus", "earth", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto"];
        const matchPlanet = planets.find(p => p.startsWith(query));
        if (matchPlanet && this.callbacks.onFocusBody) {
          if (this.solarBodySelect) this.solarBodySelect.value = matchPlanet;
          this.callbacks.onFocusBody(matchPlanet);
          return;
        }

        // Check asteroids
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

    const avgDiam = Math.round(((neo.estimated_diameter_min_m || 30) + (neo.estimated_diameter_max_m || 60)) / 2);
    if (this.metricSize) {
      this.metricSize.textContent = `~${avgDiam} m`;
    }
    if (this.metricSizeSub) {
      this.metricSizeSub.textContent = this.getSizeComparisonText(avgDiam);
    }

    if (this.metricNextPass) {
      this.metricNextPass.textContent = neo.close_approach_date?.split(" ")[0] || "Sep 12, 2026";
    }
    if (this.metricNextPassSub) {
      this.metricNextPassSub.textContent = "Closest Encounter Watch";
    }

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

    if (this.gaugePin) {
      const pct = Math.max(3, Math.min(97, (distLD / 1.0) * 70));
      this.gaugePin.style.left = `${pct}%`;
    }
  }

  updateLabels(data) {
    if (!this.labelsContainer) return;
    const { labels } = data;
    const activeIds = new Set();

    labels.forEach(item => {
      if (!item.pos || !item.pos.visible) return;
      activeIds.add(item.id);

      let el = this.labelPool.get(item.id);
      if (!el) {
        el = document.createElement("div");
        el.className = `floating-3d-label ${item.type}`;
        el.innerHTML = `
          <div class="label-content">
            <span class="label-dot ${item.type}"></span>
            <span class="label-title-text">${item.name}</span>
          </div>
          <div class="label-pointer"></div>
        `;
        this.labelsContainer.appendChild(el);
        this.labelPool.set(item.id, el);
      }

      el.style.left = `${item.pos.x}px`;
      el.style.top = `${item.pos.y - 8}px`;
      el.classList.add("visible");
    });

    // Hide labels no longer in view
    this.labelPool.forEach((el, id) => {
      if (!activeIds.has(id)) {
        el.classList.remove("visible");
      }
    });
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