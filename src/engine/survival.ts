import {
  CROP_GROWTH_SECONDS,
  FOOD_META,
  MAX_INVENTORY_MINERAL,
  MINERAL_RESPAWN_SECONDS,
  toolLevelToTankTier,
} from '../data/phase2Catalog';
import { TANK_LABELS } from '../i18n/translations';
import {
  ActiveMission,
  CropStage,
  FoodId,
  GameSnapshot,
  GasId,
  MineralId,
  MissionType,
  OxygenTankTier,
  PetId,
  SolarExposure,
  StatusEffectId,
  UpgradeBranchId,
  ZoneId,
} from '../types/game';
import { MISSION_CATALOG } from '../data/phase4Content';

export const clamp = (v: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, v));

export function getCropStage(elapsedSeconds: number): CropStage {
  if (elapsedSeconds >= CROP_GROWTH_SECONDS) return 'ready';
  if (elapsedSeconds >= CROP_GROWTH_SECONDS * 0.5) return 'semi_developed';
  return 'premature';
}

/**
 * §3.4 Oxygen consumption formula:
 * - Base: 10% every 10s (or 5% every 10s if Oxygen Upgrade Tree is completed)
 * - Tank reduction (NOT cumulative, highest equipped tier replaces lower):
 *   none: 0, basic: -1, updated: -2, advanced: -3, industrial: -4
 * - Hard floor: cannot drop below 1% every 10 seconds
 */
export function computeSuitOxygenLossPer10s(
  oxygenTreeCompleted: boolean,
  tankTier: OxygenTankTier
): number {
  const base = oxygenTreeCompleted ? 5 : 10;
  const tankReduction = TANK_LABELS[tankTier]?.reduction ?? 0;
  return Math.max(1, base - tankReduction);
}

export function getPassiveRechargeRatePerSec(exposure: SolarExposure): number {
  switch (exposure) {
    case 'low':
      return 2 / 5; // 2% per 5s
    case 'moderate':
      return 4 / 5; // 4% per 5s
    case 'high':
      return 10 / 5; // 10% per 5s
  }
}

export interface SurvivalStepInput {
  dt: number;
  isMoving: boolean;
  isRunning: boolean;
  isMiningOrTraining: boolean;
  ambientTempC: number;
  currentZone: ZoneId;
  timeScale?: number;
}

export interface SurvivalStepResult {
  snapshot: GameSnapshot;
  speedMultiplier: number;
  tookDamage: boolean;
  warningTriggered: boolean;
}

