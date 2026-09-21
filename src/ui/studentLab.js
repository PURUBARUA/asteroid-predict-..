import { soundFX } from "../audio/soundFX.js";
import { 
  calculateAsteroidMass, 
  calculateKineticEnergy, 
  calculateCraterDimensions, 
  calculateAtmosphericEntry, 
  calculateKineticDeflection 
} from "../physics/impactPhysics.js";

export class StudentLabController {
  constructor(onOrbitParamChange) {
    this.onOrbitParamChange = onOrbitParamChange;
    this.modal = document.getElementById("student-lab-modal");
    this.btnOpen = document.getElementById("btn-open-student-lab");
    this.btnClose = document.getElementById("btn-close-student-lab");

    this.initDOM();
    this.initTabs();
    this.initDeflectionSim();
    this.initCraterSim();
    this.initKeplerDials();
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

    // Backdrop click
    if (this.modal) {
      this.modal.addEventListener("click", (e) => {
        if (e.target === this.modal) this.close();
      });
    }
  }

  open() {
    if (this.modal) this.modal.classList.add("active");
  }

  close() {
    if (this.modal) this.modal.classList.remove("active");
  }

  initTabs() {
    const tabs = document.querySelectorAll(".lab-tab-btn");
    const contents = document.querySelectorAll(".lab-tab-content");

    tabs.forEach(tab => {
      tab.addEventListener("click", () => {
        soundFX.playTelemetryClick();
        tabs.forEach(t => t.classList.remove("active"));
        contents.forEach(c => c.classList.remove("active"));

        tab.classList.add("active");
        const target = document.getElementById(tab.dataset.target);
        if (target) target.classList.add("active");
      });
    });
  }

  initKeplerDials() {
    const sliderA = document.getElementById("dial-a");
    const sliderE = document.getElementById("dial-e");
    const sliderI = document.getElementById("dial-i");
    const valA = document.getElementById("val-dial-a");
    const valE = document.getElementById("val-dial-e");
    const valI = document.getElementById("val-dial-i");
    const perihelionDisplay = document.getElementById("kepler-perihelion");
    const aphelionDisplay = document.getElementById("kepler-aphelion");

    const updateKepler = () => {
      const a = parseFloat(sliderA?.value || 1.35);
      const e = parseFloat(sliderE?.value || 0.32);
      const i = parseFloat(sliderI?.value || 4.78);

      if (valA) valA.textContent = `${a.toFixed(2)} AU`;
      if (valE) valE.textContent = e.toFixed(2);
      if (valI) valI.textContent = `${i.toFixed(1)}°`;

      const q = a * (1 - e);
      const Q = a * (1 + e);
      if (perihelionDisplay) perihelionDisplay.textContent = `${q.toFixed(3)} AU`;
      if (aphelionDisplay) aphelionDisplay.textContent = `${Q.toFixed(3)} AU`;

      if (this.onOrbitParamChange) {
        this.onOrbitParamChange({
          semi_major_axis_au: a,
          eccentricity: e,
          inclination_deg: i
        });
      }
    };

    [sliderA, sliderE, sliderI].forEach(s => {
      if (s) s.addEventListener("input", updateKepler);
    });
  }

  initDeflectionSim() {
    const sliderLead = document.getElementById("dart-lead-time");
    const sliderMass = document.getElementById("dart-impactor-mass");
    const valLead = document.getElementById("val-dart-lead");
    const valMass = document.getElementById("val-dart-mass");
    const resultDv = document.getElementById("res-dart-dv");
    const resultDist = document.getElementById("res-dart-dist");
    const resultStatus = document.getElementById("res-dart-status");
    const btnFire = document.getElementById("btn-fire-dart");

    const runSim = () => {
      const leadYears = parseFloat(sliderLead?.value || 5);
      const massKg = parseFloat(sliderMass?.value || 600);

      if (valLead) valLead.textContent = `${leadYears} years`;
      if (valMass) valMass.textContent = `${massKg} kg`;

      // Simulating deflection on a 50-meter asteroid (like 2026 RZ1)
      const res = calculateKineticDeflection(50, leadYears, massKg, 6.6, 2.5);

      if (resultDv) resultDv.textContent = `${res.deltaVMms} mm/s`;
      if (resultDist) resultDist.textContent = `${res.deflectionDistanceKm.toLocaleString()} km`;

      if (resultStatus) {
        if (res.isSuccessful) {
          resultStatus.textContent = "SUCCESSFUL DEFLECTION (MISSES EARTH)";
          resultStatus.className = "sim-result-status success";
        } else {
          resultStatus.textContent = `IMPACT RISK: NEED ${res.probesNeeded} PROBES OR MORE LEAD TIME`;
          resultStatus.className = "sim-result-status warning";
        }
      }
    };

    [sliderLead, sliderMass].forEach(s => {
      if (s) s.addEventListener("input", runSim);
    });

    if (btnFire) {
      btnFire.addEventListener("click", () => {
        soundFX.playRadarPing();
        runSim();
      });
    }

    runSim();
  }

  initCraterSim() {
    const sliderDiam = document.getElementById("crater-diam");
    const sliderVel = document.getElementById("crater-vel");
    const valDiam = document.getElementById("val-crater-diam");
    const valVel = document.getElementById("val-crater-vel");

    const resEnergy = document.getElementById("res-crater-energy");
    const resCrater = document.getElementById("res-crater-size");
    const resBlast = document.getElementById("res-crater-blast");
    const resFate = document.getElementById("res-crater-fate");

    const runCraterSim = () => {
      const diam = parseFloat(sliderDiam?.value || 50);
      const vel = parseFloat(sliderVel?.value || 15);

      if (valDiam) valDiam.textContent = `${diam} m`;
      if (valVel) valVel.textContent = `${vel} km/s`;

      const mass = calculateAsteroidMass(diam);
      const { energyMegatons, hiroshimaEquiv } = calculateKineticEnergy(mass, vel);
      const entry = calculateAtmosphericEntry(diam, vel);
      const crater = calculateCraterDimensions(diam, vel);

      if (resEnergy) resEnergy.textContent = `${energyMegatons.toFixed(2)} MT TNT (${Math.round(hiroshimaEquiv).toLocaleString()} Hiroshima bombs)`;
      if (resFate) resFate.textContent = entry.fateType;
      if (resCrater) resCrater.textContent = entry.willAirburst ? "No Surface Crater (Airburst Dissipation)" : `${crater.finalCraterM} m wide, ${crater.craterDepthM} m deep`;
      if (resBlast) resBlast.textContent = `${entry.blastRadiusKm} km radius (severe building damage)`;
    };

    [sliderDiam, sliderVel].forEach(s => {
      if (s) s.addEventListener("input", runCraterSim);
    });

    runCraterSim();
  }
}
