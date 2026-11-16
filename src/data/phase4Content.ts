import {
  AssistantTopicId,
  MissionType,
  PetId,
} from '../types/game';

export interface AssistantTopicInfo {
  id: AssistantTopicId;
  titleEn: string;
  titleEs: string;
  summaryEn: string;
  summaryEs: string;
  stepsEn: string[];
  stepsEs: string[];
  diagramType: AssistantTopicId;
  accent: string;
}

export const ASSISTANT_TOPICS: AssistantTopicInfo[] = [
  {
    id: 'agriculture',
    titleEn: 'Agriculture',
    titleEs: 'Agricultura',
    summaryEn:
      'Grow 12 nutritious vegetables in the ship hydroponic bay! Turn power ON to grow (2 min/crop); turn OFF anytime to save energy without losing progress.',
    summaryEs:
      '¡Cultiva 12 vegetales en el jardín hidropónico! Enciéndelo para crecer (2 min/cultivo); apágalo cuando quieras para ahorrar energía sin perder el progreso.',
    stepsEn: [
      'Pick a vegetable seed in Agriculture and plant it in any empty plot.',
      'Watch 3 pixel stages: Premature → Semi-developed → Ready to harvest.',
      'Toggle Agriculture OFF if Ship Energy drops below 20%!',
    ],
    stepsEs: [
      'Elige una semilla en Agricultura y plántala en una parcela vacía.',
      'Observa 3 etapas: Prematuro → Semi-desarrollado → Listo para cosechar.',
      '¡Apaga Agricultura si la Energía de la nave baja de 20%!',
    ],
    diagramType: 'agriculture',
    accent: '#4ade80',
  },
  {
    id: 'oxygen',
    titleEn: 'Oxygen Mechanic',
    titleEs: 'Mecánica de Oxígeno',
    summaryEn:
      'Inside the powered ship your Oxygen recharges automatically. Outside, suit O2 drops every 10s depending on your Oxygen Tank and Oxygen Upgrade Tree.',
    summaryEs:
      'Dentro de la nave con energía el Oxígeno se recarga solo. Afuera baja cada 10s según tu Tanque de Oxígeno y el Árbol de Mejoras de Oxígeno.',
    stepsEn: [
      'Base suit O2 drain: -10% / 10s (drops to -5% when Oxygen Tree is maxed).',
      'Oxygen Tanks (Basic to Industrial) subtract 1% to 4% more (never stacked).',
      'Minimum possible consumption cap is 1% every 10 seconds.',
    ],
    stepsEs: [
      'Consumo base del traje: -10% / 10s (-5% al completar el Árbol de Oxígeno).',
      'Cada Tanque de Oxígeno (Básico a Industrial) reduce de 1% a 4% extra.',
      'El mínimo absoluto de consumo es 1% cada 10 segundos.',
    ],
    diagramType: 'oxygen',
    accent: '#38bdf8',
  },
  {
    id: 'status_effects',
    titleEn: 'Status Effects',
    titleEs: 'Estados Alterados',
    summaryEn:
      'Monitor your body carefully! Extreme cold/heat, bad water, dehydration, hunger, missing helmet, or failed missions trigger special status effects.',
    summaryEs:
      '¡Cuida tu estado físico! Temperaturas extremas, agua sucia, hambre, deshidratación, falta de casco o misiones fallidas activan efectos.',
    stepsEn: [
      'Pressure (no suit outside) = visual dizziness. Freezing (<-150°C) & Burn (>95°C) hurt health.',
      'Illness adds Weakness; Sadness (lost mission) slows movement.',
      'Motivation (Exercise while fed & hydrated >20%) slows hunger & water loss!',
    ],
    stepsEs: [
      'Presión (sin traje afuera) = mareo visual. Congelamiento y Quemadura quitan salud.',
      'Enfermedad causa Debilidad; Tristeza (misión perdida) reduce velocidad.',
      '¡Motivación (Entrenar con comida/agua >20%) frena la pérdida de hambre y agua!',
    ],
    diagramType: 'status_effects',
    accent: '#f43f5e',
  },
  {
    id: 'suit',
    titleEn: 'Space Suit (Equip / Unequip)',
    titleEs: 'Traje Espacial (Poner / Quitar)',
    summaryEn:
      'Press E or tap Suit to toggle your Space Suit. Inside a powered cabin you can safely remove it, but outside in space it keeps you alive!',
    summaryEs:
      'Presiona E o toca Traje para equiparlo o quitarlo. En una cabina con energía es seguro quitarlo, ¡pero afuera te protege!',
    stepsEn: [
      'Without a suit, humans only survive temperatures between -10°C and +50°C.',
      'Outside those limits unsuited: -10% Health every 5s + rapid Oxygen loss.',
      'Leaving the ship without the suit immediately triggers Pressure dizziness!',
    ],
    stepsEs: [
      'Sin traje solo soportas temperaturas entre -10°C y +50°C.',
      'Fuera de ese rango sin traje: -10% Salud cada 5s y pérdida rápida de O2.',
      '¡Salir de la nave sin traje activa inmediatamente Presión con mareo!',
    ],
    diagramType: 'suit',
    accent: '#0ea5e9',
  },
  {
    id: 'tools',
    titleEn: 'Tools (Keys 1–4)',
    titleEs: 'Herramientas (Teclas 1–4)',
    summaryEn:
      'Switch between 4 specialized tools using keys 1–4 or the HUD hotbar, and upgrade them from Basic to Industrialized at the Tools & Suit Locker.',
    summaryEs:
      'Alterna entre 4 herramientas con teclas 1–4 o la barra superior y mejóralas de Básico a Industrializado en el Casillero.',
    stepsEn: [
      '[1] Drill: Extract planetary mineral veins.',
      '[2] Mineral Storage: Deposit backpack minerals (max 5 each) in Ship Storage.',
      '[3] Fuel Collector & [4] Fuel Storage: Harvest and bank O2, H2 & Helium-3.',
    ],
    stepsEs: [
      '[1] Taladro: Extrae vetas de minerales planetarios.',
      '[2] Depósito Minerales: Guarda los minerales de tu mochila (máx 5 c/u).',
      '[3] Colector de Gases y [4] Almacén Fuel: Captura y deposita O2, H2 y Helio-3.',
    ],
    diagramType: 'tools',
    accent: '#fb923c',
  },
  {
    id: 'gases',
    titleEn: 'Processing Gases & Fuel',
    titleEs: 'Procesar Gases y Combustible',
    summaryEn:
      'Fuse Hydrogen + Oxygen gases into H2+O2 Fuel canisters in Storage, or refine Ilmenite mineral into pure Oxygen gas!',
    summaryEs:
      '¡Fusiona Hidrógeno + Oxígeno en tanques H2+O2 en el Almacén, o trata Ilmenita para obtener gas Oxígeno puro!',
    stepsEn: [
      'Collect O2 & H2 gases from surface vents using Tool [3], then deposit with [4].',
      'Refine 1 Ilmenite → +2 Oxygen Gas anytime in Storage Fuel Zone.',
      'Fuse H2 + O2 (-10% Energy) → +1 Fuel Canister, then Load Tank (+25% Ship Fuel)!',
    ],
    stepsEs: [
      'Recolecta gases O2 y H2 en la superficie con [3] y deposita con [4].',
      'Trata 1 Ilmenita → +2 Gas O2 en la Zona de Combustible del Almacén.',
      'Fusiona H2 + O2 (-10% Energía) → +1 Tanque y ¡Carga la nave (+25%)!',
    ],
    diagramType: 'gases',
    accent: '#c084fc',
  },
  {
    id: 'energy',
    titleEn: 'Energy Mechanics',
    titleEs: 'Mecánica de Energía',
    summaryEn:
      'Solar panels recharge the ship according to distance from the Sun: Low (inner drain or +2%/5s), Moderate (+4%/5s), High (+10%/5s).',
    summaryEs:
      'Los paneles solares recargan la nave según la luz solar: Baja (+2%/5s), Moderada (+4%/5s) o Alta (+10%/5s).',
    stepsEn: [
      'Below 20% Energy: suspend Agriculture immediately to protect Oxygen!',
      'At 0% Energy: Ship shuts down for 30s and Cabin Oxygen goes offline!',
      'Equip your Space Suit if Energy hits 0% until backup recharge restores 30%.',
    ],
    stepsEs: [
      'Bajo 20% de Energía: ¡suspende la Agricultura para proteger el Oxígeno!',
      'Al 0% de Energía: la nave se pausa 30s y se queda sin oxígeno en cabina.',
      'Ponte el Traje si la Energía llega a 0% hasta recargar al 30%.',
    ],
    diagramType: 'energy',
    accent: '#facc15',
  },
  {
    id: 'upgrade_tree',
    titleEn: 'Upgrade Tree',
    titleEs: 'Árbol de Mejoras',
    summaryEn:
      'Invest stored minerals into 5 lifelong efficiency branches: Minerals, Oxygen, Energy, Water, and Food!',
    summaryEs:
      'Invierte minerales guardados en 5 ramas permanentes: Minerales, Oxígeno, Energía, Agua y Comida.',
    stepsEn: [
      'Oxygen Tree max level cuts base suit O2 loss in half (-10% → -5% / 10s).',
      'Energy, Water & Food Trees reduce consumption and boost recovery.',
      'Mineral Tree boosts extraction yield from every vein.',
    ],
    stepsEs: [
      'El Árbol de Oxígeno al máximo reduce a la mitad la pérdida base del traje.',
      'Energía, Agua y Comida reducen consumo y aumentan la recuperación.',
      'El Árbol de Minerales aumenta la cantidad extraída de cada veta.',
    ],
    diagramType: 'upgrade_tree',
    accent: '#10b981',
  },
  {
    id: 'inventory',
    titleEn: 'Inventory & Storage',
    titleEs: 'Inventario y Almacén',
    summaryEn:
      'Your backpack holds Minerals (up to 5 of each), Rations (meats + harvested veggies), and Clean/Contaminated Water.',
    summaryEs:
      'Tu mochila organiza Minerales (máx. 5 c/u), Raciones de Comida (carnes + vegetales) y Agua Limpia o Contaminada.',
    stepsEn: [
      'Never hold more than 5 of a mineral in the backpack — bank them in Ship Storage!',
      'Avoid Contaminated Water unless desperate: it cures thirst but triggers Illness.',
      'Ship Storage safely stores unlimited minerals, gases, and H2+O2 Fuel.',
    ],
    stepsEs: [
      'No puedes llevar más de 5 unidades por mineral: ¡deposítalos en el Almacén!',
      'Evita el Agua Contaminada: hidrata pero provoca Enfermedad y Debilidad.',
      'El Almacén de la nave guarda minerales, gases y combustible sin límite.',
    ],
    diagramType: 'inventory',
    accent: '#f59e0b',
  },
  {
    id: 'minerals',
    titleEn: 'Collecting Minerals',
    titleEs: 'Recolección de Minerales',
    summaryEn:
      'Explore planetary surfaces to mine Iron, Titanium, Ilmenite, Silicon, Nickel, Platinum, and Carbon veins with your Drill.',
    summaryEs:
      'Explora la superficie planetaria y mina Hierro, Titanio, Ilmenita, Silicio, Níquel, Platino y Carbono con tu Taladro.',
    stepsEn: [
      'Equip Drill [1], walk next to a sparkling mineral outcrop, and press Space or Pulse.',
      'Depleted veins automatically regenerate after 10 seconds.',
      'The Asteroid Belt grants +1 extra bonus yield per mineral vein!',
    ],
    stepsEs: [
      'Equipa el Taladro [1], acércate a una veta brillante y presiona Espacio o Pulso.',
      'Las vetas agotadas se regeneran automáticamente cada 10 segundos.',
      '¡El Cinturón de Asteroides otorga +1 mineral extra por cada veta!',
    ],
    diagramType: 'minerals',
    accent: '#a78bfa',
  },
  {
    id: 'jupiter_ship',
    titleEn: 'Ship in Jupiter & Saturn',
    titleEs: 'Nave en Júpiter y Saturno',
    summaryEn:
      'Gas giants have no solid surface to land on! Pilot Odyssey-1 through debris & ring rocks while fighting intense gravitational pull.',
    summaryEs:
      '¡Los gigantes gaseosos no tienen suelo firme! Pilota Odyssey-1 esquivando meteoritos mientras luchas contra su gravedad.',
    stepsEn: [
      'Laptop: the ship steers toward your mouse cursor. Phone/Tablet: steer by touching!',
      'Pull away toward the right side of space — don’t get sucked into the core!',
      'Fill the Escape Gravity bar to 100% to stabilize orbit and unlock the next jump.',
    ],
    stepsEs: [
      'Laptop: la nave sigue el cursor del mouse. Celular/Tablet: ¡toca hacia donde ir!',
      'Aléjate hacia la derecha: ¡no dejes que el núcleo gravitacional te atrape!',
      'Llena la barra Escapar Gravedad al 100% para habilitar el siguiente destino.',
    ],
    diagramType: 'jupiter_ship',
    accent: '#f97316',
  },
  {
    id: 'sun_dyson',
    titleEn: 'Final Objective: Dyson Sphere',
    titleEs: 'Objetivo Final: Esfera de Dyson',
    summaryEn:
      'At the Sun, pilot carefully around its giant burning sphere and place 50 Dyson Sphere solar panels to complete your Solar Odyssey!',
    summaryEs:
      'Al llegar al Sol, pilota alrededor de su esfera gigante y coloca 50 paneles solares de la Esfera de Dyson para completar tu Odisea Solar.',
    stepsEn: [
      'Fly through glowing golden Orbital Anchor Nodes to deploy Dyson panels (0/50).',
      'Solar flares erupt every 4 seconds — avoid every flare and stay clear of the Sun’s surface!',
      'Getting hit resets panel progress and replays Mercury → Sun. Place 50 to win!',
    ],
    stepsEs: [
      'Pasa por los Anillos Orbitales dorados para instalar paneles Dyson (0/50).',
      'Cada 4 segundos estalla una llamarada solar: ¡esquívalas y no te acerques demasiado!',
      'Si chocas, vuelves desde Mercurio → Sol con 0/50. ¡Coloca los 50 para ganar!',
    ],
    diagramType: 'sun_dyson',
    accent: '#fbbf24',
  },
];

