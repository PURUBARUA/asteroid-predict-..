# NASA Eyes on Asteroids: 2026 RZ1 Watch & Planetary Defense Educational Laboratory

[![NASA JPL Data](https://img.shields.io/badge/Data-NASA%20JPL%20CNEOS-00e5ff.svg)](https://cneos.jpl.nasa.gov/)
[![WebGL 3D](https://img.shields.io/badge/Engine-Three.js%20r170-green.svg)](https://threejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![GitHub Pages](https://img.shields.io/badge/Deploy-GitHub%20Pages-blue.svg)](https://pages.github.com/)

> An open-source, interactive 3D WebGL aerospace platform replicating and expanding upon [NASA Eyes on Asteroids (2026 RZ1 Watch)](https://eyes.nasa.gov/apps/asteroids/#/watch/2026_rz1). Built with Keplerian orbital propagation, Collins impact physics, and a machine learning hazard classifier for students, researchers, and planetary defense education.

---

## Highlights & Features

### 1. 3D Close-Approach Visualization (Replicating `2026_rz1` Watch)
- **Geocentric Encounter Mode**: Earth-centered flyby showing the close approach of **Asteroid 2026 RZ1** passing within **0.46 Lunar Distances (176,800 km)** on September 12, 2026.
- **Reference Orbits**: Real-time rendering of the **Moon's orbit (1 LD / 384,400 km)**, **Geostationary (GEO) satellite ring (35,786 km altitude)**, and **Low Earth Orbit (LEO) ring (400 km ISS)**.
- **Heliocentric Solar System Mode**: Full orbital ellipses across the inner solar system (Mercury, Venus, Earth, Mars, Asteroid Belt) to illustrate Earth-crossing Apollo dynamics.
- **Scrubbable Time Control**: High-precision timeline allowing playback from $T - 24\text{h}$ to $T + 24\text{h}$, warp speeds up to $86,400\times$, and instantaneous jump to closest approach epoch ($T = 0$).

### 2. Student Orbital Mechanics & Physics Laboratory
- **Keplerian Orbital Parameter Dials**: Modify the 6 classical Keplerian elements ($a, e, i, \Omega, \omega, M$) in real-time to observe orbital distortion and recalculate perihelion ($q$) and aphelion ($Q$).
- **DART Kinetic Deflection Simulator**: Calculates momentum enhancement factor ($\beta \approx 2.5$) and required $\Delta v$ (in mm/s) to deflect an asteroid away from Earth given variable lead times (1 to 25 years).
- **Collins Impact & Cratering Calculator**: Solves atmospheric entry ablation, airburst burst altitude, 5-psi blast overpressure radius, and transient/final crater dimensions based on Collins, Melosh & Marcus (2005) formulations.

### 3. Machine Learning Hazard & Trajectory Classifier
- Pre-trained client-side decision network calibrated on historical Near-Earth Objects from NASA CNEOS and Sentry.
- Inputs: Absolute magnitude ($H$), diameter ($m$), velocity ($v_\infty$), Minimum Orbit Intersection Distance (MOID), eccentricity ($e$), and inclination ($i$).
- Predicts:
  - **Torino Impact Hazard Scale (0 to 10)**
  - **Palermo Technical Impact Scale**
  - **Atmospheric Entry Fate** (Harmless ablation, Chelyabinsk-class airburst, Tunguska-class mega-airburst, or surface cratering)
- **Interactive Synthetic Asteroid Studio**: Students can customize synthetic diameter, velocity, and miss distance to observe live machine learning classification.

### 4. NASA JPL Mission Control Aesthetic
- Authentic dark HUD telemetry interface with real-time UTC clock and Julian Date (JD) counter.
- Procedural Web Audio API sound generator (DSN radar sweeps, telemetry clicks, and alert alarms) with zero external media files.
- Metric, Imperial, and Astronomical ($AU / LD$) unit conversion toggles.

---

## Data Provenance & Legal Compliance (No Data Conflicts)

This repository strictly adheres to the **NASA Open Data Policy (17 U.S.C. § 105)**, which establishes that works produced by NASA and U.S. government scientific agencies are in the public domain.

- **Data Sources**:
  - [NASA JPL Center for Near-Earth Object Studies (CNEOS)](https://cneos.jpl.nasa.gov/)
  - [NASA Planetary Defense Coordination Office (PDCO)](https://www.nasa.gov/planetary-defense/)
  - [IAU Minor Planet Center (MPC)](https://minorplanetcenter.net/)
- **API Optimization**: Utilizes client-side caching to respect NASA NeoWs rate limits. Works seamlessly offline with built-in high-precision ephemerides for **2026 RZ1**, Apophis (99942), Bennu (101955), and Didymos/Dimorphos.
- **Non-Affiliation Notice**: *This project is an independent educational and research platform developed for students and space technologists. It is not an official endorsement by or affiliated with NASA, JPL, or Caltech.*

---

## Quick Start (Local Development)

Ensure you have [Node.js](https://nodejs.org/) (v18+) installed.

```bash
# Clone the repository
git clone https://github.com/<your-username>/<your-repo>.git
cd <your-repo>

# Install dependencies
npm install

# Start local development server
npm run dev
```

Visit `http://localhost:3000` in your browser.

---

## Deployment to GitHub Pages

This project is pre-configured for automated continuous deployment using GitHub Actions.

1. Push this repository to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial release of NASA Eyes on Asteroids (2026 RZ1)"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo>.git
   git push -u origin main
   ```
2. In your GitHub repository settings:
   - Navigate to **Settings > Pages**.
   - Under **Build and deployment > Source**, select **GitHub Actions**.
3. Every push to `main` will automatically build and publish your site at:
   `https://<your-username>.github.io/<your-repo>/`

---

## Mathematical Formulations Used

### 1. Keplerian Orbit Propagation
$$\begin{aligned}
M &= E - e \sin(E) \quad \text{(Kepler's Equation, solved via Newton-Raphson)} \\
\tan\left(\frac{\nu}{2}\right) &= \sqrt{\frac{1+e}{1-e}} \tan\left(\frac{E}{2}\right) \\
r &= \frac{a(1 - e^2)}{1 + e \cos(\nu)}
\end{aligned}$$

### 2. Kinetic Impact Energy
$$E_k = \frac{1}{2} M v^2 = \frac{1}{2} \left(\frac{4}{3}\pi R^3 \rho\right) v^2$$

### 3. Kinetic Deflection (DART Mission)
$$\Delta v = \beta \frac{m_{\text{sc}} v_{\text{sc}}}{M_{\text{ast}}}$$
$$\Delta x = \Delta v \times \Delta t_{\text{lead}}$$

---

## Author & Aerospace Portfolio

**Aerospace Technologist & Planetary Defense Researcher**  
Passionate about autonomous astrodynamics, real-time GPU shaders, and telemetry visualization systems for deep space exploration.
