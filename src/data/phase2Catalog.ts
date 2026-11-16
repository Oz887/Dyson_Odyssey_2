import {
  FoodId,
  FuelId,
  GasId,
  MeatId,
  MineralId,
  OxygenTankLevel,
  OxygenTankTier,
  ShipUpgradeTier,
  ToolLevel,
  ToolType,
  UpgradeBranchId,
  VeggieId,
} from '../types/game';

export const MAX_INVENTORY_MINERAL = 5;
export const CROP_GROWTH_SECONDS = 120; // 2 minutes per crop (§3.9)
export const MINERAL_RESPAWN_SECONDS = 10; // 10 seconds regeneration (§3.6)

export const MINERAL_META: Record<
  MineralId,
  { en: string; es: string; rarityEn: string; rarityEs: string; color: string }
> = {
  iron: { en: 'Iron', es: 'Hierro', rarityEn: 'Very common', rarityEs: 'Muy común', color: '#94a3b8' },
  titanium: { en: 'Titanium', es: 'Titanio', rarityEn: 'Common', rarityEs: 'Común', color: '#cbd5e1' },
  ilmenite: { en: 'Ilmenite', es: 'Ilmenita', rarityEn: 'Regional', rarityEs: 'Regional', color: '#6366f1' },
  silicon: { en: 'Silicon', es: 'Silicio', rarityEn: 'Very common', rarityEs: 'Muy común', color: '#38bdf8' },
  nickel: { en: 'Nickel', es: 'Níquel', rarityEn: 'Uncommon', rarityEs: 'Poco común', color: '#eab308' },
  platinum: { en: 'Platinum', es: 'Platino', rarityEn: 'Rare', rarityEs: 'Raro', color: '#e2e8f0' },
  carbon: { en: 'Carbon', es: 'Carbono', rarityEn: 'Planet-dependent', rarityEs: 'Según planeta', color: '#475569' },
};

export const GAS_META: Record<GasId, { en: string; es: string; color: string }> = {
  oxygen_gas: { en: 'Oxygen Gas (O2)', es: 'Gas Oxígeno (O2)', color: '#38bdf8' },
  hydrogen_gas: { en: 'Hydrogen Gas (H2)', es: 'Gas Hidrógeno (H2)', color: '#c084fc' },
};

export const FUEL_META: Record<FuelId, { en: string; es: string; color: string }> = {
  hydro_oxy_fuel: { en: 'Hydrogen + Oxygen Fuel', es: 'Combustible H2 + O2', color: '#f97316' },
  helium_3: { en: 'Helium-3', es: 'Helio-3', color: '#22d3ee' },
};

export const MEAT_IDS: MeatId[] = [
  'chicken',
  'beef_fajitas',
  'chili_con_carne',
  'turkey',
  'tuna',
  'bouillon_cubes',
  'soups',
];

export const VEGGIE_IDS: VeggieId[] = [
  'tomato',
  'lettuce',
  'cucumber',
  'radish',
  'spinach',
  'leafy_greens',
  'cabbage',
  'arugula',
  'beet',
  'basil',
  'parsley',
  'chives',
];

export const FOOD_META: Record<
  FoodId,
  { en: string; es: string; category: 'sealed' | 'dehydrated' | 'veggie'; hungerGain: number }
> = {
  chicken: { en: 'Chicken', es: 'Pollo', category: 'sealed', hungerGain: 32 },
  beef_fajitas: { en: 'Beef Fajitas', es: 'Fajitas de Res', category: 'sealed', hungerGain: 36 },
  chili_con_carne: { en: 'Chili con Carne', es: 'Carne con Chile', category: 'sealed', hungerGain: 36 },
  turkey: { en: 'Turkey', es: 'Pavo', category: 'sealed', hungerGain: 34 },
  tuna: { en: 'Tuna', es: 'Atún', category: 'sealed', hungerGain: 28 },
  bouillon_cubes: { en: 'Chicken Bouillon Cubes', es: 'Cubitos de Pollo', category: 'dehydrated', hungerGain: 22 },
  soups: { en: 'Dehydrated Soup', es: 'Sopas', category: 'dehydrated', hungerGain: 30 },
  tomato: { en: 'Tomato', es: 'Tomate', category: 'veggie', hungerGain: 20 },
  lettuce: { en: 'Lettuce', es: 'Lechuga', category: 'veggie', hungerGain: 16 },
  cucumber: { en: 'Cucumber', es: 'Pepino', category: 'veggie', hungerGain: 18 },
  radish: { en: 'Radish', es: 'Rábano', category: 'veggie', hungerGain: 18 },
  spinach: { en: 'Spinach', es: 'Espinacas', category: 'veggie', hungerGain: 22 },
  leafy_greens: { en: 'Leafy Greens', es: 'Hojas Verdes', category: 'veggie', hungerGain: 18 },
  cabbage: { en: 'Cabbage', es: 'Repollo', category: 'veggie', hungerGain: 20 },
  arugula: { en: 'Arugula', es: 'Rúcula', category: 'veggie', hungerGain: 16 },
  beet: { en: 'Beet', es: 'Remolacha', category: 'veggie', hungerGain: 24 },
  basil: { en: 'Basil', es: 'Albahaca', category: 'veggie', hungerGain: 14 },
  parsley: { en: 'Parsley', es: 'Perejil', category: 'veggie', hungerGain: 14 },
  chives: { en: 'Chives', es: 'Cebollín', category: 'veggie', hungerGain: 14 },
};

