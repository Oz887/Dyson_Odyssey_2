import React, { useState } from 'react';
import { Check, Lock, Rocket, Shield, Wrench, X } from 'lucide-react';
import {
  getNextToolLevel,
  getToolUpgradeCost,
  LEVEL_LABELS,
  MINERAL_META,
  OXYGEN_TANK_MATERIALS,
  SHIP_TIERS,
  SHIP_TIER_ORDER,
  TOOL_LEVEL_ORDER,
  TOOL_META,
  TOOL_ORDER,
  toolLevelToTankTier,
} from '../../data/phase2Catalog';
import { soundEngine } from '../../engine/audio';
import {
  canAffordMinerals,
  computeSuitOxygenLossPer10s,
  spendMinerals,
} from '../../engine/survival';
import { isShipTierUnlockedByPlanet } from '../../data/phase3Planets';
import { TEXT } from '../../i18n/translations';
import {
  CinematicEvent,
  GameSnapshot,
  Language,
  MineralId,
  OxygenTankLevel,
  ShipUpgradeTier,
  ToolType,
} from '../../types/game';

interface ToolsAndShipModalProps {
  snapshot: GameSnapshot;
  language: Language;
  onUpdateSnapshot: (next: GameSnapshot) => void;
  onTriggerCinematic: (event: CinematicEvent) => void;
  onLockedAccess: (contextEs: string, contextEn: string) => void;
  onClose: () => void;
}

