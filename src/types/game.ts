export type Language = 'en' | 'es';

export type CharacterId = 'leo' | 'nova';

export type Direction = 'down' | 'up' | 'left' | 'right';

export type SolarExposure = 'low' | 'moderate' | 'high';

export type OxygenTankTier = 'none' | 'basic' | 'updated' | 'advanced' | 'industrial';

export type ToolType = 'drill' | 'mineral_storage' | 'fuel_collector' | 'fuel_storage';
export type ToolLevel = 'basic' | 'updated' | 'advanced' | 'industrialized';
export type OxygenTankLevel = 'basic' | 'updated' | 'advanced' | 'industrialized';

export type ShipUpgradeTier = 'basic' | 'improved' | 'advanced' | 'elite' | 'legendary';

export type UpgradeBranchId = 'minerals' | 'oxygen' | 'energy' | 'water' | 'food';

export type PlanetId =
  | 'earth'
  | 'moon'
  | 'mars'
  | 'asteroid_belt'
  | 'jupiter'
  | 'saturn'
  | 'uranus'
  | 'neptune'
  | 'venus'
  | 'mercury'
  | 'sun';

export type MineralId =
  | 'iron'
  | 'titanium'
  | 'ilmenite'
  | 'silicon'
  | 'nickel'
  | 'platinum'
  | 'carbon';

export type GasId = 'oxygen_gas' | 'hydrogen_gas';
export type FuelId = 'hydro_oxy_fuel' | 'helium_3';

export type MeatId =
  | 'chicken'
  | 'beef_fajitas'
  | 'chili_con_carne'
  | 'turkey'
  | 'tuna'
  | 'bouillon_cubes'
  | 'soups';

export type VeggieId =
  | 'tomato'
  | 'lettuce'
  | 'cucumber'
  | 'radish'
  | 'spinach'
  | 'leafy_greens'
  | 'cabbage'
  | 'arugula'
  | 'beet'
  | 'basil'
  | 'parsley'
  | 'chives';

export type FoodId = MeatId | VeggieId;

export type ScreenId =
  | 'start'
  | 'playing'
  | 'sleep'
  | 'planet_map'
  | 'inventory'
  | 'upgrade_tree'
  | 'tool_upgrade'
  | 'storage'
  | 'garden'
  | 'pause'
  | 'game_over';

export type StatusEffectId =
  | 'pressure'
  | 'illness'
  | 'freezing'
  | 'burn'
  | 'motivation'
  | 'sadness'
  | 'dehydrated'
  | 'hungry'
  | 'weakness';

export type PlayerAnimState =
  | 'idle'
  | 'move'
  | 'fatigue'
  | 'illness'
  | 'freezing'
  | 'burn'
  | 'training'
  | 'consume'
  | 'hydrate'
  | 'interact'
  | 'attack'
  | 'drill'
  | 'collector'
  | 'deposit'
  | 'harvest'
  | 'sleep';

export type ZoneId = 'ship' | 'surface' | 'cryo' | 'thermal' | 'space_scenario';

export interface SurvivalStats {
  health: number;      // 0..100
  hunger: number;      // 0..100 (drops 1% / 4s)
  hydration: number;   // 0..100 (drops 1% / 2s)
  fatigue: number;     // 0..100
  oxygen: number;      // 0..100
  energy: number;      // 0..100
  temperature: number; // °C
  fuel: number;        // 0..100
  dropMultiplier: number;
}

export interface InventoryState {
  minerals: Record<MineralId, number>;
  food: Record<FoodId, number>;
  cleanWater: number;
  contaminatedWater: number;
}

export interface ShipStorageState {
  minerals: Record<MineralId, number>;
  gases: Record<GasId, number>;
  fuel: Record<FuelId, number>;
  toolGasBuffer: Record<GasId, number>;
  toolHeliumBuffer: number;
}

export interface ToolsState {
  equippedTool: ToolType;
  levels: Record<ToolType, ToolLevel>;
  oxygenTankLevel: OxygenTankLevel;
}

export interface UpgradeTreeState {
  minerals: number;
  oxygen: number;
  energy: number;
  water: number;
  food: number;
}

export type CropStage = 'premature' | 'semi_developed' | 'ready';

export interface CropPlot {
  id: number;
  veggieId: VeggieId | null;
  elapsedSeconds: number;
}

export interface AgricultureState {
  enabled: boolean;
  plots: CropPlot[];
}

export interface MineralNodeState {
  id: string;
  mineralId: MineralId;
  x: number;
  y: number;
  cooldownRemaining: number;
}

export interface GasVentNodeState {
  id: string;
  resource: GasId | 'helium_3';
  x: number;
  y: number;
  cooldownRemaining: number;
}

export interface CinematicEvent {
  id: string;
  kind: 'tool' | 'ship';
  titleEn: string;
  titleEs: string;
  subtitleEn: string;
  subtitleEs: string;
  detailEn: string;
  detailEs: string;
  accentColor: string;
}

export type TravelCinematicState = {
  fromPlanetId: PlanetId;
  toPlanetId: PlanetId;
  distanceKm: number;
  distanceAu: number;
  variant: 'standard_4_1' | 'mercury_to_sun_4_2';
};

export type MissionType =
  | 'oxygen_failure'
  | 'energy_failure'
  | 'water_failure'
  | 'storage_failure';

export type PetId = 'astro_dog' | 'cosmo_cat' | 'nebula_owl';

