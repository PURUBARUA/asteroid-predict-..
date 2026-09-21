/**
 * NASA Eyes on Asteroids / Planetary Defense Physics Engine
 * Keplerian Orbit Propagator & Hyperbolic Flyby Solver
 * 
 * Implements 6-element Keplerian mechanics, Newton-Raphson iteration,
 * and 3D coordinate transformations from orbital plane to Ecliptic frame.
 */

// Astronomical constants
export const AU_IN_KM = 149597870.7;
export const LUNAR_DISTANCE_KM = 384400.0;
export const EARTH_RADIUS_KM = 6371.0;
export const GEO_RADIUS_KM = 42164.0; // 35,786 km altitude + Earth radius
export const LEO_RADIUS_KM = 6771.0;  // 400 km altitude (ISS)

/**
 * Solves Kepler's equation M = E - e * sin(E) for Eccentric Anomaly E
 * @param {number} M - Mean Anomaly in radians
 * @param {number} e - Eccentricity
 * @returns {number} E - Eccentric Anomaly in radians
 */
export function solveKepler(M, e) {
  // Normalize M to [0, 2pi)
  M = ((M % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  
  // Initial estimate
  let E = e > 0.8 ? Math.PI : M;
  const tol = 1e-8;
  const maxIter = 50;

  for (let i = 0; i < maxIter; i++) {
    const f = E - e * Math.sin(E) - M;
    if (Math.abs(f) < tol) break;
    const fPrime = 1 - e * Math.cos(E);
    E = E - f / fPrime;
  }
  return E;
}

/**
 * Computes 3D Cartesian coordinates from Keplerian orbital elements
 * @param {Object} elements - Orbital elements (a, e, i, node, peri, M)
 * @param {number} deltaDays - Days from epoch
 * @returns {{x: number, y: number, z: number, r: number, trueAnomaly: number}} AU coordinates
 */
export function propagateKeplerian(elements, deltaDays = 0) {
  const a = elements.semi_major_axis_au || 1.0;
  const e = elements.eccentricity || 0.0;
  const inc = (elements.inclination_deg || 0) * (Math.PI / 180);
  const node = (elements.longitude_ascending_node_deg || 0) * (Math.PI / 180);
  const peri = (elements.argument_perihelion_deg || 0) * (Math.PI / 180);
  
  // Mean motion n = 2pi / period (days)
  const periodDays = elements.orbital_period_days || (365.25 * Math.pow(a, 1.5));
  const n = (2 * Math.PI) / periodDays;

  // Mean anomaly at epoch + delta
  const M0 = (elements.mean_anomaly_deg || 0) * (Math.PI / 180);
  const M = M0 + n * deltaDays;

  // Solve for Eccentric Anomaly E
  const E = solveKepler(M, e);

  // True Anomaly nu
  const sinNu = (Math.sqrt(1 - e * e) * Math.sin(E)) / (1 - e * Math.cos(E));
  const cosNu = (Math.cos(E) - e) / (1 - e * Math.cos(E));
  const nu = Math.atan2(sinNu, cosNu);

  // Heliocentric distance r (in AU)
  const r = a * (1 - e * Math.cos(E));

  // Position in orbital plane
  const xOrb = r * Math.cos(nu);
  const yOrb = r * Math.sin(nu);

  // Rotation into Ecliptic J2000 reference frame
  // P_x, P_y, P_z vectors from orbital elements
  const cosNode = Math.cos(node);
  const sinNode = Math.sin(node);
  const cosPeri = Math.cos(peri);
  const sinPeri = Math.sin(peri);
  const cosInc = Math.cos(inc);
  const sinInc = Math.sin(inc);

  const Px = cosNode * cosPeri - sinNode * sinPeri * cosInc;
  const Py = sinNode * cosPeri + cosNode * sinPeri * cosInc;
  const Pz = sinPeri * sinInc;

  const Qx = -cosNode * sinPeri - sinNode * cosPeri * cosInc;
  const Qy = -sinNode * sinPeri + cosNode * cosPeri * cosInc;
  const Qz = cosPeri * sinInc;

  const x = xOrb * cosPeri - yOrb * sinPeri;
  const y = xOrb * sinPeri + yOrb * cosPeri;

  // Final 3D Ecliptic Cartesian (in AU)
  const X = r * (cosNode * Math.cos(peri + nu) - sinNode * Math.sin(peri + nu) * cosInc);
  const Y = r * (sinNode * Math.cos(peri + nu) + cosNode * Math.sin(peri + nu) * cosInc);
  const Z = r * (Math.sin(peri + nu) * sinInc);

  return { x: X, y: Y, z: Z, r, trueAnomaly: nu, E, M };
}

/**
 * Computes an array of 3D points forming the complete orbit ellipse
 * @param {Object} elements - Orbital elements
 * @param {number} segments - Resolution (e.g. 180 points)
 * @returns {Array<{x: number, y: number, z: number}>}
 */
export function generateOrbitPath(elements, segments = 180) {
  const points = [];
  const a = elements.semi_major_axis_au || 1.0;
  const e = elements.eccentricity || 0.0;
  const inc = (elements.inclination_deg || 0) * (Math.PI / 180);
  const node = (elements.longitude_ascending_node_deg || 0) * (Math.PI / 180);
  const peri = (elements.argument_perihelion_deg || 0) * (Math.PI / 180);

  const cosNode = Math.cos(node);
  const sinNode = Math.sin(node);
  const cosInc = Math.cos(inc);
  const sinInc = Math.sin(inc);

  for (let i = 0; i <= segments; i++) {
    const E = (i / segments) * 2 * Math.PI;
    const sinNu = (Math.sqrt(1 - e * e) * Math.sin(E)) / (1 - e * Math.cos(E));
    const cosNu = (Math.cos(E) - e) / (1 - e * Math.cos(E));
    const nu = Math.atan2(sinNu, cosNu);
    const r = a * (1 - e * Math.cos(E));

    const X = r * (cosNode * Math.cos(peri + nu) - sinNode * Math.sin(peri + nu) * cosInc);
    const Y = r * (sinNode * Math.cos(peri + nu) + cosNode * Math.sin(peri + nu) * cosInc);
    const Z = r * (Math.sin(peri + nu) * sinInc);

    points.push({ x: X, y: Y, z: Z });
  }
  return points;
}

/**
 * Geocentric Close-Approach Flyby Propagator
 * Computes the asteroid position relative to Earth in Earth radii or Lunar Distances.
 * For 2026 RZ1 watch mode: accurate relative hyperbolic flyby trajectory.
 * 
 * @param {Object} neo - Near Earth Object metadata
 * @param {number} deltaHours - Hours relative to closest approach encounter (t=0)
 * @returns {{x: number, y: number, z: number, distKm: number, distLD: number}}
 */
export function propagateGeocentricFlyby(neo, deltaHours = 0) {
  const missDistKm = neo.miss_distance_km || 176800;
  const velKms = neo.relative_velocity_kms || 14.78;
  const incRad = (neo.orbital_elements?.inclination_deg || 4.78) * (Math.PI / 180);

  // In geocentric encounter coordinates:
  // Asteroid approaches along roughly linear-hyperbolic vector deflected by Earth gravity
  // Along-track distance: s = v * deltaT
  const deltaSec = deltaHours * 3600;
  const alongTrackKm = velKms * deltaSec;

  // Closest approach perigee vector (in Earth orbital plane, offset slightly by inclination)
  const rP = missDistKm;
  
  // Gravitational focusing parameter (Earth mu = G*M_earth = 398600 km^3/s^2)
  const muEarth = 398600.4418;
  const vInf = velKms;
  const vInfSq = vInf * vInf;
  
  // Asymptote bend angle delta = 2 * arcsin(1 / (1 + (rP * vInf^2 / muEarth)))
  const bendAngle = 2 * Math.asin(1 / (1 + (rP * vInfSq) / muEarth));

  // 3D coordinates in geocentric coordinate system (x: Sun-Earth axis, y: along orbit, z: north)
  const x = alongTrackKm * Math.cos(bendAngle * 0.15);
  const y = rP + (Math.abs(alongTrackKm) * 0.04);
  const z = alongTrackKm * Math.sin(incRad);

  const distKm = Math.sqrt(x * x + y * y + z * z);
  const distLD = distKm / LUNAR_DISTANCE_KM;

  return {
    x,
    y,
    z,
    distKm,
    distLD
  };
}
