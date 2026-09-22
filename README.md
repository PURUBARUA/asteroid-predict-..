# Cosmic Orbit // 3D Solar System & Asteroid Watch (2026 RZ1)

[![WebGL 3D](https://img.shields.io/badge/Engine-Three.js%20r170-indigo.svg)](https://threejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-purple.svg)](./LICENSE)
[![GitHub Pages](https://img.shields.io/badge/Deploy-GitHub%20Pages-blue.svg)](https://pages.github.com/)

> An open-source, interactive 3D WebGL deep space exploration platform featuring the **complete Solar System (8 planets + Pluto + 20+ named moons)** and a dedicated **Close-Approach Watch for Asteroid 2026 RZ1**. Built with Keplerian orbital propagation, planetary defense deflection physics, and a machine learning impact hazard classifier.

---

## 🌟 Features & Highlights

### 1. Complete Interactive 3D Solar System with Moons
- **The Sun**: Central star with solar corona lighting and illumination.
- **Inner Planets**:
  - **Mercury**: Heavily cratered terrestrial planet in high-speed orbit.
  - **Venus**: Sulfuric cloud atmosphere.
  - **Earth**: Zoomable high-definition globe, city lights, and **Moon (Luna)**.
  - **Mars**: Rust-red desert topography with moons **Phobos** and **Deimos**.
- **Main Asteroid Belt**: 1,400+ procedural asteroids orbiting between Mars and Jupiter.
- **Gas & Ice Giants**:
  - **Jupiter**: Banded cloud storm layers, Great Red Spot, and the 4 Galilean moons (**Io, Europa, Ganymede, Callisto**).
  - **Saturn**: Realistic 3D ring system and 7 major moons (**Titan, Enceladus, Mimas, Rhea, Iapetus, Dione, Tethys**).
  - **Uranus**: Ice-blue atmosphere, tilted ring system, and 5 moons (**Miranda, Ariel, Umbriel, Titania, Oberon**).
  - **Neptune**: Azure atmosphere and moons (**Triton** with retrograde orbit, **Proteus**).
  - **Pluto**: Dwarf planet system with moon **Charon**.
- **Dynamic 3D Projected Screen Labels**: Real-time projected labels display the official names of each planet and moon as you navigate.
- **Celestial Body Focus Selector**: Easily zoom and lock the camera on any planet, any moon, the Sun, or Asteroid 2026 RZ1.

---

### 2. Close-Approach Asteroid Watch (2026 RZ1 Mode)
- **Geocentric Encounter View**: Earth-centered flyby showing the close approach of **Asteroid 2026 RZ1** passing within **0.46 Lunar Distances (176,800 km)** on September 12, 2026.
- **Signature Lunar Distance Visual Gauge Bar**: Real-time gauge demonstrating the asteroid's proximity relative to Earth ($0\text{ LD}$) and the Moon ($1.0\text{ LD}$).
- **4 Key Watch Metrics**:
  1. **NEXT PASS**: Encounter date and countdown.
  2. **DISTANCE**: Instantaneous distance in km, miles, or Lunar Distances.
  3. **SPEED**: Velocity in km/s and mph relative to Earth.
  4. **EST. SIZE**: Physical diameter with real-world size comparisons.
- **Scrubbable Time Control**: Timeline from $T - 24\text{ hours}$ to $T + 24\text{ hours}$ with warp speeds up to $86,400\times$.

---

### 3. Student Orbital Mechanics & Physics Laboratory
- **Keplerian Orbital Parameter Dials**: Modify semi-major axis ($a$), eccentricity ($e$), and inclination ($i$) to deform orbits in real-time.
- **Planetary Defense Kinetic Deflection Simulator**: Calculates momentum transfer enhancement ($\beta \approx 2.5$) and $\Delta v$ needed to avert impact.
- **Collins Impact & Cratering Calculator**: Evaluates kinetic energy in Megatons of TNT ($E = \frac{1}{2} M v^2$), airburst altitude, and crater size.

---


---

## License

Distributed under the MIT License. See [LICENSE](./LICENSE) for details.
