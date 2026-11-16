import React, { useState } from 'react';
import {
  BatteryCharging,
  Box,
  Flame,
  GitBranch,
  Lock,
  Sprout,
  X,
} from 'lucide-react';
import {
  CROP_GROWTH_SECONDS,
  FOOD_META,
  FUEL_META,
  GAS_META,
  MINERAL_META,
  UPGRADE_TREE_META,
  VEGGIE_IDS,
} from '../../data/phase2Catalog';
import { soundEngine } from '../../engine/audio';
import {
  canAffordMinerals,
  computeSuitOxygenLossPer10s,
  depositAllMineralsToStorage,
  depositGasesToFuelZone,
  fuseHydrogenOxygenFuel,
  getCropStage,
  harvestCropPlot,
  loadFuelCanisterToShip,
  refineIlmeniteToOxygen,
  spendMinerals,
} from '../../engine/survival';
import { TEXT } from '../../i18n/translations';
import {
  GameSnapshot,
  Language,
  MineralId,
  UpgradeBranchId,
  VeggieId,
} from '../../types/game';
import { FoodSprite, GasOrFuelSprite, MineralSprite } from '../FoodSprite';

interface OptionScreensModalProps {
  screen: 'upgrade_tree' | 'storage' | 'garden';
  snapshot: GameSnapshot;
  language: Language;
  onUpdateSnapshot: (next: GameSnapshot) => void;
  onLockedAccess: (contextEs: string, contextEn: string) => void;
  onResolveMission: () => void;
  onClose: () => void;
}

