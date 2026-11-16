import { PlanetPreset, WorldInteractable, ZoneId } from '../types/game';

export interface SolidRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const SHIP_BOUNDS = {
  minX: 58,
  maxX: 302,
  minY: 64,
  maxY: 192,
};

export const SURFACE_BOUNDS = {
  width: 960,
  height: 540,
  minX: 28,
  maxX: 932,
  minY: 122,
  maxY: 512,
};

export const SHIP_SOLIDS: SolidRect[] = [
  { x: 60, y: 58, w: 46, h: 30 },  // Bunk bed
  { x: 138, y: 58, w: 84, h: 24 }, // Food & water dispensers
  { x: 256, y: 58, w: 42, h: 28 }, // Suit locker
  { x: 254, y: 128, w: 44, h: 28 }, // Cockpit table
];

export const SURFACE_SOLIDS: SolidRect[] = [
  { x: 432, y: 152, w: 96, h: 72 }, // Landed Odyssey-1 Ship
  { x: 316, y: 174, w: 54, h: 28 }, // Solar panel array
  // Mineral outcrops (aligned with mineralNodes coordinates)
  { x: 295, y: 350, w: 28, h: 22 },
  { x: 361, y: 408, w: 28, h: 22 },
  { x: 616, y: 316, w: 28, h: 22 },
  { x: 546, y: 418, w: 28, h: 22 },
  { x: 145, y: 300, w: 28, h: 22 },
  { x: 806, y: 272, w: 28, h: 22 },
  { x: 686, y: 438, w: 28, h: 22 },
];

export const SHIP_INTERACTABLES: WorldInteractable[] = [
  {
    id: 'sleep_bunk',
    type: 'sleep_bunk',
    x: 84,
    y: 96,
    width: 48,
    height: 36,
    zone: 'ship',
    labelEn: 'Sleep Bunk',
    labelEs: 'Litera (Dormir)',
  },
  {
    id: 'water_unit',
    type: 'food_water',
    x: 155,
    y: 90,
    width: 34,
    height: 32,
    zone: 'ship',
    labelEn: 'Drink Water (+40%)',
    labelEs: 'Beber Agua (+40%)',
  },
  {
    id: 'food_unit',
    type: 'food_water',
    x: 204,
    y: 90,
    width: 34,
    height: 32,
    zone: 'ship',
    labelEn: 'Open Food Inventory',
    labelEs: 'Abrir Comida e Inventario',
  },
  {
    id: 'suit_locker',
    type: 'suit_locker',
    x: 276,
    y: 94,
    width: 44,
    height: 34,
    zone: 'ship',
    labelEn: 'Tools & Suit Locker (E)',
    labelEs: 'Casillero Traje y Herram. (E)',
  },
  {
    id: 'garden_bed',
    type: 'garden_bed',
    x: 102,
    y: 122,
    width: 52,
    height: 30,
    zone: 'ship',
    labelEn: 'Hydroponic Garden',
    labelEs: 'Jardín Hidropónico',
  },
  {
    id: 'training_pad',
    type: 'training_pad',
    x: 96,
    y: 168,
    width: 46,
    height: 32,
    zone: 'ship',
    labelEn: 'Exercise Pad (T)',
    labelEs: 'Tapete Entrenar (T)',
  },
  {
    id: 'storage_vault',
    type: 'storage_vault',
    x: 138,
    y: 176,
    width: 38,
    height: 30,
    zone: 'ship',
    labelEn: 'Storage & Mineral Deposit',
    labelEs: 'Almacén / Depositar Minerales',
  },
  {
    id: 'fuel_zone',
    type: 'fuel_zone',
    x: 224,
    y: 176,
    width: 42,
    height: 30,
    zone: 'ship',
    labelEn: 'Fuel & Gas Zone',
    labelEs: 'Zona de Combustible y Gases',
  },
  {
    id: 'energy_reactor',
    type: 'energy_reactor',
    x: 230,
    y: 122,
    width: 44,
    height: 32,
    zone: 'ship',
    labelEn: 'Energy & Oxygen Area',
    labelEs: 'Área de Energía y Oxígeno',
  },
  {
    id: 'ship_console',
    type: 'ship_console',
    x: 266,
    y: 160,
    width: 48,
    height: 36,
    zone: 'ship',
    labelEn: 'Planet Console & Map',
    labelEs: 'Consola de Planetas y Mapa',
  },
  {
    id: 'airlock_exit',
    type: 'airlock',
    x: 180,
    y: 188,
    width: 44,
    height: 28,
    zone: 'ship',
    labelEn: 'Exit Ship Airlock (F)',
    labelEs: 'Salir por Escotilla (F)',
  },
];

