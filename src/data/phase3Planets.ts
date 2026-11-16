import { PlanetId, PlanetPreset, ShipUpgradeTier, SolarExposure } from '../types/game';

/**
 * Configurable Phase 3 constants (Open Questions 1–4)
 */
export const PHASE3_CONFIG = {
  earthSolarExposure: 'moderate' as SolarExposure,
  sunSolarExposure: 'high' as SolarExposure,
  neptuneToVenusDistanceKm: 4392000000,
  neptuneToVenusDistanceAu: 29.36,
  mercuryToSunDistanceKm: 57900000,
  mercuryToSunDistanceAu: 0.387,
  helium3UnlockPlanet: 'neptune' as 'neptune' | 'mercury',
};

/**
 * Exact Route Order (§1.5):
 * Earth → Moon → Mars → Asteroid Belt → Jupiter → Saturn → Uranus → Neptune → Venus → Mercury → Sun
 */
export const ROUTE_ORDER: PlanetId[] = [
  'earth',
  'moon',
  'mars',
  'asteroid_belt',
  'jupiter',
  'saturn',
  'uranus',
  'neptune',
  'venus',
  'mercury',
  'sun',
];

export const PLANET_CATALOG: Record<PlanetId, PlanetPreset> = {
  earth: {
    id: 'earth',
    nameEn: 'Earth',
    nameEs: 'Tierra',
    baseTempC: 18,
    solarExposure: PHASE3_CONFIG.earthSolarExposure,
    hasAtmosphereOxygen: true,
    hasAtmosphereHydrogen: false,
    hasHelium3: false,
    cannotLand: false,
    hasSpaceObjects: false,
    hasSolarFlares: false,
    gravityStrength: 0,
    fuelCostToEnter: 0,
    distanceFromPrevKm: 0,
    distanceFromPrevAu: 0,
    descEn:
      'A rocky planet with abundant liquid water. Atmosphere composed mainly of nitrogen and oxygen. Avg distance from Sun: 149.6 million km.',
    descEs:
      'Planeta rocoso con abundante agua líquida y atmósfera de nitrógeno y oxígeno. Distancia media al Sol: 149.6 millones de km.',
    factEn: 'The only known planet with confirmed life.',
    factEs: 'El único planeta conocido con vida confirmada.',
    color: '#3b82f6',
  },
  moon: {
    id: 'moon',
    nameEn: 'Moon',
    nameEs: 'Luna',
    baseTempC: -18,
    solarExposure: 'moderate',
    hasAtmosphereOxygen: false,
    hasAtmosphereHydrogen: false,
    hasHelium3: true,
    cannotLand: false,
    hasSpaceObjects: false,
    hasSolarFlares: false,
    gravityStrength: 0,
    fuelCostToEnter: 12,
    distanceFromPrevKm: 384400,
    distanceFromPrevAu: 0.00257,
    descEn:
      "Earth's natural satellite. Almost no atmosphere and heavily cratered surface. Avg distance from Earth: 384,400 km. Unlocks Improved Ship.",
    descEs:
      'Satélite natural de la Tierra. Casi sin atmósfera y superficie llena de cráteres. Distancia media: 384,400 km. Desbloquea Nave Mejorada.',
    factEn: "Its gravity is approximately 16.5% of Earth's gravity.",
    factEs: 'Su gravedad es aproximadamente el 16.5% de la terrestre.',
    color: '#cbd5e1',
  },
  mars: {
    id: 'mars',
    nameEn: 'Mars',
    nameEs: 'Marte',
    baseTempC: -65,
    solarExposure: 'moderate',
    hasAtmosphereOxygen: false,
    hasAtmosphereHydrogen: false,
    hasHelium3: false,
    cannotLand: false,
    hasSpaceObjects: false,
    hasSolarFlares: false,
    gravityStrength: 0,
    fuelCostToEnter: 16,
    distanceFromPrevKm: 78341343,
    distanceFromPrevAu: 0.524,
    descEn:
      'A cold, rocky planet with a thin carbon dioxide atmosphere. Avg distance from the Sun: 227.9 million km.',
    descEs:
      'Planeta frío y rocoso con atmósfera delgada de dióxido de carbono. Distancia media al Sol: 227.9 millones de km.',
    factEn: 'Olympus Mons is the largest known volcano in the Solar System.',
    factEs: 'El Monte Olimpo es el volcán más grande conocido del Sistema Solar.',
    color: '#ef4444',
  },
  asteroid_belt: {
    id: 'asteroid_belt',
    nameEn: 'Asteroid Belt',
    nameEs: 'Cinturón de Asteroides',
    baseTempC: -95,
    solarExposure: 'moderate',
    hasAtmosphereOxygen: false,
    hasAtmosphereHydrogen: false,
    hasHelium3: false,
    cannotLand: false,
    hasSpaceObjects: false,
    hasSolarFlares: false,
    gravityStrength: 0,
    fuelCostToEnter: 18,
    distanceFromPrevKm: 186060634,
    distanceFromPrevAu: 1.246,
    descEn:
      'Region between Mars and Jupiter with rocky/metallic objects rich in iron, nickel, cobalt, silicates & water minerals. Unlocks Advanced Ship.',
    descEs:
      'Región entre Marte y Júpiter rica en hierro, níquel, silicatos y minerales con agua. Desbloquea Nave Avanzada.',
    factEn: 'Ceres is the largest object in the belt and is classified as a dwarf planet.',
    factEs: 'Ceres es el objeto más grande del cinturón y está clasificado como planeta enano.',
    color: '#94a3b8',
  },
  jupiter: {
    id: 'jupiter',
    nameEn: 'Jupiter',
    nameEs: 'Júpiter',
    baseTempC: -110,
    solarExposure: 'low',
    hasAtmosphereOxygen: false,
    hasAtmosphereHydrogen: true,
    hasHelium3: false,
    cannotLand: true,
    hasSpaceObjects: true,
    hasSolarFlares: false,
    gravityStrength: 58,
    fuelCostToEnter: 20,
    distanceFromPrevKm: 364479000,
    distanceFromPrevAu: 2.434,
    descEn:
      'Largest planet in the Solar System. Gas giant of hydrogen and helium. Avg distance from Sun: 778.5 million km. Cannot land — dodge debris & escape gravity!',
    descEs:
      'El planeta más grande del Sistema Solar. Gigante gaseoso de hidrógeno y helio. No se puede aterrizar: ¡esquiva objetos y escapa de su gravedad!',
    factEn: 'Its Great Red Spot is an enormous long-lasting atmospheric storm.',
    factEs: 'Su Gran Mancha Roja es una enorme tormenta atmosférica duradera.',
    color: '#f97316',
  },
  saturn: {
    id: 'saturn',
    nameEn: 'Saturn',
    nameEs: 'Saturno',
    baseTempC: -140,
    solarExposure: 'low',
    hasAtmosphereOxygen: false,
    hasAtmosphereHydrogen: true,
    hasHelium3: false,
    cannotLand: true,
    hasSpaceObjects: true,
    hasSolarFlares: false,
    gravityStrength: 54,
    fuelCostToEnter: 20,
    distanceFromPrevKm: 655051000,
    distanceFromPrevAu: 4.378,
    descEn:
      'Gas giant famous for its extensive ring system, composed mainly of hydrogen and helium. Avg distance from Sun: 1.43 billion km. Cannot land — escape its pull!',
    descEs:
      'Gigante gaseoso famoso por sus extensos anillos. No se puede aterrizar: ¡esquiva rocas de sus anillos y escapa de su gravedad!',
    factEn: 'Its moon Titan has lakes and seas of liquid methane and ethane.',
    factEs: 'Su luna Titán posee lagos y mares de metano y etano líquidos.',
    color: '#eab308',
  },
  uranus: {
    id: 'uranus',
    nameEn: 'Uranus',
    nameEs: 'Urano',
    baseTempC: -195,
    solarExposure: 'low',
    hasAtmosphereOxygen: false,
    hasAtmosphereHydrogen: true,
    hasHelium3: false,
    cannotLand: false,
    hasSpaceObjects: false,
    hasSolarFlares: false,
    gravityStrength: 0,
    fuelCostToEnter: 22,
    distanceFromPrevKm: 1437442000,
    distanceFromPrevAu: 9.619,
    descEn:
      'Ice giant with a blue-green appearance caused by atmospheric methane. Avg distance from Sun: 2.87 billion km. Unlocks Elite Ship.',
    descEs:
      'Gigante helado de tono azul verdoso por el metano atmosférico. Distancia al Sol: 2.87 mil millones km. Desbloquea Nave Élite.',
    factEn: 'Its rotational axis is tilted approximately 98 degrees.',
    factEs: 'Su eje de rotación está inclinado aproximadamente 98 grados.',
    color: '#22d3ee',
  },
  neptune: {
    id: 'neptune',
    nameEn: 'Neptune',
    nameEs: 'Neptuno',
    baseTempC: -200,
    solarExposure: 'low',
    hasAtmosphereOxygen: false,
    hasAtmosphereHydrogen: true,
    hasHelium3: false,
    cannotLand: false,
    hasSpaceObjects: false,
    hasSolarFlares: false,
    gravityStrength: 0,
    fuelCostToEnter: 22,
    distanceFromPrevKm: 1627428000,
    distanceFromPrevAu: 10.846,
    descEn:
      'Distant ice giant with an extremely dynamic atmosphere. Avg distance from the Sun: 4.50 billion km.',
    descEs:
      'Distante gigante helado con una atmósfera extremadamente dinámica. Distancia al Sol: 4.50 mil millones km.',
    factEn: 'It experiences some of the fastest winds measured on any planet.',
    factEs: 'Experimenta algunos de los vientos más rápidos medidos en cualquier planeta.',
    color: '#3b82f6',
  },
  venus: {
    id: 'venus',
    nameEn: 'Venus',
    nameEs: 'Venus',
    baseTempC: 464,
    solarExposure: 'high',
    hasAtmosphereOxygen: false,
    hasAtmosphereHydrogen: false,
    hasHelium3: false,
    cannotLand: false,
    hasSpaceObjects: false,
    hasSolarFlares: false,
    gravityStrength: 0,
    fuelCostToEnter: 24,
    distanceFromPrevKm: PHASE3_CONFIG.neptuneToVenusDistanceKm,
    distanceFromPrevAu: PHASE3_CONFIG.neptuneToVenusDistanceAu,
    descEn:
      'Rocky planet with an extremely dense carbon dioxide atmosphere. Avg distance from Sun: 108.2 million km.',
    descEs:
      'Planeta rocoso con atmósfera densísima de dióxido de carbono. Distancia media al Sol: 108.2 millones de km.',
    factEn: 'Its surface temperature is ~465°C, making it hotter than Mercury.',
    factEs: 'Su superficie ronda los 465°C, haciéndolo más caliente que Mercurio.',
    color: '#fbbf24',
  },
  mercury: {
    id: 'mercury',
    nameEn: 'Mercury',
    nameEs: 'Mercurio',
    baseTempC: 167,
    dayTempC: 430,
    nightTempC: -180,
    solarExposure: 'high',
    hasAtmosphereOxygen: false,
    hasAtmosphereHydrogen: false,
    hasHelium3: false,
    cannotLand: false,
    hasSpaceObjects: false,
    hasSolarFlares: false,
    gravityStrength: 0,
    fuelCostToEnter: 20,
    distanceFromPrevKm: 50298950,
    distanceFromPrevAu: 0.336,
    descEn:
      'Smallest planet & closest to Sun (57.9M km). Mean 167°C (430°C day, -180°C night). Unlocks Legendary Ship.',
    descEs:
      'El planeta más pequeño y cercano al Sol (57.9M km). Media 167°C (430°C día, -180°C noche). Desbloquea Nave Legendaria.',
    factEn: 'Despite being closest to the Sun, it is not the hottest planet.',
    factEs: 'Aunque es el más cercano al Sol, no es el planeta más caliente.',
    color: '#a8a29e',
  },
  sun: {
    id: 'sun',
    nameEn: 'Sun',
    nameEs: 'Sol',
    baseTempC: 550,
    solarExposure: PHASE3_CONFIG.sunSolarExposure,
    hasAtmosphereOxygen: false,
    hasAtmosphereHydrogen: true,
    hasHelium3: false,
    cannotLand: true,
    hasSpaceObjects: false,
    hasSolarFlares: true,
    gravityStrength: 74,
    fuelCostToEnter: 25,
    distanceFromPrevKm: PHASE3_CONFIG.mercuryToSunDistanceKm,
    distanceFromPrevAu: PHASE3_CONFIG.mercuryToSunDistanceAu,
    descEn:
      'Star of 73% hydrogen & 25% helium (5,500°C surface, 15M°C core). Final Objective: place all 50 Dyson Sphere panels while dodging solar flares!',
    descEs:
      'Estrella de 73% hidrógeno y 25% helio (5,500°C superficie). Objetivo Final: ¡coloca los 50 paneles de la Esfera de Dyson esquivando llamaradas solares!',
    factEn: 'Produces energy via nuclear fusion, converting hydrogen into helium.',
    factEs: 'Produce energía mediante fusión nuclear, convirtiendo hidrógeno en helio.',
    color: '#f59e0b',
  },
};

export function getNextRoutePlanet(current: PlanetId): PlanetId | null {
  const idx = ROUTE_ORDER.indexOf(current);
  if (idx < 0 || idx >= ROUTE_ORDER.length - 1) return null;
  return ROUTE_ORDER[idx + 1];
}

export function isShipTierUnlockedByPlanet(
  tier: ShipUpgradeTier,
  visitedPlanets: PlanetId[]
): boolean {
  switch (tier) {
    case 'basic':
      return true;
    case 'improved':
      return visitedPlanets.includes('moon');
    case 'advanced':
      return visitedPlanets.includes('asteroid_belt');
    case 'elite':
      return visitedPlanets.includes('uranus');
    case 'legendary':
      return visitedPlanets.includes('mercury');
  }
}