export function stepSurvival(
  prev: GameSnapshot,
  input: SurvivalStepInput
): SurvivalStepResult {
  const dt = input.dt * (input.timeScale ?? 1);
  if (prev.stats.health <= 0) {
    return { snapshot: prev, speedMultiplier: 0, tookDamage: false, warningTriggered: false };
  }

  const stats = { ...prev.stats };
  const energyState = { ...prev.energyState };
  const oxygenTankTier = toolLevelToTankTier(prev.tools.oxygenTankLevel);
  const oxygenTreeCompleted = prev.upgradeTree.oxygen >= 3;
  let sadnessTimer = Math.max(0, (prev.hooks.sadnessTimer ?? 0) - dt);
  let activeMission: ActiveMission | null = prev.activeMission
    ? { ...prev.activeMission }
    : null;
  const storage = {
    ...prev.storage,
    minerals: { ...prev.storage.minerals },
  };
  let missionLostSadness = prev.hooks.missionLostSadness && sadnessTimer > 0;

  if (activeMission) {
    activeMission.timeRemaining = Math.max(0, activeMission.timeRemaining - dt);

    if (activeMission.type === 'storage_failure' && !activeMission.storageApplied) {
      // Lose 3% of total mineral amount
      const mKeys = Object.keys(storage.minerals) as MineralId[];
      const totalMin = mKeys.reduce((acc, k) => acc + storage.minerals[k], 0);
      let toLose = Math.floor(totalMin * 0.03);
      if (totalMin > 0 && toLose === 0) toLose = 1;
      for (const k of mKeys) {
        if (toLose <= 0) break;
        const take = Math.min(storage.minerals[k], toLose);
        storage.minerals[k] -= take;
        toLose -= take;
      }
      activeMission.storageApplied = true;
    }

    if (activeMission.type === 'water_failure') {
      activeMission.waterTickAcc += dt;
      if (activeMission.waterTickAcc >= 5) {
        activeMission.waterTickAcc -= 5;
        stats.hydration = clamp(stats.hydration - 10, 0, 100);
      }
    }

    if (activeMission.type === 'energy_failure') {
      stats.energy = clamp(stats.energy - 1.1 * dt, 0, 100);
    }

    if (activeMission.type === 'oxygen_failure') {
      stats.oxygen = clamp(stats.oxygen - 1.4 * dt, 0, 100);
    }

    if (activeMission.timeRemaining <= 0) {
      activeMission = null;
      missionLostSadness = true;
      sadnessTimer = 45;
    }
  }

  const hooks = {
    ...prev.hooks,
    agricultureActive: prev.agriculture.enabled,
    oxygenTreeCompleted,
    oxygenTankTier,
    missionLostSadness,
    sadnessTimer,
  };
  const exposure = energyState.solarExposure;

  let illnessTimer = Math.max(0, prev.illnessTimer - dt);
  const motivationTimer = Math.max(0, prev.motivationTimer - dt);
  const missionClockSeconds = prev.missionClockSeconds + dt;
  const day = 1 + Math.floor(missionClockSeconds / 360);

  // Upgrade tree efficiency modifiers (§1.8)
  const energyEffFactor = 1 - prev.upgradeTree.energy * 0.12;
  const waterEffFactor = 1 - prev.upgradeTree.water * 0.12;
  const foodEffFactor = 1 - prev.upgradeTree.food * 0.1;

  // Ship upgrade modifiers (§1.7)
  const hasInfirmary = prev.shipTier !== 'basic';
  const hasTempRegulator = prev.shipTier === 'elite' || prev.shipTier === 'legendary';

  // 1. ENERGY SYSTEM (§3.3 & §3.9)
  if (stats.energy <= 0 && !energyState.isRechargingAfterOutage) {
    if (energyState.outagePauseRemaining <= 0 && !energyState.alarm0Triggered) {
      energyState.outagePauseRemaining = 30;
      energyState.alarm0Triggered = true;
    } else if (energyState.outagePauseRemaining > 0) {
      energyState.outagePauseRemaining = Math.max(0, energyState.outagePauseRemaining - dt);
      if (energyState.outagePauseRemaining === 0) {
        energyState.isRechargingAfterOutage = true;
      }
    }
  } else if (energyState.isRechargingAfterOutage) {
    const boost = 1 + prev.upgradeTree.energy * 0.15;
    stats.energy = clamp(stats.energy + getPassiveRechargeRatePerSec(exposure) * boost * dt, 0, 100);
    if (stats.energy >= 30) {
      energyState.isRechargingAfterOutage = false;
      energyState.alarm0Triggered = false;
    }
  } else {
    let netEnergyPerSec = 0;
    const shipO2Drain = exposure === 'low' ? (1 / 5) * energyEffFactor : 0;
    const agriDrain = hooks.agricultureActive && exposure !== 'high' ? (2 / 4) * energyEffFactor : 0;

    if (exposure === 'high') {
      netEnergyPerSec = getPassiveRechargeRatePerSec('high') * (1 + prev.upgradeTree.energy * 0.15);
    } else if (exposure === 'moderate') {
      netEnergyPerSec = hooks.agricultureActive
        ? -agriDrain
        : getPassiveRechargeRatePerSec('moderate') * 0.5 * (1 + prev.upgradeTree.energy * 0.15);
    } else {
      netEnergyPerSec = -(shipO2Drain + agriDrain);
    }

    stats.energy = clamp(stats.energy + netEnergyPerSec * dt, 0, 100);
    if (stats.energy <= 20) {
      energyState.warning20Triggered = true;
    } else if (stats.energy > 28) {
      energyState.warning20Triggered = false;
    }

    if (stats.energy <= 0) {
      energyState.outagePauseRemaining = 30;
      energyState.alarm0Triggered = true;
    }
  }

  const shipHasOxygen = stats.energy > 0 && energyState.outagePauseRemaining <= 0;

  // 2. AGRICULTURE GROWTH (§3.9): grows 2 mins per crop ONLY when enabled AND power > 0
  const agriculture = {
    ...prev.agriculture,
    plots: prev.agriculture.plots.map((plot) => {
      if (!prev.agriculture.enabled || !plot.veggieId || !shipHasOxygen) {
        return plot; // Growth stays paused when agriculture is OFF
      }
      return {
        ...plot,
        elapsedSeconds: Math.min(CROP_GROWTH_SECONDS, plot.elapsedSeconds + dt),
      };
    }),
  };

  // 3. MINERAL & GAS NODE REGENERATION (§3.6: 10 seconds)
  const mineralNodes = prev.mineralNodes.map((node) =>
    node.cooldownRemaining > 0
      ? { ...node, cooldownRemaining: Math.max(0, node.cooldownRemaining - dt) }
      : node
  );
  const gasVents = prev.gasVents.map((vent) =>
    vent.cooldownRemaining > 0
      ? { ...vent, cooldownRemaining: Math.max(0, vent.cooldownRemaining - dt) }
      : vent
  );

  // 4. TEMPERATURE (§1.4, §3.1, §3.5)
  const targetTemp =
    prev.insideShip && shipHasOxygen
      ? 22
      : hasTempRegulator && prev.suitEquipped
        ? clamp(input.ambientTempC, -80, 75)
        : input.ambientTempC;
  stats.temperature += (targetTemp - stats.temperature) * Math.min(1, dt * 1.8);

  // 5. STATUS EFFECTS EVALUATION (§3.2)
  const effects = new Set<StatusEffectId>();
  if (prev.insideShip && hasInfirmary && illnessTimer > 0) {
    // Improved Ship Infirmary speeds recovery
    illnessTimer = Math.max(0, illnessTimer - dt * 1.5);
  }
  if (illnessTimer > 0) {
    effects.add('illness');
    effects.add('weakness');
  }
  if (motivationTimer > 0) effects.add('motivation');
  if (hooks.missionLostSadness) effects.add('sadness');
  if (!prev.insideShip && !prev.suitEquipped) effects.add('pressure');
  if (stats.temperature < -150) effects.add('freezing');
  if (stats.temperature > 95) effects.add('burn');

  // 6. HUNGER & HYDRATION (§1.4, §3.2)
  let drainFactor = 1;
  if (effects.has('motivation')) drainFactor *= 0.6;
  if (effects.has('weakness')) drainFactor *= 1.5;

  stats.hunger = clamp(stats.hunger - (1 / 4) * drainFactor * foodEffFactor * dt, 0, 100);
  stats.hydration = clamp(stats.hydration - (1 / 2) * drainFactor * waterEffFactor * dt, 0, 100);

  if (stats.hydration < 20) effects.add('dehydrated');
  if (stats.hunger < 20) effects.add('hungry');

  // 7. FATIGUE (§1.4)
  if (input.isRunning && input.isMoving) {
    stats.fatigue = clamp(stats.fatigue - 7.5 * dt, 0, 100);
  } else if (input.isMiningOrTraining) {
    stats.fatigue = clamp(stats.fatigue - 6.0 * dt, 0, 100);
  } else if (!input.isMoving) {
    stats.fatigue = clamp(stats.fatigue + 16 * dt, 0, 100);
  } else {
    stats.fatigue = clamp(stats.fatigue + 4 * dt, 0, 100);
  }

  // 8. OXYGEN (§3.4)
  const oxygenLossPer10s = computeSuitOxygenLossPer10s(oxygenTreeCompleted, oxygenTankTier);

  if (prev.insideShip && shipHasOxygen) {
    stats.oxygen = clamp(stats.oxygen + 14 * dt, 0, 100);
  } else if (!prev.suitEquipped) {
    stats.oxygen = clamp(stats.oxygen - (10 / 5) * dt, 0, 100);
  } else {
    stats.oxygen = clamp(stats.oxygen - (oxygenLossPer10s / 10) * dt, 0, 100);
  }

  // 9. HEALTH (§3.1, §3.2, §3.5)
  let healthLossPerSec = 0;
  let primaryCause = prev.deathReason;

  if (!prev.suitEquipped && (stats.temperature < -10 || stats.temperature > 50)) {
    healthLossPerSec += 10 / 5;
    primaryCause = 'Extreme temperature without a space suit';
  }
  if (effects.has('freezing')) {
    healthLossPerSec += 0.8;
    primaryCause = 'Freezing below -150°C';
  }
  if (effects.has('burn')) {
    healthLossPerSec += 2.6;
    primaryCause = 'Extreme burn above +95°C';
  }
  if (effects.has('dehydrated')) {
    healthLossPerSec += 1.1;
    primaryCause = 'Severe dehydration';
  }
  if (effects.has('hungry')) {
    healthLossPerSec += 0.8;
    primaryCause = 'Starvation';
  }
  if (effects.has('illness')) {
    healthLossPerSec += 1.0;
    primaryCause = 'Contamination illness';
  }
  if (stats.oxygen <= 0) {
    healthLossPerSec += 5.5;
    primaryCause = 'Oxygen depletion';
  }

  const prevHealth = stats.health;
  if (healthLossPerSec > 0) {
    stats.health = clamp(stats.health - healthLossPerSec * dt, 0, 100);
  } else if (prev.insideShip && hasInfirmary && stats.health < 100 && !effects.has('hungry') && !effects.has('dehydrated')) {
    // Improved ship Infirmary gently heals healthy fed astronauts inside ship
    stats.health = clamp(stats.health + 1.2 * dt, 0, 100);
  }
  const tookDamage = stats.health < prevHealth - 0.001;

  // 10. MOVEMENT SPEED MULTIPLIER
  let speedMultiplier = 1;
  if (effects.has('freezing')) speedMultiplier *= 0.6;
  if (effects.has('sadness')) speedMultiplier *= 0.78;
  if (stats.fatigue < 15) speedMultiplier *= 0.65;
  else if (input.isRunning && stats.fatigue > 5) speedMultiplier *= 1.48;

  // 11. WARNING BANNER
  let activeBanner: GameSnapshot['activeBanner'] = null;
  let warningTriggered = false;

  if (!shipHasOxygen && prev.insideShip && !prev.suitEquipped) {
    activeBanner = {
      key: 'energy_0_suit',
      severity: 'danger',
      textEn: 'Ship energy at 0%! Oxygen offline — Equip your Space Suit (E) immediately!',
      textEs: '¡Energía de la nave al 0%! Sin oxígeno — ¡Ponte el traje espacial (E) ya!',
    };
    warningTriggered = true;
  } else if (effects.has('pressure')) {
    activeBanner = {
      key: 'pressure',
      severity: 'danger',
      textEn: 'PRESSURE ALERT: Outside without helmet! Equip Suit (E) or enter ship.',
      textEs: 'ALERTA DE PRESIÓN: ¡Sin casco afuera! Ponte el traje (E) o entra a la nave.',
    };
    warningTriggered = true;
  } else if (effects.has('burn')) {
    activeBanner = {
      key: 'burn',
      severity: 'danger',
      textEn: 'BURN HAZARD (>95°C): Rapid health loss! Leave thermal zone.',
      textEs: 'PELIGRO DE QUEMADURA (>95°C): ¡Daño rápido! Sal de la zona térmica.',
    };
    warningTriggered = true;
  } else if (effects.has('freezing')) {
    activeBanner = {
      key: 'freezing',
      severity: 'danger',
      textEn: 'FREEZING HAZARD (<-150°C): Speed -40% & health loss!',
      textEs: 'CONGELAMIENTO (<-150°C): ¡Velocidad -40% y pérdida de salud!',
    };
    warningTriggered = true;
  } else if (energyState.warning20Triggered && hooks.agricultureActive) {
    activeBanner = {
      key: 'energy_20_agri',
      severity: 'warn',
      textEn: 'Ship energy below 20%! Suspend agriculture to protect life support.',
      textEs: '¡Energía bajo 20%! Suspende la agricultura para proteger el soporte vital.',
    };
    warningTriggered = true;
  } else if (stats.oxygen < 25) {
    activeBanner = {
      key: 'low_o2',
      severity: 'warn',
      textEn: 'Low Oxygen (<25%)! Return inside the ship to recharge.',
      textEs: '¡Oxígeno bajo (<25%)! Vuelve dentro de la nave para recargar.',
    };
    warningTriggered = true;
  }

  return {
    snapshot: {
      ...prev,
      stats,
      statusEffects: Array.from(effects),
      currentZone: input.currentZone,
      energyState,
      hooks,
      storage,
      agriculture,
      mineralNodes,
      gasVents,
      activeMission,
      illnessTimer,
      motivationTimer,
      day,
      missionClockSeconds,
      oxygenLossPer10s,
      activeBanner,
      deathReason: stats.health <= 0 ? primaryCause : null,
    },
    speedMultiplier,
    tookDamage,
    warningTriggered,
  };
}

