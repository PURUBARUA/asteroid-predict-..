/**
 * Data schemas and types for Near-Earth Objects
 */

export function normalizeNeoObject(raw, source = "nasa_api") {
  if (source === "curated") return raw;

  // NASA NeoWs format parser
  const closeApproach = raw.close_approach_data?.[0] || {};
  const missDistKm = parseFloat(closeApproach.miss_distance?.kilometers || 384400);
  const missDistLD = parseFloat(closeApproach.miss_distance?.lunar || 1.0);
  const missDistAU = parseFloat(closeApproach.miss_distance?.astronomical || 0.0025);
  const velKms = parseFloat(closeApproach.relative_velocity?.kilometers_per_second || 15.0);
  const velMph = parseFloat(closeApproach.relative_velocity?.miles_per_hour || 33500);
  
  const diamMin = parseFloat(raw.estimated_diameter?.meters?.estimated_diameter_min || 30);
  const diamMax = parseFloat(raw.estimated_diameter?.meters?.estimated_diameter_max || 65);
  const avgDiam = (diamMin + diamMax) / 2;

  return {
    id: raw.id || `neo_${raw.name?.replace(/\s+/g, "_")}`,
    name: raw.name || "Unknown NEO",
    full_name: `Asteroid ${raw.name}`,
    featured: false,
    orbit_class: raw.orbital_data?.orbit_class?.orbit_class_type || "Apollo",
    orbit_class_description: raw.orbital_data?.orbit_class?.orbit_class_description || "Near-Earth Asteroid",
    absolute_magnitude_h: raw.absolute_magnitude_h || 24.0,
    estimated_diameter_min_m: Math.round(diamMin),
    estimated_diameter_max_m: Math.round(diamMax),
    is_potentially_hazardous: raw.is_potentially_hazardous_asteroid || false,
    is_sentry_object: raw.is_sentry_object || false,
    close_approach_date: closeApproach.close_approach_date_full || closeApproach.close_approach_date || "2026-Sep-12",
    epoch_jd: parseFloat(closeApproach.epoch_date_close_approach || 2461296),
    relative_velocity_kms: parseFloat(velKms.toFixed(2)),
    relative_velocity_mph: Math.round(velMph),
    miss_distance_ld: parseFloat(missDistLD.toFixed(3)),
    miss_distance_km: Math.round(missDistKm),
    miss_distance_au: parseFloat(missDistAU.toFixed(6)),
    orbital_elements: {
      semi_major_axis_au: parseFloat(raw.orbital_data?.semi_major_axis || 1.35),
      eccentricity: parseFloat(raw.orbital_data?.eccentricity || 0.32),
      inclination_deg: parseFloat(raw.orbital_data?.inclination || 5.0),
      longitude_ascending_node_deg: parseFloat(raw.orbital_data?.ascending_node_longitude || 160.0),
      argument_perihelion_deg: parseFloat(raw.orbital_data?.perihelion_argument || 220.0),
      mean_anomaly_deg: parseFloat(raw.orbital_data?.mean_anomaly || 45.0),
      perihelion_distance_au: parseFloat(raw.orbital_data?.perihelion_distance || 0.92),
      aphelion_distance_au: parseFloat(raw.orbital_data?.aphelion_distance || 1.78),
      orbital_period_days: parseFloat(raw.orbital_data?.orbital_period || 570)
    },
    narrative: `Live observation from NASA JPL Near-Earth Object Web Service. Discovered via automated planetary defense surveys.`
  };
}
