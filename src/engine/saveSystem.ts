import { MEAT_IDS, VEGGIE_IDS } from '../data/phase2Catalog';
import { PHASE3_CONFIG, PLANET_CATALOG } from '../data/phase3Planets';
import {
  AgricultureState,
  CharacterId,
  FoodId,
  GameSnapshot,
  GasVentNodeState,
  InventoryState,
  MineralId,
  MineralNodeState,
  PlanetId,
  SaveSlot,
  ShipStorageState,
  ToolsState,
  UpgradeTreeState,
} from '../types/game';

const STORAGE_KEY = 'solar_odyssey_phase1_saves_v1';

export function createInitialMineralsRecord(fill = 0): Record<MineralId, number> {
  return {
    iron: fill,
    titanium: fill,
    ilmenite: fill,
    silicon: fill,
    nickel: fill,
    platinum: fill,
    carbon: fill,
  };
}

export function createInitialInventory(): InventoryState {
  const food = {} as Record<FoodId, number>;
  for (const m of MEAT_IDS) food[m] = 44;
  for (const v of VEGGIE_IDS) food[v] = 0;

  return {
    minerals: createInitialMineralsRecord(0),
    food,
    cleanWater: 12,
    contaminatedWater: 2,
  };
}

export function createInitialStorage(): ShipStorageState {
  return {
    minerals: {
      iron: 3,
      titanium: 2,
      ilmenite: 2,
      silicon: 3,
      nickel: 1,
      platinum: 0,
      carbon: 2,
    },
    gases: {
      oxygen_gas: 2,
      hydrogen_gas: 2,
    },
    fuel: {
      hydro_oxy_fuel: 2,
      helium_3: 0,
    },
    toolGasBuffer: {
      oxygen_gas: 0,
      hydrogen_gas: 0,
    },
    toolHeliumBuffer: 0,
  };
}

export function createInitialTools(): ToolsState {
  return {
    equippedTool: 'drill',
    levels: {
      drill: 'basic',
      mineral_storage: 'basic',
      fuel_collector: 'basic',
      fuel_storage: 'basic',
    },
    oxygenTankLevel: 'basic',
  };
}

export function createInitialUpgradeTree(): UpgradeTreeState {
  return {
    minerals: 0,
    oxygen: 0,
    energy: 0,
    water: 0,
    food: 0,
  };
}

export function createInitialAgriculture(): AgricultureState {
  return {
    enabled: false,
    plots: [
      { id: 0, veggieId: 'tomato', elapsedSeconds: 0 },
      { id: 1, veggieId: 'lettuce', elapsedSeconds: 0 },
      { id: 2, veggieId: 'spinach', elapsedSeconds: 0 },
      { id: 3, veggieId: null, elapsedSeconds: 0 },
    ],
  };
}

export function createInitialMineralNodes(): MineralNodeState[] {
  return [
    { id: 'node_iron_1', mineralId: 'iron', x: 309, y: 362, cooldownRemaining: 0 },
    { id: 'node_silicon_1', mineralId: 'silicon', x: 375, y: 420, cooldownRemaining: 0 },
    { id: 'node_titanium_1', mineralId: 'titanium', x: 630, y: 328, cooldownRemaining: 0 },
    { id: 'node_ilmenite_1', mineralId: 'ilmenite', x: 560, y: 430, cooldownRemaining: 0 },
    { id: 'node_nickel_1', mineralId: 'nickel', x: 159, y: 312, cooldownRemaining: 0 },
    { id: 'node_carbon_1', mineralId: 'carbon', x: 820, y: 284, cooldownRemaining: 0 },
    { id: 'node_platinum_1', mineralId: 'platinum', x: 700, y: 450, cooldownRemaining: 0 },
  ];
}

export function createInitialGasVents(): GasVentNodeState[] {
  return [
    { id: 'vent_o2', resource: 'oxygen_gas', x: 405, y: 270, cooldownRemaining: 0 },
    { id: 'vent_h2', resource: 'hydrogen_gas', x: 605, y: 245, cooldownRemaining: 0 },
    { id: 'vent_he3', resource: 'helium_3', x: 250, y: 240, cooldownRemaining: 0 },
  ];
}

export function listSavedGames(): SaveSlot[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SaveSlot[];
    if (!Array.isArray(parsed)) return [];
    return parsed.sort((a, b) => b.savedAt - a.savedAt);
  } catch {
    return [];
  }
}

