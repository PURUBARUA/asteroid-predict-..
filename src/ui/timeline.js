import { soundFX } from "../audio/soundFX.js";

export class TimelineController {
  constructor(onTimeChange) {
    this.onTimeChange = onTimeChange;
    this.deltaHours = 0; // relative to closest approach
    this.minHours = -24;
    this.maxHours = 24;
    this.isPlaying = false;
    this.speedMultiplier = 3600; // 1 second real = 1 hour sim
    this.lastFrameTime = performance.now();

    this.initDOM();
    this.startLoop();
  }

  initDOM() {
    this.slider = document.getElementById("timeline-slider");
    this.playBtn = document.getElementById("btn-play");
    this.timeDisplay = document.getElementById("timeline-time-display");
    this.encounterBtn = document.getElementById("btn-jump-encounter");
    this.speedSelect = document.getElementById("speed-select");

    if (this.slider) {
      this.slider.min = this.minHours;
      this.slider.max = this.maxHours;
      this.slider.step = 0.05;
      this.slider.value = 0;

      this.slider.addEventListener("input", (e) => {
        this.deltaHours = parseFloat(e.target.value);
        this.updateDisplay();
        this.onTimeChange(this.deltaHours);
      });
    }

    if (this.playBtn) {
      this.playBtn.addEventListener("click", () => {
        this.togglePlay();
      });
    }

    if (this.encounterBtn) {
      this.encounterBtn.addEventListener("click", () => {
        soundFX.playRadarPing();
        this.setTime(0);
      });
    }

    if (this.speedSelect) {
      this.speedSelect.addEventListener("change", (e) => {
        this.speedMultiplier = parseFloat(e.target.value);
      });
    }

    // Step buttons
    const stepBack = document.getElementById("btn-step-back");
    const stepFwd = document.getElementById("btn-step-fwd");
    if (stepBack) {
      stepBack.addEventListener("click", () => {
        soundFX.playTelemetryClick();
        this.setTime(Math.max(this.minHours, this.deltaHours - 1));
      });
    }
    if (stepFwd) {
      stepFwd.addEventListener("click", () => {
        soundFX.playTelemetryClick();
        this.setTime(Math.min(this.maxHours, this.deltaHours + 1));
      });
    }
  }

  togglePlay() {
    this.isPlaying = !this.isPlaying;
    soundFX.playTelemetryClick();
    if (this.playBtn) {
      this.playBtn.innerHTML = this.isPlaying
        ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg> PAUSE`
        : `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg> PLAY`;
      this.playBtn.classList.toggle("active", this.isPlaying);
    }
  }

  setTime(hours) {
    this.deltaHours = hours;
    if (this.slider) this.slider.value = hours;
    this.updateDisplay();
    this.onTimeChange(this.deltaHours);
  }

  updateDisplay() {
    if (!this.timeDisplay) return;

    const absHours = Math.abs(this.deltaHours);
    const h = Math.floor(absHours);
    const m = Math.floor((absHours - h) * 60);
    const sign = this.deltaHours < 0 ? "T -" : (this.deltaHours > 0 ? "T +" : "T =");
    
    if (Math.abs(this.deltaHours) < 0.02) {
      this.timeDisplay.innerHTML = `<span class="t-pulse">CLOSEST APPROACH (T=0)</span>`;
    } else {
      this.timeDisplay.textContent = `${sign} ${String(h).padStart(2, "0")}h ${String(m).padStart(2, "0")}m`;
    }
  }

  startLoop() {
    const loop = (now) => {
      const deltaSec = (now - this.lastFrameTime) / 1000.0;
      this.lastFrameTime = now;

      if (this.isPlaying) {
        // convert delta real seconds to delta sim hours
        const deltaSimHours = (deltaSec * this.speedMultiplier) / 3600.0;
        this.deltaHours += deltaSimHours;

        if (this.deltaHours > this.maxHours) {
          this.deltaHours = this.minHours; // loop
        }

        if (this.slider) this.slider.value = this.deltaHours;
        this.updateDisplay();
        this.onTimeChange(this.deltaHours);
      }

      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }
}
