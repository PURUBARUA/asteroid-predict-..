/**
 * Planetary Defense & Impact Physics Calculator
 * Based on peer-reviewed impact formulations:
 * - Collins, Melosh & Marcus (2005) Earth Impact Effects
 * - NASA DART Mission Momentum Transfer Enhancement (Cheng et al. 2023)
 */

export const TNT_JOULE = 4.184e9; // 1 ton of TNT in Joules
export const MEGATON_JOULE = 4.184e15; // 1 Megaton TNT in Joules
export const DEFAULT_DENSITY = 2600; // kg/m^3 (stony chondrite asteroid)
export const TARGET_DENSITY = 2700; // kg/m^3 (Earth sedimentary/crystalline crust)
export const GRAVITY_EARTH = 9.807; // m/s^2

/**
 * Calculates asteroid mass from diameter assuming spherical geometry
 * @param {number} diameterMeters - Asteroid diameter in meters
 * @param {number} densityKgM3 - Bulk density in kg/m^3
 * @returns {number} Mass in kilograms
 */
export function calculateAsteroidMass(diameterMeters, densityKgM3 = DEFAULT_DENSITY) {
  const radius = diameterMeters / 2.0;
  const volume = (4.0 / 3.0) * Math.PI * Math.pow(radius, 3);
  return volume * densityKgM3;
}

/**
 * Calculates kinetic energy in Joules and Megatons TNT
 * @param {number} massKg - Asteroid mass in kg
 * @param {number} velocityKms - Impact velocity in km/s
 * @returns {{energyJoules: number, energyMegatons: number, hiroshimaEquiv: number}}
 */
export function calculateKineticEnergy(massKg, velocityKms) {
  const velocityMs = velocityKms * 1000.0;
  const energyJoules = 0.5 * massKg * Math.pow(velocityMs, 2);
  const energyMegatons = energyJoules / MEGATON_JOULE;
  // Little Boy bomb = ~15 kilotons = 0.015 MT
  const hiroshimaEquiv = (energyMegatons * 1000.0) / 15.0;

  return {
    energyJoules,
    energyMegatons,
    hiroshimaEquiv
  };
}

/**
 * Predicts atmospheric entry outcome (airburst altitude vs surface impact)
 * @param {number} diameterMeters - Impactor diameter
 * @param {number} velocityKms - Velocity in km/s
 * @param {number} density - Impactor density
 * @param {number} angleDeg - Entry angle (default 45 deg)
 * @returns {Object} Airburst details
 */
export function calculateAtmosphericEntry(diameterMeters, velocityKms, density = DEFAULT_DENSITY, angleDeg = 45) {
  const mass = calculateAsteroidMass(diameterMeters, density);
  const { energyMegatons } = calculateKineticEnergy(mass, velocityKms);

  // Strength of typical stony asteroid (pascals)
  const yieldStrength = density < 2000 ? 1e6 : (density < 3000 ? 5e6 : 5e7);
  
  // Stagnation pressure P = rho_air * v^2
  // Atmospheric scale height H = 8000 m, surface air density rho0 = 1.225 kg/m^3
  const vMs = velocityKms * 1000;
  const dynPressureSeaLevel = 1.225 * vMs * vMs;
  
  let willAirburst = true;
  let burstAltitudeKm = 0;
  let fateType = "Airburst";

  if (dynPressureSeaLevel > yieldStrength) {
    // Airburst occurs at altitude where dynamic pressure equals yield strength
    const ratio = yieldStrength / (1.225 * vMs * vMs);
    if (ratio > 0 && ratio < 1) {
      burstAltitudeKm = (-8.0 * Math.log(ratio)) * Math.sin(angleDeg * (Math.PI / 180));
      burstAltitudeKm = Math.max(0, Math.min(65, burstAltitudeKm));
    }
  }

  // Thresholds based on diameter and density:
  // Diameters > 100m typically penetrate the atmosphere to reach the surface
  if (diameterMeters > 90 || burstAltitudeKm <= 0.5) {
    willAirburst = false;
    burstAltitudeKm = 0;
    fateType = "Surface Impact / Cratering";
  } else if (diameterMeters < 25) {
    fateType = "High-Altitude Airburst (Chelyabinsk-class)";
  } else {
    fateType = "Low-Altitude Detonation (Tunguska-class)";
  }

  // Severe blast overpressure radius (5 psi radius in km)
  // R_5psi = 1.4 * E^(1/3)
  const blastRadiusKm = 1.4 * Math.pow(Math.max(0.01, energyMegatons), 1 / 3);
  
  // Fireball thermal burn radius (3rd degree burns)
  const thermalRadiusKm = 2.0 * Math.pow(Math.max(0.01, energyMegatons), 0.41);

  return {
    willAirburst,
    burstAltitudeKm: parseFloat(burstAltitudeKm.toFixed(1)),
    fateType,
    blastRadiusKm: parseFloat(blastRadiusKm.toFixed(1)),
    thermalRadiusKm: parseFloat(thermalRadiusKm.toFixed(1)),
    energyMegatons: parseFloat(energyMegatons.toFixed(2))
  };
}