export function saveGameSnapshot(
  snapshot: GameSnapshot,
  position: { x: number; y: number },
  customName?: string
): SaveSlot {
  const existing = listSavedGames();
  const slotId = `save_${snapshot.character}_${snapshot.planetPreset.id}`;
  const slot: SaveSlot = {
    id: slotId,
    name:
      customName ??
      `${snapshot.character === 'leo' ? 'Leo' : 'Nova'} · ${snapshot.planetPreset.nameEn}`,
    character: snapshot.character,
    savedAt: Date.now(),
    day: snapshot.day,
    missionClockSeconds: snapshot.missionClockSeconds,
    planetId: snapshot.planetPreset.id,
    visitedPlanets: snapshot.visitedPlanets,
    odometerKm: snapshot.odometerKm,
    stats: { ...snapshot.stats },
    suitEquipped: snapshot.suitEquipped,
    insideShip: snapshot.insideShip,
    position: { ...position },
    energyState: { ...snapshot.energyState },
    hooks: { ...snapshot.hooks },
    inventory: snapshot.inventory,
    storage: snapshot.storage,
    tools: snapshot.tools,
    upgradeTree: snapshot.upgradeTree,
    shipTier: snapshot.shipTier,
    agriculture: snapshot.agriculture,
    completedHardEnergyMission: snapshot.completedHardEnergyMission,
    missionsCompletedCount: snapshot.missionsCompletedCount,
    unlockedPets: snapshot.unlockedPets,
    activePet: snapshot.activePet,
    dysonSphereCompleted: snapshot.dysonSphereCompleted,
    illnessTimer: snapshot.illnessTimer,
    motivationTimer: snapshot.motivationTimer,
  };

  const filtered = existing.filter((s) => s.id !== slotId);
  const updated = [slot, ...filtered].slice(0, 6);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Ignore storage quota issues safely
  }
  return slot;
}

export function deleteSavedGame(slotId: string): SaveSlot[] {
  const remaining = listSavedGames().filter((s) => s.id !== slotId);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(remaining));
  } catch {
    // Ignore storage errors
  }
  return remaining;
}

export function createInitialSnapshot(character: CharacterId): GameSnapshot {
  const defaultPlanet = PLANET_CATALOG.earth;
  return {
    character,
    stats: {
      health: 100,
      hunger: 92,
      hydration: 92,
      fatigue: 100,
      oxygen: 100,
      energy: 85,
      temperature: defaultPlanet.baseTempC,
      fuel: 70,
      dropMultiplier: 1,
    },
    statusEffects: [],
    suitEquipped: true,
    insideShip: true,
    currentZone: 'ship',
    energyState: {
      solarExposure: defaultPlanet.solarExposure,
      outagePauseRemaining: 0,
      isRechargingAfterOutage: false,
      warning20Triggered: false,
      alarm0Triggered: false,
    },
    hooks: {
      agricultureActive: false,
      oxygenTreeCompleted: false,
      oxygenTankTier: 'basic',
      gravitationalPull: { x: 0, y: 0 },
      spaceObjectsActive: false,
      solarFlaresActive: false,
      missionLostSadness: false,
      sadnessTimer: 0,
      helium3UnlockPlanet: PHASE3_CONFIG.helium3UnlockPlanet,
      currentPlanetReached: 'earth' as PlanetId,
    },
    planetPreset: defaultPlanet,
    visitedPlanets: ['earth'],
    odometerKm: 0,
    specialScenario: null,
    inventory: createInitialInventory(),
    storage: createInitialStorage(),
    tools: createInitialTools(),
    upgradeTree: createInitialUpgradeTree(),
    shipTier: 'basic',
    agriculture: createInitialAgriculture(),
    mineralNodes: createInitialMineralNodes(),
    gasVents: createInitialGasVents(),
    illnessTimer: 0,
    motivationTimer: 0,
    day: 1,
    missionClockSeconds: 0,
    oxygenLossPer10s: 9,
    activePrompt: null,
    activeBanner: null,
    pendingCinematic: null,
    activeMission: null,
    completedHardEnergyMission: false,
    missionsCompletedCount: 0,
    unlockedPets: [],
    activePet: null,
    dysonSphereCompleted: false,
    deathReason: null,
  };
}
