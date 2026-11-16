import React from 'react';
import { Droplets, Flame, Gem, Lock, Utensils, X } from 'lucide-react';
import {
  FOOD_META,
  FUEL_META,
  GAS_META,
  MAX_INVENTORY_MINERAL,
  MEAT_IDS,
  MINERAL_META,
  VEGGIE_IDS,
} from '../../data/phase2Catalog';
import { soundEngine } from '../../engine/audio';
import { consumeFoodItem, consumeWaterItem } from '../../engine/survival';
import { TEXT } from '../../i18n/translations';
import { GameSnapshot, GasId, Language, MineralId } from '../../types/game';
import { FoodSprite, GasOrFuelSprite, MineralSprite } from '../FoodSprite';

interface InventoryModalProps {
  snapshot: GameSnapshot;
  language: Language;
  onUpdateSnapshot: (next: GameSnapshot) => void;
  onClose: () => void;
}

export const InventoryModal: React.FC<InventoryModalProps> = ({
  snapshot,
  language,
  onUpdateSnapshot,
  onClose,
}) => {
  const es = language === 'es';
  const t = TEXT[language];
  const mineralKeys = Object.keys(MINERAL_META) as MineralId[];

  return (
    <div className="fixed inset-0 z-40 bg-slate-950/85 flex items-center justify-center p-3 sm:p-5">
      <div className="pixel-panel w-full max-w-6xl p-4 sm:p-5 text-slate-100 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between pb-3 border-b-2 border-slate-700 shrink-0">
          <div>
            <h2 className="font-pixel text-base sm:text-lg text-amber-300">
              {t.screens.inventory}
            </h2>
            <p className="text-[11px] text-slate-400">
              {es
                ? 'Consume comida y agua directo aquí. Máx. 5 por mineral; los gases usan el Colector/Depósito.'
                : 'Consume food & water directly. Max 5 per mineral; gases use the Fuel Collector/Storage tool.'}
            </p>
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

        {/* 4-COLUMN INVENTORY LAYOUT: [Minerals, Fuel, Food, Water] */}
        <div className="mt-4 flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 pr-1">
          {/* COLUMN 1: MINERALS (max 5 each) */}
          <div className="bg-slate-900/90 border-2 border-slate-700 p-3 flex flex-col gap-2">
            <div className="font-pixel text-xs text-cyan-300 flex items-center gap-1.5 pb-1.5 border-b border-slate-700">
              <Gem className="w-4 h-4" />
              <span>{es ? 'Minerales (Máx. 5)' : 'Minerals (Max 5)'}</span>
            </div>
            <div className="space-y-1.5">
              {mineralKeys.map((m) => {
                const count = snapshot.inventory.minerals[m];
                const meta = MINERAL_META[m];
                return (
                  <div
                    key={m}
                    className="flex items-center justify-between gap-2 p-1.5 bg-slate-950/70 border border-slate-800"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <MineralSprite id={m} size={24} />
                      <div className="min-w-0">
                        <div className="text-xs font-medium truncate">
                          {es ? meta.es : meta.en}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {es ? meta.rarityEs : meta.rarityEn}
                        </div>
                      </div>
                    </div>
                    <span className="font-mono-num text-xs font-bold text-cyan-200 shrink-0">
                      {count}/{MAX_INVENTORY_MINERAL}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* COLUMN 2: FUEL & GAS TOOL BUFFER */}
          <div className="bg-slate-900/90 border-2 border-slate-700 p-3 flex flex-col gap-2.5">
            <div className="font-pixel text-xs text-orange-300 flex items-center gap-1.5 pb-1.5 border-b border-slate-700">
              <Flame className="w-4 h-4" />
              <span>{es ? 'Combustible y Gases' : 'Fuel & Gases'}</span>
            </div>

            <div className="p-2 bg-slate-950/70 border border-slate-800 text-[11px] text-slate-300">
              {es
                ? 'El inventario no almacena gases: se guardan en la herramienta de Depósito de Gases.'
                : 'Inventory cannot store gases directly — collected gases sit in your Fuel Storage tool.'}
            </div>

            <div className="space-y-1.5">
              <div className="text-[10px] font-pixel text-slate-400">
                {es ? 'EN HERRAMIENTA (POR DEPOSITAR)' : 'IN TOOL BUFFER'}
              </div>
              {(['oxygen_gas', 'hydrogen_gas'] as GasId[]).map((g) => (
                <div
                  key={g}
                  className="flex items-center justify-between p-1.5 bg-slate-950/70 border border-slate-800"
                >
                  <div className="flex items-center gap-2">
                    <GasOrFuelSprite id={g} size={24} />
                    <span className="text-xs">{es ? GAS_META[g].es : GAS_META[g].en}</span>
                  </div>
                  <span className="font-mono-num text-xs font-bold">
                    {snapshot.storage.toolGasBuffer[g]}
                  </span>
                </div>
              ))}
              <div className="flex items-center justify-between p-1.5 bg-slate-950/70 border border-slate-800">
                <div className="flex items-center gap-2">
                  <GasOrFuelSprite id="helium_3" size={24} />
                  <span className="text-xs">Helium-3 (Tool)</span>
                </div>
                <span className="font-mono-num text-xs font-bold">
                  {snapshot.storage.toolHeliumBuffer}
                </span>
              </div>
            </div>

            <div className="space-y-1.5 pt-1 border-t border-slate-800">
              <div className="text-[10px] font-pixel text-slate-400">
                {es ? 'COMBUSTIBLE EN NAVE' : 'SHIP FUEL RESERVES'}
              </div>
              <div className="flex items-center justify-between p-1.5 bg-slate-950/70 border border-slate-800">
                <div className="flex items-center gap-2">
                  <GasOrFuelSprite id="hydro_oxy_fuel" size={24} />
                  <span className="text-xs">
                    {es ? FUEL_META.hydro_oxy_fuel.es : FUEL_META.hydro_oxy_fuel.en}
                  </span>
                </div>
                <span className="font-mono-num text-xs font-bold text-orange-300">
                  {snapshot.storage.fuel.hydro_oxy_fuel}
                </span>
              </div>
              <div className="flex items-center justify-between p-1.5 bg-slate-950/70 border border-slate-800">
                <div className="flex items-center gap-2">
                  <GasOrFuelSprite id="helium_3" size={24} />
                  <span className="text-xs">Helium-3</span>
                </div>
                <span className="flex items-center gap-1 font-mono-num text-xs text-cyan-300">
                  <Lock className="w-3 h-3" />
                  {snapshot.storage.fuel.helium_3}
                </span>
              </div>
            </div>
          </div>

          {/* COLUMN 3: FOOD (Meats & Harvested Vegetation) */}
          <div className="bg-slate-900/90 border-2 border-slate-700 p-3 flex flex-col gap-2">
            <div className="font-pixel text-xs text-amber-300 flex items-center gap-1.5 pb-1.5 border-b border-slate-700">
              <Utensils className="w-4 h-4" />
              <span>{es ? 'Comida (Consumir)' : 'Food (Consume)'}</span>
            </div>

            <div className="space-y-1.5 max-h-[48vh] overflow-y-auto pr-1">
              {[...MEAT_IDS, ...VEGGIE_IDS].map((fid) => {
                const count = snapshot.inventory.food[fid] ?? 0;
                const meta = FOOD_META[fid];
                return (
                  <div
                    key={fid}
                    className={`flex items-center justify-between gap-2 p-1.5 border ${
                      count > 0
                        ? 'bg-slate-950/80 border-slate-700'
                        : 'bg-slate-950/35 border-slate-800 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FoodSprite id={fid} size={30} />
                      <div className="min-w-0">
                        <div className="text-xs font-medium truncate">
                          {es ? meta.es : meta.en}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono-num">
                          +{meta.hungerGain}% · x{count}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={count <= 0}
                      onClick={() => {
                        soundEngine.playConsume();
                        onUpdateSnapshot(consumeFoodItem(snapshot, fid));
                      }}
                      className="pixel-btn px-2 py-1 bg-amber-500 disabled:bg-slate-700 disabled:opacity-50 border border-amber-200 disabled:border-slate-600 text-slate-950 disabled:text-slate-400 font-pixel text-[10px] shrink-0 cursor-pointer"
                    >
                      {es ? 'Comer' : 'Eat'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* COLUMN 4: WATER */}
          <div className="bg-slate-900/90 border-2 border-slate-700 p-3 flex flex-col gap-3">
            <div className="font-pixel text-xs text-sky-300 flex items-center gap-1.5 pb-1.5 border-b border-slate-700">
              <Droplets className="w-4 h-4" />
              <span>{es ? 'Agua' : 'Water'}</span>
            </div>

            <div className="p-2.5 bg-slate-950/75 border border-slate-700 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-sky-200">
                  {es ? 'Agua Purificada' : 'Clean Water Flasks'}
                </span>
                <span className="font-mono-num text-sm font-bold text-sky-300">
                  x{snapshot.inventory.cleanWater}
                </span>
              </div>
              <button
                type="button"
                disabled={snapshot.inventory.cleanWater <= 0}
                onClick={() => {
                  soundEngine.playHydrate();
                  onUpdateSnapshot(consumeWaterItem(snapshot, false));
                }}
                className="pixel-btn w-full py-2 bg-sky-500 disabled:bg-slate-700 border-2 border-sky-200 disabled:border-slate-600 text-slate-950 font-pixel text-xs cursor-pointer"
              >
                {es ? 'Beber Agua (+35%)' : 'Drink Water (+35%)'}
              </button>
            </div>

            <div className="p-2.5 bg-slate-950/75 border border-slate-700 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-lime-300">
                  {es ? 'Agua Sin Tratar (Riesgo)' : 'Untreated Water (Risk)'}
                </span>
                <span className="font-mono-num text-sm font-bold text-lime-300">
                  x{snapshot.inventory.contaminatedWater}
                </span>
              </div>
              <button
                type="button"
                disabled={snapshot.inventory.contaminatedWater <= 0}
                onClick={() => {
                  soundEngine.playDamage();
                  onUpdateSnapshot(consumeWaterItem(snapshot, true));
                }}
                className="pixel-btn w-full py-2 bg-lime-700 disabled:bg-slate-700 border-2 border-lime-300 disabled:border-slate-600 text-white font-pixel text-[11px] cursor-pointer"
              >
                {es ? 'Beber (Causa Enfermedad)' : 'Drink (Causes Illness)'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