export const OptionScreensModal: React.FC<OptionScreensModalProps> = ({
  screen,
  snapshot,
  language,
  onUpdateSnapshot,
  onLockedAccess,
  onResolveMission,
  onClose,
}) => {
  const es = language === 'es';
  const t = TEXT[language];
  const [selectedSeed, setSelectedSeed] = useState<VeggieId>('tomato');
  const title = t.screens[screen];

  const upgradeTreeBranch = (branch: UpgradeBranchId) => {
    const currLvl = snapshot.upgradeTree[branch];
    const meta = UPGRADE_TREE_META[branch];
    if (currLvl >= meta.maxLevel) return;
    const cost = meta.costs[currLvl];
    if (!canAffordMinerals(snapshot.storage.minerals, cost)) return;

    const updatedMinerals = spendMinerals(snapshot.storage.minerals, cost);
    const nextTree = { ...snapshot.upgradeTree, [branch]: currLvl + 1 };
    const oxygenCompleted = nextTree.oxygen >= 3;
    const lossPer10s = computeSuitOxygenLossPer10s(
      oxygenCompleted,
      snapshot.hooks.oxygenTankTier
    );

    soundEngine.playWake();
    onUpdateSnapshot({
      ...snapshot,
      storage: { ...snapshot.storage, minerals: updatedMinerals },
      upgradeTree: nextTree,
      hooks: { ...snapshot.hooks, oxygenTreeCompleted: oxygenCompleted },
      oxygenLossPer10s: lossPer10s,
      stats: {
        ...snapshot.stats,
        dropMultiplier: 1 + nextTree.minerals * 0.5,
      },
    });
  };

  const renderContent = () => {
    if (screen === 'upgrade_tree') {
      const branches: UpgradeBranchId[] = [
        'minerals',
        'oxygen',
        'energy',
        'water',
        'food',
      ];
      return (
        <div className="space-y-3">
          {branches.map((branch) => {
            const meta = UPGRADE_TREE_META[branch];
            const lvl = snapshot.upgradeTree[branch];
            const maxed = lvl >= meta.maxLevel;
            const cost = maxed ? null : meta.costs[lvl];
            const canAfford = cost
              ? canAffordMinerals(snapshot.storage.minerals, cost)
              : false;

            return (
              <div
                key={branch}
                className="p-3 bg-slate-900 border-2 border-slate-700 space-y-2"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="font-pixel text-xs text-emerald-300">
                      {es ? meta.es : meta.en}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {es ? meta.descEs : meta.descEn}
                    </div>
                  </div>
                  <div className="font-mono-num text-xs font-bold text-amber-300">
                    Lv {lvl}/{meta.maxLevel}
                  </div>
                </div>

                {!maxed && cost ? (
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800">
                    <div className="flex flex-wrap gap-1.5 text-[11px] font-mono-num">
                      {(Object.entries(cost) as [MineralId, number][]).map(([m, req]) => {
                        const have = snapshot.storage.minerals[m] ?? 0;
                        return (
                          <span
                            key={m}
                            className={`px-1.5 py-0.5 border ${
                              have >= req
                                ? 'bg-emerald-950/70 border-emerald-500 text-emerald-200'
                                : 'bg-rose-950/70 border-rose-500 text-rose-200'
                            }`}
                          >
                            {es ? MINERAL_META[m].es : MINERAL_META[m].en}: {have}/{req}
                          </span>
                        );
                      })}
                    </div>
                    <button
                      type="button"
                      disabled={!canAfford}
                      onClick={() => upgradeTreeBranch(branch)}
                      className="pixel-btn px-3 py-1.5 bg-emerald-500 disabled:bg-slate-700 disabled:opacity-50 border border-emerald-200 disabled:border-slate-600 text-slate-950 disabled:text-slate-400 font-pixel text-[10px] cursor-pointer"
                    >
                      {es ? 'Mejorar' : 'Upgrade'}
                    </button>
                  </div>
                ) : (
                  <div className="font-pixel text-[10px] text-emerald-300">
                    {es ? 'RAMA COMPLETADA' : 'BRANCH COMPLETED'}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      );
    }

    if (screen === 'garden') {
      return (
        <div className="space-y-4">
          {/* Agriculture ON/OFF Switch (§3.9) */}
          <div className="p-3 bg-slate-900 border-2 border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="font-pixel text-xs text-emerald-300 flex items-center gap-1.5">
                <BatteryCharging className="w-4 h-4" />
                <span>
                  {es
                    ? 'Sistema de Agricultura (-2% Energía / 4s)'
                    : 'Agriculture Power (-2% Energy / 4s)'}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {es
                  ? 'Cada cultivo tarda 2 minutos. Al apagar, no gasta energía y el crecimiento se pausa.'
                  : 'Each crop takes 2 minutes. When OFF, drains 0 energy and growth stays paused.'}
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                onUpdateSnapshot({
                  ...snapshot,
                  agriculture: {
                    ...snapshot.agriculture,
                    enabled: !snapshot.agriculture.enabled,
                  },
                });
              }}
              className={`pixel-btn px-4 py-2 border-2 font-pixel text-xs shrink-0 cursor-pointer ${
                snapshot.agriculture.enabled
                  ? 'bg-emerald-500 border-emerald-200 text-slate-950'
                  : 'bg-slate-800 border-slate-500 text-slate-200'
              }`}
            >
              {snapshot.agriculture.enabled ? t.on : t.off}
            </button>
          </div>

          {/* Seed Picker */}
          <div className="p-3 bg-slate-900 border-2 border-slate-700 space-y-2">
            <div className="font-pixel text-[11px] text-amber-300">
              {es ? 'Selecciona Semilla para Plantar:' : 'Select Vegetable to Plant:'}
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
              {VEGGIE_IDS.map((vid) => {
                const active = selectedSeed === vid;
                return (
                  <button
                    key={vid}
                    type="button"
                    onClick={() => {
                      soundEngine.playClick();
                      setSelectedSeed(vid);
                    }}
                    className={`p-1.5 border flex flex-col items-center gap-1 cursor-pointer ${
                      active
                        ? 'bg-emerald-700 border-emerald-300 text-white'
                        : 'bg-slate-950 border-slate-700 text-slate-300'
                    }`}
                  >
                    <FoodSprite id={vid} size={26} />
                    <span className="text-[9px] truncate w-full text-center">
                      {es ? FOOD_META[vid].es : FOOD_META[vid].en}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4 Hydroponic Crop Plots */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {snapshot.agriculture.plots.map((plot) => {
              const stage = getCropStage(plot.elapsedSeconds);
              const pct = Math.round((plot.elapsedSeconds / CROP_GROWTH_SECONDS) * 100);
              const stageLabel =
                stage === 'ready'
                  ? es
                    ? 'Listo para cosechar'
                    : 'Ready to harvest'
                  : stage === 'semi_developed'
                    ? es
                      ? 'Semi-desarrollado'
                      : 'Semi-developed'
                    : es
                      ? 'Prematuro'
                      : 'Premature';

              return (
                <div
                  key={plot.id}
                  className="p-3 bg-slate-900 border-2 border-slate-700 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {plot.veggieId ? (
                      <FoodSprite id={plot.veggieId} size={36} />
                    ) : (
                      <div className="w-9 h-9 bg-slate-950 border border-slate-700 flex items-center justify-center">
                        <Sprout className="w-4 h-4 text-slate-600" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="font-pixel text-xs text-white truncate">
                        {plot.veggieId
                          ? es
                            ? FOOD_META[plot.veggieId].es
                            : FOOD_META[plot.veggieId].en
                          : es
                            ? `Parcela #${plot.id + 1} (Vacía)`
                            : `Plot #${plot.id + 1} (Empty)`}
                      </div>
                      {plot.veggieId && (
                        <div className="text-[11px] text-emerald-300 font-mono-num">
                          {stageLabel} · {pct}%
                        </div>
                      )}
                    </div>
                  </div>

                  {plot.veggieId ? (
                    stage === 'ready' ? (
                      <button
                        type="button"
                        onClick={() => {
                          soundEngine.playConsume();
                          onUpdateSnapshot(harvestCropPlot(snapshot, plot.id).snapshot);
                        }}
                        className="pixel-btn px-3 py-1.5 bg-emerald-500 border border-emerald-200 text-slate-950 font-pixel text-[10px] shrink-0 cursor-pointer"
                      >
                        {es ? 'Cosechar +1' : 'Harvest +1'}
                      </button>
                    ) : (
                      <span className="font-mono-num text-[11px] text-slate-400 shrink-0">
                        {Math.ceil(CROP_GROWTH_SECONDS - plot.elapsedSeconds)}s
                      </span>
                    )
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        soundEngine.playClick();
                        onUpdateSnapshot({
                          ...snapshot,
                          agriculture: {
                            ...snapshot.agriculture,
                            plots: snapshot.agriculture.plots.map((p) =>
                              p.id === plot.id
                                ? { ...p, veggieId: selectedSeed, elapsedSeconds: 0 }
                                : p
                            ),
                          },
                        });
                      }}
                      className="pixel-btn px-3 py-1.5 bg-amber-500 border border-amber-200 text-slate-950 font-pixel text-[10px] shrink-0 cursor-pointer"
                    >
                      {es ? 'Plantar' : 'Plant'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    // STORAGE & FUEL ZONE (§1.9, §3.7, §3.10)
    const mineralKeys = Object.keys(MINERAL_META) as MineralId[];
    const canFuseFuel =
      snapshot.storage.gases.hydrogen_gas >= 1 &&
      snapshot.storage.gases.oxygen_gas >= 1 &&
      snapshot.stats.energy >= 10;
    const canRefineIlmenite = snapshot.storage.minerals.ilmenite >= 1;

    const heliumUnlocked = snapshot.visitedPlanets.includes(snapshot.hooks.helium3UnlockPlanet);

    return (
      <div className="space-y-4">
        {snapshot.activeMission && (
          <div className="p-3 bg-rose-950/85 border-2 border-rose-400 flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs text-rose-100">
              {es
                ? 'Falla crítica activa en sistemas de la nave:'
                : 'Active critical ship system failure:'}
            </div>
            <button
              type="button"
              onClick={() => {
                onResolveMission();
                onClose();
              }}
              className="pixel-btn px-3 py-1.5 bg-amber-400 border border-amber-100 text-slate-950 font-pixel text-[11px] cursor-pointer"
            >
              {es ? 'Reparar Falla Ahora' : 'Repair Failure Now'}
            </button>
          </div>
        )}
        {/* Deposit Controls (Mineral Storage & Fuel Storage tools) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => {
              const res = depositAllMineralsToStorage(snapshot);
              if (res.moved > 0) {
                soundEngine.playInteract();
                onUpdateSnapshot(res.snapshot);
              }
            }}
            className="pixel-btn p-3 bg-fuchsia-600 border-2 border-fuchsia-200 text-white font-pixel text-xs cursor-pointer"
          >
            {es ? 'Depositar Minerales de Mochila' : 'Deposit Backpack Minerals'}
          </button>
          <button
            type="button"
            onClick={() => {
              const res = depositGasesToFuelZone(snapshot);
              if (res.moved > 0) {
                soundEngine.playInteract();
                onUpdateSnapshot(res.snapshot);
              }
            }}
            className="pixel-btn p-3 bg-indigo-600 border-2 border-indigo-200 text-white font-pixel text-xs cursor-pointer"
          >
            {es ? 'Depositar Gases del Colector' : 'Deposit Collected Gases'}
          </button>
        </div>

        {/* Stored Minerals */}
        <div className="p-3 bg-slate-900 border-2 border-slate-700 space-y-2">
          <div className="font-pixel text-xs text-fuchsia-300">
            {es ? 'Bóveda de Minerales de la Nave' : 'Ship Mineral Storage'}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {mineralKeys.map((m) => (
              <div
                key={m}
                className="flex items-center justify-between p-1.5 bg-slate-950/80 border border-slate-800"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <MineralSprite id={m} size={20} />
                  <span className="text-xs truncate">
                    {es ? MINERAL_META[m].es : MINERAL_META[m].en}
                  </span>
                </div>
                <span className="font-mono-num text-xs font-bold text-amber-300">
                  {snapshot.storage.minerals[m]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Energy & Fuel Zone (§3.7) */}
        <div className="p-3 bg-slate-900 border-2 border-orange-500/70 space-y-3">
          <div className="font-pixel text-xs text-orange-300 flex items-center gap-1.5">
            <Flame className="w-4 h-4" />
            <span>
              {es
                ? 'Zona de Combustible y Reactor de Ilmenita (§3.7)'
                : 'Ship Fuel Zone & Ilmenite Reactor (§3.7)'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="p-2 bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <GasOrFuelSprite id="oxygen_gas" size={20} />
                <span className="text-[11px]">{es ? GAS_META.oxygen_gas.es : 'O2 Gas'}</span>
              </div>
              <span className="font-mono-num text-xs font-bold text-sky-300">
                {snapshot.storage.gases.oxygen_gas}
              </span>
            </div>
            <div className="p-2 bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <GasOrFuelSprite id="hydrogen_gas" size={20} />
                <span className="text-[11px]">{es ? GAS_META.hydrogen_gas.es : 'H2 Gas'}</span>
              </div>
              <span className="font-mono-num text-xs font-bold text-purple-300">
                {snapshot.storage.gases.hydrogen_gas}
              </span>
            </div>
            <div className="p-2 bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <GasOrFuelSprite id="hydro_oxy_fuel" size={20} />
                <span className="text-[11px]">H2+O2 Fuel</span>
              </div>
              <span className="font-mono-num text-xs font-bold text-orange-300">
                {snapshot.storage.fuel.hydro_oxy_fuel}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                if (!heliumUnlocked) {
                  soundEngine.playWarning();
                  onLockedAccess('Helio-3', 'Helium-3 Fuel');
                }
              }}
              className="p-2 bg-slate-950 border border-slate-800 flex items-center justify-between text-left cursor-pointer"
            >
              <div className="flex items-center gap-1.5">
                <GasOrFuelSprite id="helium_3" size={20} />
                <span className="text-[11px]">{es ? FUEL_META.helium_3.es : 'Helium-3'}</span>
              </div>
              <span className="flex items-center gap-1 font-mono-num text-xs text-cyan-300">
                {!heliumUnlocked && <Lock className="w-3 h-3" />}
                {snapshot.storage.fuel.helium_3}
              </span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <button
              type="button"
              disabled={!canRefineIlmenite}
              onClick={() => {
                soundEngine.playInteract();
                onUpdateSnapshot(refineIlmeniteToOxygen(snapshot));
              }}
              className="pixel-btn py-2 px-3 bg-sky-600 disabled:bg-slate-700 disabled:opacity-50 border border-sky-200 disabled:border-slate-600 text-white font-pixel text-[11px] cursor-pointer"
            >
              {es
                ? 'Tratar 1 Ilmenita → +2 Gas O2'
                : 'Treat 1 Ilmenite → +2 O2 Gas'}
            </button>
            <button
              type="button"
              disabled={!canFuseFuel}
              onClick={() => {
                soundEngine.playTrain();
                onUpdateSnapshot(fuseHydrogenOxygenFuel(snapshot));
              }}
              className="pixel-btn py-2 px-3 bg-orange-500 disabled:bg-slate-700 disabled:opacity-50 border border-orange-200 disabled:border-slate-600 text-slate-950 font-pixel text-[11px] cursor-pointer"
            >
              {es
                ? 'Fusionar H2 + O2 (-10% Energía)'
                : 'Fuse H2 + O2 Fuel (-10% Energy)'}
            </button>
            <button
              type="button"
              disabled={snapshot.storage.fuel.hydro_oxy_fuel <= 0 || snapshot.stats.fuel >= 100}
              onClick={() => {
                soundEngine.playTrain();
                onUpdateSnapshot(loadFuelCanisterToShip(snapshot));
              }}
              className="pixel-btn py-2 px-3 bg-emerald-500 disabled:bg-slate-700 disabled:opacity-50 border border-emerald-200 disabled:border-slate-600 text-slate-950 font-pixel text-[11px] cursor-pointer"
            >
              {es
                ? 'Cargar Tanque (+25% Comb.)'
                : 'Load Tank (+25% Fuel)'}
            </button>
          </div>

          <div className="text-[11px] text-slate-400">
            {es
              ? `Helio-3 almacenado (${snapshot.storage.fuel.helium_3}): se desbloquea al llegar a ${snapshot.hooks.helium3UnlockPlanet.toUpperCase()}.`
              : `Helium-3 stored (${snapshot.storage.fuel.helium_3}): unlocks upon reaching ${snapshot.hooks.helium3UnlockPlanet.toUpperCase()}.`}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-40 bg-slate-950/85 flex items-center justify-center p-3 sm:p-5">
      <div className="pixel-panel w-full max-w-3xl p-4 sm:p-5 text-slate-100 max-h-[88vh] flex flex-col">
        <div className="flex items-center justify-between pb-3 border-b-2 border-slate-700">
          <div className="flex items-center gap-2">
            {screen === 'upgrade_tree' && <GitBranch className="w-5 h-5 text-emerald-400" />}
            {screen === 'storage' && <Box className="w-5 h-5 text-fuchsia-400" />}
            {screen === 'garden' && <Sprout className="w-5 h-5 text-emerald-400" />}
            <h2 className="font-pixel text-base sm:text-lg text-amber-300">{title}</h2>
          </div>
          <button
            type="button"
            onClick={() => {
              soundEngine.playCloseMenu();
              onClose();
            }}
            className="pixel-btn p-1.5 bg-slate-800 border-2 border-slate-500 text-slate-200 cursor-pointer"
            aria-label={t.close}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-4 overflow-y-auto pr-1">{renderContent()}</div>
      </div>
    </div>
  );
};
