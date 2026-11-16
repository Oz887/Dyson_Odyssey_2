import React, { useRef, useState } from 'react';
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  BatteryCharging,
  Backpack,
  BedDouble,
  Bot,
  Box,
  Compass,
  Droplets,
  Flame,
  GitBranch,
  Heart,
  Pause,
  Save,
  Shield,
  Snowflake,
  Sprout,
  Thermometer,
  Utensils,
  Volume2,
  VolumeX,
  Wind,
  Wrench,
  Zap,
} from 'lucide-react';
import { TOOL_META, TOOL_ORDER } from '../data/phase2Catalog';
import { MISSION_CATALOG } from '../data/phase4Content';
import { soundEngine } from '../engine/audio';
import { InputManager } from '../engine/input';
import { STATUS_INFO, TEXT } from '../i18n/translations';
import { GameSnapshot, Language, ScreenId, ToolType } from '../types/game';

interface SurvivalHudProps {
  snapshot: GameSnapshot;
  language: Language;
  showTouchControls: boolean;
  muted: boolean;
  onToggleMute: () => void;
  onSave: () => void;
  onOpenScreen: (screen: ScreenId) => void;
  onOpenAssistant: () => void;
  onEquipTool: (tool: ToolType) => void;
  inputManager: InputManager;
  onQuickAction: (type: 'eat' | 'drink' | 'train' | 'suit' | 'airlock' | 'attack' | 'interact') => void;
}