/**
 * Consume a specific food item from Inventory (§3.8), decreasing its count by 1.
 */
export function consumeFoodItem(prev: GameSnapshot, foodId: FoodId): GameSnapshot {
  const count = prev.inventory.food[foodId] ?? 0;
  if (count <= 0) return prev;
  const baseGain = FOOD_META[foodId].hungerGain;
  const bonus = 1 + prev.upgradeTree.food * 0.15;
  return {
    ...prev,
    stats: {
      ...prev.stats,
      hunger: clamp(prev.stats.hunger + baseGain * bonus, 0, 100),
    },
    inventory: {
      ...prev.inventory,
      food: {
        ...prev.inventory.food,
        [foodId]: count - 1,
      },
    },
  };
}

/**
 * Consume clean or contaminated water from Inventory (§1.4, §3.2, §3.8).
 */
export function consumeWaterItem(prev: GameSnapshot, contaminated = false): GameSnapshot {
  if (contaminated) {
    if (prev.inventory.contaminatedWater <= 0) return prev;
    return {
      ...prev,
      stats: { ...prev.stats, hydration: clamp(prev.stats.hydration + 30, 0, 100) },
      inventory: {
        ...prev.inventory,
        contaminatedWater: prev.inventory.contaminatedWater - 1,
      },
      illnessTimer: 25,
    };
  }
  if (prev.inventory.cleanWater <= 0) return prev;
  const bonus = 1 + prev.upgradeTree.water * 0.15;
  return {
    ...prev,
    stats: { ...prev.stats, hydration: clamp(prev.stats.hydration + 35 * bonus, 0, 100) },
    inventory: {
      ...prev.inventory,
      cleanWater: prev.inventory.cleanWater - 1,
    },
  };
}

