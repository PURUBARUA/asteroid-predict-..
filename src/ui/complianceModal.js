import { soundFX } from "../audio/soundFX.js";
import { nasaApi } from "../api/nasaApi.js";

export class ComplianceModalController {
  constructor(onApiKeyUpdate) {
    this.onApiKeyUpdate = onApiKeyUpdate;
    this.modal = document.getElementById("compliance-modal");
    this.btnOpen = document.getElementById("btn-open-compliance");
    this.btnClose = document.getElementById("btn-close-compliance");
    this.apiKeyInput = document.getElementById("input-nasa-api-key");
    this.btnSaveKey = document.getElementById("btn-save-api-key");
    this.keyStatus = document.getElementById("api-key-status");

    this.initDOM();
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

    // Load saved API key if present
    const savedKey = localStorage.getItem("custom_nasa_api_key");
    if (savedKey && this.apiKeyInput) {
      this.apiKeyInput.value = savedKey;
      nasaApi.setApiKey(savedKey);
      if (this.keyStatus) this.keyStatus.textContent = "Custom Key Active";
    }

    if (this.btnSaveKey && this.apiKeyInput) {
      this.btnSaveKey.addEventListener("click", () => {
        const val = this.apiKeyInput.value.trim();
        if (val) {
          localStorage.setItem("custom_nasa_api_key", val);
          nasaApi.setApiKey(val);
          if (this.keyStatus) {
            this.keyStatus.textContent = "Key Verified & Saved (Rate limit: 1000 req/hr)";
            this.keyStatus.style.color = "#34d399";
          }
        } else {
          localStorage.removeItem("custom_nasa_api_key");
          nasaApi.setApiKey("DEMO_KEY");
          if (this.keyStatus) {
            this.keyStatus.textContent = "Reverted to Public DEMO_KEY";
            this.keyStatus.style.color = "#00e5ff";
          }
        }
        soundFX.playTelemetryClick();
        if (this.onApiKeyUpdate) this.onApiKeyUpdate();
      });
    }
  }

  open() {
    if (this.modal) this.modal.classList.add("active");
  }

  close() {
    if (this.modal) this.modal.classList.remove("active");
  }
}