export type AssistantMood = 'cheerful' | 'curious' | 'worried';

export type AssistantTopicId =
  | 'agriculture'
  | 'oxygen'
  | 'status_effects'
  | 'suit'
  | 'tools'
  | 'gases'
  | 'energy'
  | 'upgrade_tree'
  | 'inventory'
  | 'minerals'
  | 'jupiter_ship'
  | 'sun_dyson';

export interface ActiveMission {
  id: string;
  type: MissionType;
  isHard: boolean;
  targetInteractable: 'energy_reactor' | 'storage_vault';
  timeRemaining: number;
  maxTime: number;
  waterTickAcc: number;
  storageApplied: boolean;
}

export interface SpecialScenarioState {
  active: boolean;
  planetId: 'jupiter' | 'saturn' | 'sun';
  escapeProgress: number; // 0..100 (for Jupiter & Saturn)
  sunPanelsPlaced?: number; // 0..50 (for Sun Dyson Sphere)
  elapsedSeconds: number;
}

export interface FuturePhaseHooks {
  agricultureActive: boolean;
  oxygenTreeCompleted: boolean;
  oxygenTankTier: OxygenTankTier;
  gravitationalPull: { x: number; y: number };
  spaceObjectsActive: boolean;
  solarFlaresActive: boolean;
  missionLostSadness: boolean;
  sadnessTimer?: number;
  helium3UnlockPlanet: 'neptune' | 'mercury';
  currentPlanetReached: PlanetId;
}

export interface EnergySystemState {
  solarExposure: SolarExposure;
  outagePauseRemaining: number;
  isRechargingAfterOutage: boolean;
  warning20Triggered: boolean;
  alarm0Triggered: boolean;
}

export interface PlanetPreset {
  id: PlanetId;
  nameEn: string;
  nameEs: string;
  baseTempC: number;
  dayTempC?: number;
  nightTempC?: number;
  solarExposure: SolarExposure;
  hasAtmosphereOxygen: boolean;
  hasAtmosphereHydrogen: boolean;
  hasHelium3: boolean;
  cannotLand: boolean;
  hasSpaceObjects: boolean;
  hasSolarFlares: boolean;
  gravityStrength: number;
  fuelCostToEnter: number;
  distanceFromPrevKm: number;
  distanceFromPrevAu: number;
  descEn: string;
  descEs: string;
  factEn: string;
  factEs: string;
  color: string;
}

export interface WorldInteractable {
  id: string;
  type:
    | 'sleep_bunk'
    | 'food_water'
    | 'suit_locker'
    | 'training_pad'
    | 'ship_console'
    | 'airlock'
    | 'mineral_rock'
    | 'gas_vent'
    | 'garden_bed'
    | 'fuel_zone'
    | 'storage_vault'
    | 'energy_reactor'
    | 'base_beacon';
  x: number;
  y: number;
  width: number;
  height: number;
  zone: 'ship' | 'surface';
  labelEn: string;
  labelEs: string;
  mineralId?: MineralId;
  gasResource?: GasId | 'helium_3';
}

export interface GameSnapshot {
  character: CharacterId;
  stats: SurvivalStats;
  statusEffects: StatusEffectId[];
  suitEquipped: boolean;
  insideShip: boolean;
  currentZone: ZoneId;
  energyState: EnergySystemState;
  hooks: FuturePhaseHooks;
  planetPreset: PlanetPreset;
  visitedPlanets: PlanetId[];
  odometerKm: number;
  specialScenario: SpecialScenarioState | null;
  inventory: InventoryState;
  storage: ShipStorageState;
  tools: ToolsState;
  upgradeTree: UpgradeTreeState;
  shipTier: ShipUpgradeTier;
  agriculture: AgricultureState;
  mineralNodes: MineralNodeState[];
  gasVents: GasVentNodeState[];
  illnessTimer: number;
  motivationTimer: number;
  day: number;
  missionClockSeconds: number;
  oxygenLossPer10s: number;
  activePrompt: {
    id: string;
    labelEn: string;
    labelEs: string;
    actionHint: string;
  } | null;
  activeBanner: {
    key: string;
    severity: 'info' | 'warn' | 'danger';
    textEn: string;
    textEs: string;
  } | null;
  pendingCinematic: CinematicEvent | null;
  activeMission: ActiveMission | null;
  completedHardEnergyMission: boolean;
  missionsCompletedCount: number;
  unlockedPets: PetId[];
  activePet: PetId | null;
  dysonSphereCompleted: boolean;
  deathReason: string | null;
}

export interface SaveSlot {
  id: string;
  name: string;
  character: CharacterId;
  savedAt: number;
  day: number;
  missionClockSeconds: number;
  planetId: PlanetId;
  visitedPlanets?: PlanetId[];
  odometerKm?: number;
  stats: SurvivalStats;
  suitEquipped: boolean;
  insideShip: boolean;
  position: { x: number; y: number };
  energyState: EnergySystemState;
  hooks: FuturePhaseHooks;
  inventory?: InventoryState;
  storage?: ShipStorageState;
  tools?: ToolsState;
  upgradeTree?: UpgradeTreeState;
  shipTier?: ShipUpgradeTier;
  agriculture?: AgricultureState;
  completedHardEnergyMission?: boolean;
  missionsCompletedCount?: number;
  unlockedPets?: PetId[];
  activePet?: PetId | null;
  dysonSphereCompleted?: boolean;
  illnessTimer: number;
  motivationTimer: number;
}