export const TOOL_ORDER: ToolType[] = [
  'drill',
  'mineral_storage',
  'fuel_collector',
  'fuel_storage',
];

export const TOOL_LEVEL_ORDER: ToolLevel[] = [
  'basic',
  'updated',
  'advanced',
  'industrialized',
];

export const LEVEL_LABELS: Record<ToolLevel, { en: string; es: string }> = {
  basic: { en: 'Basic', es: 'Básico' },
  updated: { en: 'Updated', es: 'Mejorado' },
  advanced: { en: 'Advanced', es: 'Avanzado' },
  industrialized: { en: 'Industrialized', es: 'Industrializado' },
};

export const TOOL_META: Record<
  ToolType,
  {
    en: string;
    es: string;
    descEn: string;
    descEs: string;
    materials: MineralId[]; // §3.10 exact material lists
    shortKey: string;
  }
> = {
  drill: {
    en: 'Drill',
    es: 'Taladro',
    descEn: 'Collects minerals from surface veins.',
    descEs: 'Extrae minerales de vetas en la superficie.',
    materials: ['iron', 'titanium', 'silicon', 'nickel'],
    shortKey: '1',
  },
  mineral_storage: {
    en: 'Mineral Storage',
    es: 'Depósito Minerales',
    descEn: 'Deposits backpack minerals into Ship Storage.',
    descEs: 'Transfiere minerales al Almacén de la nave.',
    materials: ['iron', 'titanium', 'carbon'],
    shortKey: '2',
  },
  fuel_collector: {
    en: 'Fuel Collector',
    es: 'Colector de Gases',
    descEn: 'Collects Oxygen, Hydrogen & Helium-3 gases.',
    descEs: 'Recolecta gases de Oxígeno, Hidrógeno y Helio-3.',
    materials: ['iron', 'nickel', 'silicon', 'platinum'],
    shortKey: '3',
  },
  fuel_storage: {
    en: 'Fuel Storage',
    es: 'Depósito de Gases',
    descEn: 'Deposits collected gases into the Ship Fuel Zone.',
    descEs: 'Deposita gases recolectados en la Zona de Combustible.',
    materials: ['iron', 'titanium', 'carbon', 'nickel'],
    shortKey: '4',
  },
};

export const OXYGEN_TANK_MATERIALS: MineralId[] = [
  'titanium',
  'nickel',
  'carbon',
  'silicon',
  'iron',
];

export function toolLevelToTankTier(lvl: OxygenTankLevel): OxygenTankTier {
  switch (lvl) {
    case 'basic':
      return 'basic';
    case 'updated':
      return 'updated';
    case 'advanced':
      return 'advanced';
    case 'industrialized':
      return 'industrial';
  }
}

export function getNextToolLevel(curr: ToolLevel): ToolLevel | null {
  const idx = TOOL_LEVEL_ORDER.indexOf(curr);
  if (idx < 0 || idx >= TOOL_LEVEL_ORDER.length - 1) return null;
  return TOOL_LEVEL_ORDER[idx + 1];
}

export function getToolUpgradeCost(
  materials: MineralId[],
  targetLevel: ToolLevel
): Partial<Record<MineralId, number>> {
  const mult =
    targetLevel === 'updated' ? 2 : targetLevel === 'advanced' ? 4 : 6;
  const cost: Partial<Record<MineralId, number>> = {};
  materials.forEach((m, idx) => {
    cost[m] = mult + (idx === 0 ? 1 : 0);
  });
  return cost;
}

export function getToolYieldAndCapacity(level: ToolLevel): {
  yieldAmount: number;
  gasBufferCap: number;
  depositBatch: number;
} {
  switch (level) {
    case 'basic':
      return { yieldAmount: 1, gasBufferCap: 6, depositBatch: 5 };
    case 'updated':
      return { yieldAmount: 2, gasBufferCap: 12, depositBatch: 10 };
    case 'advanced':
      return { yieldAmount: 3, gasBufferCap: 20, depositBatch: 15 };
    case 'industrialized':
      return { yieldAmount: 4, gasBufferCap: 32, depositBatch: 25 };
  }
}

export const SHIP_TIER_ORDER: ShipUpgradeTier[] = [
  'basic',
  'improved',
  'advanced',
  'elite',
  'legendary',
];

export const SHIP_TIERS: Record<
  ShipUpgradeTier,
  {
    en: string;
    es: string;
    planetEn: string;
    planetEs: string;
    roomsEn: string[];
    roomsEs: string[];
    cost: Partial<Record<MineralId, number>>;
    accent: string;
  }
