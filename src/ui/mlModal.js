import { soundFX } from "../audio/soundFX.js";
import { predictAsteroidHazard } from "../ml/asteroidClassifier.js";

export class MLModalController {
  constructor() {
    this.modal = document.getElementById("ml-modal");
    this.btnOpen = document.getElementById("btn-open-ml");
    this.btnClose = document.getElementById("btn-close-ml");
    this.currentNeo = null;

    this.initDOM();
    this.initCustomTester();
  }

  initDOM() {
    if (this.btnOpen) {
      this.btnOpen.addEventListener("click", () => {
        soundFX.playRadarPing();
        this.open();
      });
    }

    if (this.btnClose) {
      this.btnClose.addEventListener("click", () => {
        soundFX.playTelemetryClick();
        this.close();
      });
    }

    if (this.modal) {
      this.modal.addEventListener("click", (e) => {
        if (e.target === this.modal) this.close();
      });
    }
  }

  open() {
    if (this.modal) this.modal.classList.add("active");
    this.updateWithCurrentNeo();
  }

  close() {
    if (this.modal) this.modal.classList.remove("active");
  }

  setNeo(neo) {
    this.currentNeo = neo;
    if (this.modal && this.modal.classList.contains("active")) {
      this.updateWithCurrentNeo();
    }
  }

  updateWithCurrentNeo() {
    if (!this.currentNeo) return;

    const avgDiam = ((this.currentNeo.estimated_diameter_min_m || 30) + (this.currentNeo.estimated_diameter_max_m || 60)) / 2;
    const prediction = predictAsteroidHazard({
      diameterM: avgDiam,
      missDistanceKm: this.currentNeo.miss_distance_km || 176800,
      relVelocityKms: this.currentNeo.relative_velocity_kms || 14.8,
      moidAU: this.currentNeo.miss_distance_au || 0.00118,
      eccentricity: this.currentNeo.orbital_elements?.eccentricity || 0.32,
      inclinationDeg: this.currentNeo.orbital_elements?.inclination_deg || 4.78
    });

    // Update displays
    const torinoVal = document.getElementById("ml-torino-value");
    const torinoDesc = document.getElementById("ml-torino-desc");
    const palermoVal = document.getElementById("ml-palermo-value");
    const confVal = document.getElementById("ml-conf-value");
    const targetTitle = document.getElementById("ml-target-title");

    if (targetTitle) targetTitle.textContent = `TARGET: ${this.currentNeo.name}`;
    if (torinoVal) {
      torinoVal.textContent = prediction.torinoScale;
      torinoVal.style.color = prediction.torinoColor;
    }
    if (torinoDesc) torinoDesc.textContent = prediction.torinoDescription;
    if (palermoVal) palermoVal.textContent = prediction.palermoScale;
    if (confVal) confVal.textContent = `${(prediction.mlConfidenceScore * 100).toFixed(1)}%`;

    // Render feature importance bars
    const barsContainer = document.getElementById("ml-feature-bars");
    if (barsContainer) {
      barsContainer.innerHTML = "";
      prediction.featureImportances.forEach(item => {
        const row = document.createElement("div");
        row.className = "ml-feature-row";
        row.innerHTML = `
          <div class="ml-feature-label">
            <span>${item.feature}</span>
            <span class="ml-feature-impact">${item.impact} (${item.importance}%)</span>
          </div>
          <div class="ml-bar-track">
            <div class="ml-bar-fill" style="width: ${item.importance}%"></div>
          </div>
        `;
        barsContainer.appendChild(row);
      });
    }
  }

  initCustomTester() {
    const sDiam = document.getElementById("custom-diam");
    const sVel = document.getElementById("custom-vel");
    const sMiss = document.getElementById("custom-miss");
    const valDiam = document.getElementById("val-custom-diam");
    const valVel = document.getElementById("val-custom-vel");
    const valMiss = document.getElementById("val-custom-miss");

    const outTorino = document.getElementById("out-custom-torino");
    const outHazard = document.getElementById("out-custom-hazard");
    const outEnergy = document.getElementById("out-custom-energy");

    const runCustomEval = () => {
      const diam = parseFloat(sDiam?.value || 60);
      const vel = parseFloat(sVel?.value || 15);
      const missKm = parseFloat(sMiss?.value || 150000);

      if (valDiam) valDiam.textContent = `${diam} m`;
      if (valVel) valVel.textContent = `${vel} km/s`;
      if (valMiss) valMiss.textContent = `${missKm.toLocaleString()} km (${(missKm / 384400).toFixed(2)} LD)`;

      const pred = predictAsteroidHazard({
        diameterM: diam,
        relVelocityKms: vel,
        missDistanceKm: missKm
      });

      if (outTorino) {
        outTorino.textContent = `Torino Scale: ${pred.torinoScale}`;
        outTorino.style.color = pred.torinoColor;
      }
      if (outHazard) outHazard.textContent = pred.torinoDescription;
      if (outEnergy) outEnergy.textContent = `Kinetic Yield: ${pred.energyMegatons} MT TNT (${pred.hiroshimaEquiv.toLocaleString()} Hiroshima bombs)`;
    };

    [sDiam, sVel, sMiss].forEach(s => {
      if (s) s.addEventListener("input", runCustomEval);
    });

    runCustomEval();
  }
}