export interface MissionTemplate {
  type: MissionType;
  isHard: boolean;
  targetInteractable: 'energy_reactor' | 'storage_vault';
  durationSec: number;
  titleEn: string;
  titleEs: string;
  alertEn: string;
  alertEs: string;
  fixHintEn: string;
  fixHintEs: string;
  rewardEn: string;
  rewardEs: string;
}

export const MISSION_CATALOG: Record<MissionType, MissionTemplate> = {
  oxygen_failure: {
    type: 'oxygen_failure',
    isHard: false,
    targetInteractable: 'energy_reactor',
    durationSec: 65,
    titleEn: 'Oxygen Production Failure!',
    titleEs: '¡Falla en Producción de Oxígeno!',
    alertEn: 'O2 scrubbers are choking inside the Energy Area! Repair the reactor before cabin O2 destabilizes.',
    alertEs: '¡Los depuradores de O2 están fallando en el Área de Energía! Repara el reactor rápido.',
    fixHintEn: 'Go to the Energy & Oxygen Area inside the ship and press Space / Use!',
    fixHintEs: '¡Ve al Área de Energía y Oxígeno dentro de la nave y presiona Espacio / Usar!',
    rewardEn: '+3 Iron, +3 Ilmenite, +2 Clean Water & System Upgrade!',
    rewardEs: '+3 Hierro, +3 Ilmenita, +2 Agua Limpia y ¡Mejora de Sistema!',
  },
  energy_failure: {
    type: 'energy_failure',
    isHard: true,
    targetInteractable: 'energy_reactor',
    durationSec: 60,
    titleEn: 'CRITICAL: Reactor Energy Failure!',
    titleEs: '¡CRÍTICO: Falla Total de Energía!',
    alertEn: 'Hard Mission! Main solar bus is overloading and draining Energy fast. Fix it ONCE and unlock a Space Pet!',
    alertEs: '¡Misión Difícil! El reactor solar está en sobrecarga. ¡Repáralo una vez y gana una Mascota Espacial!',
    fixHintEn: 'Approach the sparking Energy & Oxygen Area inside the ship and press Space / Use!',
    fixHintEs: '¡Acércate al Área de Energía con chispas dentro de la nave y presiona Espacio / Usar!',
    rewardEn: '+4 Platinum, +5 Titanium, Upgrade Boost & Special Space Pet!',
    rewardEs: '+4 Platino, +5 Titanio, Mejora y ¡Mascota Espacial Especial!',
  },
  water_failure: {
    type: 'water_failure',
    isHard: false,
    targetInteractable: 'storage_vault',
    durationSec: 65,
    titleEn: 'Water Pipeline Rupture!',
    titleEs: '¡Fuga en Red de Agua!',
    alertEn: 'A hull leak triggered severe dehydration (-10% Hydration every 5s)! Seal the valve at Storage!',
    alertEs: '¡Una fuga inició deshidratación (-10% Agua cada 5s)! Sella la válvula en el Almacén.',
    fixHintEn: 'Go to the Storage Vault inside the ship and press Space / Use!',
    fixHintEs: '¡Ve a la Bóveda del Almacén dentro de la nave y presiona Espacio / Usar!',
    rewardEn: '+4 Clean Water, +3 Silicon, +2 Carbon & Upgrade Boost!',
    rewardEs: '+4 Agua Limpia, +3 Silicio, +2 Carbono y ¡Mejora!',
  },
  storage_failure: {
    type: 'storage_failure',
    isHard: false,
    targetInteractable: 'storage_vault',
    durationSec: 65,
    titleEn: 'Storage Containment Breach!',
    titleEs: '¡Fallo de Contención en Almacén!',
    alertEn: 'Storage pressure dropped — 3% of stored minerals slipped loose! Re-lock the Storage Vault now!',
    alertEs: '¡Cayó la presión del almacén y se perdió un 3% de minerales! Sella la bóveda ahora.',
    fixHintEn: 'Go to the Storage Vault inside the ship and press Space / Use!',
    fixHintEs: '¡Ve a la Bóveda del Almacén dentro de la nave y presiona Espacio / Usar!',
    rewardEn: '+3 Iron, +3 Nickel, +2 Rations & Upgrade Boost!',
    rewardEs: '+3 Hierro, +3 Níquel, +2 Raciones y ¡Mejora!',
  },
};