> = {
  basic: {
    en: 'Basic Ship',
    es: 'Nave Básica',
    planetEn: 'Earth',
    planetEs: 'Tierra',
    roomsEn: ['Control Room', 'Storage', 'Bedroom', 'Food Area', 'Energy Area', 'Tools Room'],
    roomsEs: ['Sala de Control', 'Almacén', 'Dormitorio', 'Área de Comida', 'Área de Energía', 'Sala de Herramientas'],
    cost: {},
    accent: '#38bdf8',
  },
  improved: {
    en: 'Improved Ship',
    es: 'Nave Mejorada',
    planetEn: 'Moon',
    planetEs: 'Luna',
    roomsEn: ['Hydroponic Garden', 'Medical Infirmary'],
    roomsEs: ['Jardín Hidropónico', 'Enfermería'],
    cost: { iron: 4, titanium: 3, silicon: 3 },
    accent: '#34d399',
  },
  advanced: {
    en: 'Advanced Ship',
    es: 'Nave Avanzada',
    planetEn: 'Asteroid Belt',
    planetEs: 'Cinturón de Asteroides',
    roomsEn: ['Astronaut Gym', 'Energy Power Upgrade', 'Defense Plating'],
    roomsEs: ['Gimnasio Espacial', 'Mejora de Energía', 'Blindaje Defensivo'],
    cost: { iron: 6, titanium: 5, nickel: 4, carbon: 3 },
    accent: '#fbbf24',
  },
  elite: {
    en: 'Elite Ship',
    es: 'Nave Élite',
    planetEn: 'Uranus',
    planetEs: 'Urano',
    roomsEn: ['Advanced AI Core', 'Recycling System', 'Science Laboratory', 'Temperature Regulator'],
    roomsEs: ['IA Avanzada', 'Sistema de Reciclaje', 'Laboratorio', 'Regulador de Temperatura'],
    cost: { titanium: 7, silicon: 6, nickel: 5, platinum: 3 },
    accent: '#c084fc',
  },
  legendary: {
    en: 'Legendary Ship',
    es: 'Nave Legendaria',
    planetEn: 'Mercury',
    planetEs: 'Mercurio',
    roomsEn: ['Improved Shield', 'Quantum Technology', 'Electromagnetic Fields'],
    roomsEs: ['Escudo Mejorado', 'Tecnología Cuántica', 'Campos Electromagnéticos'],
    cost: { titanium: 9, platinum: 5, carbon: 6, nickel: 6 },
    accent: '#fb7185',
  },
};

export const UPGRADE_TREE_META: Record<
  UpgradeBranchId,
  {
    en: string;
    es: string;
    descEn: string;
    descEs: string;
    maxLevel: number;
    costs: Partial<Record<MineralId, number>>[];
  }
> = {
  minerals: {
    en: 'Mineral Collection',
    es: 'Recolección Mineral',
    descEn: 'Increases mineral yield per extraction.',
    descEs: 'Aumenta la cantidad de minerales obtenidos por extracción.',
    maxLevel: 3,
    costs: [{ iron: 2, silicon: 2 }, { iron: 4, titanium: 2 }, { titanium: 4, nickel: 3 }],
  },
  oxygen: {
    en: 'Oxygen Capacity & Efficiency',
    es: 'Capacidad y Eficiencia O2',
    descEn: 'Level 3 completes the Oxygen Tree: cuts suit base O2 loss from 10% to 5% / 10s.',
    descEs: 'El Nivel 3 completa la rama: reduce pérdida base del traje de 10% a 5% / 10s.',
    maxLevel: 3,
    costs: [{ iron: 2, ilmenite: 1 }, { titanium: 3, ilmenite: 2 }, { silicon: 4, nickel: 2 }],
  },
  energy: {
    en: 'Energy Capacity & Efficiency',
    es: 'Capacidad y Eficiencia Energía',
    descEn: 'Improves solar recharge speed and reduces passive drain.',
    descEs: 'Mejora la recarga solar y reduce el consumo pasivo.',
    maxLevel: 3,
    costs: [{ silicon: 3, iron: 2 }, { silicon: 4, carbon: 2 }, { platinum: 2, silicon: 5 }],
  },
  water: {
    en: 'Water Capacity & Efficiency',
    es: 'Capacidad y Eficiencia Agua',
    descEn: 'Slows hydration drain and boosts water flask recovery.',
    descEs: 'Reduce la pérdida de agua y aumenta la recuperación por sorbo.',
    maxLevel: 3,
    costs: [{ iron: 2, carbon: 2 }, { titanium: 3, carbon: 3 }, { nickel: 3, silicon: 4 }],
  },
  food: {
    en: 'Food Improvement & Efficiency',
    es: 'Mejora Alimentaria',
    descEn: 'Boosts nutrition gained from meats and harvested crops.',
    descEs: 'Aumenta la nutrición recuperada al consumir carnes y cultivos.',
    maxLevel: 3,
    costs: [{ carbon: 2, iron: 2 }, { silicon: 3, carbon: 3 }, { titanium: 4, carbon: 4 }],
  },
};