export function applyEatFood(prev: GameSnapshot, contaminated = false): GameSnapshot {
  const stats = { ...prev.stats, hunger: clamp(prev.stats.hunger + 35, 0, 100) };
  return {
    ...prev,
    stats,
    illnessTimer: contaminated ? 25 : prev.illnessTimer,
  };
}

export function applyDrinkWater(prev: GameSnapshot, contaminated = false): GameSnapshot {
  const stats = { ...prev.stats, hydration: clamp(prev.stats.hydration + 40, 0, 100) };
  return {
    ...prev,
    stats,
    illnessTimer: contaminated ? 25 : prev.illnessTimer,
  };
}

export function applyTraining(prev: GameSnapshot): { snapshot: GameSnapshot; gainedMotivation: boolean } {
  const canMotivate = prev.stats.hunger >= 20 && prev.stats.hydration >= 20;
  return {
    snapshot: {
      ...prev,
      stats: {
        ...prev.stats,
        fatigue: clamp(prev.stats.fatigue - 18, 0, 100),
      },
      motivationTimer: canMotivate ? 45 : prev.motivationTimer,
    },
    gainedMotivation: canMotivate,
  };
}

/**
 * §3.7 Treat Ilmenite in Energy Area -> produces Oxygen Gas
 */
export function refineIlmeniteToOxygen(prev: GameSnapshot): GameSnapshot {
  const avail = prev.storage.minerals.ilmenite;
  if (avail < 1) return prev;
  return {
    ...prev,
    storage: {
      ...prev.storage,
      minerals: {
        ...prev.storage.minerals,
        ilmenite: avail - 1,
      },
      gases: {
        ...prev.storage.gases,
        oxygen_gas: prev.storage.gases.oxygen_gas + 2,
      },
    },
  };
}