export const SURFACE_INTERACTABLES: WorldInteractable[] = [
  {
    id: 'airlock_enter',
    type: 'airlock',
    x: 480,
    y: 238,
    width: 60,
    height: 36,
    zone: 'surface',
    labelEn: 'Enter Ship Airlock (F)',
    labelEs: 'Entrar a la Nave (F)',
  },
  {
    id: 'solar_beacon',
    type: 'base_beacon',
    x: 342,
    y: 212,
    width: 48,
    height: 36,
    zone: 'surface',
    labelEn: 'Inspect Solar Array',
    labelEs: 'Revisar Panel Solar',
  },
  // Mineral veins (matched to mineralNodes ids)
  { id: 'node_iron_1', type: 'mineral_rock', mineralId: 'iron', x: 309, y: 362, width: 42, height: 36, zone: 'surface', labelEn: 'Mine Iron (Drill)', labelEs: 'Minar Hierro (Taladro)' },
  { id: 'node_silicon_1', type: 'mineral_rock', mineralId: 'silicon', x: 375, y: 420, width: 42, height: 36, zone: 'surface', labelEn: 'Mine Silicon (Drill)', labelEs: 'Minar Silicio (Taladro)' },
  { id: 'node_titanium_1', type: 'mineral_rock', mineralId: 'titanium', x: 630, y: 328, width: 42, height: 36, zone: 'surface', labelEn: 'Mine Titanium (Drill)', labelEs: 'Minar Titanio (Taladro)' },
  { id: 'node_ilmenite_1', type: 'mineral_rock', mineralId: 'ilmenite', x: 560, y: 430, width: 42, height: 36, zone: 'surface', labelEn: 'Mine Ilmenite (Drill)', labelEs: 'Minar Ilmenita (Taladro)' },
  { id: 'node_nickel_1', type: 'mineral_rock', mineralId: 'nickel', x: 159, y: 312, width: 42, height: 36, zone: 'surface', labelEn: 'Mine Nickel (Drill)', labelEs: 'Minar Níquel (Taladro)' },
  { id: 'node_carbon_1', type: 'mineral_rock', mineralId: 'carbon', x: 820, y: 284, width: 42, height: 36, zone: 'surface', labelEn: 'Mine Carbon (Drill)', labelEs: 'Minar Carbono (Taladro)' },
  { id: 'node_platinum_1', type: 'mineral_rock', mineralId: 'platinum', x: 700, y: 450, width: 42, height: 36, zone: 'surface', labelEn: 'Mine Platinum (Drill)', labelEs: 'Minar Platino (Taladro)' },
  // Gas vents (matched to gasVents ids)
  { id: 'vent_o2', type: 'gas_vent', gasResource: 'oxygen_gas', x: 405, y: 270, width: 42, height: 36, zone: 'surface', labelEn: 'Collect O2 Gas (Collector)', labelEs: 'Recolectar Gas O2 (Colector)' },
  { id: 'vent_h2', type: 'gas_vent', gasResource: 'hydrogen_gas', x: 605, y: 245, width: 42, height: 36, zone: 'surface', labelEn: 'Collect H2 Gas (Collector)', labelEs: 'Recolectar Gas H2 (Colector)' },
  { id: 'vent_he3', type: 'gas_vent', gasResource: 'helium_3', x: 250, y: 240, width: 42, height: 36, zone: 'surface', labelEn: 'Collect Helium-3 (Collector)', labelEs: 'Recolectar Helio-3 (Colector)' },
];

export function resolveCircleRectCollision(
  nx: number,
  ny: number,
  radius: number,
  solids: SolidRect[]
): { x: number; y: number } {
  let x = nx;
  let y = ny;
  for (const rect of solids) {
    const closestX = Math.max(rect.x, Math.min(x, rect.x + rect.w));
    const closestY = Math.max(rect.y, Math.min(y, rect.y + rect.h));
    const dx = x - closestX;
    const dy = y - closestY;
    const distSq = dx * dx + dy * dy;
    if (distSq < radius * radius) {
      const dist = Math.sqrt(distSq) || 0.001;
      const overlap = radius - dist;
      x += (dx / dist) * overlap;
      y += (dy / dist) * overlap;
    }
  }
  return { x, y };
}

export function getSurfaceZoneAndTemp(
  x: number,
  y: number,
  planet: PlanetPreset
): { zone: ZoneId; ambientTempC: number } {
  // Mercury has extreme Day (+430°C east) vs Night (-180°C west) and 167°C mean
  if (planet.id === 'mercury') {
    if (x < 260) return { zone: 'cryo', ambientTempC: planet.nightTempC ?? -180 };
    if (x > 700) return { zone: 'thermal', ambientTempC: planet.dayTempC ?? 430 };
    return { zone: 'surface', ambientTempC: planet.baseTempC };
  }
  if (x < 220 && y > 210) {
    return { zone: 'cryo', ambientTempC: Math.min(planet.baseTempC, -165) };
  }
  if (x > 740 && y > 210) {
    return { zone: 'thermal', ambientTempC: Math.max(planet.baseTempC, 110) };
  }
  return { zone: 'surface', ambientTempC: planet.baseTempC };
}