export const SurvivalHud: React.FC<SurvivalHudProps> = ({
  snapshot,
  language,
  showTouchControls,
  muted,
  onToggleMute,
  onSave,
  onOpenScreen,
  onOpenAssistant,
  onEquipTool,
  inputManager,
  onQuickAction,
}) => {
  const t = TEXT[language];
  const es = language === 'es';
  const { stats, statusEffects } = snapshot;
  const dpadRef = useRef<HTMLDivElement | null>(null);
  const [activeDir, setActiveDir] = useState<'up' | 'down' | 'left' | 'right' | null>(null);

  const zoneLabel =
    snapshot.currentZone === 'ship'
      ? t.insideShip
      : snapshot.currentZone === 'cryo'
        ? t.cryoZone
        : snapshot.currentZone === 'thermal'
          ? t.thermalZone
          : t.outsideSurface;

  const updateDpadFromPointer = (clientX: number, clientY: number) => {
    const el = dpadRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = clientX - cx;
    const dy = clientY - cy;
    const dist = Math.hypot(dx, dy);
    if (dist < 10) {
      inputManager.setDpadVector(0, 0);
      setActiveDir(null);
      return;
    }
    const nx = dx / dist;
    const ny = dy / dist;
    inputManager.setDpadVector(nx, ny);
    if (Math.abs(dx) > Math.abs(dy)) {
      setActiveDir(dx < 0 ? 'left' : 'right');
    } else {
      setActiveDir(dy < 0 ? 'up' : 'down');
    }
  };

  const clearDpad = () => {
    inputManager.setDpadVector(0, 0);
    setActiveDir(null);
  };

  const optionButtons: {
    id: ScreenId;
    label: string;
    colorClass: string;
    icon: React.ReactNode;
  }[] = [
    {
      id: 'planet_map',
      label: t.screens.planet_map,
      colorClass: 'bg-cyan-500 border-cyan-200 text-slate-950',
      icon: <Compass className="w-3.5 h-3.5 shrink-0" />,
    },
    {
      id: 'inventory',
      label: t.screens.inventory,
      colorClass: 'bg-amber-400 border-amber-100 text-slate-950',
      icon: <Backpack className="w-3.5 h-3.5 shrink-0" />,
    },
    {
      id: 'upgrade_tree',
      label: t.screens.upgrade_tree,
      colorClass: 'bg-emerald-500 border-emerald-200 text-slate-950',
      icon: <GitBranch className="w-3.5 h-3.5 shrink-0" />,
    },
    {
      id: 'tool_upgrade',
      label: t.screens.tool_upgrade,
      colorClass: 'bg-orange-500 border-orange-200 text-slate-950',
      icon: <Wrench className="w-3.5 h-3.5 shrink-0" />,
    },
    {
      id: 'storage',
      label: t.screens.storage,
      colorClass: 'bg-fuchsia-500 border-fuchsia-200 text-slate-950',
      icon: <Box className="w-3.5 h-3.5 shrink-0" />,
    },
    {
      id: 'garden',
      label: t.screens.garden,
      colorClass: 'bg-lime-400 border-lime-100 text-slate-950',
      icon: <Sprout className="w-3.5 h-3.5 shrink-0" />,
    },
    {
      id: 'sleep',
      label: t.screens.sleep,
      colorClass: 'bg-indigo-500 border-indigo-200 text-white',
      icon: <BedDouble className="w-3.5 h-3.5 shrink-0" />,
    },
  ];

  return (
    <div className="pointer-events-none fixed inset-0 z-20 flex flex-col justify-between p-2.5 sm:p-3.5">
      {/* TOP PERIMETER CLUSTER */}
      <div className="flex items-start justify-between gap-2">
        {/* TOP-LEFT: Core Biological Status Bars + Tool Hotbar */}
        <div className="pointer-events-auto flex flex-col gap-1.5">
          <div className="bg-[#0b1022]/90 border-2 border-slate-600 p-2 w-48 sm:w-56 space-y-1.5">
            <StatRow
              icon={<Heart className="w-3.5 h-3.5 text-rose-400" />}
              label={t.health}
              value={stats.health}
              barColor={stats.health < 30 ? 'bg-rose-500' : 'bg-emerald-400'}
            />
            <StatRow
              icon={<Utensils className="w-3.5 h-3.5 text-amber-400" />}
              label={t.hunger}
              value={stats.hunger}
              barColor={stats.hunger < 20 ? 'bg-rose-500' : 'bg-amber-400'}
            />
            <StatRow
              icon={<Droplets className="w-3.5 h-3.5 text-sky-400" />}
              label={t.hydration}
              value={stats.hydration}
              barColor={stats.hydration < 20 ? 'bg-rose-500' : 'bg-sky-400'}
            />
            <StatRow
              icon={<Zap className="w-3.5 h-3.5 text-violet-400" />}
              label={t.fatigue}
              value={stats.fatigue}
              barColor="bg-violet-400"
            />
          </div>

          {/* 4 Equipable Tools Quick Switcher (§3.10) */}
          <div className="flex items-center gap-1 bg-[#0b1022]/90 border-2 border-slate-700 p-1 w-fit">
            {TOOL_ORDER.map((tool) => {
              const meta = TOOL_META[tool];
              const active = snapshot.tools.equippedTool === tool;
              return (
                <button
                  key={tool}
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    onEquipTool(tool);
                  }}
                  title={es ? meta.es : meta.en}
                  className={`px-2 py-1 border font-pixel text-[10px] cursor-pointer whitespace-nowrap ${
                    active
                      ? 'bg-amber-400 border-amber-100 text-slate-950'
                      : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500'
                  }`}
                >
                  {meta.shortKey}:{es ? meta.es.slice(0, 5) : meta.en.slice(0, 5)}
                </button>
              );
            })}
          </div>
        </div>

        {/* TOP-CENTER: Active Warning, RPG Mission & Status Effects */}
        <div className="hidden md:flex flex-col items-center gap-1.5 max-w-md">
          {snapshot.activeMission && (
            <button
              type="button"
              onClick={() => {
                soundEngine.playOpenMenu();
                onOpenAssistant();
              }}
              className="pointer-events-auto px-3 py-1.5 bg-rose-950/95 border-2 border-amber-400 text-amber-100 font-pixel text-[11px] flex items-center gap-2 cursor-pointer"
            >
              <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0" />
              <span>
                {es
                  ? MISSION_CATALOG[snapshot.activeMission.type].titleEs
                  : MISSION_CATALOG[snapshot.activeMission.type].titleEn}{' '}
                ({Math.ceil(snapshot.activeMission.timeRemaining)}s)
              </span>
            </button>
          )}

          {snapshot.activeBanner && (
            <div
              className={`px-3 py-1.5 border-2 font-pixel text-[11px] text-center flex items-center gap-2 ${
                snapshot.activeBanner.severity === 'danger'
                  ? 'bg-rose-950/95 border-rose-400 text-rose-100'
                  : 'bg-amber-950/95 border-amber-400 text-amber-100'
              }`}
            >
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>
                {es ? snapshot.activeBanner.textEs : snapshot.activeBanner.textEn}
              </span>
            </div>
          )}

          {statusEffects.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 bg-[#0b1022]/90 border-2 border-slate-700 px-3 py-1">
              {statusEffects.map((id) => {
                const info = STATUS_INFO[id];
                const color =
                  info.tone === 'danger'
                    ? 'text-rose-300'
                    : info.tone === 'warn'
                      ? 'text-amber-300'
                      : 'text-emerald-300';
                return (
                  <span
                    key={id}
                    className={`font-pixel text-[10px] flex items-center gap-1 ${color}`}
                    title={es ? info.descEs : info.descEn}
                  >
                    {id === 'freezing' && <Snowflake className="w-3 h-3" />}
                    {id === 'burn' && <Flame className="w-3 h-3" />}
                    {id !== 'freezing' && id !== 'burn' && <Activity className="w-3 h-3" />}
                    <span>{es ? info.es : info.en}</span>
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* TOP-RIGHT: Suit, Oxygen, Energy, Temperature & System Buttons */}
        <div className="pointer-events-auto flex flex-col items-end gap-1.5">
          <div className="bg-[#0b1022]/90 border-2 border-slate-600 p-2 w-48 sm:w-56 space-y-1.5">
            <StatRow
              icon={<Wind className="w-3.5 h-3.5 text-cyan-300" />}
              label={t.oxygen}
              value={stats.oxygen}
              barColor={stats.oxygen < 25 ? 'bg-rose-500' : 'bg-cyan-400'}
            />
            <StatRow
              icon={<BatteryCharging className="w-3.5 h-3.5 text-yellow-300" />}
              label={t.energy}
              value={stats.energy}
              barColor={stats.energy <= 20 ? 'bg-amber-500' : 'bg-yellow-400'}
            />
            <div className="flex items-center justify-between text-[11px] pt-0.5 border-t border-slate-700/80">
              <span className="flex items-center gap-1 text-slate-300">
                <Thermometer className="w-3.5 h-3.5 text-orange-300" />
                <span>
                  {es ? snapshot.planetPreset.nameEs : snapshot.planetPreset.nameEn}
                </span>
              </span>
              <span
                className={`font-mono-num font-bold ${
                  stats.temperature < -150
                    ? 'text-cyan-300'
                    : stats.temperature > 95
                      ? 'text-rose-400'
                      : 'text-slate-100'
                }`}
              >
                {Math.round(stats.temperature)}°C
              </span>
            </div>
            <div className="flex items-center justify-between text-[10px] font-pixel">
              <span className="text-orange-300 font-mono-num">
                FUEL {Math.round(stats.fuel)}%
              </span>
              <button
                type="button"
                onClick={() => onQuickAction('suit')}
                className={`px-1.5 py-0.5 border cursor-pointer ${
                  snapshot.suitEquipped
                    ? 'bg-sky-700 border-sky-300 text-white'
                    : 'bg-rose-900 border-rose-400 text-rose-100'
                }`}
              >
                {snapshot.suitEquipped ? t.suitOn : t.suitOff}
              </button>
            </div>
            <div className="text-[9px] font-pixel text-sky-300/90 truncate">
              {zoneLabel}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                onSave();
              }}
              className="pixel-btn p-2 bg-emerald-600 border-2 border-emerald-300 text-white cursor-pointer"
              aria-label={t.saveGame}
              title={t.saveGame}
            >
              <Save className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onToggleMute}
              className="pixel-btn p-2 bg-slate-800 border-2 border-slate-500 text-slate-100 cursor-pointer"
              aria-label="Toggle Mute"
            >
              {muted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-300" />}
            </button>
            <button
              type="button"
              onClick={() => {
                soundEngine.playOpenMenu();
                onOpenScreen('pause');
              }}
              className="pixel-btn p-2 bg-slate-800 border-2 border-slate-500 text-slate-100 cursor-pointer"
              aria-label="Pause"
            >
              <Pause className="w-4 h-4" />
            </button>
          </div>

          {/* Top-right Map button & Virtual Assistant directly below it (§2.1) */}
          <div className="flex flex-col items-end gap-1.5">
            <button
              type="button"
              onClick={() => {
                soundEngine.playOpenMenu();
                onOpenScreen('planet_map');
              }}
              className="pixel-btn flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500 border-2 border-cyan-200 text-slate-950 font-pixel text-[10px] cursor-pointer whitespace-nowrap"
            >
              <Compass className="w-3.5 h-3.5 shrink-0" />
              <span>{t.screens.planet_map}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                soundEngine.playOpenMenu();
                onOpenAssistant();
              }}
              className={`pixel-btn flex items-center gap-1.5 px-3 py-1.5 border-2 font-pixel text-[10px] cursor-pointer whitespace-nowrap ${
                snapshot.activeMission
                  ? 'bg-rose-600 border-amber-300 text-white'
                  : 'bg-sky-600 border-sky-200 text-white'
              }`}
            >
              <Bot className="w-3.5 h-3.5 shrink-0" />
              <span>{es ? 'Asistente' : 'Assistant'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* MOBILE / COMPACT WARNING BANNER */}
      {snapshot.activeBanner && (
        <div className="md:hidden self-center px-2.5 py-1 bg-rose-950/95 border-2 border-rose-400 text-rose-100 font-pixel text-[10px] text-center max-w-xs">
          {es ? snapshot.activeBanner.textEs : snapshot.activeBanner.textEn}
        </div>
      )}

      {/* BOTTOM CLUSTER */}
      <div className="flex items-end justify-between gap-2">
        {showTouchControls ? (
          <div
            ref={dpadRef}
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              updateDpadFromPointer(e.clientX, e.clientY);
            }}
            onPointerMove={(e) => {
              if (e.buttons > 0 || activeDir !== null) {
                updateDpadFromPointer(e.clientX, e.clientY);
              }
            }}
            onPointerUp={clearDpad}
            onPointerCancel={clearDpad}
            className="pointer-events-auto relative w-36 h-36 grid grid-cols-3 grid-rows-3 gap-1 shrink-0"
            aria-label="Movement Direction Pad"
          >
            <div />
            <div
              className={`flex items-center justify-center border-2 ${
                activeDir === 'up'
                  ? 'bg-sky-500 border-white text-slate-950'
                  : 'bg-slate-800/90 border-slate-500 text-slate-100'
              }`}
            >
              <ArrowUp className="w-5 h-5" />
            </div>
            <div />
            <div
              className={`flex items-center justify-center border-2 ${
                activeDir === 'left'
                  ? 'bg-sky-500 border-white text-slate-950'
                  : 'bg-slate-800/90 border-slate-500 text-slate-100'
              }`}
            >
              <ArrowLeft className="w-5 h-5" />
            </div>
            <div className="bg-slate-900/90 border-2 border-slate-600" />
            <div
              className={`flex items-center justify-center border-2 ${
                activeDir === 'right'
                  ? 'bg-sky-500 border-white text-slate-950'
                  : 'bg-slate-800/90 border-slate-500 text-slate-100'
              }`}
            >
              <ArrowRight className="w-5 h-5" />
            </div>
            <div />
            <div
              className={`flex items-center justify-center border-2 ${
                activeDir === 'down'
                  ? 'bg-sky-500 border-white text-slate-950'
                  : 'bg-slate-800/90 border-slate-500 text-slate-100'
              }`}
            >
              <ArrowDown className="w-5 h-5" />
            </div>
            <div />
          </div>
        ) : (
          <div className="hidden lg:block w-24" />
        )}

        {/* BOTTOM-CENTER: Colorful Option Selection Buttons */}
        <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-1.5 bg-[#0b1022]/90 border-2 border-slate-700 p-1.5">
          {optionButtons.map((btn) => (
            <button
              key={btn.id}
              type="button"
              onClick={() => {
                soundEngine.playOpenMenu();
                onOpenScreen(btn.id);
              }}
              className={`pixel-btn flex items-center gap-1.5 px-2.5 py-2 border-2 font-pixel text-[10px] sm:text-[11px] whitespace-nowrap shrink-0 cursor-pointer ${btn.colorClass}`}
            >
              {btn.icon}
              <span>{btn.label}</span>
            </button>
          ))}
        </div>

        {showTouchControls ? (
          <div className="pointer-events-auto grid grid-cols-2 gap-1.5 shrink-0">
            <button
              type="button"
              onPointerDown={() => inputManager.setTouchRun(true)}
              onPointerUp={() => inputManager.setTouchRun(false)}
              onPointerLeave={() => inputManager.setTouchRun(false)}
              className="pixel-btn min-w-[52px] min-h-[44px] px-2 bg-violet-500 border-2 border-violet-200 text-white font-pixel text-[10px] cursor-pointer"
            >
              {t.runBtn}
            </button>
            <button
              type="button"
              onClick={() => onQuickAction('suit')}
              className="pixel-btn min-w-[52px] min-h-[44px] px-2 bg-sky-500 border-2 border-sky-200 text-slate-950 font-pixel text-[10px] cursor-pointer flex items-center justify-center gap-1"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>{t.suitBtn}</span>
            </button>
            <button
              type="button"
              onClick={() => onQuickAction('attack')}
              className="pixel-btn min-w-[52px] min-h-[44px] px-2 bg-rose-500 border-2 border-rose-200 text-white font-pixel text-[10px] cursor-pointer"
            >
              {t.attackBtn}
            </button>
            <button
              type="button"
              onClick={() => onQuickAction('interact')}
              className="pixel-btn min-w-[52px] min-h-[44px] px-2 bg-emerald-500 border-2 border-emerald-200 text-slate-950 font-pixel text-[10px] cursor-pointer"
            >
              {t.interactBtn}
            </button>
          </div>
        ) : (
          <div className="hidden lg:block w-24" />
        )}
      </div>
    </div>
  );
};

interface StatRowProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  barColor: string;
}

const StatRow: React.FC<StatRowProps> = ({ icon, label, value, barColor }) => {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className="flex items-center gap-2">
      <div className="shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between text-[10px] leading-none mb-0.5">
          <span className="text-slate-300 truncate">{label}</span>
          <span className="font-mono-num text-slate-100 font-bold">{pct}%</span>
        </div>
        <div className="w-full h-2 bg-slate-900 border border-slate-700 overflow-hidden">
          <div
            className={`h-full ${barColor} transition-all duration-150`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );
};