/**
 * §3.3 & §3.7 Fuse Hydrogen + Oxygen in Ship Fuel Zone -> consumes 10% energy directly
 */
export function fuseHydrogenOxygenFuel(prev: GameSnapshot): GameSnapshot {
  if (
    prev.storage.gases.hydrogen_gas < 1 ||
    prev.storage.gases.oxygen_gas < 1 ||
    prev.stats.energy < 10
  ) {
    return prev;
  }
  return {
    ...prev,
    stats: {
      ...prev.stats,
      energy: clamp(prev.stats.energy - 10, 0, 100),
      fuel: clamp(prev.stats.fuel + 20, 0, 100),
    },
    storage: {
      ...prev.storage,
      gases: {
        hydrogen_gas: prev.storage.gases.hydrogen_gas - 1,
        oxygen_gas: prev.storage.gases.oxygen_gas - 1,
      },
      fuel: {
        ...prev.storage.fuel,
        hydro_oxy_fuel: prev.storage.fuel.hydro_oxy_fuel + 1,
      },
    },
  };
}

/**
 * §3.10 Deposit backpack minerals (max 5 each) into Ship Storage using Mineral Storage tool
 */
export function depositAllMineralsToStorage(prev: GameSnapshot): { snapshot: GameSnapshot; moved: number } {
  let moved = 0;
  const nextInvMinerals = { ...prev.inventory.minerals };
  const nextStoreMinerals = { ...prev.storage.minerals };
  (Object.keys(nextInvMinerals) as MineralId[]).forEach((m) => {
    const qty = nextInvMinerals[m];
    if (qty > 0) {
      nextStoreMinerals[m] += qty;
      nextInvMinerals[m] = 0;
      moved += qty;
    }
  });
  if (moved === 0) return { snapshot: prev, moved: 0 };
  return {
    moved,
    snapshot: {
      ...prev,
      inventory: { ...prev.inventory, minerals: nextInvMinerals },
      storage: { ...prev.storage, minerals: nextStoreMinerals },
    },
  };
}