export const ToolsAndShipModal: React.FC<ToolsAndShipModalProps> = ({
  snapshot,
  language,
  onUpdateSnapshot,
  onTriggerCinematic,
  onLockedAccess,
  onClose,
}) => {
  const es = language === 'es';
  const t = TEXT[language];
  const [tab, setTab] = useState<'tools' | 'ship'>('tools');

  const upgradeTool = (tool: ToolType) => {
    const curr = snapshot.tools.levels[tool];
    const next = getNextToolLevel(curr);
    if (!next) return;
    const cost = getToolUpgradeCost(TOOL_META[tool].materials, next);
    if (!canAffordMinerals(snapshot.storage.minerals, cost)) return;

    const updatedStorageMinerals = spendMinerals(snapshot.storage.minerals, cost);
    soundEngine.playClick();
    onUpdateSnapshot({
      ...snapshot,
      storage: { ...snapshot.storage, minerals: updatedStorageMinerals },
      tools: {
        ...snapshot.tools,
        levels: { ...snapshot.tools.levels, [tool]: next },
      },
    });
    onTriggerCinematic({
      id: `tool_${tool}_${next}_${Date.now()}`,
      kind: 'tool',
      titleEn: `${TOOL_META[tool].en}: ${LEVEL_LABELS[next].en}`,
      titleEs: `${TOOL_META[tool].es}: ${LEVEL_LABELS[next].es}`,
      subtitleEn: 'Tool Efficiency & Capacity Upgraded!',
      subtitleEs: '¡Eficiencia y Capacidad Mejoradas!',
      detailEn: TOOL_META[tool].descEn,
      detailEs: TOOL_META[tool].descEs,
      accentColor: '#fb923c',
    });
  };

  const upgradeOxygenTank = () => {
    const curr = snapshot.tools.oxygenTankLevel;
    const next = getNextToolLevel(curr) as OxygenTankLevel | null;
    if (!next) return;
    const cost = getToolUpgradeCost(OXYGEN_TANK_MATERIALS, next);
    if (!canAffordMinerals(snapshot.storage.minerals, cost)) return;

    const tankTier = toolLevelToTankTier(next);
    const updatedStorageMinerals = spendMinerals(snapshot.storage.minerals, cost);
    const lossPer10s = computeSuitOxygenLossPer10s(
      snapshot.upgradeTree.oxygen >= 3,
      tankTier
    );
    soundEngine.playClick();
    onUpdateSnapshot({
      ...snapshot,
      storage: { ...snapshot.storage, minerals: updatedStorageMinerals },
      tools: { ...snapshot.tools, oxygenTankLevel: next },
      hooks: { ...snapshot.hooks, oxygenTankTier: tankTier },
      oxygenLossPer10s: lossPer10s,
    });
    onTriggerCinematic({
      id: `o2tank_${next}_${Date.now()}`,
      kind: 'tool',
      titleEn: `Oxygen Tank: ${LEVEL_LABELS[next].en}`,
      titleEs: `Tanque de Oxígeno: ${LEVEL_LABELS[next].es}`,
      subtitleEn: `Suit O2 Loss Reduced to -${lossPer10s}% / 10s`,
      subtitleEs: `Pérdida de O2 del Traje reducida a -${lossPer10s}% / 10s`,
      detailEn: 'Higher pressure composite tanks store denser breathable oxygen reserves.',
      detailEs: 'Tanques compuestos de mayor presión conservan oxígeno por más tiempo.',
      accentColor: '#38bdf8',
    });
  };

  const upgradeShipTier = (targetTier: ShipUpgradeTier) => {
    const currIdx = SHIP_TIER_ORDER.indexOf(snapshot.shipTier);
    const targetIdx = SHIP_TIER_ORDER.indexOf(targetTier);
    if (targetIdx !== currIdx + 1) return;
    const info = SHIP_TIERS[targetTier];
    if (!canAffordMinerals(snapshot.storage.minerals, info.cost)) return;

    const updatedMinerals = spendMinerals(snapshot.storage.minerals, info.cost);
    soundEngine.playClick();
    onUpdateSnapshot({
      ...snapshot,
      shipTier: targetTier,
      storage: { ...snapshot.storage, minerals: updatedMinerals },
    });
    onTriggerCinematic({
      id: `ship_${targetTier}_${Date.now()}`,
      kind: 'ship',
      titleEn: `${info.en} (${info.planetEn})`,
      titleEs: `${info.es} (${info.planetEs})`,
      subtitleEn: `Unlocked: ${info.roomsEn.join(' · ')}`,
      subtitleEs: `Desbloqueado: ${info.roomsEs.join(' · ')}`,
      detailEn: 'New spacecraft modules fabricated and integrated into life support.',
      detailEs: 'Nuevos módulos espaciales fabricados e integrados al soporte vital.',
      accentColor: info.accent,
    });
  };

  const renderCost = (cost: Partial<Record<MineralId, number>>) => (
    <div className="flex flex-wrap gap-1.5 text-[11px] font-mono-num">
      {(Object.entries(cost) as [MineralId, number][]).map(([m, req]) => {
        const have = snapshot.storage.minerals[m] ?? 0;
        const ok = have >= req;
        return (
          <span
            key={m}
            className={`px-1.5 py-0.5 border ${
              ok
                ? 'bg-emerald-950/70 border-emerald-500 text-emerald-200'
                : 'bg-rose-950/70 border-rose-500 text-rose-200'
            }`}
          >
            {es ? MINERAL_META[m].es : MINERAL_META[m].en}: {have}/{req}
          </span>
        );
      })}
    </div>
  );

  return (
    <div className="fixed inset-0 z-40 bg-slate-950/85 flex items-center justify-center p-3 sm:p-5">
      <div className="pixel-panel w-full max-w-4xl p-4 sm:p-5 text-slate-100 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between pb-3 border-b-2 border-slate-700">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                setTab('tools');
              }}
              className={`pixel-btn flex items-center gap-1.5 px-3 py-1.5 border-2 font-pixel text-xs cursor-pointer ${
                tab === 'tools'
                  ? 'bg-orange-500 border-orange-200 text-slate-950'
                  : 'bg-slate-800 border-slate-600 text-slate-300'
              }`}
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>{es ? 'Herramientas y Traje' : 'Tools & Suit'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                setTab('ship');
              }}
              className={`pixel-btn flex items-center gap-1.5 px-3 py-1.5 border-2 font-pixel text-xs cursor-pointer ${
                tab === 'ship'
                  ? 'bg-cyan-500 border-cyan-200 text-slate-950'
                  : 'bg-slate-800 border-slate-600 text-slate-300'
              }`}
            >
              <Rocket className="w-3.5 h-3.5" />
              <span>{es ? 'Mejoras de Nave' : 'Ship Upgrades'}</span>
            </button>
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

        <div className="mt-4 flex-1 overflow-y-auto pr-1 space-y-3">
          {tab === 'tools' ? (
            <>
              {/* Space Suit Equip / Unequip */}
              <div className="p-3 bg-slate-900 border-2 border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="font-pixel text-xs text-sky-300 flex items-center gap-1.5">
                    <Shield className="w-4 h-4" />
                    <span>{es ? 'Traje Espacial (§3.5)' : 'Space Suit (§3.5)'}</span>
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {es
                      ? 'Sin traje solo resistes de -10°C a +50°C (-10% salud cada 5s).'
                      : 'Without suit you withstand only -10°C to +50°C (-10% health / 5s).'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const next = !snapshot.suitEquipped;
                    soundEngine.playSuitToggle(next);
                    onUpdateSnapshot({ ...snapshot, suitEquipped: next });
                  }}
                  className={`pixel-btn px-4 py-2 border-2 font-pixel text-xs cursor-pointer ${
                    snapshot.suitEquipped
                      ? 'bg-sky-500 border-sky-200 text-slate-950'
                      : 'bg-rose-600 border-rose-300 text-white'
                  }`}
                >
                  {snapshot.suitEquipped ? t.suitOn : t.suitOff}
                </button>
              </div>

              {/* 4 Equipable Tools */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {TOOL_ORDER.map((tool) => {
                  const meta = TOOL_META[tool];
                  const lvl = snapshot.tools.levels[tool];
                  const nextLvl = getNextToolLevel(lvl);
                  const cost = nextLvl ? getToolUpgradeCost(meta.materials, nextLvl) : null;
                  const canAfford = cost ? canAffordMinerals(snapshot.storage.minerals, cost) : false;
                  const equipped = snapshot.tools.equippedTool === tool;

                  return (
                    <div
                      key={tool}
                      className={`p-3 border-2 space-y-2.5 ${
                        equipped
                          ? 'bg-slate-900 border-amber-400'
                          : 'bg-slate-900/80 border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <div className="font-pixel text-xs text-white">
                            [{meta.shortKey}] {es ? meta.es : meta.en}
                          </div>
                          <div className="text-[11px] text-amber-300 font-pixel">
                            {es ? LEVEL_LABELS[lvl].es : LEVEL_LABELS[lvl].en}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            soundEngine.playClick();
                            onUpdateSnapshot({
                              ...snapshot,
                              tools: { ...snapshot.tools, equippedTool: tool },
                            });
                          }}
                          className={`pixel-btn px-2.5 py-1.5 border font-pixel text-[10px] cursor-pointer ${
                            equipped
                              ? 'bg-emerald-500 border-emerald-200 text-slate-950'
                              : 'bg-slate-800 border-slate-500 text-slate-200'
                          }`}
                        >
                          {equipped ? (es ? 'EQUIPADO' : 'EQUIPPED') : es ? 'EQUIPAR' : 'EQUIP'}
                        </button>
                      </div>

                      <p className="text-[11px] text-slate-400">
                        {es ? meta.descEs : meta.descEn}
                      </p>

                      {nextLvl && cost ? (
                        <div className="space-y-2 pt-1 border-t border-slate-800">
                          {renderCost(cost)}
                          <button
                            type="button"
                            disabled={!canAfford}
                            onClick={() => upgradeTool(tool)}
                            className="pixel-btn w-full py-1.5 bg-orange-500 disabled:bg-slate-700 disabled:opacity-50 border border-orange-200 disabled:border-slate-600 text-slate-950 disabled:text-slate-400 font-pixel text-[11px] cursor-pointer"
                          >
                            {es
                              ? `Mejorar a ${LEVEL_LABELS[nextLvl].es}`
                              : `Upgrade to ${LEVEL_LABELS[nextLvl].en}`}
                          </button>
                        </div>
                      ) : (
                        <div className="text-[11px] font-pixel text-emerald-300">
                          {es ? 'NIVEL MÁXIMO ALCANZADO' : 'MAX LEVEL REACHED'}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Passive Oxygen Tank Upgrade */}
              <div className="p-3 bg-slate-900 border-2 border-cyan-600/70 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="font-pixel text-xs text-cyan-300">
                      {es
                        ? 'Tanque de Oxígeno (Pasivo)'
                        : 'Oxygen Tank (Passive Upgrade)'}
                    </div>
                    <div className="text-[11px] text-slate-300">
                      {es ? 'Nivel actual:' : 'Current level:'}{' '}
                      <span className="text-amber-300 font-pixel">
                        {es
                          ? LEVEL_LABELS[snapshot.tools.oxygenTankLevel].es
                          : LEVEL_LABELS[snapshot.tools.oxygenTankLevel].en}
                      </span>{' '}
                      · -{snapshot.oxygenLossPer10s}% / 10s
                    </div>
                  </div>
                  <div className="flex gap-1 font-pixel text-[10px]">
                    {TOOL_LEVEL_ORDER.map((lvl, idx) => {
                      const active =
                        TOOL_LEVEL_ORDER.indexOf(snapshot.tools.oxygenTankLevel) >= idx;
                      return (
                        <span
                          key={lvl}
                          className={`px-1.5 py-0.5 border ${
                            active
                              ? 'bg-cyan-700 border-cyan-300 text-white'
                              : 'bg-slate-950 border-slate-700 text-slate-500'
                          }`}
                        >
                          {idx + 1}
                        </span>
                      );
                    })}
                  </div>
                </div>
                {(() => {
                  const nextO2 = getNextToolLevel(snapshot.tools.oxygenTankLevel);
                  if (!nextO2) {
                    return (
                      <div className="text-[11px] font-pixel text-emerald-300">
                        {es ? 'TANQUE INDUSTRIAL ACTIVO (-4%)' : 'INDUSTRIAL TANK ACTIVE (-4%)'}
                      </div>
                    );
                  }
                  const cost = getToolUpgradeCost(OXYGEN_TANK_MATERIALS, nextO2);
                  const ok = canAffordMinerals(snapshot.storage.minerals, cost);
                  return (
                    <div className="space-y-2 pt-1">
                      {renderCost(cost)}
                      <button
                        type="button"
                        disabled={!ok}
                        onClick={upgradeOxygenTank}
                        className="pixel-btn w-full py-2 bg-cyan-500 disabled:bg-slate-700 disabled:opacity-50 border border-cyan-200 disabled:border-slate-600 text-slate-950 disabled:text-slate-400 font-pixel text-xs cursor-pointer"
                      >
                        {es
                          ? `Mejorar Tanque a ${LEVEL_LABELS[nextO2].es}`
                          : `Upgrade Tank to ${LEVEL_LABELS[nextO2].en}`}
                      </button>
                    </div>
                  );
                })()}
              </div>
            </>
          ) : (
            /* SHIP UPGRADES (§1.7 connected with Phase 3 planet unlocks) */
            <div className="space-y-3">
              {SHIP_TIER_ORDER.map((tier, idx) => {
                const info = SHIP_TIERS[tier];
                const currIdx = SHIP_TIER_ORDER.indexOf(snapshot.shipTier);
                const unlocked = idx <= currIdx;
                const isNext = idx === currIdx + 1;
                const planetUnlocked = isShipTierUnlockedByPlanet(
                  tier,
                  snapshot.visitedPlanets
                );
                const canAfford =
                  isNext &&
                  planetUnlocked &&
                  canAffordMinerals(snapshot.storage.minerals, info.cost);

                return (
                  <div
                    key={tier}
                    className={`p-3 border-2 space-y-2 ${
                      unlocked
                        ? 'bg-slate-900 border-emerald-500/70'
                        : isNext
                          ? 'bg-slate-900 border-amber-400'
                          : 'bg-slate-950/70 border-slate-800 opacity-70'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {unlocked ? (
                          <Check className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Lock className="w-4 h-4 text-slate-400" />
                        )}
                        <span className="font-pixel text-xs" style={{ color: info.accent }}>
                          {es ? info.es : info.en}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          · {es ? info.planetEs : info.planetEn}
                        </span>
                      </div>
                      <span className="font-pixel text-[10px] text-slate-300">
                        {unlocked
                          ? es
                            ? 'DESBLOQUEADA'
                            : 'UNLOCKED'
                          : isNext
                            ? planetUnlocked
                              ? es
                                ? 'LISTA PARA CONSTRUIR'
                                : 'READY TO BUILD'
                              : es
                                ? `REQUIERE ${info.planetEs.toUpperCase()}`
                                : `REACH ${info.planetEn.toUpperCase()}`
                            : es
                              ? 'BLOQUEADA'
                              : 'LOCKED'}
                      </span>
                    </div>

                    <div className="text-xs text-slate-300">
                      {(es ? info.roomsEs : info.roomsEn).join(' · ')}
                    </div>

                    {isNext && (
                      <div className="pt-1 space-y-2">
                        {renderCost(info.cost)}
                        <button
                          type="button"
                          onClick={() => {
                            if (!planetUnlocked) {
                              soundEngine.playWarning();
                              onLockedAccess(info.es, info.en);
                              return;
                            }
                            if (canAfford) {
                              upgradeShipTier(tier);
                            } else {
                              soundEngine.playWarning();
                            }
                          }}
                          className={`pixel-btn w-full py-2 border-2 font-pixel text-xs cursor-pointer ${
                            canAfford
                              ? 'bg-cyan-500 border-cyan-200 text-slate-950'
                              : 'bg-slate-700 opacity-65 border-slate-600 text-slate-300'
                          }`}
                        >
                          {!planetUnlocked
                            ? es
                              ? `Viaja a ${info.planetEs} para desbloquear`
                              : `Reach ${info.planetEn} to unlock`
                            : es
                              ? `Construir ${info.es}`
                              : `Build ${info.en}`}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