export const PET_META: Record<
  PetId,
  {
    nameEn: string;
    nameEs: string;
    color: string;
    accent: string;
  }
> = {
  astro_dog: {
    nameEn: 'Sparky (Astro-Pup)',
    nameEs: 'Chispas (Astro-Perrito)',
    color: '#fbbf24',
    accent: '#38bdf8',
  },
  cosmo_cat: {
    nameEn: 'Nebula (Cosmo-Cat)',
    nameEs: 'Nébula (Cosmo-Gatito)',
    color: '#e879f9',
    accent: '#a5f3fc',
  },
  nebula_owl: {
    nameEn: 'Orión (Pixel-Owl)',
    nameEs: 'Orión (Búho Estelar)',
    color: '#34d399',
    accent: '#fde047',
  },
};

export function getFunnyLockedMessage(contextEs: string, contextEn: string, es: boolean): string {
  const esQuotes = [
    `¡Alto ahí, cadete espacial! "${contextEs}" está más cerrado que una esclusa en el vacío. Cumple los requisitos primero.`,
    `¡Beep-boop! Intentaste abrir "${contextEs}", pero mis circuitos dicen: "¡Todavía no, piloto!"`,
    `Ni con cinta espacial podemos forzar "${contextEs}" aún. ¡Completa el paso previo primero!`,
  ];
  const enQuotes = [
    `Whoa there, Space Cadet! "${contextEn}" is locked tighter than an airlock in deep vacuum. Meet the requirements first!`,
    `Beep-boop! You poked "${contextEn}", and my quantum sensors say: "Nice try, explorer — unlock the previous step!"`,
    `Not even duct tape can open "${contextEn}" yet! Complete the earlier milestone first.`,
  ];
  const idx = Math.floor(Math.random() * 3);
  return es ? esQuotes[idx] : enQuotes[idx];
}