/**
 * §3.10 Deposit collected gases from Fuel Storage tool into Ship Fuel Zone
 */
export function depositGasesToFuelZone(prev: GameSnapshot): { snapshot: GameSnapshot; moved: number } {
  const { oxygen_gas, hydrogen_gas } = prev.storage.toolGasBuffer;
  const he3 = prev.storage.toolHeliumBuffer;
  const total = oxygen_gas + hydrogen_gas + he3;
  if (total === 0) return { snapshot: prev, moved: 0 };

  return {
    moved: total,
    snapshot: {
      ...prev,
      storage: {
        ...prev.storage,
        gases: {
          oxygen_gas: prev.storage.gases.oxygen_gas + oxygen_gas,
          hydrogen_gas: prev.storage.gases.hydrogen_gas + hydrogen_gas,
        },
        fuel: {
          ...prev.storage.fuel,
          helium_3: prev.storage.fuel.helium_3 + he3,
        },
        toolGasBuffer: { oxygen_gas: 0, hydrogen_gas: 0 },
        toolHeliumBuffer: 0,
      },
    },
  };
}

export function canAffordMinerals(
  storageMinerals: Record<MineralId, number>,
  cost: Partial<Record<MineralId, number>>
): boolean {
  return (Object.entries(cost) as [MineralId, number][]).every(
    ([m, amt]) => (storageMinerals[m] ?? 0) >= amt
  );
}

export function spendMinerals(
  storageMinerals: Record<MineralId, number>,
  cost: Partial<Record<MineralId, number>>
): Record<MineralId, number> {
  const next = { ...storageMinerals };
  (Object.entries(cost) as [MineralId, number][]).forEach(([m, amt]) => {
    next[m] = Math.max(0, (next[m] ?? 0) - amt);
  });
  return next;
}