/**
 * Computes crater dimensions using Collins, Melosh & Marcus (2005) scaling
 * @param {number} diameterMeters 
 * @param {number} velocityKms 
 * @param {number} density 
 * @param {number} angleDeg 
 * @returns {{transientCraterM: number, finalCraterM: number, craterDepthM: number}}
 */
export function calculateCraterDimensions(diameterMeters, velocityKms, density = DEFAULT_DENSITY, angleDeg = 45) {
  const theta = angleDeg * (Math.PI / 180);
  const vMs = velocityKms * 1000;

  // Transient crater diameter Dtc
  // D_tc = 1.161 * (rho_i / rho_t)^(1/3) * L^0.78 * v^0.44 * g^(-0.22) * sin(theta)^(1/3)
  const densityRatio = Math.pow(density / TARGET_DENSITY, 1 / 3);
  const Lterm = Math.pow(diameterMeters, 0.78);
  const vTerm = Math.pow(vMs, 0.44);
  const gTerm = Math.pow(GRAVITY_EARTH, -0.22);
  const angleTerm = Math.pow(Math.sin(theta), 1 / 3);

  const transientCraterM = 1.161 * densityRatio * Lterm * vTerm * gTerm * angleTerm;
  
  // Final crater diameter Df:
  // Simple crater (Dtc < 3200m on Earth): Df = 1.25 * Dtc
  // Complex crater (Dtc >= 3200m): Df = 1.17 * (Dtc^1.13 / D_*^0.13), with D_* = 3200m
  let finalCraterM = 0;
  if (transientCraterM < 3200) {
    finalCraterM = 1.25 * transientCraterM;
  } else {
    finalCraterM = 1.17 * (Math.pow(transientCraterM, 1.13) / Math.pow(3200, 0.13));
  }

  const craterDepthM = finalCraterM / 4.5;

  return {
    transientCraterM: Math.round(transientCraterM),
    finalCraterM: Math.round(finalCraterM),
    craterDepthM: Math.round(craterDepthM)
  };
}

/**
 * Calculates DART-style kinetic deflection parameters
 * @param {number} asteroidDiameterM 
 * @param {number} leadTimeYears - Warning time before projected impact
 * @param {number} impactorMassKg - Kinetic probe mass (e.g. DART = 570 kg)
 * @param {number} impactorVelocityKms - Probe collision speed (e.g. DART = 6.6 km/s)
 * @param {number} beta - Momentum enhancement factor (1.5 - 3.6 for rubble piles)
 * @returns {Object} Deflection results
 */
export function calculateKineticDeflection(
  asteroidDiameterM, 
  leadTimeYears = 5.0, 
  impactorMassKg = 600, 
  impactorVelocityKms = 6.6,
  beta = 2.4
) {
  const asteroidMass = calculateAsteroidMass(asteroidDiameterM);
  const vImpactorMs = impactorVelocityKms * 1000;
  
  // Delta-V imparted to asteroid: delta_v = beta * (m_sc * v_sc) / M_ast
  const deltaVMs = (beta * impactorMassKg * vImpactorMs) / asteroidMass;
  
  // Deflection distance achieved at Earth after lead time t
  // Delta_x = delta_v * t
  const leadTimeSec = leadTimeYears * 365.25 * 86400;
  const deflectionDistanceKm = (deltaVMs * leadTimeSec) / 1000;
  
  // Earth radius safety margin: 6,371 km + 2,000 km atmosphere/margin = ~8,400 km
  const requiredDeflectionKm = 8400;
  const isSuccessful = deflectionDistanceKm >= requiredDeflectionKm;
  
  // Number of kinetic impactor probes needed if 1 probe is insufficient
  const probesNeeded = Math.ceil(requiredDeflectionKm / Math.max(0.0001, deflectionDistanceKm));

  return {
    deltaVMms: parseFloat((deltaVMs * 1000).toFixed(4)), // in mm/s
    deltaVMs,
    deflectionDistanceKm: Math.round(deflectionDistanceKm),
    isSuccessful,
    probesNeeded: isSuccessful ? 1 : Math.min(50, probesNeeded),
    leadTimeYears,
    safetyMarginKm: Math.round(deflectionDistanceKm - requiredDeflectionKm)
  };
}