export function collectMineralFromNode(
  prev: GameSnapshot,
  nodeId: string
): { snapshot: GameSnapshot; gained: number; fullCap: boolean } {
  const node = prev.mineralNodes.find((n) => n.id === nodeId);
  if (!node || node.cooldownRemaining > 0) {
    return { snapshot: prev, gained: 0, fullCap: false };
  }
  const currentAmt = prev.inventory.minerals[node.mineralId];
  if (currentAmt >= MAX_INVENTORY_MINERAL) {
    return { snapshot: prev, gained: 0, fullCap: true };
  }

  const drillLevel = prev.tools.levels.drill;
  const drillBonus =
    drillLevel === 'basic' ? 1 : drillLevel === 'updated' ? 2 : drillLevel === 'advanced' ? 3 : 4;
  const treeBonus = prev.upgradeTree.minerals;
  const beltBonus = prev.planetPreset.id === 'asteroid_belt' ? 1 : 0;
  const rawGain = drillBonus + treeBonus + beltBonus;
  const nextAmt = Math.min(MAX_INVENTORY_MINERAL, currentAmt + rawGain);
  const gained = nextAmt - currentAmt;

  return {
    gained,
    fullCap: false,
    snapshot: {
      ...prev,
      inventory: {
        ...prev.inventory,
        minerals: {
          ...prev.inventory.minerals,
          [node.mineralId]: nextAmt,
        },
      },
      mineralNodes: prev.mineralNodes.map((n) =>
        n.id === nodeId ? { ...n, cooldownRemaining: MINERAL_RESPAWN_SECONDS } : n
      ),
    },
  };
}

export function loadFuelCanisterToShip(prev: GameSnapshot): GameSnapshot {
  if (prev.storage.fuel.hydro_oxy_fuel < 1 || prev.stats.fuel >= 100) return prev;
  return {
    ...prev,
    stats: {
      ...prev.stats,
      fuel: clamp(prev.stats.fuel + 25, 0, 100),
    },
    storage: {
      ...prev.storage,
      fuel: {
        ...prev.storage.fuel,
        hydro_oxy_fuel: prev.storage.fuel.hydro_oxy_fuel - 1,
      },
    },
  };
}

export function collectGasFromVent(
  prev: GameSnapshot,
  ventId: string
): { snapshot: GameSnapshot; gained: number; resource: GasId | 'helium_3' | null } {
  const vent = prev.gasVents.find((v) => v.id === ventId);
  if (!vent || vent.cooldownRemaining > 0) {
    return { snapshot: prev, gained: 0, resource: null };
  }
  const lvl = prev.tools.levels.fuel_collector;
  const yieldAmt = lvl === 'basic' ? 1 : lvl === 'updated' ? 2 : lvl === 'advanced' ? 3 : 4;

  const storage = { ...prev.storage };
  if (vent.resource === 'helium_3') {
    storage.toolHeliumBuffer += yieldAmt;
  } else {
    storage.toolGasBuffer = {
      ...storage.toolGasBuffer,
      [vent.resource]: storage.toolGasBuffer[vent.resource] + yieldAmt,
    };
  }

  return {
    gained: yieldAmt,
    resource: vent.resource,
    snapshot: {
      ...prev,
      storage,
      gasVents: prev.gasVents.map((v) =>
        v.id === ventId ? { ...v, cooldownRemaining: MINERAL_RESPAWN_SECONDS } : v
      ),
    },
  };
}

export function harvestCropPlot(prev: GameSnapshot, plotId: number): { snapshot: GameSnapshot; veggie: FoodId | null } {
  const plot = prev.agriculture.plots.find((p) => p.id === plotId);
  if (!plot || !plot.veggieId || plot.elapsedSeconds < CROP_GROWTH_SECONDS) {
    return { snapshot: prev, veggie: null };
  }
  const veg = plot.veggieId;
  return {
    veggie: veg,
    snapshot: {
      ...prev,
      inventory: {
        ...prev.inventory,
        food: {
          ...prev.inventory.food,
          [veg]: (prev.inventory.food[veg] ?? 0) + 1,
        },
      },
      agriculture: {
        ...prev.agriculture,
        plots: prev.agriculture.plots.map((p) =>
          p.id === plotId ? { ...p, elapsedSeconds: 0 } : p
        ),
      },
    },
  };
}

export function spawnRandomMission(
  prev: GameSnapshot,
  forcedType?: MissionType
): ActiveMission {
  const pool: MissionType[] = ['oxygen_failure', 'water_failure', 'storage_failure'];
  if (!prev.completedHardEnergyMission) {
    pool.push('energy_failure');
  }
  const picked =
    forcedType && (forcedType !== 'energy_failure' || !prev.completedHardEnergyMission)
      ? forcedType
      : pool[Math.floor(Math.random() * pool.length)];
  const tpl = MISSION_CATALOG[picked];
  return {
    id: `mission_${picked}_${Date.now()}`,
    type: picked,
    isHard: tpl.isHard,
    targetInteractable: tpl.targetInteractable,
    timeRemaining: tpl.durationSec,
    maxTime: tpl.durationSec,
    waterTickAcc: 0,
    storageApplied: false,
  };
}

export function resolveActiveMission(prev: GameSnapshot): {
  snapshot: GameSnapshot;
  unlockedPet: PetId | null;
  upgradedBranch: UpgradeBranchId | null;
  wasHard: boolean;
} {
  const mission = prev.activeMission;
  if (!mission) {
    return { snapshot: prev, unlockedPet: null, upgradedBranch: null, wasHard: false };
  }

  const nextMinerals = { ...prev.storage.minerals };
  let nextWater = prev.inventory.cleanWater;
  const nextFood = { ...prev.inventory.food };
  const nextStats = { ...prev.stats };

  if (mission.type === 'oxygen_failure') {
    nextMinerals.iron += 3;
    nextMinerals.ilmenite += 3;
    nextWater += 2;
    nextStats.oxygen = 100;
  } else if (mission.type === 'energy_failure') {
    nextMinerals.platinum += 4;
    nextMinerals.titanium += 5;
    nextStats.energy = clamp(nextStats.energy + 45, 0, 100);
  } else if (mission.type === 'water_failure') {
    nextWater += 4;
    nextMinerals.silicon += 3;
    nextMinerals.carbon += 2;
    nextStats.hydration = clamp(nextStats.hydration + 35, 0, 100);
  } else {
    nextMinerals.iron += 3;
    nextMinerals.nickel += 3;
    nextFood.chicken += 2;
  }

  // Player Upgrade Reward: +1 level on lowest available Upgrade Tree branch
  const nextTree = { ...prev.upgradeTree };
  const branches: UpgradeBranchId[] = ['minerals', 'oxygen', 'energy', 'water', 'food'];
  let upgradedBranch: UpgradeBranchId | null = null;
  const candidates = branches.filter((b) => nextTree[b] < 3);
  if (candidates.length > 0) {
    candidates.sort((a, b) => nextTree[a] - nextTree[b]);
    upgradedBranch = candidates[0];
    nextTree[upgradedBranch] += 1;
  }

  const oxygenCompleted = nextTree.oxygen >= 3;
  const lossPer10s = computeSuitOxygenLossPer10s(oxygenCompleted, prev.hooks.oxygenTankTier);
  nextStats.dropMultiplier = 1 + nextTree.minerals * 0.5;

  // Special Pet reward for completing Hard Energy mission (once per game)
  let unlockedPet: PetId | null = null;
  let unlockedPets = [...prev.unlockedPets];
  let activePet = prev.activePet;
  if (mission.isHard) {
    const petPool: PetId[] = ['astro_dog', 'cosmo_cat', 'nebula_owl'];
    const newPet = petPool.find((p) => !unlockedPets.includes(p)) ?? 'astro_dog';
    if (!unlockedPets.includes(newPet)) {
      unlockedPets = [...unlockedPets, newPet];
    }
    unlockedPet = newPet;
    activePet = newPet;
  }

  return {
    unlockedPet,
    upgradedBranch,
    wasHard: mission.isHard,
    snapshot: {
      ...prev,
      activeMission: null,
      completedHardEnergyMission: prev.completedHardEnergyMission || mission.isHard,
      missionsCompletedCount: prev.missionsCompletedCount + 1,
      unlockedPets,
      activePet,
      upgradeTree: nextTree,
      oxygenLossPer10s: lossPer10s,
      stats: nextStats,
      inventory: {
        ...prev.inventory,
        cleanWater: nextWater,
        food: nextFood,
      },
      storage: {
        ...prev.storage,
        minerals: nextMinerals,
      },
      hooks: {
        ...prev.hooks,
        oxygenTreeCompleted: oxygenCompleted,
        missionLostSadness: false,
        sadnessTimer: 0,
      },
    },
  };
}
